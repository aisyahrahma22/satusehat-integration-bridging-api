import { setEncounter } from "../../../controllers/fhir/fhirEncounter.controller";

const consumeEncounter = (connection: any) => {
    const queueNames = [
        { name: 'bridging_update_encounter', action: 'updated' }
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
                        const payload = {
                            hospitalId: result.hospitalId,
                            registrationId: result.registrationId,
                            status: result.status,
                            patientId: result.patientId,
                            registrationDate: result.registrationDate,
                            doctorId: result.doctorId,
                            roomId: result.roomId,
                            processDate: result.processDate,
                            isPaid: result.isPaid,
                            diagnoses: result.diagnoses,
                            medicalCategory: result.medicalCategory,
                        }
                        setEncounter(payload)
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

export default consumeEncounter;