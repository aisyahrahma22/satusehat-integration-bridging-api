import { setProcedure } from "../../../controllers/fhir/fhirProcedure.controller";
import EncounterModel from "../../../models/fhir/fhirEncounter.model";
const consumeProcedure = (connection: any) => {
    const queueNames = [
        { name: 'bridging_update_procedure', action: 'updated' }
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
                        const registrationId = result.registrationId
                        const hospitalId = result.hospitalId
                        const searchParam = await EncounterModel.findOne({
                            registrationId: registrationId, hospitalId: hospitalId
                        }, {}, { lean: true });

                        setProcedure(result.item, searchParam)
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

export default consumeProcedure;