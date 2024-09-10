import { setCondition } from "../../../controllers/fhir/fhirCondition.controller";
import EncounterModel from "../../../models/fhir/fhirEncounter.model";
const consumeCondition = (connection: any) => {
    const queueNames = [
        { name: 'bridging_update_condition', action: 'updated' }
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
                        setCondition(result.item, searchParam)
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
export default consumeCondition;