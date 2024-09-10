import { Request, Response } from "express";
import {
  doCreate as doCreateEncounter,
  doFind as doFindEncounter,
  doUpdate as doUpdateEncounter,
  doFindAll as doFindAllEncounter,
} from "../../services/fhir/fhirEncounter.service";
import { doFindHospital } from "../../services/hospital.service";
import * as fhir from "../../middleware/request/fhir";
import {
  doCreate as doCreateEncounterDuplicate,
  doFind as doFindEncounterDuplicate,
  doUpdate as doUpdateEncounterDuplicate,
  doFindAll as  doFindAllEncounterDuplicate,
} from "../../services/fhir/fhirEncounterDuplicate.service";
import { GetFhirEncounterInput, SetFhirEncounterInput, SetFhirSingleEncounterInput } from "../../schemas/fhir/fhirEncounter.schema";
import { doFind as doFindPatientRef} from "../../services/fhir/fhirPatientReference.service";
import { doFind as doFindLocation } from "../../services/fhir/fhirLocation.service";
import { doFind as doFindPractitionerRef } from "../../services/fhir/fhirPractitionerReference.service";
import { sortBy } from "lodash";
import moment from 'moment';
import {
  doFindAll as doFindAllObservation,
} from "../../services/fhir/fhirObservation.service";
import {
  doFindAll as doFindAllCondition,
  doCreate as doCreateCondition,
  doFind as doFindCondition,
  doUpdate as doUpdateCondition
} from "../../services/fhir/fhirCondition.service";
import {
  doFind as doFindCarePlan,
} from "../../services/fhir/fhirCarePlan.service";
import { conditionPayload, createFhirConditionPayload, processCondition } from "./fhirCondition.controller";
import log from "../../utils/logger";
import { FHIR_ENCOUNTER_ARRIVED, FHIR_ENCOUNTER_CANCELLED, FHIR_ENCOUNTER_FINISHED, FHIR_ENCOUNTER_INPROGRESS, MEDICAL_CATEGORY_OPD } from "../../utils/constants";
import { decrypt } from "../../utils/encryption";
import publishEncounterStatus from "../../services/message/publish/encounterStatus.publish";
import { createFhirObservationPayload, processObservations } from "./fhirObservation.controller";
import { createCarePlanPayload, processCareplans } from "./fhirCarePlan.controller";
import {
  doFindAll as doFindAllProcedure,
} from "../../services/fhir/fhirProcedure.service";
import { createFhirProcedurePayload, processProcedure } from "./fhirProcedure.controller";
import { validateAndFixDates, validateHistoryData } from "../../helpers/fhir/dateUtils";
import { createPrognosaPayload, processPrognosa } from "./fhirPrognosa.controller";
import { createFhirAllergyPayload, processAllergy } from "./fhirAllergy.controller";
import {
  doFind as doFindPrognosa,
} from "../../services/fhir/fhirPrognosa.service";
import { createFhirMedicineReceiptPayload, processMedicalReceipt } from "./fhirMedicineReceipt.controller";
import {
  doFindAll as doFindAllAllergy,
} from "../../services/fhir/fhirAllergy.service";
import {
  doFindAll as doFindAllMedicineReceipt
} from "../../services/fhir/fhirMedicineReceipt.service"
import { processLaboratory } from "./fhirLaboratory.controller";
import { processRadiology } from "./fhirRadiology.controller";
type HistoryItem = {
  start: string;
  end: string;
};

type History = {
  arrived?: HistoryItem;
  inProgress?: HistoryItem;
  finished?: HistoryItem;
  cancelled?: HistoryItem;
};

interface DiagnosisEntry {
  uuid: string;
  name: string;
  code: string;
  active: boolean;
}

function checkHistory(encounter: any, status: string, processDate: string, isPaid: boolean): History {
  const item = encounter?.history;
  const history: History = {};
  switch (status) {
    case FHIR_ENCOUNTER_ARRIVED:
      history.arrived = {
        start: processDate,
        end: '',
      };
      break;
    case FHIR_ENCOUNTER_INPROGRESS:
      history.arrived = {
        start: item?.arrived?.start || '',
        end: processDate,
      };
      history.inProgress = {
        start: processDate,
        end: '',
      };
      break;
    case FHIR_ENCOUNTER_FINISHED:
      history.arrived = {
        start: item?.arrived?.start || '',
        end: item?.arrived?.end || '',
      };
      history.inProgress = {
        start: item?.inProgress?.start || '',
        end: processDate,
      };
      history.finished = {
        start: isPaid ? (item?.inProgress?.start || '') : processDate,
        end: isPaid ? processDate : '',
      };
      break;
    case FHIR_ENCOUNTER_CANCELLED:
      history.cancelled = {
        start: processDate,
        end: processDate,
      };
      break;
    default:
      break;
  }
  return history;
}

function setHistory(consultationDate: any, processTime: any) {
  const history: History = {
    arrived: {
      start: processTime?.arrivedTime,
      end: processTime?.inProgressTime[0]
    },
    inProgress: {
      start: processTime?.inProgressTime[0],
      end: processTime?.inProgressTime[1]
    },
    finished: {
      start: processTime?.inProgressTime[1],
      end: processTime?.finishedTime
    }
  };
  return history;
}

function getFormattedPeriod(period: { start?: string; end?: string } = {}) {
  return {
    start: moment(period.start).utcOffset("+00:00").format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"),
    end: moment(period.end).utcOffset("+00:00").format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"),
  };
}

export async function getHandler(
  req: Request<GetFhirEncounterInput>,
  res: Response
) {
  try {
    const hospitalId = req.params.hospitalId;
    const registrationId = req.params.registrationId;
    const data = await doFindEncounter({ hospitalId, registrationId });

    if (!data) {
      return res.status(404).send({
        errorCode: 404,
        errorMessage: `Encounter tidak ditemukan`,
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

export async function scheduler(req: any, res: any) {
  try {
    const encounters = await doFindAllEncounter({
      status: FHIR_ENCOUNTER_FINISHED,
      doctorFhirId: { "$exists": true, "$ne": "" },
      patientFhirId: { "$exists": true, "$ne": "" },
      locationFhirId: { "$exists": true, "$ne": "" },
      $or: [
        { fhirEncounterId: { "$exists": false } },
        { fhirEncounterId: { "$exists": true, "$eq": "" } }
      ]
    }, { 
      sort: { createdAt: -1 } 
    });
    if (encounters && encounters.length > 0) {
      const data = await setEventScheduler(encounters);
      return res.status(200).send({
        message: "Send Encounter to Satu Sehat",
        data
      });
    }

    return res.status(200).send({
      message: "No data to send to Satu Sehat"
    });
  } catch (e: any) {
    return res.status(400).send({
      errorCode: 400,
      errorMessage: e.message
    });
  }
}

export async function itemScheduler(req: any, res: any) {
  try {
    const encounters = await doFindAllEncounter({
      status: FHIR_ENCOUNTER_FINISHED,
      doctorFhirId: { "$exists": true, "$ne": "" },
      patientFhirId: { "$exists": true, "$ne": "" },
      locationFhirId: { "$exists": true, "$ne": "" },
      fhirEncounterId: { "$exists": true, "$ne": "" }
    });
    if (encounters && encounters.length > 0) {
      for await (const entry of encounters) {
        publishEncounterStatus.updated({
          registrationId: entry.registrationId,
          fhirEncounterId: entry.fhirEncounterId,
          description: entry?.description || null,
          date: moment(entry.history.finished.end).utcOffset("+00:00").format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"),
        });
        const registrationId = entry.registrationId
        let observations = await doFindAllObservation({ registrationId: registrationId, encounterId : entry._id });
        const filteredObservations = observations.filter(data => data.fhirObservationId === "");
        if (filteredObservations?.length > 0) {
          await createFhirObservationPayload(filteredObservations, entry);
        }

        let carePlans = await doFindCarePlan({ registrationId: registrationId,  encounterId: entry._id });
        if (carePlans?.fhirCareplanId === "" && carePlans?.procedureName !== "") {
          await createCarePlanPayload(carePlans , entry);
        }

        let procedures = await doFindAllProcedure({ encounterId : entry._id  });
        const filteredProcedure = procedures.filter(data => data.fhirProcedureId === "");
        if (filteredProcedure?.length > 0) {
          await createFhirProcedurePayload(filteredProcedure, entry);
        }

        let prognosa = await doFindPrognosa({ encounterId : entry._id  });
        if(prognosa && prognosa?.fhirPrognosaId === '' && prognosa.code ){
          await createPrognosaPayload(prognosa, entry)
        }

        let allergy = await doFindAllAllergy({ encounterId : entry._id  });
        const filteredAllergy = allergy.filter(data => data.fhirAllergyId === "");
        if(filteredAllergy.length > 0){
          const hospital = await doFindHospital({ uuid: entry.hospitalId });
          if(hospital){
            const { organization_id } = JSON.parse(decrypt(hospital.fhirSecret));
            await createFhirAllergyPayload(filteredAllergy, organization_id, entry)
          }
        }

        if(!entry.diagnoses || entry?.diagnoses?.length === 0){
          const condition = await doFindCondition({ encounterId: entry._id,  pmrId: { "$exists": true, "$eq": "" } });
          if(condition?.fhirConditionId == ""){
            const data = {
              code: 'Z00.0',
              name: `General medical examination for ${entry?.fhirEncounterId}`
            }
            const payload = conditionPayload(data, entry)
            const fhirResponse = await fhir.post("/Condition", payload, entry.hospitalId);
            const payloadCreate = {
              ...data,
              fhirRequest: payload,
              fhirConditionId: fhirResponse?.id,
              fhirResponse: fhirResponse,
              fhirResourceType: fhirResponse?.resourceType,
              pmrId: "",
              encounterId: entry._id
            };
             await doUpdateCondition({ _id: condition._id }, { ...payloadCreate }, { new: true });
           }
         }else{
           let conditions = await doFindAllCondition({ encounterId : entry._id ,  pmrId: { "$exists": true, "$ne": "" } });
           const filteredCondition = conditions.filter(data => data.fhirConditionId === "");
           if (filteredCondition?.length > 0) {
             await createFhirConditionPayload(filteredCondition, entry);
           }
         }
      }
      return res.status(200).send({
        message: "Send Item Encounter to Satu Sehat"
      });
    }

    return res.status(200).send({
      message: "No item encounter to send to Satu Sehat"
    });
  } catch (e: any) {
    log.error(`error item scheduler`, e);
    return res.status(400).send({
      errorCode: 400,
      errorMessage: e.message
    });
  }
}

export async function duplicateScheduler(req: Request, res: Response) {
  try {
      const duplicateEncounters = await doFindAllEncounterDuplicate({ active: true });

      if (duplicateEncounters?.length === 0) {
          return res.status(200).send({ message: "No data to send to Satu Sehat" });
      }

      for await (const entry of duplicateEncounters) {
          const encounter = await doFindEncounter({ _id: entry.encounterId });
          if (!encounter) continue;

          const hospital = await doFindHospital({ uuid: encounter.hospitalId });
          if (!hospital || !hospital?.configs?.enableFhirEncounter) continue;

          if (!encounter.fhirEncounterId && encounter.fhirRequest) {
              const { statusHistory, period } = encounter.fhirRequest;
              const { organization_id } = JSON.parse(decrypt(hospital.fhirSecret));
              
              const emptyDiagnose = [{
                  condition: {
                      reference: `urn:uuid:14fb4e95-bb1e-4ec4-a15f-6b1e0669f93d`,
                      display: "Condition empty"
                  },
                  use: {
                      coding: [{
                          system: "http://terminology.hl7.org/CodeSystem/diagnosis-role",
                          code: "DD",
                          display: "Discharge diagnosis"
                      }]
                  },
                  rank: 1
              }];

              let updatedStatusHistory = statusHistory;
              let updatedPeriod = period;

              if (validateHistoryData(encounter.history)) {
                  const itemHistory = validateAndFixDates(encounter.history);
                  updatedStatusHistory = [
                      { status: "arrived", period: { start: itemHistory.arrived.start, end: itemHistory.arrived.end } },
                      { status: "in-progress", period: { start: itemHistory.inProgress.start, end: itemHistory.inProgress.end } },
                      { status: "finished", period: { start: itemHistory.finished.start, end: itemHistory.finished.end } }
                  ];
                  updatedPeriod = { start: itemHistory.arrived.start, end: itemHistory.finished.end };
              }

              const payload = {
                  ...encounter.fhirRequest,
                  identifier: [{ system: `http://sys-ids.kemkes.go.id/encounter/${organization_id}`, value: entry._id }],
                  diagnosis: encounter.diagnoses ? encounter.fhirRequest.diagnosis : emptyDiagnose,
                  statusHistory: updatedStatusHistory,
                  period: updatedPeriod
              };

              const fhirResponse = await fhir.postData('/Encounter', payload, encounter.hospitalId);
              const payloadUpdate = {
                  fhirRequest: payload,
                  fhirEncounterId: fhirResponse?.id,
                  fhirResponse: fhirResponse,
                  fhirResourceType: fhirResponse?.resourceType,
                  fhirRequestDate: new Date(),
                  description: ["Encounter Terkirim"]
              };

              const newEncounter = await doUpdateEncounter({ _id: encounter._id }, payloadUpdate, { new: true });

              if (newEncounter && newEncounter.fhirEncounterId) {
                  await doUpdateEncounterDuplicate({ _id: entry._id }, { active: false }, { new: true });
                  publishEncounterStatus.updated({
                      registrationId: newEncounter.registrationId,
                      fhirEncounterId: newEncounter.fhirEncounterId,
                      description: newEncounter.description,
                      date: moment(newEncounter.history.finished.end).utcOffset("+00:00").format("YYYY-MM-DDTHH:mm:ss.SSS[Z]")
                  });
              }
          }
      }

      return res.status(200).send({ message: "Send duplicate encounter to Satu Sehat" });
  } catch (error: any) {
      return res.status(400).send({
          errorCode: 400,
          errorMessage: error.message
      });
  }
}


export async function setHandler(
  req: Request<SetFhirEncounterInput, {}, SetFhirEncounterInput>,
  res: Response
) {
  try {
    const body = req.body;
    const hospitalId = req.params.hospitalId;
    const registrationId = req.params.registrationId;
    const {
      description,
      hospital,
      patient,
      practitioner,
      location,
      checkDiagnones,
      mappedDiagnoses
    } = await fetchData(body, hospitalId, registrationId);

    let encounter = await doFindEncounter({ hospitalId, registrationId });
    const data = await handleEncounter(
      body,
      hospital,
      patient,
      practitioner,
      location,
      registrationId,
      checkDiagnones,
      mappedDiagnoses,
      description,
      encounter
    );
    return res.send(data);
  } catch (e: any) {
    log.error(`FHIR >> Encounter error created/updated`);
    log.error({
      err: e,
      context: {
        action: "Create / Update Encounter",
        params: req.params,
        body: req.body
      }
    })
    return res.status(400).send({
      errorCode: e.errorCode ? e.errorCode : 400,
      errorMessage: e.errorMessage ? e.errorMessage : e.message,
    });
  }
}

export async function setEventScheduler(encounters: any[]) {
  for await (const entry of encounters) {
    const isHistoryFinished = entry?.history?.finished?.end;
    let isHistoryArrived = entry?.history?.arrived?.start;
    const registrationId = entry?.registrationId;
    if (!isHistoryFinished || !isHistoryArrived) continue;
    const hospital = await doFindHospital({ uuid: entry.hospitalId });
    if (!hospital) continue;

    try {
      if(hospital && hospital?.configs?.enableFhirEncounter){
        const { organization_id } = JSON.parse(decrypt(hospital.fhirSecret));
        const fhirPayload = await createFhirPayload(entry, organization_id, entry?.diagnoses);
        let updatedStatusHistory = fhirPayload.statusHistory;
        let updatedPeriod = fhirPayload.period;
        if (validateHistoryData(entry.history)) {
          const itemHistory = validateAndFixDates(entry.history);
          updatedStatusHistory = [                
              { status: "arrived", period: { start: itemHistory.arrived.start, end: itemHistory.arrived.end } },
              { status: "in-progress", period: { start: itemHistory.inProgress.start, end: itemHistory.inProgress.end } },
              { status: "finished", period: { start: itemHistory.finished.start, end: itemHistory.finished.end } }
          ];
          updatedPeriod = { start: itemHistory.arrived.start, end: itemHistory.finished.end };
        }
        const payload = {
          ...fhirPayload,
          statusHistory: updatedStatusHistory,
          period: updatedPeriod
        };
        const fhirResponse = await fhir.postData('/Encounter', payload, entry.hospitalId);
        if (fhirResponse.error) {
          await handleFhirErrorDuplicate(fhirResponse.error, entry._id);
        }

        const payloadUpdate = {
          fhirRequest: fhirPayload,
          fhirEncounterId: fhirResponse?.id,
          fhirResponse: fhirResponse,
          fhirResourceType: fhirResponse?.resourceType,
          fhirRequestDate: new Date(),
          description: ["Encounter Terkirim"],
        };

        const newEncounter = await doUpdateEncounter({ _id: entry._id }, payloadUpdate, { new: true });

        if(newEncounter && fhirResponse?.id){
          const encounterDuplicate = await doFindEncounterDuplicate({ encounterId: newEncounter._id });
          if (encounterDuplicate && newEncounter.fhirEncounterId) {
            await doUpdateEncounterDuplicate({ _id: encounterDuplicate._id }, { active: false }, { new: true });
          }      
          publishEncounterStatus.updated({
            registrationId: newEncounter.registrationId,
            fhirEncounterId: newEncounter.fhirEncounterId || fhirResponse?.id,
            description: newEncounter.description,
            date: moment(newEncounter.history.finished.end).utcOffset("+00:00").format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"),
          });

          let observations = await doFindAllObservation({ registrationId, encounterId : newEncounter._id });
          const filteredObservations = observations.filter(data => data.fhirObservationId === "");
          if (filteredObservations?.length > 0) {
            await createFhirObservationPayload(filteredObservations, newEncounter);
          }

          let carePlans = await doFindCarePlan({ registrationId,  encounterId: entry._id });
          if (carePlans?.fhirCareplanId == ''  && carePlans?.procedureName !== "") {
            await createCarePlanPayload(carePlans , newEncounter);
          }

          let procedures = await doFindAllProcedure({ encounterId : newEncounter._id  });
          const filteredProcedure = procedures.filter(data => data.fhirProcedureId === "");
          if (filteredProcedure?.length > 0) {
            await createFhirProcedurePayload(filteredProcedure, newEncounter);
          }

          let prognosa = await doFindPrognosa({ encounterId : newEncounter._id  });
          if(!prognosa?.fhirPrognosaId || prognosa.fhirPrognosaId === ''){
            await createPrognosaPayload(prognosa, newEncounter)
          }

          let allergy = await doFindAllAllergy({ encounterId : newEncounter._id  });
          const filteredAllergy = allergy.filter(data => data.fhirAllergyId === "");
          if(filteredAllergy.length > 0){
            await createFhirAllergyPayload(filteredAllergy, organization_id, newEncounter)
          }
          
          let medicineReceipts = await doFindAllMedicineReceipt({registrationId, hospitalId: newEncounter.hospitalId})
          const filteredMedicineReceipt = medicineReceipts.filter(data => data.fhirMedicineReceiptId === "")
          if (filteredMedicineReceipt.length > 0) {
            await createFhirMedicineReceiptPayload(filteredMedicineReceipt, organization_id, newEncounter)
          }


          try {
            if(!newEncounter.diagnoses || newEncounter.diagnoses.length === 0){
              const condition = await doFindCondition({ encounterId: newEncounter._id,  pmrId: { "$exists": true, "$ne": "" } });
              if(!condition){
                const data = {
                  code: 'Z00.0',
                  name: `General medical examination for ${newEncounter?.fhirEncounterId}`
                }
                const payload = conditionPayload(data, newEncounter)
                const fhirResponse = await fhir.post("/Condition", payload, newEncounter.hospitalId);
                const payloadCreate = {
                  ...data,
                  fhirRequest: payload,
                  fhirConditionId: fhirResponse?.id,
                  fhirResponse: fhirResponse,
                  fhirResourceType: fhirResponse?.resourceType,
                  pmrId: "",
                  encounterId: newEncounter._id,
                  description: ''
                };
                await doCreateCondition(payloadCreate);
              }
            }else{
              let conditions = await doFindAllCondition({ encounterId : entry._id, pmrId: { "$exists": true, "$ne": "" }   });
              const filteredCondition = conditions.filter(data => data.fhirConditionId === "");
              if (filteredCondition?.length > 0) {
                const encounterData = {...newEncounter, fhirEncounterId: fhirResponse?.id}
                await createFhirConditionPayload(filteredCondition, encounterData);
              }    
            }
          } catch (error) {
             log.error(`FHIR >> Encounter update no diagnoses in condition error`);
           }
        } 
      }
    } catch (error: any) {
      publishEncounterStatus.updated({
        registrationId,
        fhirEncounterId: null,
        description: ["Gagal Terkirim"],
      });

      log.error(`FHIR >> Encounter error send to Satu Sehat >> ${entry._id}`);
      log.error({
        err: error,
        context: {
          action: 'Error Encounter',
        },
      });
    }
  }
}

async function handleFhirErrorDuplicate(error: any, encounterId: string) {
  if (error.message === 'duplicate') {
    const encounterDuplicate = await doFindEncounterDuplicate({ encounterId });
    if (!encounterDuplicate) {
      await doCreateEncounterDuplicate({ encounterId, active: true });
    }
  } else {
    throw new Error(error.message);
  }

  return null
}

function createFhirPayload(data: any, organization_id: any, mappedDiagnoses: any) {
  let emptyDiagnose = [ {
    condition: {
      reference: `urn:uuid:80fca897-e965-4c66-94d9-6cdfb9e8b62d`,
      display: "General medical examination"
    },
    use: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/diagnosis-role",
          code: "DD",
          display: "Discharge diagnosis"
        }
      ]
    },
    rank: 1
  }]
 
  let fhirPayload: any = {
    resourceType: "Encounter",
    identifier: [
      {
        system: `http://sys-ids.kemkes.go.id/encounter/${organization_id}`,
        value: data.registrationId,
      },
    ],
    status: data.status,
    class: {
      system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
      code: "AMB",
      display: "ambulatory",
    },
    subject: {
      reference: `Patient/${data.patientFhirId}`,
      display: data.patientName,
    },
    serviceProvider: {
      reference: `Organization/${organization_id}`,
    },
    statusHistory: [
      { status: "arrived", period: getFormattedPeriod(data.history?.arrived) },
      { status: "in-progress", period: getFormattedPeriod(data.history?.inProgress) },
      { status: "finished", period: getFormattedPeriod(data.history?.finished) },
    ],
    location: [
      {
        location: {
          reference: `Location/${data.locationFhirId}`,
          display: data.locationReferenceName,
        },
      },
    ],
    period: {
      start: moment(data.history?.arrived?.start).utcOffset("+00:00").format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"),
      end: moment(data.history?.finished?.end).utcOffset("+00:00").format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"),
    },
    participant: [
      {
        type: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
                code: "ATND",
                display: "attender",
              },
            ],
          },
        ],
        individual: {
          reference: `Practitioner/${data.doctorFhirId}`,
          display: data.doctorName,
        },
      },
    ]
  };

  if (mappedDiagnoses && mappedDiagnoses?.length > 0) {
    const diagnoseDetail = mappedDiagnoses.map((diagnose: any) => ({
      condition: {
        reference: `urn:uuid:${diagnose.code}`,
        display: diagnose.name,
      },
      use: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/diagnosis-role",
            code: "DD",
            display: "Discharge diagnosis",
          },
        ],
      },
      rank: diagnose.rank,
    }));
  
    fhirPayload = {
      ...fhirPayload,
      diagnosis: diagnoseDetail
    }
  }else{
    fhirPayload = {
      ...fhirPayload,
      diagnosis: emptyDiagnose
    }
  }

  return fhirPayload;
}

export async function singleEncounter(req: Request<SetFhirEncounterInput, {}, SetFhirSingleEncounterInput>,
  res: Response
) {
  let registrationId = req.params.registrationId;
  try {
    const body = req.body;
    const hospitalId = req.params.hospitalId;
    const description: string[] = [];

    // Validasi semua data
    const hospital = await doFindHospital({ uuid: hospitalId });
    if (!hospital || !hospital.configs.enableFhirEncounter) {
      description.push(!hospital ? 'Faskes tidak ditemukan' : 'Encounter belum diaktifkan');
      return res.status(400).send({
        errorCode: 400,
        errorMessage: description.join(', '),
      });
    }
    const patient = await doFindPatientRef({ patientId: body?.patientId });
    const practitioner = await doFindPractitionerRef({ referenceId: body?.doctorId });
    const location = await doFindLocation({ referenceId: body?.roomId });
    if (!patient || !practitioner || !location) {
      description.push(
        !patient ? 'Pasien belum punya ID Satu Sehat' : '',
        !practitioner ? 'Dokter belum punya ID Satu Sehat' : '',
        !location ? 'Klinik / ruangan belum punya ID Satu Sehat' : ''
      );
      return res.status(400).send({
        errorCode: 400,
        errorMessage: description.join(', '),
      });
    }

    let encounter = await doFindEncounter({
      status: FHIR_ENCOUNTER_FINISHED,
      hospitalId: hospitalId,
      registrationId: registrationId,
    });
    
    console.log('OLD Encounter :>> ',encounter);

    if (encounter && encounter.fhirEncounterId !== "") {
      publishEncounterStatus.updated({
        registrationId  : registrationId,
        fhirEncounterId : encounter.fhirEncounterId,
        description     : "Encounter Berhasil Terikirim",
        date  : moment(encounter.history.finished.end).utcOffset("+00:00").format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"),
      });
    }
    // console.log('Body :>> ', body);
    // Sorting diagnoses
    let mappedDiagnoses = null;
    if (body?.diagnoses?.length > 0) {
      const trueValues = body.diagnoses.filter((item: any) => item.isPrimer);
      const falseValues = body.diagnoses.filter((item: any) => !item.isPrimer);
      const sortedTrueValues = sortBy(trueValues, 'createdAt');
      const sortedFalseValues = sortBy(falseValues, 'createdAt');
      const sortedDiagnoses = [...sortedTrueValues, ...sortedFalseValues];
      // Re-mapping diagnoses
      mappedDiagnoses = sortedDiagnoses.map((diagnose, index) => ({
        code: diagnose.uuid,
        name: diagnose.name,
        rank: index + 1,
      }));
    }
    if (!encounter) {
      /** Create New Encounter */

      const payload = {
        groupId: hospital.groupId,
        hospitalId: hospital.uuid,
        medicalCategory: body?.medicalCategory || MEDICAL_CATEGORY_OPD,
        registrationId: registrationId,
        registrationDate: new Date(body.registrationDate),
        patientId: body.patientId,
        patientFhirId: patient?.fhirId || '',
        patientName: patient?.fhirName,
        doctorId: body.doctorId,
        doctorFhirId: practitioner?.fhirId || '',
        doctorName: practitioner?.fhirName,
        isPaid: body.isPaid || false,
        history: setHistory(body.consultationDate, body.progress),
        locationSource: location?.source,
        locationReferenceId: location?.referenceId,
        locationFhirId: location?.fhirId || '',
        locationReferenceName: location?.fhirName,
        diagnoses: mappedDiagnoses,
        status: FHIR_ENCOUNTER_FINISHED,
        fhirEncounterId: '',
        description: "Encounter ditambahkan",
        fhirRequest: null
      };
      encounter = await doCreateEncounter(payload);
    } else {
      if(encounter.fhirEncounterId == ""){
        /** Update existing encounter */
        const payload = {
          patientId: body.patientId,
          patientFhirId: patient?.fhirId || '',
          patientName: patient?.fhirName,
          doctorId: body.doctorId,
          medicalCategory: body?.medicalCategory || MEDICAL_CATEGORY_OPD,
          doctorFhirId: practitioner?.fhirId || '',
          doctorName: practitioner?.fhirName,
          isPaid: body.isPaid || false,
          history: setHistory(body.consultationDate, body.progress),
          locationSource: location?.source,
          locationReferenceId: location?.referenceId,
          locationFhirId: location?.fhirId || '',
          locationReferenceName: location?.fhirName,
          diagnoses: mappedDiagnoses,
          description: "Encounter diubah",
        };

        encounter = await doUpdateEncounter({ _id: encounter._id }, { ...payload }, { new: true });
      }
    }

    if (encounter) {
      /** Send encounter to Satusehat */
      if(encounter.fhirEncounterId == ""){
        const { organization_id } = JSON.parse(decrypt(hospital.fhirSecret));
        const fhirPayload = await createFhirPayload(encounter, organization_id, encounter.diagnoses);
        const fhirResponse = await fhir.post('/Encounter', fhirPayload, hospitalId);
        const payloadUpdate = {
          fhirRequest: fhirPayload,
          fhirEncounterId: fhirResponse?.id,
          fhirResponse: fhirResponse,
          fhirResourceType: fhirResponse?.resourceType,
          fhirRequestDate: new Date()
        };
        
        const newEncounters = await doUpdateEncounter({ _id: encounter._id }, { ...payloadUpdate }, { new: true });
        encounter = newEncounters
  
        // Publish Send Encounter Status To HIS
        publishEncounterStatus.updated({
          registrationId  : registrationId,
          fhirEncounterId : fhirResponse?.id,
          description     : "Encounter Berhasil Terikirim",
          date  :moment(encounter?.history.finished.end).utcOffset("+00:00").format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"),
        });
      }
    
       // Proses observation
      try {
        if (body?.observation) {
          await processObservations(registrationId, encounter, body.observation)
         }
      } catch (error) {
        log.error(`FHIR >> Encounter error send single data observation`);
      }

      // Proses condition
      try {
        let { diagnoses } = body;
        if(encounter && (!diagnoses || diagnoses?.length === 0)){
          const data = {
            code: 'Z00.0',
            name: `General medical examination for ${encounter?.fhirEncounterId}`
          }
          const payload = conditionPayload(data, encounter)
          const condition = await doFindCondition({ encounterId: encounter._id,  pmrId: { "$exists": true, "$eq": "" } });
          if(!condition || condition.fhirConditionId == ""){
            const fhirResponse = await fhir.post("/Condition", payload, encounter.hospitalId);
            const payloadCreate = {
              ...data,
              fhirRequest: payload,
              fhirConditionId: fhirResponse?.id,
              fhirResponse: fhirResponse,
              fhirResourceType: fhirResponse?.resourceType,
              pmrId: "",
              encounterId: encounter._id,
              description: ''
            };
             await doCreateCondition(payloadCreate);
           }
         }else{
          if (diagnoses) {
            const conditions = diagnoses.map(({ uuid, name, code, active }: DiagnosisEntry) => ({
              code: uuid,
              name,
              icd10Code: code,
              active
            }));
            await processCondition(encounter, conditions);
          }
         }
      } catch (error) {
        log.error('FHIR >> Encounter error: Failed to send single data conditions', error);
      }

        // Proses careplan
        try {
          if (body?.carePlan) {
            await processCareplans(registrationId, encounter, body.carePlan)
          }
        } catch (error) {
          log.error(`FHIR >> Encounter error send single data careplan`);
        }

        // Proses procedure
        try {
          if (body?.procedure) {
            await processProcedure(encounter, body.procedure)
          }  
        } catch (error) {
          log.error(`FHIR >> Encounter error send single data procedure`);
        }

        // Proses prognosa
        try {
          if (body?.prognosa) {
            await processPrognosa(registrationId, encounter, body.prognosa)
          }
        } catch (error) {
          log.error(`FHIR >> Encounter error send single data prognosa`)
        }

        // Proses Allergy
        try {
          if(body?.allergy){
            await processAllergy(encounter, body.allergy)
          }
        } catch (error) {
          log.error(`FHIR >> Encounter error send single data allergy`)
        }

          // Proses Medicine Receipts
          try {
           if(body?.medicineReceipt)  await processMedicalReceipt(encounter, body.medicineReceipt)
          } catch (error) {
            log.error(`FHIR >> Encounter error send single data medicine receipt`)
          }

          // Proses Lab
          try {
           if(body?.laboratory)  await processLaboratory(encounter, body.laboratory)
          } catch (error) {
            log.error(`FHIR >> Encounter error send single data laboratory`)
          }

          // Proses Rad
          try {
            if(body?.radiology) await processRadiology(encounter, body.radiology)
          } catch (error) {
            log.error(`FHIR >> Encounter error send single data radiology`)
          }
        return res.send({
          data: {...encounter},
          description: "Encounter Berhasil Terikirim"
        });
    }else {
      publishEncounterStatus.updated({
        registrationId,
        description     : ["Gagal mengirim data encounter"]
      });
      return res.status(400).send({
        errorCode: 400,
        errorMessage: 'Gagal mengirim data encounter #1'
      });
    }
  } catch (error) {
    // Publish Send Encounter Status To HIS
    publishEncounterStatus.updated({
      registrationId,
      fhirEncounterId : null,
      description     : ["Gagal Terikirim"]
    });
    log.error(`FHIR >> Encounter error send single data encounter`);
    log.error({
      err: error,
      context: {
        action: 'Send Single Encounter',
        body: req.body,
        params: req.params
      }
    });
    return res.status(400).send({
      errorCode: 400,
      errorMessage: 'Gagal mengirim data encounter'
    });
  }
}

export async function setEncounter(body: any) {
  try {
    const hospitalId = body.hospitalId;
    const registrationId = body.registrationId;
    const {
      description,
      hospital,
      patient,
      practitioner,
      location,
      checkDiagnones,
      mappedDiagnoses
    } = await fetchData(body, hospitalId, registrationId);

    let encounter = await doFindEncounter({ hospitalId, registrationId });
    const data = await handleEncounter(
      body,
      hospital,
      patient,
      practitioner,
      location,
      registrationId,
      checkDiagnones,
      mappedDiagnoses,
      description,
      encounter
    );
    return data;
  } catch (e: any) {
    log.error(`FHIR >> Encounter error created/updated`, e)
  }
}

async function fetchData(body: any, hospitalId: string, registrationId: string) {
  const description = [];

  const hospital = await doFindHospital({ uuid: hospitalId });
  if (!hospital) {
    description.push('Faskes tidak ditemukan');
  }

  if (hospital && !hospital.configs.enableFhirEncounter) {
    description.push('Encounter belum diaktifkan');
  }

  const patient = await doFindPatientRef({ patientId: body?.patientId });
  if (!patient) {
    description.push("Pasien belum punya ID Satu Sehat");
  }

  const practitioner = await doFindPractitionerRef({ referenceId: body?.doctorId });
  if (!practitioner) {
    description.push("Dokter belum punya ID Satu Sehat");
  }

  const location = await doFindLocation({ hospitalId, referenceId: body?.roomId });
  if (!location) {
    description.push("Lokasi belum punya ID Satu Sehat");
  }

  const diagnose = body.diagnoses ?? [];
  const checkDiagnones = diagnose.find((item: any) => item.code === '');
  const trueValues = diagnose.filter((item: any) => item.isPrimer);
  const falseValues = diagnose.filter((item: any) => !item.isPrimer);
  const sortedTrueValues = sortBy(trueValues, 'createdAt');
  const sortedFalseValues = sortBy(falseValues, 'createdAt');
  const sortedDiagnoses = [...sortedTrueValues, ...sortedFalseValues];

  const mappedDiagnoses = sortedDiagnoses.map((diagnose, index) => ({
    code: diagnose.code,
    name: diagnose.name,
    rank: index + 1,
  }));

  return {
    description,
    hospital,
    patient,
    practitioner,
    location,
    checkDiagnones,
    mappedDiagnoses
  };
}

async function handleEncounter(
  body: any,
  hospital: any,
  patient: any,
  practitioner: any,
  location: any,
  registrationId: string,
  checkDiagnones: any,
  mappedDiagnoses: any,
  description: any[],
  encounter: any
) {
  let data = null;
  if (!encounter) {
    description.push("Encounter ditambahkan");
    const payload = {
      groupId: hospital.groupId,
      hospitalId: hospital.uuid,
      medicalCategory: body.medicalCategory,
      registrationId: registrationId,
      registrationDate: new Date(body?.registrationDate),
      patientId: body.patientId,
      patientFhirId: patient?.fhirId || '',
      patientName: patient?.fhirName,
      doctorId: body.doctorId,
      doctorFhirId: practitioner?.fhirId || '',
      doctorName: practitioner?.fhirName,
      isPaid: body.isPaid || false,
      history: checkHistory(null, body.status, (body.processDate || ''), (body.isPaid || false)),
      locationSource: location?.source,
      locationReferenceId: location?.referenceId,
      locationFhirId: location?.fhirId || '',
      locationReferenceName: location?.fhirName,
      diagnoses: checkDiagnones ? null : mappedDiagnoses,
      status: body.status,
      fhirEncounterId: '',
      description,
      fhirRequest: null
    };
    data = await doCreateEncounter(payload);
    log.info(`FHIR >> Encounter created`);
  } else {
    description.push("Encounter diubah");
    const payload = {
      doctorId: body.doctorId,
      doctorFhirId: practitioner?.fhirId || '',
      doctorName: practitioner?.fhirName,
      locationSource: location?.source,
      locationReferenceId: location?.referenceId,
      locationFhirId: location?.fhirId || '',
      locationReferenceName: location?.fhirName,
      isPaid: body.isPaid || false,
      history: checkHistory(encounter, body.status, (body.processDate || ''), (body.isPaid || false)),
      diagnoses: checkDiagnones ? null : mappedDiagnoses,
      medicalCategory: body.medicalCategory || encounter.medicalCategory,
      status: body.status,
      description
    }
    data = await doUpdateEncounter({ _id: encounter._id }, { ...payload }, { new: true });
    log.info(`FHIR >> Encounter updated`);
  }
  return data;
}
