
import { setPrognosa } from "../../../controllers/fhir/fhirPrognosa.controller";
import EncounterModel from "../../../models/fhir/fhirEncounter.model";
const consumePrognosa = (connection: any) => {
    const queueNames = [
        { name: 'bridging_update_prognosa', action: 'updated' }
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
                            active    : result.active == '1',
                            name  : result.name,
                            code  : result.code,
                            notes : result.notes,
                            createdAt : result.createdAt || new Date(),
                            pmrPrognosaId : result.pmrPrognosaId,
                        }
                       if(result.code && result.name){
                         setPrognosa(registrationId, hospitalId, searchParam, payload)
                       }else{
                        console.log('prognosa code not found')
                       }
                    } catch (error) {
                        console.log("error consume prognosa", error);
                    }
                },
                {
                    noAck: true,
                }
            );
        });
    });
}

export default consumePrognosa;