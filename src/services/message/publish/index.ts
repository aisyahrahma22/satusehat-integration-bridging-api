import config from "config";
import * as amqp from "amqplib/callback_api";

const rabbitmqUsername = config.get<string>("rabbitmqUsername");
const rabbitmqPassword = config.get<string>("rabbitmqPassword");
const rabbitmqHost = config.get<string>("rabbitmqHost");
const rabbitmqPort = config.get<number>("rabbitmqPort");
const rabbitmqUrl = `amqp://${rabbitmqUsername}:${rabbitmqPassword}@${rabbitmqHost}:${rabbitmqPort}?heartbeat=60`;

const publishMessage = async (queue: any, params: any) => {
    try {
        amqp.connect(rabbitmqUrl, (err, conn) => {
            if (err) console.log(err);;

            try {
                // Sender
                conn.createChannel((err, ch1) => {
                    if (err) console.log(err);;

                    try {
                        ch1.assertQueue(queue, {
                            durable: false
                        });
                    } catch (error) {
                    }

                    // setInterval(() => {
                    try {
                        ch1.sendToQueue(queue, Buffer.from(params));
                    } catch (error) {

                    }
                    // }, 1000);
                });
                setTimeout(function () {
                    conn.close();
                    //process.exit(0);
                }, 500)
            } catch (error) {
            }
        });
    } catch (error) {
        console.warn(error);
    }

};

export default publishMessage;