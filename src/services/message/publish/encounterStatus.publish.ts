import publishMessage from "./index";

const publishEncounterStatus = {
    updated(data: any) {
        publishMessage(`his_encounter_status`, JSON.stringify(data))
    },
}

export default publishEncounterStatus;
