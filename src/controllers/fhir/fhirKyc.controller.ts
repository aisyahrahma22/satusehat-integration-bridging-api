import { Request, Response } from "express";
import NodeRSA from "node-rsa";
import * as kyc from "../../middleware/request/fhir";
import { SetFhirKycInput } from "../../schemas/fhir/fhirKyc.schema";

function generateKeyPair() {
  const key = new NodeRSA({ b: 2048 });
  const publicKey = key.exportKey("public");
  const privateKey = key.exportKey("private");
  return { publicKey, privateKey };
}

function encryptMessage(message: string, publicKey: string): string {
  const key = new NodeRSA(publicKey);
  return key.encrypt(message, "base64");
}

function decryptMessage(encryptedMessage: string, privateKey: string): string {
  const key = new NodeRSA(privateKey);
  return key.decrypt(encryptedMessage, "utf8");
}

function generateUrl(agen: string, nik_agen: string) {
  const { publicKey, privateKey } = generateKeyPair();

  const data = {
    agent_name: agen,
    agent_nik: nik_agen,
    public_key: publicKey,
  };

  const jsonData = JSON.stringify(data);
  const encryptedPayload = encryptMessage(jsonData, publicKey);
  const decryptedPayload = decryptMessage(encryptedPayload, privateKey);

  return {
    encryptedPayload,
    decryptedPayload: JSON.parse(decryptedPayload),
  };
}

export async function setHandler(
  req: Request<SetFhirKycInput>,
  res: Response
) {
  try {
    const { name, nik, hospitalId } = req.body;
    const { encryptedPayload, decryptedPayload } = generateUrl(name, nik);

    const formattedPublicKey = formatPublicKey(decryptedPayload.public_key);

    const payload = {
      agent_name: decryptedPayload.agent_name,
      agent_nik: decryptedPayload.agent_nik,
      public_key: formattedPublicKey,
    };

    const fhirResponse = await kyc.post("/generate-url", payload, hospitalId, true);

    return res.status(200).send({
      fhirResponse,
    });
  } catch (e: any) {
    return res.status(400).send({
      errorCode: e.errorCode || 400,
      errorMessage: e.errorMessage || e.message,
    });
  }
}

function formatPublicKey(publicKey: string): string {
  const key = publicKey.replace(/\n/g, '');
  const startIndex = key.indexOf("-----BEGIN PUBLIC KEY-----") + "-----BEGIN PUBLIC KEY-----".length;
  const endIndex = key.indexOf("-----END PUBLIC KEY-----");
  return `${key.substring(0, startIndex)}\n${key.substring(startIndex, endIndex)}\n${key.substring(endIndex)}`;
}
