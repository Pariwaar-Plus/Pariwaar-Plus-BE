import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import rootRouter from "./index.routes";
import { globalErrorHandler } from "./middlewares/error.middleware";


dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin:["http://localhost:3000","https://pariwar-plus.netlify.app",process.env.CLIENT_APP_URL!] , // Your Next.js URL
  credentials: true
}));
app.use(express.json());

app.use(cookieParser());


app.get("/", (req, res) => {
  res.send("Clinic System API is running...");
});

app.use("/api", rootRouter);
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});