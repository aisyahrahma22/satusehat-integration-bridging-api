import { Request, Response } from "express";
import {
  doCreate as doCreateObservation,
  doUpdate as doUpdateObservation,
  doFindAll as doFindAllObservation,
} from "../../services/fhir/fhirObservation.service";
import log from "../../utils/logger";
import * as fhir from "../../middleware/request/fhir";
import { GetFhirObservationInput, SetFhirObservationInput } from "../../schemas/fhir/fhirObservation.schema";
import {
  doFind as doFindEncounter,
} from "../../services/fhir/fhirEncounter.service";
import publishFhirObservation from "../../services/message/publish/fhirObservation.publish";
import moment from 'moment';
export async function getHandler(
  req: Request<GetFhirObservationInput>,
  res: Response
) {
  try {
    const registrationId = req.params.registrationId;
    const hospitalId = req.params.hospitalId;
    const data = await doFindAllObservation({ hospitalId, registrationId });

    if (data.length < 0) {
      return res.status(404).send({
        errorCode: 404,
        errorMessage: `Observation not found`,
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
    SetFhirObservationInput,
    {},
    SetFhirObservationInput
  >,
  res: Response
) {
  try {
    const body = req.body;
    const hospitalId = req.params.hospitalId;
    const registrationId = req.params.registrationId;
    const encounter = await doFindEncounter({ hospitalId, registrationId});
    if (!encounter) {
      return res.status(400).send({
        errorCode: 400,
        errorMessage: "Encounter tidak ditemukan",
      });
    }
    let observations = await doFindAllObservation({ registrationId });
    let data: any[] = [];
    let vitalSigns = null
    if(body?.vitalSign){
      const bloodPressure = body?.vitalSign?.bloodPressure?.split('/');
      vitalSigns = [
        { category: 'heart_rate', value: body?.vitalSign.pulseRate },
        { category: 'respiratory_rate', value: body?.vitalSign.respiratoryRate },
        { category: 'oxygen_saturation', value: body?.vitalSign.oxygenSaturation },
        { category: 'body_temperature', value: body?.vitalSign.bodyTemperature },
        { category: 'systolic_blood', value: Number(bloodPressure[0]) || 0 },
        { category: 'diastolic_blood', value: Number(bloodPressure[1]) || 0 },
      ];
    }
    if (observations.length > 0 && vitalSigns){
      for await(const observation of observations){
        for await(const item of vitalSigns){
          if(observation.category == item.category){
            const payload = {
              datetime: body.datetime || new Date(),
              value: item.value,
              category: item.category
            }
            const update = await doUpdateObservation({ _id: observation._id}, { ...payload }, { new: true });
            data.push(update)
          }
        }
      }
    }else{
      if(vitalSigns){
        for await(const item of vitalSigns){
          const payload = {
            status: 'final',
            encounterId : encounter?._id,
            registrationId: registrationId,
            active: body.active || true,
            datetime: body.datetime || new Date(),
            value: item.value,
            category: item.category,
            fhirObservationId: ""
          }
          const create = await doCreateObservation(payload);
          data.push(create)
      }
      }
    }
    return res.send(data);
  } catch (e: any) {
    return res.status(400).send({
      errorCode: e.errorCode ? e.errorCode : 400,
      errorMessage: e.errorMessage ? e.errorMessage : e.message,
    });
  }
}

interface CategoryInfo {
  system: string;
  code: string;
  display: string;
}

interface ValueInfo {
  value: number;
  unit: string;
  system: string;
  code: string;
}

function checkCategory(category: string): CategoryInfo | undefined {
  const commonProperties = {
    system: "http://loinc.org",
  };

  switch (category) {
    case 'heart_rate':
      return { ...commonProperties, code: "8867-4", display: "Heart rate" };
    case 'respiratory_rate':
      return { ...commonProperties, code: "9279-1", display: "Respiratory rate" };
    case 'oxygen_saturation':
      return { ...commonProperties, code: "20564-1", display: "Oxygen saturation in Blood" };
    case 'body_temperature':
      return { ...commonProperties, code: "8310-5", display: "Body temperature" };
    case 'systolic_blood':
      return { ...commonProperties, code: "8480-6", display: "Systolic blood pressure" };
    case 'diastolic_blood':
      return { ...commonProperties, code: "8462-4", display: "Diastolic blood pressure" };
    default:
      return undefined;
  }
}

function checkValue(category: string, value: number): ValueInfo | undefined {
  const commonProperties = {
    value,
    system: "http://unitsofmeasure.org",
  };

  switch (category) {
    case 'heart_rate':
      return { ...commonProperties, unit: "beats/minute", code: "/min" };
    case 'respiratory_rate':
    case 'oxygen_saturation':
      return { ...commonProperties, unit: "breaths/minute", code: "/min" };
    case 'body_temperature':
      return { ...commonProperties, unit: "C", code: "Cel" };
    case 'systolic_blood':
    case 'diastolic_blood':
      return { ...commonProperties, unit: "mm[Hg]", code: "mm[Hg]" };
    default:
      return undefined;
  }
}

function observationPayload(val: any, encounter: any){
  const categories = checkCategory(val.category);
  const valueQuantity = checkValue(val.category, Number(val.value));

  const payload = {
    resourceType: "Observation",
    status: val.status,
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "vital-signs",
            display: "Vital Signs"
          }
        ]
      }
    ],
    code: { coding: [categories] },
    subject: { reference: `Patient/${encounter.patientFhirId}` },
    performer: [{ reference: `Practitioner/${encounter.doctorFhirId}` }],
    encounter: {
      reference: `Encounter/${encounter.fhirEncounterId}`,
      display: `Pemeriksaan Fisik ${encounter.patientName} pada ${val.datetime || val.updatedAt} abc`
    },
    effectiveDateTime: moment(val.datetime || val.createdAt).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"),
    issued: moment(val.datetime || val.createdAt).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"),
    valueQuantity
  };

  return payload
}

export async function createFhirObservationPayload(data: any[], encounter: any): Promise<any[]> {
  const observations: any[] = [];

  for await (const val of data) {
    try {
      const payload = observationPayload(val, encounter)
      let fhirResponse;
      let fhirObservationId: string | null = null;

      if (val.fhirObservationId) {
        const newPayload = {...payload, id: val.fhirObservationId}
        fhirResponse = await fhir.put(`/Observation/${val.fhirObservationId}`, newPayload, encounter.hospitalId);
        fhirObservationId = fhirResponse?.id;
      } else {
        fhirResponse = await fhir.postData("/Observation", payload, encounter.hospitalId);
        fhirObservationId = fhirResponse?.id;
      }

      const payloadUpdate = {
        fhirRequest: payload,
        fhirObservationId: fhirObservationId || '',
        fhirResponse,
        fhirResourceType: fhirResponse?.resourceType
      };

      const newObservation = await doUpdateObservation({ _id: val._id }, { ...payloadUpdate }, { new: true });
     // Kirim data observasi ke HIS
      if(val.category && fhirObservationId){
        publishFhirObservation.updated({
          registrationId  : val.registrationId,
          fhirObservationId: fhirObservationId || null,
          fhirCategory     : val.category,
          value: val.value,
          hospitalId: encounter.hospitalId,
          category     : val.category,
        });
      }
      observations.push(newObservation);
    } catch (error) {
      log.error(`FHIR >> Observation error send to Satu Sehat >> ${val._id}`);
      console.log('Error Observation :>> ', error);
    }
  }

  return observations;
}

export async function setObservation(registrationId: any, encounter: any, data: any) {
  let newObservations: any[] = [];
  try {
    const observations = await doFindAllObservation({ registrationId });
    const bloodPressure = data?.vitalSign.bloodPressure?.split('/');
    const vitalSigns = [
      { category: 'heart_rate', value: data?.vitalSign.pulseRate },
      { category: 'respiratory_rate', value: data?.vitalSign.respiratoryRate },
      { category: 'oxygen_saturation', value: data?.vitalSign.oxygenSaturation },
      { category: 'body_temperature', value: data?.vitalSign.bodyTemperature },
      { category: 'systolic_blood', value: Number(bloodPressure[0]) || 0 },
      { category: 'diastolic_blood', value: Number(bloodPressure[1]) || 0 },
    ];
    if (observations.length > 0) {
      for await (const observation of observations) {
        for await (const item of vitalSigns) {
          if (observation.category == item.category) {
            const payload = {
              datetime: data.datetime || new Date(),
              value: item.value,
              category: item.category,
              fhirObservationId: observation?.fhirObservationId || ''
            };
            const updatedObservation = await doUpdateObservation({ _id: observation._id }, { ...payload }, { new: true });
            newObservations.push(updatedObservation);
          }
        }
      }
    } else {
      for await (const item of vitalSigns) {
        const payload = {
          status: 'final',
          encounterId: encounter?._id,
          registrationId: registrationId,
          active: true, // always true
          datetime: data.datetime || new Date(),
          value: item.value,
          category: item.category,
          fhirObservationId: ""
        };
        const createdObservation = await doCreateObservation(payload);
        newObservations.push(createdObservation);
      }
    }
  } catch (error) {
    log.error({
      err: error,
      context: {
        action: "Error to save observation",
        body: data,
        params: registrationId
      }
    });
  }
  return newObservations;
}

export async function processObservations(registrationId: string, encounter: any, body: any) {
  if (!body || !encounter) return;
  
  await setObservation(registrationId, encounter, body);
  let observations = await doFindAllObservation({ registrationId, encounterId: encounter._id });
  const fhirObservations = observations.filter(data => data.fhirObservationId !== "");
  const filteredObservations = observations.filter(data => data.fhirObservationId === "");

  for (const observation of fhirObservations) {
    const payload = observationPayload(observation, encounter)
    const newPayload = {...payload, id: observation.fhirObservationId}
    const fhirResponse =  await fhir.put(`/Observation/${observation.fhirObservationId}`, newPayload, encounter.hospitalId);
    await doUpdateObservation({ _id: observation._id }, { fhirResponse: fhirResponse }, { new: true });
    publishFhirObservation.updated({
      registrationId: observation.registrationId,
      fhirObservationId: observation.fhirObservationId,
      category: observation.category,
      value: observation.value,
      hospitalId: encounter.hospitalId
    });
  }
  
  if (filteredObservations.length > 0) {
    await createFhirObservationPayload(filteredObservations, encounter);
  }
}