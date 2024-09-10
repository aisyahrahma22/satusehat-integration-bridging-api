import { Request, Response } from "express";
import {
  doCreate as doCreateRadiology,
  doUpdate as doUpdateRadiology,
  doFindAll as doFindAllRadiology,
} from "../../services/fhir/fhirRadiology.service";
import log from "../../utils/logger";
import { GetFhirRadiologyInput, SetFhirRadiologyInput } from "../../schemas/fhir/fhirRadiology.schema";
import { doFindHospital } from "../../services/hospital.service";
import { decrypt } from "../../utils/encryption";
import {
  doFind as doFindEncounter,
  doFindAll as doFindAllEncounter,
} from "../../services/fhir/fhirEncounter.service";
import {
  doFind as doFindServiceReq,
} from "../../services/fhir/fhirServiceRequest.service";
import {
  doFind as doFindObserv,
} from "../../services/fhir/fhirObservGeneral.service";
import { createDiagnosticReportPayload, createObservPayload, createServiceReqPayload } from "./fhirPayload.controller";
import { FHIR_ENCOUNTER_FINISHED } from "../../utils/constants";
import publishFhirRadiology from "../../services/message/publish/fhirRadiology.publish";
export async function getHandler(
  req: Request<GetFhirRadiologyInput>,
  res: Response
) {
  try {
    const hospitalId = req.params.hospitalId;
    const registrationId = req.params.registrationId;
    const encounter = await doFindEncounter({ hospitalId, registrationId});
    if (!encounter) {
      return res.status(400).send({
        errorCode: 400,
        errorMessage: "Encounter tidak ditemukan",
      });
    }
    let data: any[] = [];
    if(encounter){
      let encounterId = encounter._id.toHexString();
      const radiology = await doFindAllRadiology({ encounterId: encounterId });
      data.push(...radiology)
    }
   
    if (data.length == 0) {
      return res.status(404).send({
        errorCode: 404,
        errorMessage: `Radiology not found`,
      });
    }else{
      return res.send(data);
    }
  } catch (e: any) {
    return res.status(400).send({
      errorCode: 400,
      errorMessage: e.message,
    });
  }
}

export async function setHandler(
  req: Request<
    SetFhirRadiologyInput,
    {},
    SetFhirRadiologyInput
  >,
  res: Response
) {
  try {
    const body = req.body;
    const hospitalId = req.params.hospitalId;
    const registrationId = req.params.registrationId;
    const encounter = await doFindEncounter({ hospitalId, registrationId });
    if (!encounter) {
      return res.status(400).send({
        errorCode: 400,
        errorMessage: "Encounter tidak ditemukan",
      });
    }
    let encounterId = encounter._id.toHexString();
    const radiology = await doFindAllRadiology({ encounterId: encounterId });
    const data = await processRadiologies(radiology, encounterId, body);
    return res.send(data);
  } catch (e: any) {
    return res.status(400).send({
      errorCode: e.errorCode ? e.errorCode : 400,
      errorMessage: e.errorMessage ? e.errorMessage : e.message,
    });
  }
}

export async function schedulerLab(req: any, res: any) {
  try {
    const encounters = await doFindAllEncounter({
      status: FHIR_ENCOUNTER_FINISHED,
      doctorFhirId: { "$exists": true, "$ne": "" },
      patientFhirId: { "$exists": true, "$ne": "" },
      locationFhirId: { "$exists": true, "$ne": "" },
      medicalCategory: { "$exists": true, "$eq": "lab" },
      fhirEncounterId: { "$exists": true, "$ne": "" },
      isPaid: { "$exists": true, "$eq": true }
    })
    if (encounters && encounters.length > 0) {
      let data = null
      for await (const entry of encounters) {
        const isHistoryFinished     = entry?.history?.finished?.end;
        if (isHistoryFinished) {
          const Radiology = await doFindAllRadiology({ encounterId: entry._id, fhirDiagnosticRadId: { "$exists": true, "$eq": "" }  });
          data = await createFhirRadiologyPayload(Radiology, entry)
        }
      }
      return res.status(200).send({
        message: "Send Radiology Data to Satu Sehat",
        data: data
      });
    }

    return res.status(200).send({
      message: "No data lab to send to Satu Sehat"
    });
  } catch (e: any) {
    return res.status(400).send({
      errorCode: 400,
      errorMessage: e.message
    });
  }
}
export async function setRadiology(body: any, encounter: any) {
  try {
    if(encounter){
      let encounterId = encounter._id.toHexString();
      const radiology = await doFindAllRadiology({ encounterId: encounterId });
      const data = await processRadiologies(radiology, encounterId, body);
      return data;
    }else{
      return ({
          errorCode: 400,
          errorMessage: "Encounter tidak ditemukan",
      });
    }
  } catch (e: any) {
    log.error(`FHIR >> Radiology error created/updated`, e);
    throw e;
  }
}

async function processRadiologies(laboratories: any[], encounterId: string, body: any) {
  let data: any[] = [];
  for await (const radiology of body) {
    let payload = {
      encounterId: encounterId,
      loincCode: radiology.code || '',
      radName: radiology.radiologyName,
      isCito: radiology.isCito || false,
      display: radiology.display,
      system: radiology.system,
      loincName: radiology.loincName || '',
      category: radiology.category || '',
      pmrRadUuid: radiology.uuid,
      createdAt: radiology.createdAt || new Date(),
      active: radiology.active === '1' || true,
      fhirDiagnosticRadId: "",
      description: ''
    };
    const existingRad = laboratories.filter(item => item.pmrRadUuid === radiology.uuid);

    if (existingRad.length > 0) {
      for await (const data of existingRad){
        payload.fhirDiagnosticRadId = data.fhirDiagnosticRadId || "";
        await doUpdateRadiology({ _id: data._id }, { ...payload }, { new: true });
      }
    } else {
      await doCreateRadiology(payload);
    }
  }
  return data;
}

export async function createFhirRadiologyPayload(data: any, encounter: any) {
  let item: any[] = [];

  for await (const val of data) {
    try {
      const hospital = await doFindHospital({ uuid: encounter.hospitalId });
      let serviceReqCheck = await doFindServiceReq({ refId: val._id, category: 'rad' });
      let observCheck = await doFindObserv({ refId: val._id, category: 'rad' });
      let diagnostic = null;
      let observ = null;
      if (hospital) {
        const { organization_id } = JSON.parse(decrypt(hospital.fhirSecret));
        
        let serviceReq;
        if (!serviceReqCheck?.fhirServiceReqId) {
          serviceReq = await createServiceReqPayload(val, encounter, organization_id, 'rad');
        } else {
          serviceReq = serviceReqCheck;
        }

        if (serviceReq?.fhirServiceReqId) {
          if (!observCheck?.fhirObservGeneralId) {
            observ = await createObservPayload(val, encounter, organization_id, serviceReq.fhirServiceReqId, null, 'rad');
          } else {
            observ = observCheck;
          }

          if (observ?.fhirObservGeneralId) {
            if (!val?.fhirDiagnosticLabId) {
              diagnostic = await createDiagnosticReportPayload(val, encounter, organization_id, serviceReq.fhirServiceReqId, observ.fhirObservGeneralId, null, 'rad');
            } else {
              diagnostic = val;
            }
          }
        }

        let payload = {
          fhirIdRad: diagnostic?.fhirDiagnosticRadId || null,
          fhirIdObserv: observ?.fhirObservGeneralId|| null,
          fhirIdServiceReq: serviceReq?.fhirServiceReqId || null,
          uuid: val.pmrRadUuid,
          description: serviceReq?.fhirResponse?.error?.message === 'error-value' ? 'Code tidak ditemukan' : null
        };
         // Publish Send Laboratory FhirID To HIS
         publishFhirRadiology.updated(payload);
      }
    } catch (error) {
      log.error(`FHIR >> Radiology error send to Satu Sehat >> ${val._id}`);
      console.log('Error Radiology :>> ', error);
    }
  }

  return item;
}

export async function processRadiology(encounter: any, body: any) {
  if (!body || !encounter) return;

  await setRadiology(body, encounter);
  let encounterId = encounter._id.toHexString();
  const radilogy = await doFindAllRadiology({ encounterId: encounterId });
  const fhirRadiologyData = radilogy.filter(data => data.fhirDiagnosticRadId !== "");
  const filteredRadiology = radilogy.filter(data => data.fhirDiagnosticRadId === "");

  for (const radiology of fhirRadiologyData) {
    const serviceReq = await doFindServiceReq({ refId: radiology._id });
    const observ = await doFindObserv({ refId: radiology._id });
    let payload = {
        fhirIdRad : radiology.fhirDiagnosticRadId,
        fhirIdServiceReq : serviceReq?.fhirServiceReqId,
        uuid: radiology.pmrRadUuid,
        fhirIdObserv: observ?.fhirObservGeneralId,
        description: radiology.description
    }
    //  Publish Send Radiology FhirID To HIS
    publishFhirRadiology.updated(payload);
  }

  if (filteredRadiology.length > 0) {
    await createFhirRadiologyPayload(filteredRadiology, encounter);
  }
}