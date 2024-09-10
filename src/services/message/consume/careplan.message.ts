
import { setCarePlans } from "../../../controllers/fhir/fhirCarePlan.controller";
import EncounterModel from "../../../models/fhir/fhirEncounter.model";
const consumeCareplan = (connection: any) => {
    const queueNames = [
        { name: 'bridging_update_careplan', action: 'updated' }
    ]
    consumeCreatedOrUpdated(connection, queueNames);
}

// Created / Updated / Deleted
const consumeCreatedOrUpdated = (connection: any, queueNames: any) => {     
    connection.createChannel(function (error1: any, channel: any) {
        if (error1) {
            throw error1;
        }
        const queues = queueNames;
        queues && queues.forEach((queue: { name: any; action: any; }) => {
            channel.assertQueue(queue.name, {
                durable: false,
            });
            console.log(` [*] Waiting for messages from %s.`, queue.name);
            channel.consume(
                queue.name,
                async function (data: any) {
                    try {   
                        const result = data ? JSON.parse(data.content.toString()) : null;
                        let hospitalId = result.hospitalId
                        let registrationId = result.registrationId
                        const searchParam = await EncounterModel.findOne({
                            registrationId: registrationId, hospitalId: hospitalId
                        }, {}, { lean: true });
                        const payload = {
                            active    : result.active || true,
                            procedureName  : result.procedureName,
                            notes : result.notes,
                            createdAt : result.createdAt || new Date(),
                            procedureUuid : result.procedureUuid,
                        }
                        setCarePlans(registrationId, searchParam, payload)
                    } catch (error) {
                        console.log("error", error);
                    }
                },
                {
                    noAck: true,
                }
            );
        });
    });
}

export default consumeCareplan;