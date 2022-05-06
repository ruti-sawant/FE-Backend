import express from "express";
import dotenv from "dotenv";
dotenv.config();
import fileUpload from "express-fileupload";
import cors from "cors";
import axios from "axios";
import cookieParser from "cookie-parser";
const app = express();

//to allow get from anywhere.
const corsOptions = {
  'Access-Control-Allow-Origin': '*',
  origin: '*',
  credentials: true,            //access-control-allow-credentials:true
}
app.use(cors(corsOptions));
app.use(fileUpload());
app.use(express.json());
app.use(cookieParser());
app.use(middleware);


//imports for routes.
import uploadFile from "./routes/uploadFile.js";
import farmers from "./routes/farmers.js";
import dailyDiary from "./routes/dailyDiary.js";
import bulkUpload from "./routes/bulkUpload.js";
import seasonalData from "./routes/seasonalData.js";
import broadcasts from "./routes/broadcast.js";
import mrlReports from "./routes/mrl.js";
import cropMonitoring from "./routes/cropMonitoring.js";
import admins from "./routes/admins.js";
import dailyDiaryAutomation from './routes/dailyDiaryAutomation.js';
import login from './routes/login.js';

import middleware from "./middleware.js";

app.use("/uploadFile", uploadFile);
app.use("/farmers", farmers);
app.use("/dailyDiary", dailyDiary);
app.use("/bulkUpload", bulkUpload);
app.use("/seasonalData", seasonalData);
app.use("/broadcasts", broadcasts);
app.use("/mrlReports", mrlReports);
app.use("/cropMonitoring", cropMonitoring);
app.use("/admins", admins);
app.use("/dailyDiaryAutomation", dailyDiaryAutomation);
app.use("/login", login);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("Server started on port ", port);
});


app.options("*", middleware);
//route to fetch filters from database.
app.get("/filters", middleware, (req, res) => {
  axios
    .get(process.env.API_URL + "/filters", {
      headers: {
        "Content-Type": "application/json",
        apiid: process.env.API_KEY,
      },
    })
    .then((data) => {
      res.status(200).send(data.data);
    })
    .catch((err) => {
      res.status(400).send({ message: err.message });
    });
});


app.get("/logout", middleware, (req, res) => {
  //code to delete cookie
  res.cookie(process.env.COOKIE_NAME, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    expires: new Date(0)
  });
  res.status(200).send({ message: "Logged Out" });
});