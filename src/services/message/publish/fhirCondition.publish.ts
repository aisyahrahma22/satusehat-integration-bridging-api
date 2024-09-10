import publishMessage from "./index";
const publishFhirCondition = {
    updated(data: any) {
        publishMessage(`his_fhir_condition`, JSON.stringify(data))
    },
}
export default publishFhirCondition;
