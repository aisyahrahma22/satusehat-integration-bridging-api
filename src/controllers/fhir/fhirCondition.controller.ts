import { Request, Response } from "express";
import {
  doCreate as doCreateCondition,
  doUpdate as doUpdateCondition,
  doFindAll as doFindAllCondition,
} from "../../services/fhir/fhirCondition.service";
import log from "../../utils/logger";
import * as fhir from "../../middleware/request/fhir";
import { GetFhirConditionInput, SetFhirConditionInput } from "../../schemas/fhir/fhirCondition.schema";
import {
  doFind as doFindEncounter,
} from "../../services/fhir/fhirEncounter.service";
import publishFhirCondition from "../../services/message/publish/fhirCondition.publish";
export async function getHandler(
  req: Request<GetFhirConditionInput>,
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
      const conditions = await doFindAllCondition({ encounterId: encounterId, pmrId: { "$exists": true, "$ne": "" }  });
      data.push(...conditions)
    }
   
    if (data.length == 0) {
      return res.status(404).send({
        errorCode: 404,
        errorMessage: `Condition not found`,
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
    SetFhirConditionInput,
    {},
    SetFhirConditionInput
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
    const conditions = await doFindAllCondition({ encounterId: encounterId, pmrId: { "$exists": true, "$ne": "" }  });
    const data = await processConditions(conditions, encounterId, body);
    return res.send(data);
  } catch (e: any) {
    return res.status(400).send({
      errorCode: e.errorCode ? e.errorCode : 400,
      errorMessage: e.errorMessage ? e.errorMessage : e.message,
    });
  }
}


export function conditionPayload(val: any, encounter: any){
  let payload = {
    resourceType: "Condition",
    clinicalStatus: {
       coding: [
          {
             system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
             code: "active",
             display: "Active"
          }
       ]
    },
    category: [
       {
          coding: [
             {
                system: "http://terminology.hl7.org/CodeSystem/condition-category",
                code: "encounter-diagnosis",
                display: "Encounter Diagnosis"
             }
          ]
       }
    ],
    code: {
       coding: [
          {
             system: "http://hl7.org/fhir/sid/icd-10",
             code: val.code,
             display: val.name
          }
       ]
    },
    subject: {
      reference: `Patient/${encounter.patientFhirId}`,
    },
    encounter: {
       reference: `Encounter/${encounter.fhirEncounterId}`
    }
 };
 return payload
}

export async function createFhirConditionPayload(data: any, encounter: any) {
  let item: any[] = [];
  for await (const val of data) {
    try {
      let payload = conditionPayload(val, encounter)

      let fhirResponse;
      let fhirConditionId: string | null = null;

      if (val.fhirConditionId) {
        let updatePayload = {...payload, id: val.fhirConditionId}
        fhirResponse = await fhir.put(`/Condition/${val.fhirConditionId}`, updatePayload, encounter.hospitalId);
        fhirConditionId = fhirResponse?.id;
      } else {
        fhirResponse = await fhir.postData("/Condition", payload, encounter.hospitalId);
        fhirConditionId = fhirResponse?.id;
      }

      const payloadUpdate = {
        fhirRequest: payload,
        fhirConditionId: fhirResponse?.id,
        fhirResponse: fhirResponse,
        fhirResourceType: fhirResponse?.resourceType,
        description: fhirResponse?.error?.message === 'error-value' || fhirResponse.error?.message?.issue?.[0]?.code == 'value' ? 'Code tidak ditemukan' : null
      };
      await doUpdateCondition({ _id: val._id }, { ...payloadUpdate }, { new: true });
      publishFhirCondition.updated({
        pmrId : val.pmrId,
        fhirConditionId: fhirConditionId || null,
        description: fhirResponse?.error?.message === 'error-value' || fhirResponse.error?.message?.issue?.[0]?.code == 'value' ? 'Code tidak ditemukan' : null
      })
      item.push(fhirResponse)
    } catch (error) {
      log.error(`FHIR >> Condition error send to Satu Sehat >> ${val._id}`);
      console.log('Error Condition :>> ', error);
    }
  }
  return item;
}

export async function setCondition(body: any, encounter: any) {
  try {
    let encounterId = encounter._id.toHexString();
    const conditions = await doFindAllCondition({ encounterId: encounterId, pmrId: { "$exists": true, "$ne": "" } });
    const data = await processConditions(conditions, encounterId, body);
    return data;
  } catch (e: any) {
    log.error(`FHIR >> Condition error created/updated`, e);
    throw e;
  }
}

async function processConditions(conditions: any[], encounterId: string, body: any) {
  let data: any[] = [];
  for await (const condition of body) {
    let payload = {
      encounterId: encounterId,
      code: condition.icd10Code || '',
      name: condition.name || '',
      pmrId: condition.code,
      active: condition.active === '1' || true,
      fhirConditionId: "",
      description: ''
    };
    const existingCondition = conditions.filter(item => item.pmrId === condition.code);

    if (existingCondition.length > 0) {
      for await (const data of existingCondition){
        payload.fhirConditionId = data.fhirConditionId || "";
        await doUpdateCondition({ _id: data._id }, { ...payload }, { new: true });
      }
    } else {
      await doCreateCondition(payload);
    }
  }
  return data;
}


export async function processCondition(encounter: any, body: any) {
  if (!body || !encounter) return;

  await setCondition(body, encounter);
  let encounterId = encounter._id.toHexString();
  const conditions = await doFindAllCondition({ encounterId: encounterId, pmrId: { "$exists": true, "$ne": "" } });
  const fhirCondition = conditions.filter(data => data.fhirConditionId !== "");
  const filteredCondition = conditions.filter(data => data.fhirConditionId === "");

  for (const condition of fhirCondition) {
    let payload = conditionPayload(condition, encounter)
    const updatePayload = {...payload, id: condition.fhirConditionId}
    const fhirResponse = await fhir.put(`/Condition/${condition.fhirConditionId}`, updatePayload, encounter.hospitalId);
    await doUpdateCondition({ _id: condition._id }, { fhirResponse : fhirResponse }, { new: true });
    //  Publish Send Condition FhirID To HIS
    publishFhirCondition.updated({
      pmrId : condition.pmrId,
      fhirConditionId: condition.fhirConditionId,
      description: condition.description
    })
  }

  if (filteredCondition.length > 0) {
    await createFhirConditionPayload(filteredCondition, encounter);
  }
}