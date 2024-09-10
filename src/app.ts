import express, { Request, Response } from "express";
import config from "config";
import responseTime from "response-time";
import connect from "./utils/connect";
import logger from "./utils/logger";
import routes from "./routes";
import deserializeAuth from "./middleware/deserializeAuth";
import { restResponseTimeHistogram, startMetricsServer } from "./utils/metrics";
import path  from "path";
import runConsumer from "./services/message/consume";

const cors = require('cors');

const port = config.get<number>("port");
const host = config.get<string>("host");

const app = express();

app.use(cors())
app.use(express.static('public')); 
app.use(deserializeAuth);
app.use('/images', express.static('images'));
app.use(express.urlencoded({extended: true, limit: '50mb'}));
app.use(express.json({limit: '50mb'}));
app.use(
  responseTime((req: Request, res: Response, time: number) => {
    if (req?.route?.path) {
      restResponseTimeHistogram.observe(
        {
          method: req.method,
          route: req.route.path,
          status_code: res.statusCode,
        },
        time * 1000
      );
    }
  })
);
app.use(routes);

app.listen(port, async () => {
  logger.info(`App is running at http://${host}:${port}`);

  await connect();

  runConsumer();

  startMetricsServer();
});
