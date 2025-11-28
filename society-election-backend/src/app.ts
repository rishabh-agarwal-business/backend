import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import "express-async-errors";
import routes from "./routes";
import { errorHandler } from "./utils/errorHandler";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api", routes);

// global error handler
app.use(errorHandler);

export default app;
