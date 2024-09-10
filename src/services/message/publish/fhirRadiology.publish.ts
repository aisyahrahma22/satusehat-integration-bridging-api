import publishMessage from "./index";

const publishFhirRadiology = {
    updated(data: any) {
        publishMessage(`his_fhir_radiology`, JSON.stringify(data))
    },
}

export default publishFhirRadiology;
