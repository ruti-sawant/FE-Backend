import express from "express";
import dotenv from 'dotenv';
dotenv.config();
import fileUpload from "express-fileupload";
import cors from 'cors';
import axios from "axios";
const app = express();


//to allow get from anywhere.
const corsOptions = {
    origin: '*',
    credentials: true,            //access-control-allow-credentials:true
    optionSuccessStatus: 200
}
app.use(cors(corsOptions));
app.use(fileUpload());
app.use(express.json());



//imports for routes.
import uploadFile from './routes/uploadFile.js';
import farmers from './routes/farmers.js';
import dailyDiary from './routes/dailyDiary.js';
import bulkUpload from './routes/bulkUpload.js';
import seasonalData from './routes/seasonalData.js';
import broadcasts from './routes/broadcast.js';
import mrlReports from './routes/mrl.js';

app.use("/uploadFile", uploadFile);
app.use("/farmers", farmers);
app.use("/dailyDiary", dailyDiary);
app.use("/bulkUpload", bulkUpload);
app.use("/seasonalData", seasonalData);
app.use("/broadcasts", broadcasts);
app.use("/mrlReports", mrlReports);

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log("Server started on port ", port);
});

//route to fetch filters from database.
app.get("/filters", (req, res) => {
    axios.get(process.env.API_URL + "/filters", {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            res.status(200).send(data.data);
        })
        .catch((err) => {
            res.status(400).send({ message: err.message });
        });
});