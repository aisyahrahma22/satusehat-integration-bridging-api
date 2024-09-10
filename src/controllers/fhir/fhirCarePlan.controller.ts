import { Request, Response } from "express";
import log from "../../utils/logger";
import {
  doCreate as doCreateCarePlan,
  doUpdate as doUpdateCarePlan,
  doFindAll as doFindAllCarePlan,
  doFind as doFindCarePlan,
} from "../../services/fhir/fhirCarePlan.service";
import * as fhir from "../../middleware/request/fhir";
import { GetFhirCarePlanInput, SetFhirCarePlanInput } from "../../schemas/fhir/fhirCarePlan.schema";
import {
  doFind as doFindEncounter,
} from "../../services/fhir/fhirEncounter.service";
import moment from 'moment';
import publishFhirCareplan from "../../services/message/publish/fhirCareplan.publish";

export async function getHandler(
  req: Request<GetFhirCarePlanInput>,
  res: Response
) {
  try {
    const registrationId = req.params.registrationId;
    const hospitalId = req.params.hospitalId;
    const data = await doFindAllCarePlan({ hospitalId, registrationId });

    if (data.length < 0) {
      return res.status(404).send({
        errorCode: 404,
        errorMessage: `Care plan not found`,
      });
    }

    return res.send(data);
  } catch (e: any) {
    return res.status(400).send({
      errorCode: 400,
      errorMessage: e.message,
    });
  }
}

export async function setHandler(
  req: Request<
    SetFhirCarePlanInput,
    {},
    SetFhirCarePlanInput
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
    let carePlans = await doFindCarePlan({ registrationId, encounterId: encounterId });
    let data = null;
    let payload = {
      registrationId,
      encounterId: encounter._id,
      procedureName: body.procedureName || "",
      procedureUuid: body.procedureUuid,
      active: body.active,
      createdAt: body.createdAt || new Date(),
      notes: body.notes,
      fhirCareplanId: "",
    }
    if (!carePlans) {
      const create = await doCreateCarePlan(payload);
      data = create
    } else {
      const update = await doUpdateCarePlan({ _id: carePlans._id }, { ...payload }, { new: true });
      data = update
    }
    return res.send(data);
  } catch (e: any) {
    return res.status(400).send({
      errorCode: e.errorCode ? e.errorCode : 400,
      errorMessage: e.errorMessage ? e.errorMessage : e.message,
    });
  }
}

function carePlanPayload(data: any, encounter: any){
  const fhirPayload: any = {
    resourceType: "CarePlan",
    status: 'active',
    intent: "plan",
    title: `Careplan ${encounter.patientName} ${data.procedureName ? `menuju ${data.procedureName}` : ``} pada waktu ${moment(data.updatedAt || data.createdAt).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]")}`,
    category: [
      {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: "736372004",
            display: "Discharge care plan"
          }
        ]
      }
    ],
    description: data.notes || "-",
    subject: {
      reference: `Patient/${encounter.patientFhirId}`,
      display: encounter.patientName
    },
    encounter: {
      reference: `Encounter/${encounter.fhirEncounterId}`
    },
    created: moment(data.createdAt).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"),
    author: {
      reference: `Practitioner/${encounter.doctorFhirId}`
    }
  }

  return fhirPayload
}

export async function createCarePlanPayload(data: any, encounter: any) {
  const fhirPayload = carePlanPayload(data, encounter)

    let fhirResponse;
    let fhirCareplanId: string | null = null;
    if (data.procedureName !== '') {
      if (data.fhirCareplanId) {
        fhirPayload.id = data.fhirCareplanId
        fhirResponse = await fhir.put(`/CarePlan/${data.fhirCareplanId}`, fhirPayload, encounter.hospitalId);
        fhirCareplanId = fhirResponse?.id;
      } else {
        fhirResponse = await fhir.postData("/CarePlan", fhirPayload, encounter.hospitalId);
        fhirCareplanId = fhirResponse?.id;
      }
    const payloadUpdate = {
      fhirRequest: fhirPayload,
      fhirCareplanId: fhirCareplanId || '',
      fhirResponse,
      fhirResourceType: fhirResponse?.resourceType
    };
    const newCarePlan = await doUpdateCarePlan({ _id: data._id }, { ...payloadUpdate }, { new: true });
     // Publish Send Careplan FhirID To HIS
     publishFhirCareplan.updated({
      registrationId  : data.registrationId,
      fhirCareplanId: fhirCareplanId,
    });
    return newCarePlan
  }else{
    return null
  }
}

export async function setCarePlans(registrationId: any, encounter: any, data: any) {
  try {
    let encounterId = encounter._id.toHexString();
    const carePlans = await doFindCarePlan({ registrationId, encounterId: encounterId });
    let payload = {
      registrationId,
      encounterId: encounterId,
      procedureName: data.procedureName,
      procedureUuid: data.procedureUuid,
      createdAt: data.createdAt || new Date(),
      active: data.active,
      notes: data.notes,
      fhirCareplanId: carePlans?.fhirCareplanId || "" 
    }
    if (!carePlans) {
      await doCreateCarePlan(payload);
    } else {
      await doUpdateCarePlan({ _id: carePlans._id }, { ...payload }, { new: true });
    }
  } catch (error) {
    log.error({
      err: error,
      context: {
        action: "Error to save careplan",
        body: data,
        params: registrationId
      }
    });
  }
}

export async function processCareplans(registrationId: string, encounter: any, body: any) {
  if (!body || !encounter) return;

  await setCarePlans(registrationId, encounter, body);
  let encounterId = encounter._id.toHexString();
  const carePlans = await doFindCarePlan({ registrationId, encounterId: encounterId });
  if (carePlans?.fhirCareplanId == '') {
    await createCarePlanPayload(carePlans , encounter);
  }else{
    const fhirPayload = carePlanPayload(carePlans, encounter)
    fhirPayload.id = carePlans?.fhirCareplanId
    const fhirResponse = await fhir.put(`/CarePlan/${carePlans?.fhirCareplanId}`, fhirPayload, encounter.hospitalId);
    await doUpdateCarePlan({ _id: carePlans?._id }, { fhirResponse: fhirResponse }, { new: true });
    publishFhirCareplan.updated({
      registrationId  : registrationId,
      fhirCareplanId: carePlans?.fhirCareplanId,
    });
  }
}

