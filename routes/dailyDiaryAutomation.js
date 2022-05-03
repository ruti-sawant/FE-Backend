import express from "express";
import dotenv from 'dotenv';
dotenv.config();
import axios from "axios";
import csv from "csv-parser";
import { Readable } from "stream";
import { Parser } from "json2csv";

const router = express.Router();


router.post("/", (req, res) => {

    if (req.files) {
        const readable = Readable.from(req.files.sheet.data);
        const dataToSend = [];
        const tempData = [];
        try {
            readable
                .pipe(csv())
                .on("data", (row) => {
                    tempData.push(row);
                })
                .on("end", async () => {
                    tempData.forEach((row) => {
                        console.log(row);
                    });
                    // axios.post(process.env.API_URL + "/mrlReports/postAll", {
                    //     data: dataToSend
                    // }, {
                    //     headers: {
                    //         'Content-Type': 'application/json',
                    //         'apiid': process.env.API_KEY
                    //     }
                    // })
                    //     .then((data) => {
                    //         console.log(data.data);
                    //         res.status(200).send(data.data);
                    //     })
                    //     .catch((err) => {
                    //         console.log(err);
                    //         if (err.response && err.response.data && err.response.data.message) {
                    //             res.status(400).send({ message: err.response.data.message });
                    //         } else {
                    //             res.status(400).send({ message: err.message });
                    //         }
                    //     });

                });
        } catch (err) {
            console.log(err);
            res.status(400).send({ message: err.message });
        }
    } else {
        console.log("No file uploaded");
        res.status(400).send({ message: "File not uploaded" });
    }
});




// getAllFarmers();

function getAllFarmers() {
    axios.get(process.env.API_URL + "/farmers", {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            const result = data.data;
            axios.get(process.env.API_URL + "/seasonalData", {
                headers: {
                    'Content-Type': 'application/json',
                    'apiid': process.env.API_KEY
                }
            })
                .then(async (data) => {

                    //for extraction of seasonalData
                    const seasonalData = data.data;
                    const seasonalDataLength = seasonalData.length;
                    const mhcodeSeasonaldata = new Map();
                    for (let i = 0; i < seasonalDataLength; i++) {
                        if (!mhcodeSeasonaldata.has(seasonalData[i].MHCode)) {
                            mhcodeSeasonaldata.set(seasonalData[i].MHCode, [i]);
                        } else {
                            mhcodeSeasonaldata.get(seasonalData[i].MHCode).push(i);
                        }
                    }

                    //for extraction of farmer data.
                    let resultLength = result.length;
                    let objectToSend = [];
                    for (let i = 0; i < resultLength; i++) {
                        const farmerObject = {};
                        farmerObject.farmerId = result[i]._id;
                        farmerObject.personalInformation = result[i].personalInformation;
                        const plots = getPlots(result, i);
                        for (let i = 0; i < plots.length; i++) {
                            farmerObject.plot = plots[i];
                            const seasonalDataIndices = mhcodeSeasonaldata.get(plots[i].farmInformation.MHCode);
                            if (seasonalDataIndices && seasonalDataIndices.length > 0) {
                                for (let j = 0; j < seasonalDataIndices.length; j++) {
                                    farmerObject.seasonalData = seasonalData[seasonalDataIndices[j]];
                                    objectToSend.push({ ...farmerObject });
                                }
                            } else {
                                objectToSend.push({ ...farmerObject });
                            }
                        }
                    }



                })
                .catch((err) => {
                    // res.status(400).send({ message: err.message });
                });
            // res.status(200).send(objectToSend);
        })
        .catch((err) => {
            console.log("err", err);
            // res.status(400).send({ message: err.message });
        });

}



function getPlots(result, i) {
    const plotsArray = result[i].plots;
    const numberOfPlots = plotsArray.length;
    const resultantArray = [];
    for (let j = 0; j < numberOfPlots; j++) {
        // console.log(plotsArray[j]);
        resultantArray.push(plotsArray[j]);
    }
    return resultantArray;
}

export default router;