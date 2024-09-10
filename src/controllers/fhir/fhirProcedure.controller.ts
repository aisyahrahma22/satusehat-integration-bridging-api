import { Request, Response } from "express";
import {
  doCreate as doCreateProcedure,
  doUpdate as doUpdateProcedure,
  doFindAll as doFindAllProcedure,
} from "../../services/fhir/fhirProcedure.service";
import log from "../../utils/logger";
import * as fhir from "../../middleware/request/fhir";
import { GetFhirProcedureInput, SetFhirProcedureInput } from "../../schemas/fhir/fhirProcedure.schema";
import {
  doFind as doFindEncounter,
} from "../../services/fhir/fhirEncounter.service";
import moment from 'moment';
import publishFhirProcedure from "../../services/message/publish/fhirProcedure.publish";
export async function getHandler(
  req: Request<GetFhirProcedureInput>,
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
      const procedures = await doFindAllProcedure({ encounterId: encounterId });
      data.push(...procedures)
    }
   
    if (data.length == 0) {
      return res.status(404).send({
        errorCode: 404,
        errorMessage: `Procedure not found`,
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
    SetFhirProcedureInput,
    {},
    SetFhirProcedureInput
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
    const procedures = await doFindAllProcedure({ encounterId: encounterId });
    const data = await processProcedures(procedures, encounterId, body);
    return res.send(data);
  } catch (e: any) {
    return res.status(400).send({
      errorCode: e.errorCode ? e.errorCode : 400,
      errorMessage: e.errorMessage ? e.errorMessage : e.message,
    });
  }
}

function procedurePayload(val: any, encounter: any){
  const payload = {
    resourceType: "Procedure",
    status: "completed",
    category: {
        coding: [
            {
                system: "http://snomed.info/sct",
                code: val.categoryCode,
                display: val.categoryName
            }
        ],
        text: val.categoryName
    },
    code: {
        coding: [
            {
                system: "http://hl7.org/fhir/sid/icd-9-cm",
                code: val.code,
                display: val.name
            }
        ]
    },
    subject: {
        reference: `Patient/${encounter.patientFhirId}`,
    },
    encounter: {
        reference: `Encounter/${encounter.fhirEncounterId}`,
        display: `Tindakan ${val.name} ${encounter.patientName} pada ${val.createdAt || val.updatedAt}`
    },
    performedPeriod: {
        start: moment(val.datetime).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"),
        end: moment(val.createdAt || val.updatedAt).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"),
    },
    performer: [
        {
            actor: {
                reference: `Practitioner/${encounter.doctorFhirId}`,
            }
        }
    ]
  }

  return payload
}

export async function createFhirProcedurePayload(data: any, encounter: any) {
  let item: any[] = [];
  for await (const val of data) {
    try {
      const payload = procedurePayload(val, encounter)

      let fhirResponse;
      let fhirProcedureId: string | null = null;

      if(val.categoryCode && val.categoryName){
        if (val.fhirProcedureId) {
          const newPayload = {
            ...payload,
            id: val.fhirProcedureId
          }
          fhirResponse = await fhir.put(`/Procedure/${val.fhirProcedureId}`, newPayload, encounter.hospitalId);
          fhirProcedureId = fhirResponse?.id;
        } else {
          fhirResponse = await fhir.postData("/Procedure", payload, encounter.hospitalId);
          fhirProcedureId = fhirResponse?.id;
        }
        const payloadUpdate = {
          fhirRequest: payload,
          fhirProcedureId: fhirResponse?.id || '',
          fhirResponse: fhirResponse,
          fhirResourceType: fhirResponse?.resourceType || 'Procedure',
          description: fhirResponse?.error?.message === 'error-value' ? 'Code tidak ditemukan' : fhirResponse?.error? 'Gagal terkirim' : null
        };
       const newProcedure = await doUpdateProcedure({ _id: val._id }, { ...payloadUpdate }, { new: true });
        publishFhirProcedure.updated({
          pmrRefId: val.pmrRefId,
          fhirProcedureId: fhirProcedureId,
          description: fhirResponse?.error?.message === 'error-value' ? 'Code tidak ditemukan' : fhirResponse?.error? 'Gagal terkirim' : null
        });
        item.push(newProcedure) 
      }
    } catch (error) {
      log.error(`FHIR >> Procedure error send to Satu Sehat >> ${val._id}`);
      console.log('Error Procedure :>> ', error);
    }
  }
  return item;
}

export async function setProcedure(body: any, encounter: any) {
  try {
    let encounterId = encounter._id.toHexString();
    const procedures = await doFindAllProcedure({ encounterId: encounterId });
    const data = await processProcedures(procedures, encounterId, body);
    return data;
  } catch (e: any) {
    log.error(`FHIR >> Procedure error created/updated`, e);
    throw e;
  }
}

async function processProcedures(procedures: any[], encounterId: string, body: any) {
  let data: any[] = [];
  for await (const procedure of body) {
    let payload = {
      encounterId: encounterId,
      code: procedure.ipCode || '',
      name: procedure.ipName || '',
      categoryCode: procedure.categoryCode || '',
      categoryName: procedure.categoryName || '',
      patientMedicalRecordId: procedure.patientMedicalRecordId,
      clinicProceduresId: procedure.clinicProceduresId,
      datetime: procedure.createdAt,
      pmrRefId: procedure.pmrRefId,
      procedureUuid: procedure.uuid,
      active: procedure.active || true,
      fhirProcedureId: "",
      description: ''
    };
    const existingProcedure = procedures.filter(item => item.pmrRefId === procedure.pmrRefId);

    if (existingProcedure.length > 0) {
      for await (const data of existingProcedure){
        payload.fhirProcedureId = data.fhirProcedureId || "";
        await doUpdateProcedure({ _id: data._id }, { ...payload }, { new: true });
      }
    } else {
      await doCreateProcedure(payload);
    }
  }
  return data;
}


export async function processProcedure(encounter: any, body: any) {
  if (!body || !encounter) return;

  await setProcedure(body, encounter);
  let encounterId = encounter._id.toHexString();
  const procedures = await doFindAllProcedure({ encounterId: encounterId });
  const fhirProcedure = procedures.filter(data => data.fhirProcedureId !== "");
  const filteredProcedure = procedures.filter(data => data.fhirProcedureId === "");

  for (const procedure of fhirProcedure) {
    const payload = procedurePayload(procedure, encounter)
    const newPayload = {
      ...payload,
      id: procedure.fhirProcedureId
    }
    const fhirResponse = await fhir.put(`/Procedure/${procedure.fhirProcedureId}`, newPayload, encounter.hospitalId);
    await doUpdateProcedure({ _id: procedure._id }, { fhirResponse : fhirResponse}, { new: true });
   
    //  Publish Send Procedure FhirID To HIS
    publishFhirProcedure.updated({
      pmrRefId: procedure.pmrRefId,
      fhirProcedureId: procedure.fhirProcedureId,
      description: procedure.description
    });
  }

  if (filteredProcedure.length > 0) {
    await createFhirProcedurePayload(filteredProcedure, encounter);
  }
}