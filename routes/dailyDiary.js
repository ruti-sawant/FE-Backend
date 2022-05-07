import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import fetch from 'node-fetch';
const router = express.Router();
import axios from 'axios';

import middleware from '../middleware.js';

//to get all daily diaries.
router.get("/", middleware, (req, res) => {
    axios.get(process.env.API_URL + "/dailyDiary", {
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

//to get daily diaries for one plot by MHCode.
router.get("/MHCode/:MHCode", middleware, (req, res) => {
    const MHCode = req.params.MHCode;
    axios.get(process.env.API_URL + "/dailyDiary/MHCode/" + MHCode, {
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

//to get daily diaries for one farmer by farmerId.  
router.get("/farmers/:farmerId", middleware, (req, res) => {
    const farmerID = req.params.farmerId;
    axios.get(process.env.API_URL + "/dailyDiary/" + farmerID, {
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


//to get single diary by its diaryId.
router.get("/diary/:diaryId", middleware, (req, res) => {
    const diaryId = req.params.diaryId;
    axios.get(process.env.API_URL + "/dailyDiary/data/" + diaryId, {
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
})

//to add new daily diary.
router.post("/", async (req, res) => {
    // console.log(req.body.data);
    const data = req.body.data;
    //to generate object from data coming from frontend.
    const objectToPush = generateObjectFromData(data);
    if (data.Plot.PlotID !== 'ALL') {
        objectToPush.farmerId = data.Farmer.FarmerID;
        objectToPush.plot = data.Plot.PlotID;
        //get farmers from database api.
        await fetch(process.env.API_URL + "/farmers/" + objectToPush.farmerId + "?personalInformation.GGN=1&plots.farmInformation.plotNumber=1&plots.farmInformation.MHCode=1", {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apiid': process.env.API_KEY
            }
        })
            .then((result) => {
                if (result.status === 200)
                    return result.json();
                else
                    throw Error("Error while inserting diary");
            })
            .then((result) => {
                //code to get MHCode for selected plot from plots coming from database api.
                objectToPush.GGN = result.personalInformation.GGN;
                objectToPush.MHCode = "";
                const plots = result.plots;
                for (let i = 0; i < plots.length; i++) {
                    // console.log(i, plots[i]);
                    if (plots[i].farmInformation.plotNumber === objectToPush.plot) {
                        objectToPush.MHCode = plots[i].farmInformation.MHCode;
                        break;
                    }
                }
            })
            .catch((err) => {
                res.status(400).send(err.message);
            });
        //console.log("object", objectToPush);
        // to insert data in daily diaries
        fetch(process.env.API_URL + "/dailyDiary", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apiid': process.env.API_KEY
            },
            body: JSON.stringify({
                data: objectToPush
            })
        })
            .then((result) => {
                if (result.status === 200)
                    return result.json();
                else {
                    throw new Error("Error in inserting daily Diary");
                }
            })
            .then((result) => {
                //console.log("res", result);
                res.status(200).send(result);
            })
            .catch((err) => {
                //console.log("err", err);
                res.status(400).send(err.message);
            });
    } else {
        //to get farmers data from database api.
        const farmerID = data.Farmer.FarmerID;
        await fetch(process.env.API_URL + "/farmers/" + farmerID + "?personalInformation=1&plots.farmInformation=1", {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apiid': process.env.API_KEY
            }
        })
            .then((result) => {
                if (result.status === 200)
                    return result.json();
                else
                    throw Error("Error while inserting diary");
            })
            .then((result) => {
                //for family head.
                if (result.personalInformation.name.trim() === result.personalInformation.familyName.trim()) {
                    const gcnKey = result.personalInformation.GGN;
                    fetch(process.env.API_URL + "/farmers/GGN/" + gcnKey + "?_id=1&plots.farmInformation=1", {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'apiid': process.env.API_KEY
                        }
                    })
                        .then((result) => {
                            if (result.status === 200)
                                return result.json();
                            else
                                throw Error("Error while inserting diary");
                        })
                        .then((result) => {
                            for (let i = 0; i < result.length; i++) {
                                objectToPush.farmerId = result[i]._id;
                                objectToPush.GGN = gcnKey;
                                //iterating over plots to get MHCode and posting it for each MHCode each time.
                                for (let j = 0; j < result[i].plots.length; j++) {
                                    objectToPush.plot = result[i].plots[j].farmInformation.plotNumber;
                                    objectToPush.MHCode = result[i].plots[j].farmInformation.MHCode;
                                    fetch(process.env.API_URL + "/dailyDiary", {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'apiid': process.env.API_KEY
                                        },
                                        body: JSON.stringify({
                                            data: objectToPush
                                        })
                                    })
                                        .then((result) => {
                                            if (result.status === 200)
                                                return result.json();
                                            else {
                                                // console.log(result.text().then((r) => { console.log(r); }));
                                                throw new Error("Error in inserting daily Diary");
                                            }
                                        })
                                        .then((resultObject) => {
                                            if (i == result.length - 1)
                                                res.status(200).send(resultObject);
                                        })
                                        .catch((err) => {
                                            //console.log("err", err);
                                            if (i == result.length - 1)
                                                res.status(400).send(err.message);
                                        });
                                }
                            }
                        })
                        .catch((err) => {
                            res.status(400).send(err.message);
                        });
                } else { //for other than family head.
                    objectToPush.farmerId = result._id;
                    objectToPush.GGN = result.personalInformation.GGN;
                    const plots = result.plots;
                    //iterating over plots of farmer and adding it to database api.
                    for (let i = 0; i < plots.length; i++) {
                        objectToPush.plot = plots[i].farmInformation.plotNumber;
                        objectToPush.MHCode = plots[i].farmInformation.MHCode;
                        fetch(process.env.API_URL + "/dailyDiary", {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'apiid': process.env.API_KEY
                            },
                            body: JSON.stringify({
                                data: objectToPush
                            })
                        })
                            .then((result) => {
                                if (result.status === 200)
                                    return result.json();
                                else {
                                    //console.log(result.text().then(r => console.log(r)));
                                    throw new Error("Error in inserting daily Diary");
                                }
                            })
                            .then((result) => {
                                if (i == plots.length - 1)
                                    res.status(200).send(result);
                            })
                            .catch((err) => {
                                if (i == plots.length - 1)
                                    res.status(400).send(err.message);
                            });
                    }
                }
            })
            .catch((err) => {
                res.status(400).send(err.message);
            });

    }
});

export default router;


//supporting functions
function generateObjectFromData(data) {
    const objectToPush = {};
    //basic open fields.
    objectToPush.proposedDate = new Date(data.Date.ProposedDate);
    //generating spraying object from raw data.
    const sprayingData = data.Spraying;
    if (sprayingData) {
        const arr = [];
        for (let i = 1; i <= 5; i++) {
            const sprayDetail = {};
            if (!(sprayingData["row" + i].SprayingType) || sprayingData["row" + i].SprayingType === "None")
                continue;
            sprayDetail.category = sprayingData["row" + i].SprayingType;
            sprayDetail.chemical = sprayingData["row" + i].Chemical;
            sprayDetail.quantity = sprayingData["row" + i].Quantity;
            sprayDetail.imageUrl = sprayingData["row" + i].ImageLink;
            sprayDetail.imageId = sprayingData["row" + i].ImageId;
            arr.push(sprayDetail);
        }
        objectToPush.spraying = {
            details: arr
        }
    }
    //generating fertilizers object from raw data.
    const fertilizerData = data.Fertilizer;
    if (fertilizerData) {
        const arr = [];
        for (let i = 1; i <= 5; i++) {
            const fertilizerDetail = {};
            if (!(fertilizerData["row" + i].FertilizerWork) || fertilizerData["row" + i].FertilizerWork === "None")
                continue;
            fertilizerDetail.fertilizer = fertilizerData["row" + i].FertilizerWork;
            fertilizerDetail.quantity = fertilizerData["row" + i].Details;
            fertilizerDetail.imageUrl = fertilizerData["row" + i].ImageLink;
            fertilizerDetail.imageId = fertilizerData["row" + i].ImageId;
            arr.push(fertilizerDetail);
        }
        objectToPush.irrigation = {
            numberOfHours: fertilizerData.IrrigationTime,
            details: arr,
        }
    }
    //generating farmwork data from raw data.
    const farmworkData = data.FarmWork;
    if (farmworkData) {
        const arr = [];
        for (let i = 1; i <= 5; i++) {
            const workDetails = {};
            if (!(farmworkData["row" + i].FarmWork) || farmworkData["row" + i].FarmWork === "None")
                continue;
            workDetails.work = farmworkData["row" + i].FarmWork;
            workDetails.comments = farmworkData["row" + i].Details;
            workDetails.imageUrl = farmworkData["row" + i].ImageLink;
            workDetails.imageId = farmworkData["row" + i].ImageId;
            arr.push(workDetails);
        }
        objectToPush.farmWork = {
            details: arr,
        }
    }
    //generating soil work data from raw data.
    const soilworkData = data.SoilWork;
    if (soilworkData) {
        const arr = [];
        for (let i = 1; i <= 5; i++) {
            const workDetails = {};
            if (!(soilworkData["row" + i].soilWork) || soilworkData["row" + i].soilWork === "None")
                continue;
            workDetails.work = soilworkData["row" + i].soilWork;
            workDetails.area = soilworkData["row" + i].Details;
            workDetails.imageUrl = soilworkData["row" + i].ImageLink;
            workDetails.imageId = soilworkData["row" + i].ImageId;
            arr.push(workDetails);
        }
        objectToPush.soilWork = {
            details: arr,
        }
    }
    //generating maintenance data from raw data.
    const maintenanceworkData = data.Maintenance;
    if (maintenanceworkData) {
        const arr = [];
        for (let i = 1; i <= 5; i++) {
            const workDetails = {};
            if (!(maintenanceworkData["row" + i].MaintenanceWork) || maintenanceworkData["row" + i].MaintenanceWork === "None")
                continue;
            workDetails.item = maintenanceworkData["row" + i].MaintenanceWork;
            workDetails.comments = maintenanceworkData["row" + i].Details;
            workDetails.imageUrl = maintenanceworkData["row" + i].ImageLink;
            workDetails.imageId = maintenanceworkData["row" + i].ImageId;
            arr.push(workDetails);
        }
        objectToPush.maintenanceWork = {
            details: arr,
        }
    }
    //taking notes from raw data.
    const notes = data.Notes;
    if (notes) {
        objectToPush.notes = notes.Notes;
    }
    return objectToPush;
}