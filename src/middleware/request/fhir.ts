import axios from "axios";
import config from "config";
import { decrypt } from "../../utils/encryption";
import log from "../../utils/logger";
import { doFindHospital } from "../../services/hospital.service";
import {
  doCreate as doCreateAccessToken,
  doFind as doFindAccessToken,
  doUpdate as doUpdateAccessToken,
} from "../../services/fhir/fhirAccessToken.service";

const getAuthHeader = (token:any) => ({
  "Content-Type": "application/json",
  Accept: "*/*",
  Authorization: `Bearer ${token}`,
});

const handleAxiosError = (err: any) => {
  if (err.response) {
    err.errorCode = err.response.status || err.errorCode;
    err.errorMessage = err.response.data || err.message;
  }
  log.error(`FHIR ${err.config.method.toUpperCase()}`, err);
  throw err;
};

export async function setAuthToken(fhirSecret: string) {
  try {
    const { client_id, client_secret } = JSON.parse(decrypt(fhirSecret));
    const formData = new URLSearchParams();
    formData.append("client_id", client_id);
    formData.append("client_secret", client_secret);

    const response = await axios.post(
      `${config.get<string>("authUrlFhir")}/accesstoken?grant_type=client_credentials`,
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "*/*",
        },
      }
    );

    if (!response.data || Object.keys(response.data).length === 0) {
      return 400;
    }
    return response.data;
  } catch (err) {
    handleAxiosError(err);
  }
}

export async function getAccessToken(hospitalId: string) {
  try {
    const todayTime = Date.now();
    const hospital = await doFindHospital({ uuid: hospitalId });

    if (!hospital) {
      throw { errorCode: 400, errorMessage: "Faskes tidak ditemukan" };
    }

    if (!hospital.fhirSecret) {
      throw { errorCode: 400, errorMessage: "FHIR not registered" };
    }

    let accessToken = await doFindAccessToken({ hospitalId });
    let generateAccessToken;

    if (accessToken) {
      const tokenAgeInSeconds = (todayTime - accessToken.issuedAt) / 1000;
      if (tokenAgeInSeconds > accessToken.expiresIn - 60) {
        generateAccessToken = await setAuthToken(hospital.fhirSecret);
        log.info("FHIR - Regenerate Access Token");
      } else {
        log.info(`FHIR - Get Access Token (${tokenAgeInSeconds})`);
      }
    } else {
      generateAccessToken = await setAuthToken(hospital.fhirSecret);
      log.info("FHIR - Generate Access Token");
    }

    if (generateAccessToken) {
      const payloadAccessToken = {
        hospitalId,
        apiProductList: generateAccessToken.api_product_list,
        organizationName: generateAccessToken.organization_name,
        developerEmail: generateAccessToken['developer.email'],
        applicationName: generateAccessToken.application_name,
        tokenType: generateAccessToken.token_type,
        accessToken: generateAccessToken.access_token,
        issuedAt: generateAccessToken.issued_at,
        expiresIn: generateAccessToken.expires_in,
        status: generateAccessToken.status
      };

      if (accessToken) {
        accessToken = await doUpdateAccessToken({ _id: accessToken._id }, payloadAccessToken, { new: true });
        log.info("FHIR - Update Access Token");
      } else {
        accessToken = await doCreateAccessToken(payloadAccessToken);
        log.info("FHIR - Create Access Token");
      }
    }

    return { token: accessToken?.accessToken };
  } catch (e: any) {
    throw {
      errorCode: e.errorCode || 400,
      errorMessage: e.errorMessage || e.message,
    };
  }
}

export async function post(path: string, payload: object, hospitalId: string, isKyc = false) {
  try {
    const { token } = await getAccessToken(hospitalId);
    const url = `${path === "/Consent" ? config.get<string>("consentUrlFhir") : isKyc ? config.get<string>("kycUrlFhir") : config.get<string>("baseUrlFhir")}${path}`;
    
    const headers = isKyc
      ? { ...getAuthHeader(token), "X-Debug-Mode": "1" }
      : getAuthHeader(token);

    const response = await axios.post(url, JSON.stringify(payload), { headers });
    return response.data || response;
  } catch (err) {
    handleAxiosError(err);
  }
}

export async function put(path: string, payload: object, hospitalId: string) {
  try {
    const { token } = await getAccessToken(hospitalId);
    const url = `${config.get<string>("baseUrlFhir")}${path}`;
    const response = await axios.put(url, JSON.stringify(payload), { headers: getAuthHeader(token) });
    return response.data || response;
  } catch (err) {
    handleAxiosError(err);
  }
}

export async function get(path: string, hospitalId: string) {
  try {
    const { token } = await getAccessToken(hospitalId);
    const url = `${config.get<string>("baseUrlFhir")}${path}`;
    const response = await axios.get(url, { headers: getAuthHeader(token) });
    return response;
  } catch (err) {
    handleAxiosError(err);
  }
}

export async function postData(path: string, payload: object, hospitalId: string) {
  try {
    const { token } = await getAccessToken(hospitalId);
    const url = `${config.get<string>("baseUrlFhir")}${path}`;

    const response = await axios.post(url, JSON.stringify(payload), { headers: getAuthHeader(token) });
    return response.data || response;
  } catch (error: any) {
    let isDuplicate = error?.response?.data?.issue[0]?.code === 'duplicate';
    log.error(`FHIR POST DATA`, error);
    return {
      error: {
        code: error.response?.status,
        message: isDuplicate ? 'duplicate' : error.response?.data || error.message,
      },
    };
  }
}
