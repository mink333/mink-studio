import dotenv from 'dotenv'
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from 'cookie-parser';
import apiRouter from './api/index.js';
import { initUploadPath } from './shared/config/upload.config.js';
import { errorHandler } from './shared/middlewares/error.middleware.js';

initUploadPath();

const app = express();
const PORT = process.env.PORT;


const allowedOrigins = process.env.ORIGIN!.split(",");
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use('/api', apiRouter);

app.use(errorHandler);
app.listen(PORT, () => {
  console.log(`SERVER ONLINE ON PORT: ${PORT}`);
})