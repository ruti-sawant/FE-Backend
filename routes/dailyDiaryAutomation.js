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
                    await axios.get(process.env.API_URL + "/farmers", {
                        headers: {
                            'Content-Type': 'application/json',
                            'apiid': process.env.API_KEY
                        }
                    })
                        .then(async (data) => {
                            // console.log(data.data);
                            axios.get(process.env.API_URL + "/seasonalData", {
                                headers: {
                                    'Content-Type': 'application/json',
                                    'apiid': process.env.API_KEY
                                }
                            })
                                .then(async (seasonalData) => {
                                    const farmerDataReceived = data.data;
                                    const seasonalDataReceived = seasonalData.data;
                                    const farmerMapping = new Map();
                                    for (let i = 0; i < farmerDataReceived.length; i++) {
                                        for (let j = 0; j < farmerDataReceived[i].plots.length; j++) {
                                            farmerMapping.set(farmerDataReceived[i].plots[j].farmInformation.MHCode, {
                                                farmerId: farmerDataReceived[i]._id,
                                                GGN: farmerDataReceived[i].personalInformation.GGN,
                                                MHCode: farmerDataReceived[i].plots[j].farmInformation.MHCode,
                                                plot: farmerDataReceived[i].plots[j].farmInformation.plotNumber
                                            });
                                        }
                                    }
                                    const seasonalDataMapping = new Map();
                                    for (let i = 0; i < seasonalDataReceived.length; i++) {
                                        if (seasonalDataMapping.has(seasonalDataReceived[i].MHCode) && new Date(seasonalDataMapping.get(seasonalDataReceived[i].MHCode)) > new Date(seasonalDataReceived[i].cropMilestoneDates.fruitPruning)) {
                                            continue;
                                        }
                                        seasonalDataMapping.set(seasonalDataReceived[i].MHCode, seasonalDataReceived[i].cropMilestoneDates.fruitPruning);
                                    }
                                    for (let key of seasonalDataMapping.keys()) {
                                        if (farmerMapping.has(key))
                                            farmerMapping.get(key).proposedDate = seasonalDataMapping.get(key);
                                    }
                                    // console.log("tempData");
                                    console.log(farmerMapping);

                                    // to get Difference in date using Date.parse() and adding number of seconds to it to get expected date.



                                    const curatedDiaries = [];
                                    tempData.forEach((row) => {
                                        const diaryObject = {}
                                        diaryObject.day = row["day"];
                                        const sprayArray = [];
                                        for (let i = 1; i <= 5; i++) {
                                            const sprayObject = {};
                                            if (row["sprayCategory" + i] !== "") {
                                                sprayObject.category = row["sprayCategory" + i];
                                                sprayObject.chemical = row["sprayChemical" + i];
                                                sprayObject.quantity = row["sprayQuantity" + i];
                                                sprayObject.imageUrl = row["sprayImageUrl" + i];
                                                sprayArray.push(sprayObject);
                                            }
                                        }
                                        diaryObject.spray = { details: sprayArray };


                                        const irrigationArray = [];
                                        for (let i = 1; i <= 5; i++) {
                                            const irrigationObject = {};
                                            if (row["irrigationFertilizer" + i] !== "") {
                                                irrigationObject.fertilizer = row["irrigationFertilizer" + i];
                                                irrigationObject.quantity = row["irrigationQuantity" + i];
                                                irrigationObject.imageUrl = row["irrigationImageUrl" + i];
                                                irrigationArray.push(irrigationObject);
                                            }
                                        }
                                        diaryObject.irrigation = {
                                            numberOfHours: row["irrigationHours"],
                                            details: irrigationArray
                                        };


                                        const farmWorkArray = [];
                                        for (let i = 1; i <= 5; i++) {
                                            const farmWorkObject = {};
                                            if (row["farmWork" + i] !== "") {
                                                farmWorkObject.work = row["farmWork" + i];
                                                farmWorkObject.comments = row["farmWorkComment" + i];
                                                farmWorkObject.imageUrl = row["farmWorkImageUrl" + i];
                                                farmWorkArray.push(farmWorkObject);
                                            }
                                        }
                                        diaryObject.farmWork = { details: farmWorkArray };


                                        const soilWorkArray = [];
                                        for (let i = 1; i <= 5; i++) {
                                            const soilWorkObject = {};
                                            if (row["soilWork" + i] !== "") {
                                                soilWorkObject.work = row["soilWork" + i];
                                                soilWorkObject.area = row["soilWorkArea" + i];
                                                soilWorkObject.imageUrl = row["soilWorkImageUrl" + i];
                                                soilWorkArray.push(soilWorkObject);
                                            }
                                        }
                                        diaryObject.soilWork = { details: soilWorkArray };


                                        const maintenanceWorkArray = [];
                                        for (let i = 1; i <= 5; i++) {
                                            const maintenanceWorkObject = {};
                                            if (row["maintenanceWorkItem" + i] !== "") {
                                                maintenanceWorkObject.work = row["maintenanceWorkItem" + i];
                                                maintenanceWorkObject.comments = row["maintenanceWorkComment" + i];
                                                maintenanceWorkObject.imageUrl = row["maintenanceWorkImageUrl" + i];
                                                maintenanceWorkArray.push(maintenanceWorkObject);
                                            }
                                        }
                                        diaryObject.maintenanceWork = { details: maintenanceWorkArray };


                                        diaryObject.notes = row["notes"];


                                        curatedDiaries.push(diaryObject);
                                    });
                                    res.status(200).send(curatedDiaries);
                                })
                                .catch((err) => {
                                    console.log("seasonalData", err);
                                    res.status(400).send({ message: err.message });
                                });
                        })
                        .catch((err) => {
                            console.log("farmer", err);
                            res.status(400).send({ message: err.message });
                        });
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