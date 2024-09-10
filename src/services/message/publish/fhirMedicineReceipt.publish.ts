import publishMessage from "./index";

const publishFhirMedicineReceipt = {
    updated(data: any) {
        publishMessage(`his_fhir_medicine_receipt`, JSON.stringify(data))
    },
}

export default publishFhirMedicineReceipt;
