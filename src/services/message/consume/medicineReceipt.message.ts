import { setMedicineReceipt } from "../../../controllers/fhir/fhirMedicineReceipt.controller";
import EncounterModel from "../../../models/fhir/fhirEncounter.model";

const consumeMedicineReceipt = (connection: any) => {
    const queueNames = [
        { name: 'bridging_update_medicine_receipt', action: 'updated' }
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
                            setMedicineReceipt(results)
                    } catch (error) {
                        console.log("error medicine receipt", error);
                    }
                },
                {
                    noAck: true,
                }
            );
        });
    });
}

export default consumeMedicineReceipt;