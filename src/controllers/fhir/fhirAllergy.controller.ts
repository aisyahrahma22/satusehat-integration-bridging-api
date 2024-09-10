import { Request, Response } from "express";
import {
  doCreate as doCreateAllergy,
  doUpdate as doUpdateAllergy,
  doFindAll as doFindAllAllergy,
} from "../../services/fhir/fhirAllergy.service";
import { doFindHospital } from "../../services/hospital.service";
import log from "../../utils/logger";
import * as fhir from "../../middleware/request/fhir";
import { GetFhirAllergyInput, SetFhirAllergyInput } from "../../schemas/fhir/fhirAllergy.schema";
import {
  doFind as doFindEncounter,
} from "../../services/fhir/fhirEncounter.service";
import { decrypt } from "../../utils/encryption";
import moment from 'moment';
import publishFhirAllergy from "../../services/message/publish/fhirAllergy.publish";
export async function getHandler(
  req: Request<GetFhirAllergyInput>,
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
      const allergies = await doFindAllAllergy({ encounterId: encounterId });
      data.push(...allergies)
    }
   
    if (data.length == 0) {
      return res.status(404).send({
        errorCode: 404,
        errorMessage: `Allergy not found`,
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
    SetFhirAllergyInput,
    {},
    SetFhirAllergyInput
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
    const allergies  = await doFindAllAllergy({ encounterId: encounterId });
    const data = await processAllergies(allergies , encounterId, body);
    return res.send(data);
  } catch (e: any) {
    return res.status(400).send({
      errorCode: e.errorCode ? e.errorCode : 400,
      errorMessage: e.errorMessage ? e.errorMessage : e.message,
    });
  }
}

function allergyPayload(val: any, organization_id: any, encounter: any){
  const payload = {
    resourceType: "AllergyIntolerance",
    identifier: [
        {
            system: `http://sys-ids.kemkes.go.id/allergy/${organization_id}`,
            use: "official",
            value: val.pmrAllergyId
        }
    ],
    clinicalStatus: {
        coding: [
            {
                system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
                code: "active",
                display: "Active"
            }
        ]
    },
    verificationStatus: {
        coding: [
            {
                system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification",
                code: "confirmed",
                display: "Confirmed"
            }
        ]
    },
    category: [
        val.category
    ],
    code: {
        coding: [
            {
                system: "http://snomed.info/sct",
                code: `${val.code}`,
                display: val.name
            }
        ],
        text: val.notes || ""
    },
    patient: {
        reference: `Patient/${encounter.patientFhirId}`,
        display: encounter.patientName
    },
    encounter: {
        reference: `Encounter/${encounter.fhirEncounterId}`,
        display: `Kunjungan ${encounter.patientName} di ${moment(val.createdAt).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]")}`
    },
    recordedDate:  moment(val.createdAt).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"),
    recorder: {
        reference: `Practitioner/${encounter.doctorFhirId}`
    }
  }

  return payload
}

export async function createFhirAllergyPayload(data: any, organization_id: any, encounter: any) {
  let item: any[] = [];
  for await (const val of data) {
    try {
      const payload = allergyPayload(val, organization_id, encounter)

      let fhirResponse;
      let fhirAllergyId: string | null = null;

      if (val.fhirAllergyId) {
        let updatePayload = {...payload, id: val.fhirAllergyId}
        fhirResponse = await fhir.put(`/AllergyIntolerance/${val.fhirAllergyId}`, updatePayload, encounter.hospitalId);
        fhirAllergyId = fhirResponse?.id;
      } else {
        fhirResponse = await fhir.postData("/AllergyIntolerance", payload, encounter.hospitalId);
        fhirAllergyId = fhirResponse?.id;
      }
      const payloadUpdate = {
        fhirRequest: payload,
        fhirAllergyId: fhirResponse?.id || '',
        fhirResponse: fhirResponse,
        fhirResourceType: fhirResponse?.resourceType || 'AllergyIntolerance',
        description: fhirResponse?.error?.message === 'error-value' ? 'Code tidak ditemukan' :  fhirResponse.error ? 'Gagal Terkirim' :null
      };
      await doUpdateAllergy({ _id: val._id }, { ...payloadUpdate }, { new: true });
      publishFhirAllergy.updated({
        pmrAllergyId: val.pmrAllergyId,
        fhirAllergyId: fhirResponse?.id || null,
        description: fhirResponse?.error?.message === 'error-value' ? 'Code tidak ditemukan' : fhirResponse.error ? 'Gagal Terkirim' : null
      });
      item.push(fhirResponse)
    } catch (error) {
      log.error(`FHIR >> Allergy error send to Satu Sehat >> ${val._id}`);
      console.log('Error Allergy :>> ', error);
    }
  }
  return item;
}

export async function setAllergy(body: any, encounter: any) {
  try {
    let encounterId = encounter._id.toHexString();
    const allergies  = await doFindAllAllergy({ encounterId: encounterId });
    const data = await processAllergies(allergies, encounterId, body);
    return data;
  } catch (e: any) {
    log.error(`FHIR >> Allergy error created/updated`, e);
    throw e;
  }
}

async function processAllergies(allergies: any[], encounterId: string, body: any) {
  let data: any[] = [];
  for await (const allergy of body) {
    let payload = {
      encounterId: encounterId,
      code: allergy.code || '',
      name: allergy.allergyItemName || '',
      category: allergy.category || '',
      notes: allergy.notes || '',
      pmrAllergyId: allergy.uuid,
      createdAt: allergy.createdAt,
      active: allergy.active == 1,
      fhirAllergyId: "",
      description: ''
    }; 
    const existingAllergy = allergies.filter((item) => {
      return item.pmrAllergyId === allergy.uuid
    });

    if (existingAllergy.length > 0) {
      for await (const data of existingAllergy){
        payload.fhirAllergyId = data.fhirAllergyId || "";
        await doUpdateAllergy({ _id: data._id }, { ...payload }, { new: true });
      }
    } else {
      await doCreateAllergy(payload);
    }
  }
  return data;
}


export async function processAllergy(encounter: any, body: any) {
  if (!body || !encounter) return;

  await setAllergy(body, encounter);
  let encounterId = encounter._id.toHexString();
  const allergies = await doFindAllAllergy({ encounterId: encounterId });
  const fhirAllergy = allergies.filter(data => data.fhirAllergyId !== "");
  const filteredAllergy = allergies.filter(data => data.fhirAllergyId === "");
  let hospital = await doFindHospital({ uuid: encounter.hospitalId });
  let organizationId = null;

  if(hospital){
    const { organization_id } = JSON.parse(decrypt(hospital.fhirSecret));
    organizationId = organization_id
  }

  for (const allergy of fhirAllergy) {
    const payload = allergyPayload(allergy,  organizationId, encounter)
    const updatePayload = {...payload, id: allergy.fhirAllergyId}
    const fhirResponse = await fhir.put(`/AllergyIntolerance/${allergy.fhirAllergyId}`, updatePayload, encounter.hospitalId);

    await doUpdateAllergy({ _id: allergy._id }, { fhirResponse : fhirResponse }, { new: true });
    //  Publish Send Allergy FhirID To HIS
    publishFhirAllergy.updated({
      pmrAllergyId: allergy.pmrAllergyId,
      fhirAllergyId: allergy.fhirAllergyId,
      description: allergy.description
    });
  }

  if (filteredAllergy.length > 0 && encounter.fhirEncounterId) {
    await createFhirAllergyPayload(filteredAllergy, organizationId, encounter);
  }
}