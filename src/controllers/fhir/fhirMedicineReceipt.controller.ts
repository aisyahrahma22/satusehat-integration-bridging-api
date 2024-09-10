import {
  doCreate as doCreateMedicineReceipt,
  doUpdate as doUpdateMedicineReceipt,
  doFindAll as doFindAllMedicineReceipt,
} from "../../services/fhir/fhirMedicineReceipt.service";
import { doFindHospital } from "../../services/hospital.service";
import log from "../../utils/logger";
import * as fhir from "../../middleware/request/fhir";
import { decrypt } from "../../utils/encryption";
import publishFhirMedicineReceipt from "../../services/message/publish/fhirMedicineReceipt.publish";

export async function setMedicineReceipt(body: any) {
  try {
    const medicineReceipts  = await doFindAllMedicineReceipt({ registrationId: body.registrationId, hospitalId: body.hospitalId });

    if (body && body.item.length > 0) {
      const data = await processMedicalReceipts(medicineReceipts, body);
      return data;
    } else { 
      log.error(`FHIR >> Medicine Receipt error created/updated`)    
    }
    return {}
  } catch (e: any) {
    log.error(`FHIR >> Allergy error created/updated`, e);
    throw e;
  }
}

export async function createFhirMedicineReceiptPayload(data: any, organization_id: any, encounter: any) {
  let item: any[] = [];

  for await (const val of data) {
    let payload = {}

    if (val.type === "Racik") {
      const resultMultipleMedicine = val.ingredientItem.length ? val.ingredientItem.map((el : any) => {
        return {
          itemCodeableConcept: {
            coding: [
              {
                system: "http://sys-ids.kemkes.go.id/kfa",
                code: el.kfaCode,
                display: el.kfaName,
              },
            ],
          },
          isActive: true,
        }
      }) : [{
        itemCodeableConcept: {
          coding: [
            {
              system: "http://sys-ids.kemkes.go.id/kfa",
              code: "",
              display: "",
            },
          ],
        },
        isActive: true,
      }]

      payload = {
        resourceType: "Medication",
        meta: {
          profile: [
            "https://fhir.kemkes.go.id/r4/StructureDefinition/Medication",
          ],
        },
        identifier: [
          {
            system:
              `http://sys-ids.kemkes.go.id/${organization_id}`,
            use: "official",
            value: val.pmrReceiptConcoctionId,
          },
        ],
        code: {
          coding: [
            {
              system: "http://sys-ids.kemkes.go.id/kfa",
              code: val?.kfaCodeGroup,
              display: val?.kfaNameGroup,
            }
          ],
        },
        status: "active",
        manufacturer: {
          reference: `Organization/${organization_id}`,
        },
        ingredient: resultMultipleMedicine,
        extension: [
          {
            url: "https://fhir.kemkes.go.id/r4/StructureDefinition/MedicationType",
            valueCodeableConcept: {
              coding: [
                {
                  system:
                    "http://terminology.kemkes.go.id/CodeSystem/medication-type",
                  code: "SD",
                  display: "Give of such doses",
                },
              ],
            },
          },
        ],
      };

    } else {
      const resultMultipleMedicine = val.ingredientItem.length ? val.ingredientItem.map((el : any) => {
        return {
          itemCodeableConcept: {
            coding: [
              {
                system: "http://sys-ids.kemkes.go.id/kfa",
                code: el.kfaCode,
                display: el.kfaName,
              },
            ],
          },
          isActive: true,
        }
      }) : [{
        itemCodeableConcept: {
          coding: [
            {
              system: "http://sys-ids.kemkes.go.id/kfa",
              code: "",
              display: "",
            },
          ],
        },
        isActive: true,
      }]

      payload = {
        resourceType: "Medication",
        meta: {
          profile: [
            "https://fhir.kemkes.go.id/r4/StructureDefinition/Medication",
          ],
        },
        identifier: [
          {
            system:
              `http://sys-ids.kemkes.go.id/${organization_id}`,
            use: "official",
            value: val.pmrReceiptId,
          },
        ],
        code: {
          coding: [
            {
              system: "http://sys-ids.kemkes.go.id/kfa",
              code: val.kfaCodeGroup,
              display:
                val.kfaNameGroup,
            },
          ],
        },
        status: "active",
        manufacturer: {
          reference: `Organization/${organization_id}`,
        },
        form: {
          coding: [
            {
              system:
                "http://terminology.kemkes.go.id/CodeSystem/medication-form",
              code: val.dosageCode,
              display: val.dosageName,
            },
          ],
        },
        ingredient: resultMultipleMedicine,
        extension: [
          {
            url: "https://fhir.kemkes.go.id/r4/StructureDefinition/MedicationType",
            valueCodeableConcept: {
              coding: [
                {
                  system:
                    "http://terminology.kemkes.go.id/CodeSystem/medication-type",
                  code: "NC",
                  display: "Non-compound",
                },
              ],
            },
          },
        ],
      };
    }

    try {

      let fhirResponse;
      let fhirMedicineReceiptId: string | null = null;

      if (val.fhirMedicineReceiptId) {
        let updatePayload = { ...payload, id: val.fhirMedicineReceiptId }
        fhirResponse = await fhir.put(`/Medication/${val.fhirMedicineReceiptId}`, updatePayload, encounter.hospitalId);
        fhirMedicineReceiptId = fhirResponse?.id;
      } else {
        fhirResponse = await fhir.postData("/Medication", payload, encounter.hospitalId);
        fhirMedicineReceiptId = fhirResponse?.id;
      }

      const payloadUpdate = {
        fhirRequest: payload,
        fhirMedicineReceiptId: fhirResponse?.id || null,
        fhirResponse: fhirResponse,
        fhirResourceType: fhirResponse?.resourceType || 'Medication',
        description: fhirResponse?.error?.message === 'error-value' ? 'Code tidak ditemukan' : fhirResponse?.error? 'Gagal terkirim' : null
      };

      await doUpdateMedicineReceipt({ _id: val._id }, { ...payloadUpdate }, { new: true });
      publishFhirMedicineReceipt.updated({
        pmrReceiptId: val.pmrReceiptId,
        pmrReceiptConcoctionId: val.pmrReceiptConcoctionId,
        fhirMedicineReceiptId: fhirResponse?.id || null,
        registrationId  : val.registrationId,
        description: fhirResponse?.error?.message === 'error-value' ? 'Code tidak ditemukan' : fhirResponse?.error? 'Gagal terkirim' : null
      });

      item.push(fhirResponse)
    } catch (error : any) {
      log.error(`FHIR >> Medicine Receipt error send to Satu Sehat >> ${val._id}`);
    }
  }
  return item;
}

async function processMedicalReceipts(medicalReceipt: any[], body: any) {
  try {
    let data: any[] = [];
    for await (const receipts of body.item) {
      
      let payload: any = {};
      if (receipts.type === "Satuan") {
        const ingredientItem = receipts.ingredientItem.map(
          (ingredientItem: any) => {
            return {
              kfaCode: ingredientItem?.kfaCode || "",
              kfaName: ingredientItem?.kfaName || "",
            };
          }
        );

        payload = {
          hospitalId: body.hospitalId || "",
          registrationId: body.registrationId || "",
          kfaCodeGroup: receipts?.kfaCode || "",
          kfaNameGroup: receipts?.kfaName || "",
          dosageCode: receipts?.kfaCodeDosageForm || "",
          dosageName: receipts?.dosageFormName || "",
          createdAt: receipts?.createdAt || new Date(),
          active: receipts?.active === "1",
          pmrReceiptId: receipts?.uuid || "",
          pmrReceiptConcoctionId: "",
          type: receipts.type || "",
          ingredientItem: receipts?.ingredientItem.length ? ingredientItem : [],
          fhirRequest: {},
          fhirMedicineReceiptId: "",
          fhirResponse: {},
          fhirResourceType: "Medication",
        };

        const existingReceipts = medicalReceipt.filter(
          (item) => {
            return item.pmrReceiptId == receipts.uuid
          }
        );

        if (existingReceipts?.length > 0) {
          for await (const data of existingReceipts) {
            payload.fhirMedicineReceiptId = data.fhirMedicineReceiptId || "";
            const updatedReceipt = await doUpdateMedicineReceipt(
              { _id: data._id },
              { ...payload },
              { new: true }
            );
          }
        } else {
          const createdMedicineReceipt = await doCreateMedicineReceipt(payload);
        }
      } else {
        for await (const receiptsConcoction of receipts?.items?.pmrrConcoction) {
          const ingredientItemConc = receiptsConcoction?.ingredientItem?.map(
            (ingredientItem: any) => {
              return {
                kfaCode: ingredientItem?.kfaCode || "",
                kfaName: ingredientItem?.kfaName || "",
              };
            }
          );


          payload = {
            hospitalId: body.hospitalId || "",
            registrationId: body.registrationId || "",
            kfaCodeGroup: receiptsConcoction?.kfaCode || "",
            kfaNameGroup: receiptsConcoction?.kfaName || "",
            dosageCode: receiptsConcoction?.kfaCodeDosageForm || "",
            dosageName: receiptsConcoction?.dosageFormName || "",
            createdAt: receiptsConcoction?.createdAt || new Date(),
            active: receiptsConcoction?.active === "1",
            pmrReceiptId: receipts?.items?.pmrrUuid || "",
            pmrReceiptConcoctionId: receiptsConcoction?.pmrrcUuid || "",
            type: receiptsConcoction?.type || "",
            ingredientItem: receiptsConcoction?.ingredientItem.length
              ? ingredientItemConc
              : [],
            fhirRequest: {},
            fhirMedicineReceiptId: "",
            fhirResponse: {},
            fhirResourceType: "Medication",
          };

          const existingReceiptsConcoction = medicalReceipt.filter(
            (item) => {
              return item?.pmrReceiptConcoctionId == receiptsConcoction?.pmrrcUuid
            }
          );


          if (existingReceiptsConcoction?.length > 0) {
            for await (const data of existingReceiptsConcoction) {
              payload.fhirMedicineReceiptId = data.fhirMedicineReceiptId || "";
              const updatedReceipt = await doUpdateMedicineReceipt(
                { _id: data._id },
                { ...payload },
                { new: true }
              );
            }
          } else {
            const createdMedicineReceipt = await doCreateMedicineReceipt(
              payload
            );
          }
        }
      }
    }
    return data;
  } catch (error) {
    console.log(error) 
    log.error(`FHIR >> medicine error send to Satu Sehat >>`, error);
    return null
  }
}


export async function processMedicalReceipt(encounter: any, body: any) {
  //  code ini belum di pakai di fase sekarang, dan akan digunakan nantinya


  if (!body || !encounter) {
    log.error(`FHIR >> Medicine Receipt error send to Satu Sehat`);
    return
  };

  await setMedicineReceipt(body);
  const receipts = await doFindAllMedicineReceipt({ registrationId: body.registrationId, hospitalId: body.hospitalId });

  const fhirMedicineReceipt = receipts.filter(data => data.fhirMedicineReceiptId !== "");
  const filteredReceipt = receipts.filter(data => data.fhirMedicineReceiptId === "");

  for (const receipt of fhirMedicineReceipt) {
    //  Publish Send Medicine Receipt FhirID To HIS

    publishFhirMedicineReceipt.updated({
        pmrReceiptConcoctionId: receipt?.pmrReceiptConcoctionId || "",
        pmrReceiptId: receipt?.pmrReceiptId || "",
        fhirMedicineReceiptId: receipt.fhirMedicineReceiptId,
        registrationId  : receipt.registrationId,
        description: receipt?.description || ''
    });
  }

  if (filteredReceipt.length > 0 && encounter.fhirEncounterId) {
    const hospital = await doFindHospital({ uuid: encounter.hospitalId });
    if (hospital){
      const { organization_id } = JSON.parse(decrypt(hospital.fhirSecret));
      await createFhirMedicineReceiptPayload(filteredReceipt, organization_id,  encounter);
    }
  }
}