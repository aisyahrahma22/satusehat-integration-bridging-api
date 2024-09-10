
import { setLaboratory } from "../../../controllers/fhir/fhirLaboratory.controller"
import EncounterModel from "../../../models/fhir/fhirEncounter.model";
const consumeLaboratory = (connection: any) => {
    const queueNames = [
        { name: 'bridging_update_laboratory', action: 'updated' }
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
                        if(searchParam){
                            setLaboratory(result.item, searchParam)
                        }else{
                            console.log("encounter tidak ditemukan >> insert data lab", result);
                        }
                    } catch (error) {
                        console.log("error insert laboratory data", error);
                    }
                },
                {
                    noAck: true,
                }
            );
        });
    });
}

export default consumeLaboratory;