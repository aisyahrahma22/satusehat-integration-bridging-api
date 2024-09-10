import publishMessage from "./index";

const publishFhirObservation = {
    updated(data: any) {
        publishMessage(`his_fhir_observation`, JSON.stringify(data))
    },
}

export default publishFhirObservation;
