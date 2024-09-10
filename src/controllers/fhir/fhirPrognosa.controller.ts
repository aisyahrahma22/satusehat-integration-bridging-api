import { Request, Response } from "express";
import log from "../../utils/logger";
import {
  doCreate as doCreatePrognosa,
  doUpdate as doUpdatePrognosa,
  doFind as doFindPrognosa,
} from "../../services/fhir/fhirPrognosa.service";
import * as fhir from "../../middleware/request/fhir";
import { GetFhirPrognosaInput, SetFhirPrognosaInput } from "../../schemas/fhir/fhirPrognosa.schema";
import {
  doFind as doFindEncounter,
} from "../../services/fhir/fhirEncounter.service";
import moment from 'moment';
import publishFhirPrognosa from "../../services/message/publish/fhirPrognosa.publish";

export async function getHandler(
  req: Request<GetFhirPrognosaInput>,
  res: Response
) {
  try {
    const registrationId = req.params.registrationId;
    const hospitalId = req.params.hospitalId;
    const data = await doFindPrognosa({ hospitalId, registrationId });

    if (data) {
      return res.status(404).send({
        errorCode: 404,
        errorMessage: `Prognosa not found`,
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
    SetFhirPrognosaInput,
    {},
    SetFhirPrognosaInput
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
    let prognosa = await doFindPrognosa({ registrationId, encounterId: encounterId });
    let data = null;
    let payload = {
      registrationId,
      encounterId: encounterId,
      name: body.name,
      code: body.code,
      active: body.active,
      pmrPrognosaId: body.pmrPrognosaId,
      createdAt: body.createdAt || new Date(),
      notes: body.notes,
      fhirPrognosaId: ""
    }
    if (!prognosa) {
      const create = await doCreatePrognosa(payload);
      data = create
    } else {
      const update = await doUpdatePrognosa({ _id: prognosa._id }, { ...payload }, { new: true });
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

export async function createPrognosaPayload(data: any, encounter: any) {
  const fhirPayload: any = {
    resourceType: "ClinicalImpression",
    identifier: [
        {
            system: "http://sys-ids.kemkes.go.id/clinicalimpression/dec69acd-1831-46cc-b75a-eecd9caf810d",
            use: "official",
            value: data.pmrPrognosaId
        }
    ],
    status: "completed",
    subject: {
        reference: `Patient/${encounter.patientFhirId}`,
        display:  encounter.patientName
    },
    encounter: {
        reference: `Encounter/${encounter.fhirEncounterId}`,
        display: `Kunjungan ${encounter.patientName} di ${moment(data.createdAt).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]")}`
    },
    effectiveDateTime: moment(data.createdAt).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"),
    date: moment(data.createdAt).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"),
    assessor: {
        reference: `Practitioner/${encounter.doctorFhirId}`
    },
    summary: data.notes ? data.notes : '',
    prognosisCodeableConcept: [
        {
            coding: [
                {
                    system: "http://snomed.info/sct",
                    code: `${data.code}`,
                    display: data.name
                }
            ]
        }
    ]
  }

    let fhirResponse;
    let fhirPrognosaId: string | null = null;
    if (data.fhirPrognosaId) {
      fhirPayload.id = data.fhirPrognosaId;
      fhirResponse = await fhir.put(`/ClinicalImpression/${data.fhirPrognosaId}`, fhirPayload, encounter.hospitalId);
      fhirPrognosaId = fhirResponse?.id;
    } else {
      fhirResponse = await fhir.post("/ClinicalImpression", fhirPayload, encounter.hospitalId);
      fhirPrognosaId = fhirResponse?.id;
    }

    const payloadUpdate = {
      fhirRequest: fhirPayload,
      fhirPrognosaId,
      fhirResponse,
      fhirResourceType: fhirResponse?.resourceType
    };
    const newPrognosa = await doUpdatePrognosa({ _id: data._id }, { ...payloadUpdate }, { new: true });
     // Publish Send Prognosa FhirID To HIS
     publishFhirPrognosa.updated({
      registrationId  : data.registrationId,
      fhirPrognosaId: fhirPrognosaId,
      pmrPrognosaId: data.pmrPrognosaId
    });
    return newPrognosa
}

export async function setPrognosa(registrationId: any, hospitalId: any, encounter:any, data: any) {
  try {
    let newPrognosa = null
    let encounters = encounter
    if(!encounter) encounters = await doFindEncounter({ hospitalId, registrationId });

    if(encounters){
      let encounterId = encounters._id.toHexString();
      const prognosa = await doFindPrognosa({ registrationId, encounterId: encounterId });

      let payload = {
        registrationId,
        encounterId: encounterId,
        name: data.name,
        code: data.code,
        pmrPrognosaId: data.pmrPrognosaId,
        createdAt: data.createdAt || new Date(),
        active: data.active,
        notes: data.notes,
        fhirPrognosaId: prognosa?.fhirPrognosaId || "" 
      }
      if (!prognosa) {
        newPrognosa = await doCreatePrognosa(payload);
      } else {
        newPrognosa = await doUpdatePrognosa({ _id: prognosa._id }, { ...payload }, { new: true });
      }
    }
  } catch (error) {
    log.error({
      err: error,
      context: {
        action: "Error to save Prognosa",
        body: data,
        params: registrationId
      }
    });
  }
}

export async function processPrognosa(registrationId: string, encounter: any, body: any) {
  if (!body || !encounter) return;
  let encounterId = encounter._id.toHexString();
  await setPrognosa(registrationId, encounter.hospitalId, encounter, body);
  const prognosa = await doFindPrognosa({ registrationId, encounterId: encounterId });
  
    await createPrognosaPayload(prognosa , encounter);
 
}

