import publishMessage from "./index";

const publishFhirLaboratory = {
    updated(data: any) {
        publishMessage(`his_fhir_laboratory`, JSON.stringify(data))
    },
}

export default publishFhirLaboratory;
