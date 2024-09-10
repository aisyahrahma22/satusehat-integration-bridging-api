import publishMessage from "./index";

const publishFhirProcedure = {
    updated(data: any) {
        publishMessage(`his_fhir_procedure`, JSON.stringify(data))
    },
}

export default publishFhirProcedure;
