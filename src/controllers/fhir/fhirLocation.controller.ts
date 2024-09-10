import { Request, Response } from "express";
import {
  doCreate as doCreateLocation,
  doFind as doFindLocation,
  doUpdate as doUpdateLocation,
} from "../../services/fhir/fhirLocation.service";
import { doFindHospital } from "../../services/hospital.service";
import * as fhir from "../../middleware/request/fhir";
import { FHIR_LOCATION_TYPE_MAPPING } from "../../utils/constants";
import { GetFhirLocationInput, SetFhirLocationInput } from "../../schemas/fhir/fhirLocation.schema";
import { decrypt } from "../../utils/encryption";
import log from "../../utils/logger";

export async function getHandler(req: Request<GetFhirLocationInput>, res: Response) {
  try {
    const { hospitalId, referenceId } = req.params;

    const locationData = await doFindLocation({ hospitalId, referenceId });

    if (!locationData) {
      return res.status(404).send({
        errorCode: 404,
        errorMessage: "Location not found",
      });
    }

    return res.send(locationData);
  } catch (error: any) {
    return res.status(400).send({
      errorCode: error.errorCode || 400,
      errorMessage: error.errorMessage || error.message,
    });
  }
}

export async function setHandler(
  req: Request<SetFhirLocationInput, {}, SetFhirLocationInput>,
  res: Response
) {
  try {
    const { hospitalId, referenceId } = req.params;
    const body = req.body;

    const hospital = await doFindHospital({ uuid: hospitalId });

    if (!hospital) {
      return res.status(400).send({
        errorCode: 400,
        errorMessage: "Hospital not found",
      });
    }

    const { organization_id } = JSON.parse(decrypt(hospital.fhirSecret));
    const existingLocation = await doFindLocation({ hospitalId, referenceId });
    const physicalType = FHIR_LOCATION_TYPE_MAPPING.find(f => f.source === body.source);

    const fhirPayload: any = {
      resourceType: "Location",
      identifier: [
        {
          system: `http://sys-ids.kemkes.go.id/location/${organization_id}`,
          value: body.code,
        },
      ],
      status: body.active ? "active" : "inactive",
      name: body.name,
      description: body.description,
      mode: "instance",
      physicalType: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/location-physical-type",
            code: physicalType?.code || "ro",
            display: physicalType?.name || "Room",
          },
        ],
      },
      managingOrganization: {
        reference: `Organization/${organization_id}`,
      },
    };

    if (body.partOfReferenceId) {
      const partOfLocation = await doFindLocation({ hospitalId, referenceId: body.partOfReferenceId });
      if (partOfLocation) {
        fhirPayload.partOf = {
          reference: `Location/${partOfLocation.fhirId}`,
        };
      }
    }

    let locationData;
    if (!existingLocation) {
      // Create new location
      const fhirResponse = await fhir.post("/Location", fhirPayload, hospitalId);
      const payload = {
        groupId: hospital.groupId,
        hospitalId: hospital.uuid,
        referenceId,
        source: body.source,
        physicalType: physicalType?.code || "",
        fhirId: fhirResponse?.id,
        fhirName: fhirResponse?.name,
        fhirMeta: fhirResponse,
        fhirPartOfId: fhirResponse.partOf?.reference || "",
        active: body.active || true,
      };
      locationData = await doCreateLocation(payload);
      log.info("FHIR >> Location created");
    } else {
      // Update existing location
      fhirPayload.id = existingLocation.fhirId;
      const fhirResponse = await fhir.put(`/Location/${existingLocation.fhirId}`, fhirPayload, hospitalId);
      const payload = {
        source: body.source,
        physicalType: physicalType?.code || "",
        fhirId: fhirResponse?.id,
        fhirName: fhirResponse?.name,
        fhirMeta: fhirResponse,
        fhirPartOfId: fhirResponse.partOf?.reference || "",
        active: body.active,
      };
      locationData = await doUpdateLocation({ _id: existingLocation._id }, payload, { new: true });
      log.info("FHIR >> Location updated");
    }

    return res.send(locationData);
  } catch (error: any) {
    log.error("FHIR >> Location error during create/update");
    return res.status(400).send({
      errorCode: error.errorCode || 400,
      errorMessage: error.errorMessage || error.message,
    });
  }
}
