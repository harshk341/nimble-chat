import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "node:http";
import { connect } from "./services/db";

import authRoutes from "./routes/auth.routes";
import messageRoutes from "./routes/message.routes";
import userRoutes from "./routes/user.routes";
import { logger } from "./helpers";
import { initSocket } from "./services/socket";

dotenv.config({ quiet: true });

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

app.get("/api", (_req: Request, res: Response) => {
  res.status(200).send("API Working");
});

const server = http.createServer(app);
initSocket(server);

connect().then(() => {
  server.listen(PORT || 5000, () => {
    logger(`Server is running`);
  });
});
