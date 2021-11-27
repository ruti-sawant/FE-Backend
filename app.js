import express from "express";
import fileUpload from "express-fileupload";
import cors from 'cors';
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

app.use("/uploadFile", uploadFile);
app.use("/farmers", farmers);
app.use("/dailyDiary", dailyDiary);
app.use("/bulkUpload", bulkUpload);

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log("Server started on port ", port);
});

