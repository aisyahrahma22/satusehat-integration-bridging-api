import { Request, Response } from "express";
import {
  GetHospitalInput,
  UpdateFhirSecretHospitalInput,
  UpdateHospitalConfigInput,
} from "../schemas/hospital.schema";
import { doFindHospital, doUpdateHospital } from "../services/hospital.service";
import { decrypt, encrypt } from "../utils/encryption";

export async function getHospitalHandler(
  req: Request<GetHospitalInput["params"]>,
  res: Response
) {
  const { uuid } = req.params;

  try {
    const data = await doFindHospital({ uuid });

    if (!data) {
      return res.send({});
    }

    if (data.fhirSecret) {
      data.fhirSecret = JSON.parse(decrypt(data.fhirSecret));
    }

    return res.send(data);
  } catch (error: any) {
    return res.status(400).send({
      errorCode: 400,
      errorMessage: error.message,
    });
  }
}

export async function updateFhirSecretHospitalHandler(
  req: Request<UpdateFhirSecretHospitalInput["params"], {}, UpdateFhirSecretHospitalInput["body"]>,
  res: Response
) {
  const uid = res.locals.user.userUuid;
  const { uuid } = req.params;
  const { organizationId, clientKey, secretKey } = req.body;

  try {
    const payload = {
      organization_id: organizationId,
      client_id: clientKey,
      client_secret: secretKey,
    };
    const fhirSecret = encrypt(JSON.stringify(payload));

    const data = await doUpdateHospital(
      { uuid },
      { fhirSecret, updatedBy: uid },
      { new: true }
    );

    if (!data) {
      return res.status(404).send({
        errorCode: 404,
        errorMessage: "Data not found",
      });
    }

    return res.send(data);
  } catch (error: any) {
    return res.status(400).send({
      errorCode: 400,
      errorMessage: error.message,
    });
  }
}

export async function updateHospitalConfigHandler(
  req: Request<UpdateHospitalConfigInput["params"], {}, UpdateHospitalConfigInput["body"]>,
  res: Response
) {
  const uid = res.locals.user.userUuid;
  const { uuid } = req.params;
  const { enableFhirEncounter } = req.body;

  try {
    const data = await doUpdateHospital(
      { uuid },
      { configs: { enableFhirEncounter }, updatedBy: uid },
      { new: true }
    );

    if (!data) {
      return res.status(404).send({
        errorCode: 404,
        errorMessage: "Data not found",
      });
    }

    return res.send(data);
  } catch (error: any) {
    return res.status(400).send({
      errorCode: 400,
      errorMessage: error.message,
    });
  }
}
