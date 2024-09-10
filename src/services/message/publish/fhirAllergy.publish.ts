import publishMessage from "./index";

const publishFhirAllergy = {
    updated(data: any) {
        publishMessage(`his_fhir_allergy`, JSON.stringify(data))
    },
}

export default publishFhirAllergy;
