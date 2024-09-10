import { Request, Response } from "express";
import {
  doCreate as doCreateOrganization,
  doFind as doFindOrganization,
  doUpdate as doUpdateOrganization,
} from "../../services/fhir/fhirOrganization.service";
import { doFindHospital } from "../../services/hospital.service";
import {
  GetFhirOrganizationInput,
  SetFhirOrganizationInput,
} from "../../schemas/fhir/fhirOrganization.schema";
import * as fhir from "../../middleware/request/fhir";
import { FHIR_ORGANIZATION_TYPE_MAPPING } from "../../utils/constants";
import log from "../../utils/logger";

interface HospitalRequest {
  name: string,
  type: string,
  phone: string,
  address: string,
  active: boolean,
}

export async function getHandler(
  req: Request<GetFhirOrganizationInput>,
  res: Response
) {
  try {
    // Validasi jika token harus digroup yang sama dengan hospital yang dicari
    
    const hospitalId = req.params.hospitalId;
    const data = await doFindOrganization({ hospitalId });

    if (!data) {
      return res.status(404).send({
        errorCode: 404,
        errorMessage: `Organization not found`,
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
    SetFhirOrganizationInput,
    {},
    SetFhirOrganizationInput
  >,
  res: Response
) {
  try {
    const body = req.body;
    const hospitalId = req.params.hospitalId;
    const hospital = await doFindHospital({
      uuid: hospitalId,
    });

    if (!hospital) {
      return res.status(400).send({
        errorCode: 400,
        errorMessage: "Faskes tidak ditemukan",
      });
    }

    // Sementara satu faskes satu organisasi
    const organization = await doFindOrganization({ hospitalId });
    let fhirPayload: any = {
      resourceType: "Organization",
      active: true, 
      type: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/organization-type",
              code: body.type,
              display: FHIR_ORGANIZATION_TYPE_MAPPING.find(f => f.code === body.type)?.display
            }
          ]
        }
      ],
      name: body.name,
      telecom: [
        {
          system: "phone",
          value: body.phone,
          use: "work"
        },
      ],
      address: [
        {
          use: "work",
          type: "both",
          line: [
            body.address
          ],
          // city: "Jakarta",
          // postalCode: "55292",
          country: "ID",
          // extension: [
          //   {
          //     url: "https://fhir.kemkes.go.id/r4/StructureDefinition/administrativeCode",
          //     extension: [
          //       {
          //         url: "province",
          //         valueCode: "31"
          //       },
          //       {
          //         url: "city",
          //         valueCode: "3171"
          //       },
          //       {
          //         url: "district",
          //         valueCode: "317101"
          //       },
          //       {
          //         url: "village",
          //         valueCode: "31710101"
          //       }
          //     ]
          //   }
          // ]
        }
      ],
      // partOf: {
      //   reference: "Organization/10000004"
      // }
    }

    let data = null;
    if (!organization) {
      // Create
      const fhirResponse = await fhir.post("/Organization", fhirPayload, hospitalId);
      const payload = {
        groupId: hospital.groupId,
        hospitalId: hospital.uuid,
        organizationType: body.type,
        organizationName: body.name,
        organizationAddress: body.address,
        organizationPhone: body.phone,
        fhirId: fhirResponse?.id,
        fhirMeta: fhirResponse,
        fhirPartOfId: "",
        active: body.active || true,
      };
      data = await doCreateOrganization(payload);
    } else {
      // Update
      fhirPayload.id = organization.fhirId;
      const fhirResponse = await fhir.put(`/Organization/${organization.fhirId}`, fhirPayload, hospitalId);
      const payload = {
        organizationType: body.type,
        organizationName: body.name,
        organizationAddress: body.address,
        organizationPhone: body.phone,
        fhirId: fhirResponse?.id,
        fhirMeta: fhirResponse,
        fhirPartOfId: "",
        active: body.active,
      };
      data = await doUpdateOrganization({ _id: organization._id }, { ...payload }, { new: true });
    }

    return res.send(data);
  } catch (e: any) {
    return res.status(400).send({
      errorCode: e.errorCode ? e.errorCode : 400,
      errorMessage: e.errorMessage ? e.errorMessage : e.message,
    });
  }
}

export async function setHandlerFunctionHospital(request: HospitalRequest, hospitalIdRequest:string) {
  try {    
    const body = request;
    const hospitalId = hospitalIdRequest;
    
    const hospital = await doFindHospital({
      uuid: hospitalId,
    });

    if(hospital) {
      const organization = await doFindOrganization({ hospitalId });
      let fhirPayload: any = {
        resourceType: "Organization",
        active: true, 
        type: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/organization-type",
                code: body.type,
                display: FHIR_ORGANIZATION_TYPE_MAPPING.find(f => f.code === body.type)?.display
              }
            ]
          }
        ],
        name: body.name,
        telecom: [
          {
            system: "phone",
            value: body.phone,
            use: "work"
          },
        ],
        address: [
          {
            use: "work",
            type: "both",
            line: [
              body.address
            ],
            // city: "Jakarta",
            // postalCode: "55292",
            country: "ID",
            // extension: [
            //   {
            //     url: "https://fhir.kemkes.go.id/r4/StructureDefinition/administrativeCode",
            //     extension: [
            //       {
            //         url: "province",
            //         valueCode: "31"
            //       },
            //       {
            //         url: "city",
            //         valueCode: "3171"
            //       },
            //       {
            //         url: "district",
            //         valueCode: "317101"
            //       },
            //       {
            //         url: "village",
            //         valueCode: "31710101"
            //       }
            //     ]
            //   }
            // ]
          }
        ],
        // partOf: {
        //   reference: "Organization/10000004"
        // }
      }
  
      let data = null;
      if (!organization) {
        // Create
        const fhirResponse = await fhir.post("/Organization", fhirPayload, hospitalId);
        const payload = {
          groupId: hospital.groupId,
          hospitalId: hospital.uuid,
          organizationType: body.type,
          organizationName: body.name,
          organizationAddress: body.address,
          organizationPhone: body.phone,
          fhirId: fhirResponse?.id,
          fhirMeta: fhirResponse,
          fhirPartOfId: "",
          active: body.active,
        };
        data = await doCreateOrganization(payload);
      } else {
        // Update
        fhirPayload.id = organization.fhirId;
        const fhirResponse = await fhir.put(`/Organization/${organization.fhirId}`, fhirPayload, hospitalId);
        const payload = {
          organizationType: body.type,
          organizationName: body.name,
          organizationAddress: body.address,
          organizationPhone: body.phone,
          fhirId: fhirResponse?.id,
          fhirMeta: fhirResponse,
          fhirPartOfId: "",
          active: body.active,
        };
        data = await doUpdateOrganization({ _id: organization._id }, { ...payload }, { new: true });
      }
      log.info(`FHIR >> Hospital created`);
    } else {
      log.error(`FHIR >> Hospital not found`);
    }
    // Sementara satu faskes satu organisasi
  } catch (e: any) {
    log.error(`FHIR >> Hospital error created`);
    
  }
}