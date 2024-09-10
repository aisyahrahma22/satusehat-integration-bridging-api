import { Request, Response } from "express";
import {
  doCreate as doCreatePatientReference,
  doFind as doFindPatientReference,
  doFindOne as doFindOnePatientReference,
  doUpdate as doUpdatePatientReference,
} from "../../services/fhir/fhirPatientReference.service";
import {
  doCreate as doCreateFhirPatient,
  doFind as doFindFhirPatient
} from "../../services/fhir/fhirPatient.service";
import { doFindHospital } from "../../services/hospital.service";
import * as fhir from "../../middleware/request/fhir";
import log from "../../utils/logger";
import { GetFhirPatientInput, SetFhirPatientInput } from "../../schemas/fhir/fhirPatient.schema";
import { FHIR_IDENTITY_TYPE_KK, FHIR_IDENTITY_TYPE_KTP, FHIR_IDENTITY_TYPE_NIK, FHIR_IDENTITY_TYPE_NIK_IBU, FHIR_IDENTITY_TYPE_PASPOR } from "../../utils/constants";
import { IFhirPatientBaby } from "../../utils/interface/fhirPatientBaby";

export async function getHandler(
  req: Request<GetFhirPatientInput>,
  res: Response
) {
  try {
    // Validasi jika token harus digroup yang sama dengan hospital yang dicari
    
    const hospitalId = req.params.hospitalId;
    const patientId = req.params.patientId;
    const data = await doFindPatientReference({ hospitalId, patientId });

    if (!data) {
      return res.status(404).send({
        errorCode: 404,
        errorMessage: `Patient not found`,
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
    SetFhirPatientInput,
    {},
    SetFhirPatientInput
  >,
  res: Response
) {
  const body = req.body;
  const isBaby = body?.isBaby || false;
  const hospitalId = req.params.hospitalId;
  const patientId = req.params.patientId;
  const identityNumber = body?.identityNumber;
  let identityType = FHIR_IDENTITY_TYPE_NIK;
  try {
    const hospital = await doFindHospital({
      uuid: hospitalId,
    });

    if (!hospital) {
      return res.status(400).send({
        errorCode: 400,
        errorMessage: "Faskes tidak ditemukan",
      });
    }

    // Find out whether the patient has ever been registered in DB?
    const patientReference = await doFindOnePatientReference({ hospitalId, patientId });

    // Find out whether the identity number is registered in DB?
    let fhirPatient = await doFindFhirPatient({ identityNumber });

    if (isBaby) {
      // Check Identity Type
      switch (body?.dataBaby?.identityType?.toLowerCase()) {
        case FHIR_IDENTITY_TYPE_KTP:
          identityType = FHIR_IDENTITY_TYPE_NIK_IBU;
          break;
        case FHIR_IDENTITY_TYPE_KK:
          identityType = FHIR_IDENTITY_TYPE_KK;
          break;
        case FHIR_IDENTITY_TYPE_PASPOR:
          identityType = FHIR_IDENTITY_TYPE_PASPOR;
          break;
        default:
          identityType = FHIR_IDENTITY_TYPE_NIK_IBU;
          break;
      }

      // Find out whether the patient has ever been registered in Satusehat
      const newFhirPatient: any = await fhir.get(`/Patient?identifier=https://fhir.kemkes.go.id/id/nik-ibu|${identityNumber}`, hospitalId);
      let patientBaby: IFhirPatientBaby | undefined = undefined;
      if (newFhirPatient && newFhirPatient.data && newFhirPatient.data.entry && (newFhirPatient.data.entry.length > 0)) {
        const fhirPatients = newFhirPatient.data.entry;
        // Find the baby
        const findBaby = fhirPatients.find((baby: any) => baby.resource.birthDate === body.dataBaby?.dob && baby.resource.multipleBirthInteger === body.dataBaby?.birthOrder);
        if (findBaby) {
          patientBaby = {
            fhirId                    : findBaby.resource?.id,
            fhirName                  : findBaby.resource?.name[0]?.text,
            fhirGender                : findBaby.resource?.gender,
            fhirDob                   : findBaby.resource?.birthDate,
            fhirMultipleBirthInteger  : findBaby.resource?.multipleBirthInteger,
            fhirMeta                  : findBaby,
            fhirResourceType          : findBaby.resource?.resourceType,
          }
        }
      }

      // If baby not found and create new
      if (!patientBaby) {
        try {
          const fhirPayload =  createFhirPayloadBabyPatient(body.dataBaby, identityNumber, identityType);
          const fhirResponse = await fhir.post("/Patient", fhirPayload, hospitalId);
          if (fhirResponse && fhirResponse.data && fhirResponse.data.create_patient) {
            patientBaby = {
              fhirId                    : fhirResponse.data.create_patient.data.patient_id,
              fhirName                  : body.dataBaby?.name || "",
              fhirGender                : body.dataBaby?.gender || "",
              fhirDob                   : body.dataBaby?.dob || "",
              fhirMultipleBirthInteger  : body.dataBaby?.birthOrder || 0,
              fhirMeta                  : { fhirPayload, fhirResponse },
              fhirResourceType          : "Patient",
            }
          }
        } catch (error) {
          throw error;
        }
      }

      // Save Patient to DB
      if (patientBaby && patientBaby.fhirId) {
        // Post Patient Consent
        const payloadConsent = {
          patient_id  : patientBaby.fhirId,
          action      : body?.consent?.action,
          agent       : body?.consent?.agent,
        }

        let fhirConsent = null;
        try {
          fhirConsent = await fhir.post(`/Consent`, payloadConsent, hospitalId);
          log.info(`FHIR >> Patient Baby ${identityNumber} success post consent`);
        } catch (error) {
          log.error(`FHIR >> Pateint Baby ${identityNumber} failed post consent`);
        }

        const payload = {
          identityNumber,
          identityType,
          fhirId           : patientBaby.fhirId,
          fhirName         : patientBaby.fhirName || "",
          fhirGender       : patientBaby.fhirGender || "",
          fhirMeta         : patientBaby.fhirMeta || {},
          fhirResourceType : patientBaby.fhirResourceType || "",
          active           : body.active || true,
          consent          : {
            fhirRequest      : payloadConsent,
            fhirConsentId    : fhirConsent?.id,
            fhirResponse     : fhirConsent,
            fhirResourceType : fhirConsent?.resourceType
          },
          isBaby,
          fhirMultipleBirthInteger : patientBaby.fhirMultipleBirthInteger
        };

        // Find out whether FhirId already exist in DB?        
        fhirPatient = await doFindFhirPatient({ fhirId: patientBaby.fhirId });
        if (!fhirPatient) {
          fhirPatient = await doCreateFhirPatient(payload);
        }
      }
    }

    if (!isBaby) {
      if (!fhirPatient) {
        const newFhirPatient: any = await fhir.get(`/Patient?identifier=https://fhir.kemkes.go.id/id/nik|${identityNumber}`, hospitalId);
        if (newFhirPatient && newFhirPatient.data && newFhirPatient.data.entry && (newFhirPatient.data.entry.length > 0)) {
          const resource = newFhirPatient.data.entry[0].resource;
          let resourceName = null;
          if (resource.name && (resource.name.length > 0)) {
            resourceName = {
              fhirName: resource.name[0].text ? resource.name[0].text : "",
            }
          }

          // Post Patient Consent
          const payloadConsent = {
            patient_id : newFhirPatient.data.entry[0]?.resource?.id,
            action: body?.consent?.action,
            agent: body?.consent?.agent,
          }

          let fhirConsent = null;
          try {
            fhirConsent = await fhir.post(`/Consent`, payloadConsent, hospitalId);
            log.info(`FHIR >> Patient ${identityNumber} success post consent`);
          } catch (error) {
            log.error(`FHIR >> Pateint ${identityNumber} failed post consent`);
          }
          
          const payload = {
            identityNumber,
            identityType,
            fhirId: newFhirPatient.data.entry[0]?.resource?.id,
            fhirName: resourceName && resourceName.fhirName ? resourceName.fhirName : "",
            fhirGender: newFhirPatient.data.entry[0]?.resource?.gender || "",
            fhirMeta: newFhirPatient.data.entry[0],
            fhirResourceType: newFhirPatient.data.entry[0]?.resource?.resourceType,
            active: body.active || true,
            consent:{
              fhirRequest: payloadConsent,
              fhirConsentId: fhirConsent?.id,
              fhirResponse: fhirConsent,
              fhirResourceType: fhirConsent?.resourceType
            },
            isBaby: false
          };
          fhirPatient = await doCreateFhirPatient(payload);
        }
      }
    }

    if (fhirPatient) {
      if (!patientReference) {
        // Save Patient Reference to DB
        const payload = {
          groupId: hospital.groupId,
          hospitalId: hospital.uuid,
          patientId,
          fhirPatientId: fhirPatient?._id,
          active: body.active || true,
        };
        await doCreatePatientReference(payload);
      } else {
        // Update
        const payload = {
          fhirPatientId: fhirPatient?._id,
          active: body.active,
        };
        await doUpdatePatientReference({ _id: patientReference._id }, { ...payload }, { new: true });
      }

      const data = await doFindPatientReference({ hospitalId, patientId });
      log.info(`FHIR >> Patient ${identityNumber} registered`);
      return res.send(data);
    } else {
      if (patientReference) {
        const payload = {
          fhirPatientId: null,
          active: body.active,
        };
        await doUpdatePatientReference({ _id: patientReference._id }, { ...payload }, { new: true });
      }
      log.error(`FHIR >> Pasien ${identityNumber} not registered`);
      return res.status(404).send({
        errorCode: 404,
        errorMessage: "Pasien Tidak Ditemukan di FHIR",
      });
    }
  } catch (e: any) {
    log.error(`FHIR >> Patient ${identityNumber} >> ${e?.response?.data?.message}`);
    log.error({
      err: e,
      context: {
        body: req.body,
        params: req.params
      }
    });
    return res.status(400).send({
      errorCode: 400,
      errorMessage: e?.response?.data?.message || e,
    });
  }
}

function createFhirPayloadBabyPatient(dataBaby: any, identityNumber: string, identityType: string) {
  let fhirPayload: any = {
    resourceType: "Patient",
    meta: {
        profile: [
            "https://fhir.kemkes.go.id/r4/StructureDefinition/Patient"
        ]
    },
    identifier: [
        {
            use: "official",
            system: `https://fhir.kemkes.go.id/id/${identityType}`,
            value: identityNumber
        }
    ],
    active: true,
    name: [
        {
            use: "official",
            text: dataBaby.name
        }
    ],
    gender: dataBaby.gender,
    birthDate: dataBaby.dob,
    deceasedBoolean: false,
    multipleBirthInteger: dataBaby.birthOrder,
    communication: [
        {
            language: {
                coding: [
                    {
                        system: "urn:ietf:bcp:47",
                        code: "id-ID",
                        display: "Indonesian"
                    }
                ],
                text: "Indonesian"
            },
            preferred: true
        }
    ]
  }
  return fhirPayload;
}