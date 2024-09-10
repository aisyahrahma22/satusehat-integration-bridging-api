import config from "config";
import SessionModel from "../../../models/iam/session.model";

const consumeSession = (connection: any) => {
    const queueNames = [
        { name: 'bridging_create_session', action: 'created' },
        { name: 'bridging_update_session', action: 'updated' },
        { name: 'bridging_delete_session', action: 'deleted' }
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
                        const searchParam = await SessionModel.findOne({
                           uuid: result.uuid
                        });
                        const payload = {
                            id: result.id,
                            uuid: result.uuid,
                            userId: result.userId,
                            userAgent: result.userAgent,
                            valid: result.valid,
                            lastAccess: result.lastAccess,
                            createdAt: result.createdAt,
                            updatedAt: result.updatedAt
                        }
                        switch (queue.action) {
                            case "created":
                            case "updated":
                            case "deleted":
                                if (searchParam) {
                                    await SessionModel.findOneAndUpdate(
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
                                    // console.log(` [x] Received Patient Type Updated:`, result);
                                } else {
                                    await SessionModel.create({
                                        ...payload
                                    });
                                    // console.log(` [x] Received Patient Type Created:`, result);
                                }
                                break;
                            default:
                                if (searchParam) {
                                    await SessionModel.findOneAndUpdate(
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
                                    // console.log(` [x] Received Patient Type Updated:`, result);
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

export default consumeSession;