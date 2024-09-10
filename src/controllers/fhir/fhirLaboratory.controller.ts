import { Request, Response } from "express";
import {
  doCreate as doCreateLaboratory,
  doUpdate as doUpdateLaboratory,
  doFindAll as doFindAllLaboratory,
} from "../../services/fhir/fhirLaboratory.service";
import {
  doFindAll as doFindAllRadiology,
} from "../../services/fhir/fhirRadiology.service";
import log from "../../utils/logger";
import { GetFhirLaboratoryInput, SetFhirLaboratoryInput } from "../../schemas/fhir/fhirLaboratory.schema";
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
  doFind as doFindSpecimen,
} from "../../services/fhir/fhirSpecimen.service";
import {
  doFind as doFindObserv,
} from "../../services/fhir/fhirObservGeneral.service";
import { createDiagnosticReportPayload, createObservPayload, createServiceReqPayload, createSpecimenPayload } from "./fhirPayload.controller";
import publishFhirLaboratory from "../../services/message/publish/fhirLaboratory.publish";
import { FHIR_ENCOUNTER_FINISHED } from "../../utils/constants";
import { createFhirRadiologyPayload } from "./fhirRadiology.controller";
export async function getHandler(
  req: Request<GetFhirLaboratoryInput>,
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
      const Laboratorys = await doFindAllLaboratory({ encounterId: encounterId });
      data.push(...Laboratorys)
    }
   
    if (data.length == 0) {
      return res.status(404).send({
        errorCode: 404,
        errorMessage: `Laboratory not found`,
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
    SetFhirLaboratoryInput,
    {},
    SetFhirLaboratoryInput
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
    const laboratory = await doFindAllLaboratory({ encounterId: encounterId });
    const data = await processLaboratories(laboratory, encounterId, body);
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
      fhirEncounterId: { "$exists": true, "$ne": "" },
      isPaid: { "$exists": true, "$eq": true },
      medicalCategory: { "$in": ["lab", "rad"] }
    })
    if (encounters && encounters.length > 0) {
      let data = null
      for await (const entry of encounters) {
        const isHistoryFinished = entry?.history?.finished?.end;
        if (isHistoryFinished && entry.medicalCategory === 'lab') {
          const laboratory = await doFindAllLaboratory({ encounterId: entry._id, fhirDiagnosticLabId: { "$exists": true, "$eq": "" }  });
          data = await createFhirLaboratoryPayload(laboratory, entry)
        }

        if (isHistoryFinished && entry.medicalCategory == 'rad') {
          const radiology = await doFindAllRadiology({ encounterId: entry._id, fhirDiagnosticRad: { "$exists": true, "$eq": "" }  });
          data = await createFhirRadiologyPayload(radiology, entry)
        }
      }
      return res.status(200).send({
        message: "Send Laboratory Data to Satu Sehat",
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
export async function setLaboratory(body: any, encounter: any) {
  try {
    if(encounter){
      let encounterId = encounter._id.toHexString();
      const laboratory = await doFindAllLaboratory({ encounterId: encounterId });
      const data = await processLaboratories(laboratory, encounterId, body);
      return data;
    }else{
      return ({
          errorCode: 400,
          errorMessage: "Encounter tidak ditemukan",
      });
    }
  } catch (e: any) {
    log.error(`FHIR >> Laboratory error created/updated`, e);
    throw e;
  }
}

async function processLaboratories(laboratories: any[], encounterId: string, body: any) {
  let data: any[] = [];
  for await (const laboratory of body) {
    let payload = {
      encounterId: encounterId,
      loincCode: laboratory.code || '',
      labName: laboratory.labName,
      isCito: laboratory.isCito || false,
      display: laboratory.display,
      loincName: laboratory.loincName || '',
      category: laboratory.category || '',
      type: laboratory.type || '',
      pmrLabUuid: laboratory.uuid,
      specimenCode: laboratory.specimenCode,
      specimenName: laboratory.specimenName,
      detail: laboratory.detail,
      createdAt: laboratory.createdAt || new Date(),
      active: laboratory.active === '1' || true,
      fhirDiagnosticLabId: "",
      description: ''
    };
    const existingLab = laboratories.filter(item => item.pmrLabUuid === laboratory.pmrLabUuid);

    if (existingLab.length > 0) {
      for await (const data of existingLab){
        payload.fhirDiagnosticLabId = data.fhirDiagnosticLabId || "";
        await doUpdateLaboratory({ _id: data._id }, { ...payload }, { new: true });
      }
    } else {
      await doCreateLaboratory(payload);
    }
  }
  return data;
}

export async function createFhirLaboratoryPayload(data: any, encounter: any) {
  let item: any[] = [];

  for await (const val of data) {
    try {
      const hospital = await doFindHospital({ uuid: encounter.hospitalId });
      let serviceReqCheck = await doFindServiceReq({ refId: val._id, category: 'lab' });
      let specimenCheck = await doFindSpecimen({ refId: val._id });
      let observCheck = await doFindObserv({ refId: val._id, category: 'lab' });
      let diagnostic = null;
      let observ = null;
      let specimen = null;

      if (hospital) {
        const { organization_id } = JSON.parse(decrypt(hospital.fhirSecret));
        
        let serviceReq;
        if (!serviceReqCheck?.fhirServiceReqId) {
          serviceReq = await createServiceReqPayload(val, encounter, organization_id, 'lab');
        } else {
          serviceReq = serviceReqCheck;
        }

        if (serviceReq?.fhirServiceReqId) {
          if (!specimenCheck?.fhirSpecimenId) {
            specimen = await createSpecimenPayload(val, encounter, organization_id, serviceReq.fhirServiceReqId);
          } else {
            specimen = specimenCheck;
          }

          if (specimen?.fhirSpecimenId) {
            if (!observCheck?.fhirObservGeneralId) {
              observ = await createObservPayload(val, encounter, organization_id, serviceReq.fhirServiceReqId, specimen.fhirSpecimenId, 'lab');
            } else {
              observ = observCheck;
            }

            if (observ?.fhirObservGeneralId) {
              if (!val?.fhirDiagnosticLabId) {
                diagnostic = await createDiagnosticReportPayload(val, encounter, organization_id, serviceReq.fhirServiceReqId, observ.fhirObservGeneralId, specimen.fhirSpecimenId, 'lab');
              } else {
                diagnostic = val;
              }
            }
          }
        }
        
        let payload = {
          fhirIdLab: diagnostic?.fhirDiagnosticLabId || null,
          fhirIdServiceReq: serviceReq?.fhirServiceReqId || null,
          fhirIdSpecimen: specimen?.fhirSpecimenId || null,
          fhirIdObserv: observ?.fhirObservGeneralId || null,
          uuid: val.pmrLabUuid,
          description: serviceReq?.fhirResponse?.error?.message === 'error-value' || specimen?.fhirResponse?.error?.message === 'error-value' ? 'Code tidak ditemukan' : null
        };
        // Publish Send Laboratory FhirID To HIS
        publishFhirLaboratory.updated(payload);
      }
    } catch (error) {
      log.error(`FHIR >> Laboratory error send to Satu Sehat >> ${val._id}`);
      console.log('Error Laboratory :>> ', error);
    }
  }

  return item;
}

export async function processLaboratory(encounter: any, body: any) {
  if (!body || !encounter) return;

  await setLaboratory(body, encounter);
  let encounterId = encounter._id.toHexString();
  const laboratories = await doFindAllLaboratory({ encounterId: encounterId });
  const fhirLaboratoryData = laboratories.filter(data => data.fhirDiagnosticLabId !== "");
  const filteredLaboratory = laboratories.filter(data => data.fhirDiagnosticLabId === "");

  for (const laboratory of fhirLaboratoryData) {
    const serviceReq = await doFindServiceReq({ refId: laboratory._id });
    const specimen = await doFindSpecimen({ refId: laboratory._id });
    const observ = await doFindObserv({ refId: laboratory._id });
    let payload = {
        fhirIdLab : laboratory.fhirDiagnosticLabId,
        fhirIdServiceReq : serviceReq?.fhirServiceReqId,
        fhirIdSpecimen : specimen?.fhirSpecimenId,
        fhirIdObserv : observ?.fhirObservGeneralId,
        uuid: laboratory.pmrLabUuid,
        description: laboratory.description
    }
    //  Publish Send Laboratory FhirID To HIS
    publishFhirLaboratory.updated(payload);
  }

  if (filteredLaboratory.length > 0) {
    await createFhirLaboratoryPayload(filteredLaboratory, encounter);
  }
}