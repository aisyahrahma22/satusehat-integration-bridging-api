import config from "config";
import * as amqp from "amqplib/callback_api";
import consumeHospital from "./hospital.message";
import consumeSession from "./session.message";
import consumeEncounter from "./encounter.message";
import consumeObservation from "./observation.message";
import consumeCareplan from "./careplan.message";
import consumeProcedure from "./procedure.message";
import consumePrognosa from "./prognosa.message";
import consumeAllergy from "./allergy.message";
import consumeLaboratory from "./laboratory.message";
import consumeMedicineReceipt from "./medicineReceipt.message";
import consumeCondition from "./condition.message";
import consumeRadiology from "./radiology.message";

const rabbitmqUsername = config.get<string>("rabbitmqUsername");
const rabbitmqPassword = config.get<string>("rabbitmqPassword");
const rabbitmqHost = config.get<string>("rabbitmqHost");
const rabbitmqPort = config.get<number>("rabbitmqPort");
const rabbitmqUrl = `amqp://${rabbitmqUsername}:${rabbitmqPassword}@${rabbitmqHost}:${rabbitmqPort}?heartbeat=60`;
const runConsumer = () => {
    try {
        amqp.connect(rabbitmqUrl, function (error0: any, connection: any) {
            if (error0) {
                console.error("[AMQP]", error0.message);
                return error0;
            } 
            connection.on("error", function(err: any) {
                if (err.message !== "Connection closing") {
                    console.error("[AMQP] Connection error", err.message);
                }
            });
            connection.on('blocked', function(reason: any) {
                console.error("[AMQP] Blocked", reason);
                return;
            });
            connection.on("close", function() {
                console.error("[AMQP] Reconnecting in 10 seconds");
                return setTimeout(runConsumer, 10000);
            });
            console.error("[AMQP] Connected");
            // Prepare consumer
            consumeHospital(connection);
            consumeSession(connection);
            consumeEncounter(connection);
            consumeObservation(connection)
            consumeCareplan(connection)
            consumeProcedure(connection)
            consumePrognosa(connection)
            consumeAllergy(connection)
            consumeLaboratory(connection)
            consumeMedicineReceipt(connection)
            consumeCondition(connection)
            consumeRadiology(connection)
        });
    } catch (err) {
        console.warn(err);
    }
}


export default runConsumer;