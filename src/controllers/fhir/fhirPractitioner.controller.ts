import { Request, Response } from "express";
import {
  doCreate as doCreatePractitionerReference,
  doFind as doFindPractitionerReference,
  doFindOne as doFindOnePractitionerReference,
  doUpdate as doUpdatePractitionerReference,
} from "../../services/fhir/fhirPractitionerReference.service";
import {
  doCreate as doCreateFhirPractitioner,
  doFindOne as doFindOneFhirPractitioner
} from "../../services/fhir/fhirPractitioner.service";
import { doFindHospital } from "../../services/hospital.service";
import { GetFhirPractitionerInput, SetFhirPractitionerInput } from "../../schemas/fhir/fhirPractitioner.schema";
import { getFhirPractitonerHelper } from "../../helpers/fhir";
import log from "../../utils/logger";

interface DoctorRequest {
  referenceId     : string,
  source          : string,
  identityNumber  : string,
  active          : boolean,
}

export async function getHandler(
  req: Request<GetFhirPractitionerInput>,
  res: Response
) {
  try {
    const hospitalId = req.params.hospitalId;
    const referenceId = req.params.referenceId;
    const data = await doFindPractitionerReference({ hospitalId, referenceId });

    if (!data) {
      return res.status(404).send({
        errorCode: 404,
        errorMessage: `Practitioner not found`,
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
    SetFhirPractitionerInput,
    {},
    SetFhirPractitionerInput
  >,
  res: Response
) {
  try {
    const body = req.body;
    const hospitalId = req.params.hospitalId;
    const referenceId = req.params.referenceId;
    const source = body.source;
    const identityNumber = body.identityNumber;
    const hospital = await doFindHospital({
      uuid: hospitalId,
    });

    if (!hospital) {
      log.error(`FHIR >> Hosptial not found`);
      return res.status(400).send({
        errorCode: 400,
        errorMessage: "Faskes tidak ditemukan",
      });
    }

    // Find Indentity Number is Registered ? 
    let fhirPractitioner = await doFindOneFhirPractitioner({ identityNumber });
    if (!fhirPractitioner) {
      const payload = await getFhirPractitonerHelper(body, hospitalId);
      if (payload) {
        fhirPractitioner = await doCreateFhirPractitioner(payload);
      }
    }

    if (fhirPractitioner) {
      const practitioner = await doFindOnePractitionerReference({ hospitalId, referenceId });
      if (!practitioner) {
        // Create
        const payload = {
          groupId: hospital.groupId,
          hospitalId: hospital.uuid,
          source,
          referenceId,
          fhirPractitionerId: fhirPractitioner?._id,
          active: body.active || true,
        };
        await doCreatePractitionerReference(payload);
        log.info(`FHIR >> Practitioner created`);
      } else {
        // Update
        const payload = {
          fhirPractitionerId: fhirPractitioner?._id,
          active: body.active,
        };
        await doUpdatePractitionerReference({ _id: practitioner._id }, { ...payload }, { new: true });
        log.info(`FHIR >> Practitioner updated`);
      }

      const data = await doFindPractitionerReference({ hospitalId, referenceId });

      return res.send(data);
    } else {
      log.error(`FHIR >> Practitioner not registered`);
      return res.status(404).send({
        errorCode: 404,
        errorMessage: "Practitioner Tidak Ditemukan di FHIR",
      });
    }
  } catch (e: any) {
    log.error(`FHIR >> Practitioner error created`);
    return res.status(400).send({
      errorCode: e.errorCode ? e.errorCode : 400,
      errorMessage: e.errorMessage ? e.errorMessage : e.message,
    });
  }
}
