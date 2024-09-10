import log from "../../utils/logger";
import {
  doCreate as doCreateServiceReq,
  doUpdate as doUpdateServiceReq,
  doFind as doFindServiceReq,
} from "../../services/fhir/fhirServiceRequest.service";
import {
  doCreate as doCreateSpecimen,
  doUpdate as doUpdateSpecimen,
  doFind as doFindSpecimen,
} from "../../services/fhir/fhirSpecimen.service";
import {
  doCreate as doCreateObserv,
  doUpdate as doUpdateObserv,
  doFind as doFindObserv,
} from "../../services/fhir/fhirObservGeneral.service";
import {
  doCreate as doCreateLaboratory,
  doUpdate as doUpdateLaboratory,
  doFind as doFindLaboratory,
} from "../../services/fhir/fhirLaboratory.service";
import {
  doCreate as doCreateRadiology,
  doUpdate as doUpdateRadiology,
  doFind as doFindRadiology,
} from "../../services/fhir/fhirRadiology.service";
import * as fhir from "../../middleware/request/fhir";
import moment from 'moment';

// Helper function to get category based on type
function getCategory(type: string) {
  return type === 'lab' ? [
    {
      coding: [
        {
          system: "http://snomed.info/sct",
          code: "108252007",
          display: "Laboratory procedure"
        }
      ]
    }
  ] : [
    {
      coding: [
        {
          system: "http://snomed.info/sct",
          code: "363679005",
          display: "Imaging"
        }
      ]
    }
  ];
}

// Helper function to format date
function formatDate(date: string) {
  return moment(date).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
}

async function handleFhirRequest(
  endpoint: string,
  method: 'post' | 'put',
  payload: any,
  id: string,
  hospitalId: any
) {
  try {
    let fhirResponse;
    if (id) {
      payload.id = id;
      fhirResponse = await fhir[method](`${endpoint}/${id}`, payload, hospitalId);
    } else {
      fhirResponse = await fhir[method](endpoint, payload, hospitalId);
    }
    return fhirResponse;
  } catch (error) {
    log.error(`FHIR request error for ${endpoint}`, error);
    throw error;
  }
}

export async function createServiceReqPayload(
  data: any,
  encounter: any,
  organization_id: any,
  type: string
) {
  try {
    const names = encounter?.diagnoses?.map((diagnosis: { name: any }) => diagnosis.name) || [];
    const notesString = names.join(', ');
    const category = getCategory(type);

    const fhirPayload = {
      resourceType: "ServiceRequest",
      identifier: [
        {
          system: `http://sys-ids.kemkes.go.id/servicerequest/${organization_id}`,
          value: type === 'lab' ? data.pmrLabUuid : data.pmrRadUuid
        }
      ],
      status: "active",
      intent: "original-order",
      category,
      code: {
        coding: [
          {
            system: "http://loinc.org",
            code: data.loincCode,
            display: type === 'lab' ? data.labName : data.radName
          }
        ],
        text: type === 'lab' ? data.labName : data.radName
      },
      subject: { reference: `Patient/${encounter.patientFhirId}` },
      encounter: { reference: `Encounter/${encounter.fhirEncounterId}` },
      occurrenceDateTime: formatDate(data.createdAt),
      requester: { reference: `Practitioner/${encounter.doctorFhirId}` },
      performer: [{ reference: `Practitioner/${encounter.doctorFhirId}` }],
      reasonCode: [{ text: notesString || "General Examination" }]
    };

    const fhirResponse = await handleFhirRequest(
      "/ServiceRequest",
      data.fhirServiceReqId ? 'put' : 'post',
      fhirPayload,
      data.fhirServiceReqId,
      encounter.hospitalId
    );

    const payload = {
      fhirRequest: fhirPayload,
      fhirServiceReqId: fhirResponse?.id || '',
      fhirResponse,
      fhirResourceType: fhirResponse?.resourceType,
      refId: data._id,
    };

    const serviceReq = await doFindServiceReq({ refId: data._id });
    return serviceReq
      ? await doUpdateServiceReq({ _id: serviceReq._id }, payload, { new: true })
      : await doCreateServiceReq(payload);
  } catch (error) {
    log.error(`FHIR Service Req >> ${type === 'rad' ? 'Radiology' : 'Laboratory'} error send data`, error);
    throw error;
  }
}

export async function createSpecimenPayload(
  data: any,
  encounter: any,
  organization_id: any,
  servicefhirId: any
) {
  try {
    const fhirPayload = {
      resourceType: "Specimen",
      identifier: [
        {
          system: `http://sys-ids.kemkes.go.id/specimen/${organization_id}`,
          value: data.pmrLabUuid
        }
      ],
      status: "available",
      type: {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: data.specimenCode,
            display: data.specimenName
          }
        ]
      },
      subject: { reference: `Patient/${encounter.patientFhirId}` },
      request: [{ reference: `ServiceRequest/${servicefhirId}` }],
      receivedTime: formatDate(data.createdAt),
      extension: [
        {
          url: "https://fhir.kemkes.go.id/r4/StructureDefinition/TransportedTime",
          valueDateTime: formatDate(data.createdAt)
        }
      ]
    };

    const fhirResponse = await handleFhirRequest(
      "/Specimen",
      data.fhirSpecimenId ? 'put' : 'post',
      fhirPayload,
      data.fhirSpecimenId,
      encounter.hospitalId
    );

    const payload = {
      fhirRequest: fhirPayload,
      fhirSpecimenId: fhirResponse?.id || null,
      fhirResponse,
      fhirResourceType: fhirResponse?.resourceType,
      refId: data._id,
    };

    const specimen = await doFindSpecimen({ refId: data._id });
    return specimen
      ? await doUpdateSpecimen({ _id: specimen._id }, payload, { new: true })
      : await doCreateSpecimen(payload);
  } catch (error) {
    log.error(`FHIR Specimen >> Laboratory error send data`, error);
    throw error;
  }
}

export async function createObservPayload(
  data: any,
  encounter: any,
  organization_id: any,
  servicefhirId: any,
  specimenFhirdId: any,
  type: string
) {
  try {
    const category = type === 'lab' ? [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "laboratory",
            display: "Laboratory"
          }
        ]
      }
    ] : [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "imaging",
            display: "Imaging"
          }
        ]
      }
    ];

    const fhirPayload = {
      resourceType: "Observation",
      identifier: [
        {
          system: `http://sys-ids.kemkes.go.id/observation/${organization_id}`,
          value: type === 'lab' ? data.pmrLabUuid : data.pmrRadUuid
        }
      ],
      status: "final",
      category,
      code: {
        coding: [
          {
            system: "http://loinc.org",
            code: data.loincCode,
            display: data.display
          }
        ]
      },
      subject: { reference: `Patient/${encounter.patientFhirId}` },
      encounter: { reference: `Encounter/${encounter.fhirEncounterId}` },
      effectiveDateTime: formatDate(data.createdAt),
      issued: formatDate(data.createdAt),
      performer: [
        { reference: `Practitioner/${encounter.doctorFhirId}` },
        { reference: `Organization/${organization_id}` }
      ],
      basedOn: [{ reference: `ServiceRequest/${servicefhirId}` }],
      ...(type === 'lab' && { specimen: { reference: `Specimen/${specimenFhirdId}` } })
    };

    const fhirResponse = await handleFhirRequest(
      "/Observation",
      data.fhirObservId ? 'put' : 'post',
      fhirPayload,
      data.fhirObservId,
      encounter.hospitalId
    );

    const payload = {
      fhirRequest: fhirPayload,
      fhirObservGeneralId: fhirResponse?.id || null,
      fhirResponse,
      fhirResourceType: fhirResponse?.resourceType,
      refId: data._id,
      category: type
    };

    const observation = await doFindObserv({ refId: data._id });
    return observation
      ? await doUpdateObserv({ _id: observation._id }, payload, { new: true })
      : await doCreateObserv(payload);
  } catch (error) {
    log.error(`FHIR Observation >> ${type === 'rad' ? 'Radiology' : 'Laboratory'} error send data`, error);
    throw error;
  }
}

export async function createLaboratoryPayload(
  data: any,
  encounter: any,
  organization_id: any,
  servicefhirId: any
) {
  try {
    return await createObservPayload(data, encounter, organization_id, servicefhirId, data.fhirSpecimenId, 'lab');
  } catch (error) {
    log.error(`FHIR Laboratory error send data`, error);
    throw error;
  }
}

export async function createDiagnosticReportPayload(data: any, encounter: any, organization_id: any, servicefhirId: any, observationFhirId: any, specimenFhirdId: any, type: string) {
  try {
   const fhirPayload: any = {
     resourceType: "DiagnosticReport",
     identifier: [
         {
             system: `http://sys-ids.kemkes.go.id/diagnostic/${organization_id}/${type}`,
             use: "official",
             value: type === 'lab' ? data.pmrLabUuid : data.pmrRadUuid
         }
     ],
     status: "final",
     category: [
         {
             coding: [
                 {
                     system: "http://terminology.hl7.org/CodeSystem/v2-0074",
                     code: "CH",
                     display: "Chemistry"
                 }
             ]
         }
     ],
     code: {
         coding: [
             {
                 system: "http://loinc.org",
                 code: data.loincCode,
                 display: data.display
             }
         ]
     },
     subject: {
         reference: `Patient/${encounter.patientFhirId}`
     },
     encounter: {
        reference: `Encounter/${encounter.fhirEncounterId}`
     },
     effectiveDateTime: moment(data.createdAt).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"),
     issued: moment(data.createdAt).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"),
     performer: [
         {
            reference: `Practitioner/${encounter.doctorFhirId}`
         },
         {
             reference: `Organization/${organization_id}`
         }
     ],
     result: [
         {
             reference: `Observation/${observationFhirId}`
         }
     ],
     basedOn: [
         {
           reference: `ServiceRequest/${servicefhirId}` 
         }
     ]
   }
 
   if(type == 'lab'){
     fhirPayload.specimen = [
       {
          reference: `Specimen/${specimenFhirdId}`
       }
     ]
   }
     let fhirResponse;
     let fhirDiagnosticId = null;
     if (data.fhirDiagnosticId) {
       fhirPayload.id = data.fhirDiagnosticId
       fhirResponse = await fhir.put(`/DiagnosticReport/${data.fhirDiagnosticId}`, fhirPayload, encounter.hospitalId);
       fhirDiagnosticId = fhirResponse?.id;
     } else {
       fhirResponse = await fhir.post("/DiagnosticReport", fhirPayload, encounter.hospitalId);
       fhirDiagnosticId = fhirResponse?.id;
     }
     let newDiagnostic = null
    if(type == 'lab'){
     let payload = {
       encounterId: encounter._id,
       fhirRequest: fhirPayload,
       fhirDiagnosticLabId: fhirDiagnosticId,
       fhirResponse,
       fhirResourceType: fhirResponse?.resourceType,
       pmrLabUuid: data.pmrLabUuid,
       description: ''
     };
     const laboratory = await doFindLaboratory({ pmrLabUuid: data.pmrLabUuid });
     if(laboratory){
       newDiagnostic = await doUpdateLaboratory({ _id: data._id }, { ...payload }, { new: true });
     }else{
       newDiagnostic= await doCreateLaboratory(payload);
     }
    }else{
     let payload = {
       encounterId: encounter._id,
       fhirRequest: fhirPayload,
       fhirDiagnosticRadId: fhirDiagnosticId,
       fhirResponse,
       fhirResourceType: fhirResponse?.resourceType,
       pmrRadUuid: data.pmrRadUuid,
       description: ''
     };
     const radiology = await doFindRadiology({ pmrLabUuid: data.pmrLabUuid });
     if(radiology){
       newDiagnostic= await doUpdateRadiology({ _id: radiology._id }, { ...payload }, { new: true });
     }else{
       newDiagnostic = await doCreateRadiology(payload);
     }
    }
     return newDiagnostic
  } catch (error) {
   log.error(`FHIR Diagnostic Report >>  ${type== 'rad' ? 'Radiology' : 'Laboratory'} error send data`, error);
  }
 }

export async function createRadiologyPayload(
  data: any,
  encounter: any,
  organization_id: any,
  servicefhirId: any
) {
  try {
    return await createObservPayload(data, encounter, organization_id, servicefhirId, '', 'rad');
  } catch (error) {
    log.error(`FHIR Radiology error send data`, error);
    throw error;
  }
}
