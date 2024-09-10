import { Request, Response } from "express";
import * as fhir from "../../middleware/request/fhir";
import { GetFhirAccessTokenInput } from "../../schemas/fhir/fhirAccessToken.schema";

export async function getHandler(
  req: Request<GetFhirAccessTokenInput["params"], {}, {}>,
  res: Response
) {
  const hospitalId = req.params.hospitalId;

  try {
    const result = await fhir.getAccessToken(hospitalId);
    return res.send(result);
  } catch (e: any) {
    const { errorCode = 400, errorMessage = 'An error occurred' } = e;
    return res.status(errorCode).send({
      errorCode,
      errorMessage,
    });
  }
}
