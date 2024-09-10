import HospitalModel from "../../../models/hospital.model";
import { setHandlerFunctionHospital } from "../../../controllers/fhir/fhirOrganization.controller";

const consumeHospital = (connection: any) => {
    const queueNames = [
        { name: 'bridging_create_hospitals', action: 'created' },
        { name: 'bridging_update_hospitals', action: 'updated' },
        { name: 'bridging_delete_hospitals', action: 'deleted' }
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
        queues?.forEach((queue: { name: any; action: any; }) => {
            channel.assertQueue(queue.name, {
                durable: false,
            });
            console.log(` [*] Waiting for messages from %s.`, queue.name);
            channel.consume(
                queue.name,
                async function (data: any) {
                    try {   
                        const result = data ? JSON.parse(data.content.toString()) : null;
                        const searchParam = await HospitalModel.findOne({
                            uuid: result?.id
                        }, {}, { lean: true });
                        const payload = {
                            uuid: result.id,
                            alias: result.alias,
                            name: result.name,
                            groupId: result.group_id,
                            createdBy: result.created_by,
                            createdAt: result.modified_date,
                            updatedBy: result.modified_by,
                            updatedAt: result.modified_date,
                            active: result.active === '1'
                        }
                        
                        const bodyHospital = {
                            name: result.name,
                            type: 'prov',
                            phone: result.phone_1,
                            address: result.address,
                            active: result.active,
                         }

                        switch (queue.action) {
                            case "created":
                            case "updated":
                            case "deleted":
                                if (searchParam) {
                                    await HospitalModel.findOneAndUpdate(
                                        {
                                            _id: searchParam._id
                                        },
                                        { 
                                            ...payload
                                        },
                                        {
                                            new: true
                                        }
                                    );

                                    await setHandlerFunctionHospital(bodyHospital, result.id)
                                } else {
                                    await HospitalModel.create({
                                        ...payload
                                    });
                                    
                                    await setHandlerFunctionHospital(bodyHospital, result.id)
                                }
                                break;
                            default:
                                if (searchParam) {
                                    await HospitalModel.findOneAndUpdate(
                                        {
                                            _id: searchParam._id
                                        },
                                        { 
                                            ...payload
                                        },
                                        {
                                            new: true
                                        }
                                    );
                                }
                                break;
                        }
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

export default consumeHospital;