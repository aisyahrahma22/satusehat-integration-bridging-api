import { setAllergy } from "../../../controllers/fhir/fhirAllergy.controller";
import EncounterModel from "../../../models/fhir/fhirEncounter.model";

const consumeAllergy = (connection: any) => {
    const queueNames = [
        { name: 'bridging_update_allergy', action: 'updated' }
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
                        const results = data ? JSON.parse(data.content.toString()) : null;
                            const registrationId = results.registrationId
                            const hospitalId = results.hospitalId
                            const searchParam = await EncounterModel.findOne({
                                registrationId: registrationId, hospitalId: hospitalId
                            }, {}, { lean: true });

                            setAllergy(results.item, searchParam)
                    } catch (error) {
                        console.log("error allergy", error);
                    }
                },
                {
                    noAck: true,
                }
            );
        });
    });
}

export default consumeAllergy;