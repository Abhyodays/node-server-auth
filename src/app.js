import express from "express";
import { createServer } from "http";
import { chats } from './data/data.js';
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
const httpServer = createServer(app);
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    Credential: true
}))
app.use(express.json({ limit: "16kb" }))
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "16kb" }))

app.get('/', (req, res) => {
    res.send(chats)
})

//routes imports
import userRouter from './routers/user.routes.js';



//routes declaration
app.use("/api/v1/users", userRouter);

export { httpServer };