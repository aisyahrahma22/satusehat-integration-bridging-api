import publishMessage from "./index";

const publishFhirCareplan = {
    updated(data: any) {
        publishMessage(`his_fhir_careplan`, JSON.stringify(data))
    },
}

export default publishFhirCareplan;
