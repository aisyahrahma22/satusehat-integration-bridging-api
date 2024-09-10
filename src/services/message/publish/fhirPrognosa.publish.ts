import publishMessage from "./index";

const publishFhirPrognosa = {
    updated(data: any) {
        publishMessage(`his_fhir_prognosa`, JSON.stringify(data))
    },
}

export default publishFhirPrognosa;
