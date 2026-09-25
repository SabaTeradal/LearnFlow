import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http"; // ✅ correct import
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// ✅ Proper pino-http usage
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: Request) {
        return {
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: Response) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  })
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// test route
app.get("/", (req: Request, res: Response) => {
  res.send("API is running 🚀");
});

export default app;