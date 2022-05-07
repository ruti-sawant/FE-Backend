import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import fetch from 'node-fetch';
import axios from 'axios';

import middleware from '../middleware.js';

import { Parser } from "json2csv";

const router = express.Router();

// route to map farmers and their plots.
// for family head assign all plots of all other members in family.
// for other members assign only their plots.
router.get("/plots", middleware, (req, res) => {
    fetch(process.env.API_URL + "/farmers?personalInformation=1&plots.farmInformation=1&plots._id=1", {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((result) => {
            if (result.status == 200)
                return result.json();
            else
                return [];
        })
        .then((result) => {
            let resultLength = result.length;
            let objectToSend = [];
            for (let i = 0; i < resultLength; i++) {
                const farmerObject = {};
                //assigning common attributes.
                farmerObject.farmerID = result[i]._id;
                farmerObject.farmerName = result[i].personalInformation.name;
                farmerObject.familyName = result[i].personalInformation.familyName;
                farmerObject.GGN = result[i].personalInformation.GGN;
                //for family head assign all plots of all other members in family.
                if (result[i].personalInformation.name.trim() === result[i].personalInformation.familyName.trim()) {
                    farmerObject.plot = getPlotsForHead(result, i);
                } else { //for other members assign only their plots.
                    farmerObject.plot = getPlots(result, i);
                }
                objectToSend.push(farmerObject);
            }
            // console.log(objectToSend);
            res.status(200).send(objectToSend);
        })
        .catch((err) => {
            //console.log("err", err);
            res.status(400).send({ message: err.message });
        });
});

// method to get all farmers.
router.get("/", middleware, (req, res) => {
    axios.get(process.env.API_URL + "/farmers", {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            // console.log(data.data);
            axios.get(process.env.API_URL + "/seasonalData", {
                headers: {
                    'Content-Type': 'application/json',
                    'apiid': process.env.API_KEY
                }
            })
                .then((seasonalData) => {
                    //data received from api.
                    const farmerDataReceived = data.data;
                    const seasonalDataReceived = seasonalData.data;

                    //mapping of farmer MHCode and its location in seasonal data list.
                    const farmerMapping = new Map();
                    for (let i = 0; i < farmerDataReceived.length; i++) {
                        for (let j = 0; j < farmerDataReceived[i].plots.length; j++) {
                            farmerMapping.set(farmerDataReceived[i].plots[j].farmInformation.MHCode, { i, j });
                        }
                    }
                    //mapping of farmer MHCode and its pruning date.
                    const seasonalDataMapping = new Map();
                    for (let i = 0; i < seasonalDataReceived.length; i++) {
                        // for date lower than selected date ignore it.
                        if (seasonalDataMapping.has(seasonalDataReceived[i].MHCode) && new Date(seasonalDataMapping.get(seasonalDataReceived[i].MHCode)) > new Date(seasonalDataReceived[i].cropMilestoneDates.fruitPruning)) {
                            continue;
                        }
                        seasonalDataMapping.set(seasonalDataReceived[i].MHCode, seasonalDataReceived[i].cropMilestoneDates.fruitPruning);
                    }
                    // assigning pruning date to farmer according to MHCode and location of MHCode in seasonalData list.
                    for (let key of seasonalDataMapping.keys()) {
                        // console.log(key, seasonalDataMapping.get(key));
                        if (farmerMapping.get(key))
                            farmerDataReceived[farmerMapping.get(key).i].plots[farmerMapping.get(key).j].farmInformation.fruitPruning = seasonalDataMapping.get(key);

                    }
                    res.status(200).send(farmerDataReceived);
                })
                .catch((err) => {
                    //console.log("seasonalData", err);
                    res.status(400).send({ message: err.message });
                });
        })
        .catch((err) => {
            //console.log("farmer", err);
            res.status(400).send({ message: err.message });
        });
});

// to fetch data for a specific farmer.
router.get("/data/:farmerId", middleware, (req, res) => {
    const farmerId = req.params.farmerId;
    axios.get(process.env.API_URL + "/farmers/" + farmerId, {
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

// to fetch farmers according to MHCode.
router.get("/MHCode/:MHCode", middleware, (req, res) => {
    const MHCode = req.params.MHCode;
    axios.get(process.env.API_URL + "/farmers/MHCode/" + MHCode, {
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

//to add new farmer.
router.post("/", middleware, async (req, res) => {
    const data = req.body;
    //console.log("post farmer body", data);
    try {
        //if no familyName is selected then we have to add it to existing GGN
        if (data.personalInformation.familyName.trim() === "") {
            await axios.get(process.env.API_URL + "/farmers/GGN/" + data.personalInformation.GGN, {
                headers: {
                    'Content-Type': 'application/json',
                    'apiid': process.env.API_KEY
                }
            })
                .then((resData) => {
                    if (resData.data && resData.data[0]) {
                        //console.log("data from api for GGN", resData.data);
                        //set familyName from existing farmer and add it to new farmer.
                        data.personalInformation.familyName = resData.data[0].personalInformation.familyName;
                    } else {
                        res.status(400).send({ message: err.message });
                        return;
                    }
                })
                .catch((err) => {
                    res.status(400).send({ message: err.message });
                    return;
                })
        }
        //api request to add new farmer in database api.
        axios.post(process.env.API_URL + "/farmers", {
            data
        }, {
            headers: {
                'Content-Type': 'application/json',
                'apiid': process.env.API_KEY
            }
        })
            .then((data) => {
                res.status(200).send({ message: "Farmer inserted successfully" });
            })
            .catch((err) => {
                //console.log(err);
                res.status(400).send({ message: err.message });
            });
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

//to add plot in existing farmer.
router.post("/plots/addPlot/:farmerId", middleware, (req, res) => {
    const farmerId = req.params.farmerId;
    const data = req.body;
    axios.patch(process.env.API_URL + "/farmers/newPlot/" + farmerId, {
        data
    }, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            //console.log("data in post of farmer plot insert", data);
            res.status(200).send({ message: "Farmer plot inserted successfully" });
        })
        .catch((err) => {
            //console.log(err);

            res.status(400).send({ message: err.message });
        });
});


//to edit farmer data.
router.post("/edit/:farmerId", middleware, (req, res) => {
    const farmerId = req.params.farmerId;
    const data = req.body;
    //console.log("patch body", req.body);
    axios.patch(process.env.API_URL + "/farmers/" + farmerId, {
        data
    }, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            res.status(200).send({ message: "Farmer updated successfully" });
        })
        .catch((err) => {
            // console.log(err);

            res.status(400).send({ message: err.message });
        });
});

//to edit plot data of farmer.
router.post("/plots/edit/:plotId", middleware, (req, res) => {
    const plotId = req.params.plotId;
    const data = req.body;
    //console.log("plots patch body", data);
    axios.patch(process.env.API_URL + "/farmers/plots/" + plotId, {
        data
    }, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            //console.log("plots patch then", data);
            res.status(200).send({ message: "Farmer updated successfully" });
        })
        .catch((err) => {
            //console.log("plots patch err", err);
            res.status(400).send({ message: err.message });
        });
});

//to delete farmer by its id.
router.post("/delete/:farmerId", middleware, (req, res) => {
    const farmerId = req.params.farmerId;
    axios.delete(process.env.API_URL + "/farmers/" + farmerId, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            //console.log("data", data);
            res.status(200).send({ message: "Farmer " + farmerId + " deleted successfully" });
        })
        .catch((err) => {
            //console.log("err", err);
            res.status(400).send({ message: err.message });
        });
});

//to delete plot of farmer by its id.
router.post("/delete/plot/:plotId", middleware, (req, res) => {
    const plotId = req.params.plotId;
    axios.patch(process.env.API_URL + "/farmers/deletePlot/" + plotId, {
    }, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            //console.log("data", data);
            res.status(200).send({ message: "Farmer plot " + plotId + " deleted successfully" });
        })
        .catch((err) => {
            //console.log("err", err);
            res.status(400).send({ message: err.response.data.message });
        });
});

router.get("/exportFarmers", middleware, (req, res) => {
    //to get farmers data from api.
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

                    //data from database api.
                    const seasonalData = data.data;
                    const seasonalDataLength = seasonalData.length;
                    //map to store mhcode and and indices of seasonal data from seasonal data
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
                        const plots = getPlotsForExport(result, i);
                        //iterate over plots.
                        for (let i = 0; i < plots.length; i++) {
                            farmerObject.plot = plots[i];
                            //to make all combinations of farmer seasonal data and plot seasonal data.
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



                    // console.log(mhcodeSeasonaldata);
                    // console.log(objectToSend);
                    //export % should be calculated dynamically
                    const fields = ["srNo", "farmerId", "farmerName", "profileUrl", "mobile", "email", "familyName", "GGN", "farmMap", "plotNumber", "MHCode", "crop", "variety", "soilType", "plotArea", "latitude", "longitude", "googleMap", "village", "taluka", "district", "pincode", "tags", "nameOfConsultant", "notes", "spacingBetweenRows", "spacingBetweenCrops",
                        "year", "plantationDate", "foundationPruningDate", "fruitPruningDate", "readyToHarvestDate", "actualHarvestDate", "exportTonnage", "localTonnage", "exportPercent", "soilReport", "petioleReport", "waterReport", "preharvestQCLinks", "primaryIssuesFacedAtHarvest", "inwardQClinks", "knittingQCLinks", "packingQCLinks", "FGQCLinks", "onArrivalQCLinks", "primaryQualityIssueFaced", "MRLMaxIndividual", "MRLSum", "MRLNumberOfDetections", "MRLRedlistChemicals", "MRLReportLink", "quality"];

                    const csvData = [];
                    for (let i = 0; i < objectToSend.length; i++) {
                        //code to check for null values. and extract data accordingly.
                        const tempObject = {};
                        tempObject.srNo = i + 1;
                        if (objectToSend[i].farmerId) {
                            tempObject.farmerId = objectToSend[i].farmerId;
                        } else {
                            tempObject.farmerId = "";
                        }
                        if (objectToSend[i].personalInformation && objectToSend[i].personalInformation.name) {
                            tempObject.farmerName = objectToSend[i].personalInformation.name;
                        } else {
                            tempObject.farmerName = "";
                        }
                        if (objectToSend[i].personalInformation && objectToSend[i].personalInformation.profileUrl) {
                            tempObject.profileUrl = objectToSend[i].personalInformation.profileUrl;
                        } else {
                            tempObject.profileUrl = "";
                        }
                        if (objectToSend[i].personalInformation && objectToSend[i].personalInformation.mobileNumber && objectToSend[i].personalInformation.mobileNumber.length > 0) {
                            tempObject.mobile = objectToSend[i].personalInformation.mobileNumber[0];
                        } else {
                            tempObject.mobile = "";
                        }
                        if (objectToSend[i].personalInformation && objectToSend[i].personalInformation.email) {
                            tempObject.email = objectToSend[i].personalInformation.email;
                        } else {
                            tempObject.email = "";
                        }
                        if (objectToSend[i].personalInformation && objectToSend[i].personalInformation.familyName) {
                            tempObject.familyName = objectToSend[i].personalInformation.familyName;
                        } else {
                            tempObject.familyName = "";
                        }
                        if (objectToSend[i].personalInformation && objectToSend[i].personalInformation.GGN) {
                            tempObject.GGN = objectToSend[i].personalInformation.GGN;
                        } else {
                            tempObject.GGN = "";
                        }
                        if (objectToSend[i].personalInformation && objectToSend[i].personalInformation.farmMap) {
                            tempObject.farmMap = objectToSend[i].personalInformation.farmMap;
                        } else {
                            tempObject.farmMap = "";
                        }
                        if (objectToSend[i].personalInformation && objectToSend[i].personalInformation.consultantName) {
                            tempObject.consultantName = objectToSend[i].personalInformation.consultantName;
                        } else {
                            tempObject.consultantName = "";
                        }
                        if (objectToSend[i].plot && objectToSend[i].plot.farmInformation && objectToSend[i].plot.farmInformation.plotNumber) {
                            tempObject.plotNumber = objectToSend[i].plot.farmInformation.plotNumber;
                        } else {
                            tempObject.plotNumber = "";
                        }
                        if (objectToSend[i].plot && objectToSend[i].plot.farmInformation && objectToSend[i].plot.farmInformation.MHCode) {
                            tempObject.MHCode = objectToSend[i].plot.farmInformation.MHCode;
                        } else {
                            tempObject.MHCode = "";
                        }
                        if (objectToSend[i].plot && objectToSend[i].plot.farmInformation && objectToSend[i].plot.farmInformation.crop) {
                            tempObject.crop = objectToSend[i].plot.farmInformation.crop;
                        } else {
                            tempObject.crop = "";
                        }
                        if (objectToSend[i].plot && objectToSend[i].plot.farmInformation && objectToSend[i].plot.farmInformation.variety) {
                            tempObject.variety = objectToSend[i].plot.farmInformation.variety;
                        } else {
                            tempObject.variety = "";
                        }
                        if (objectToSend[i].plot && objectToSend[i].plot.farmInformation && objectToSend[i].plot.farmInformation.soilType) {
                            tempObject.soilType = objectToSend[i].plot.farmInformation.soilType;
                        } else {
                            tempObject.soilType = "";
                        }
                        if (objectToSend[i].plot && objectToSend[i].plot.farmInformation && objectToSend[i].plot.farmInformation.plotArea) {
                            tempObject.plotArea = objectToSend[i].plot.farmInformation.plotArea;
                        } else {
                            tempObject.plotArea = "";
                        }
                        if (objectToSend[i].plot && objectToSend[i].plot.address && objectToSend[i].plot.address.coordinates && objectToSend[i].plot.address.coordinates.latitude) {
                            tempObject.latitude = objectToSend[i].plot.address.coordinates.latitude;
                        } else {
                            tempObject.latitude = "";
                        }
                        if (objectToSend[i].plot && objectToSend[i].plot.address && objectToSend[i].plot.address.coordinates && objectToSend[i].plot.address.coordinates.longitude) {
                            tempObject.longitude = objectToSend[i].plot.address.coordinates.longitude;
                        } else {
                            tempObject.longitude = "";
                        }
                        if (objectToSend[i].plot && objectToSend[i].plot.address && objectToSend[i].plot.address.mapLink) {
                            tempObject.mapLink = objectToSend[i].plot.address.mapLink;
                        } else {
                            tempObject.mapLink = "";
                        }
                        if (objectToSend[i].plot && objectToSend[i].plot.address && objectToSend[i].plot.address.village) {
                            tempObject.village = objectToSend[i].plot.address.village;
                        } else {
                            tempObject.village = "";
                        }
                        if (objectToSend[i].plot && objectToSend[i].plot.address && objectToSend[i].plot.address.taluka) {
                            tempObject.taluka = objectToSend[i].plot.address.taluka;
                        } else {
                            tempObject.taluka = "";
                        }
                        if (objectToSend[i].plot && objectToSend[i].plot.address && objectToSend[i].plot.address.district) {
                            tempObject.district = objectToSend[i].plot.address.district;
                        } else {
                            tempObject.district = "";
                        }
                        if (objectToSend[i].plot && objectToSend[i].plot.address && objectToSend[i].plot.address.pincode) {
                            tempObject.pincode = objectToSend[i].plot.address.pincode;
                        } else {
                            tempObject.pincode = "";
                        }
                        if (objectToSend[i].plot && objectToSend[i].plot.other && objectToSend[i].plot.other.tags && objectToSend[i].plot.other.tags.length > 0) {
                            tempObject.tags = objectToSend[i].plot.other.tags.join(" , ");
                        } else {
                            tempObject.tags = "";
                        }
                        if (objectToSend[i].plot && objectToSend[i].plot.other && objectToSend[i].plot.other.notes) {
                            tempObject.notes = objectToSend[i].plot.other.notes;
                        } else {
                            tempObject.notes = "";
                        }
                        if (objectToSend[i].plot && objectToSend[i].plot.cropSpacing && objectToSend[i].plot.cropSpacing.betweenTwoRows) {
                            tempObject.spacingBetweenRows = objectToSend[i].plot.cropSpacing.betweenTwoRows;
                        } else {
                            tempObject.spacingBetweenRows = "";
                        }
                        if (objectToSend[i].plot && objectToSend[i].plot.cropSpacing && objectToSend[i].plot.cropSpacing.betweenTwoCrops) {
                            tempObject.spacingBetweenCrops = objectToSend[i].plot.cropSpacing.betweenTwoCrops;
                        } else {
                            tempObject.spacingBetweenCrops = "";
                        }
                        if (objectToSend[i].seasonalData && objectToSend[i].seasonalData.year) {
                            tempObject.year = objectToSend[i].seasonalData.year;
                        } else {
                            tempObject.year = "";
                        }
                        //code to format data properly.
                        if (objectToSend[i].seasonalData && objectToSend[i].seasonalData.cropMilestoneDates && objectToSend[i].seasonalData.cropMilestoneDates.plantation && objectToSend[i].seasonalData.cropMilestoneDates.plantation.length > 0) {
                            tempObject.plantationDate = objectToSend[i].seasonalData.cropMilestoneDates.plantation.substr(8, 2) + "/" + objectToSend[i].seasonalData.cropMilestoneDates.plantation.substr(5, 2) + "/" + objectToSend[i].seasonalData.cropMilestoneDates.plantation.substr(0, 4);
                        } else {
                            tempObject.plantationDate = "";
                        }
                        if (objectToSend[i].seasonalData && objectToSend[i].seasonalData.cropMilestoneDates && objectToSend[i].seasonalData.cropMilestoneDates.foundationPruning && objectToSend[i].seasonalData.cropMilestoneDates.foundationPruning.length > 0) {
                            tempObject.foundationPruningDate = objectToSend[i].seasonalData.cropMilestoneDates.foundationPruning.substr(8, 2) + "/" + objectToSend[i].seasonalData.cropMilestoneDates.foundationPruning.substr(5, 2) + "/" + objectToSend[i].seasonalData.cropMilestoneDates.foundationPruning.substr(0, 4);
                        } else {
                            tempObject.foundationPruningDate = "";
                        }
                        if (objectToSend[i].seasonalData && objectToSend[i].seasonalData.cropMilestoneDates && objectToSend[i].seasonalData.cropMilestoneDates.fruitPruning && objectToSend[i].seasonalData.cropMilestoneDates.fruitPruning.length > 0) {
                            tempObject.fruitPruningDate = objectToSend[i].seasonalData.cropMilestoneDates.fruitPruning.substr(8, 2) + "/" + objectToSend[i].seasonalData.cropMilestoneDates.fruitPruning.substr(5, 2) + "/" + objectToSend[i].seasonalData.cropMilestoneDates.fruitPruning.substr(0, 4);
                        } else {
                            tempObject.fruitPruningDate = "";
                        }
                        if (objectToSend[i].seasonalData && objectToSend[i].seasonalData.cropMilestoneDates && objectToSend[i].seasonalData.cropMilestoneDates.readyToHarvest && objectToSend[i].seasonalData.cropMilestoneDates.readyToHarvest.length > 0) {
                            tempObject.readyToHarvestDate = objectToSend[i].seasonalData.cropMilestoneDates.readyToHarvest.substr(8, 2) + "/" + objectToSend[i].seasonalData.cropMilestoneDates.readyToHarvest.substr(5, 2) + "/" + objectToSend[i].seasonalData.cropMilestoneDates.readyToHarvest.substr(0, 4);
                        } else {
                            tempObject.readyToHarvestDate = "";
                        }
                        if (objectToSend[i].seasonalData && objectToSend[i].seasonalData.cropMilestoneDates && objectToSend[i].seasonalData.cropMilestoneDates.actualHarvest && objectToSend[i].seasonalData.cropMilestoneDates.actualHarvest.length > 0) {
                            tempObject.actualHarvestDate = objectToSend[i].seasonalData.cropMilestoneDates.actualHarvest.substr(8, 2) + "/" + objectToSend[i].seasonalData.cropMilestoneDates.actualHarvest.substr(5, 2) + "/" + objectToSend[i].seasonalData.cropMilestoneDates.actualHarvest.substr(0, 4);
                        } else {
                            tempObject.actualHarvestDate = "";
                        }
                        if (objectToSend[i].seasonalData && objectToSend[i].seasonalData.yield && objectToSend[i].seasonalData.yield.exportTonnage > 0) {
                            tempObject.exportTonnage = objectToSend[i].seasonalData.yield.exportTonnage;
                        } else {
                            tempObject.exportTonnage = "";
                        }
                        if (objectToSend[i].seasonalData && objectToSend[i].seasonalData.yield && objectToSend[i].seasonalData.yield.localTonnage > 0) {
                            tempObject.localTonnage = objectToSend[i].seasonalData.yield.localTonnage;
                        } else {
                            tempObject.localTonnage = "";
                        }
                        if (objectToSend[i].seasonalData && objectToSend[i].seasonalData.yield && objectToSend[i].seasonalData.yield.exportTonnage && objectToSend[i].seasonalData && objectToSend[i].seasonalData.yield && (objectToSend[i].seasonalData.yield.exportTonnage + objectToSend[i].seasonalData.yield.localTonnage) > 0) {
                            tempObject.exportPercent = objectToSend[i].seasonalData.yield.exportTonnage / (objectToSend[i].seasonalData.yield.exportTonnage + objectToSend[i].seasonalData.yield.localTonnage);
                        } else {
                            tempObject.exportPercent = 0;
                        }
                        if (objectToSend[i].seasonalData && objectToSend[i].seasonalData.reports && objectToSend[i].seasonalData.reports.petioleReportUrl) {
                            tempObject.petioleReport = objectToSend[i].seasonalData.reports.petioleReportUrl;
                        } else {
                            tempObject.petioleReport = "";
                        }
                        if (objectToSend[i].seasonalData && objectToSend[i].seasonalData.reports && objectToSend[i].seasonalData.reports.soilReportUrl) {
                            tempObject.soilReport = objectToSend[i].seasonalData.reports.soilReportUrl;
                        } else {
                            tempObject.soilReport = "";
                        }
                        if (objectToSend[i].seasonalData && objectToSend[i].seasonalData.reports && objectToSend[i].seasonalData.reports.waterReportUrl) {
                            tempObject.waterReport = objectToSend[i].seasonalData.reports.waterReportUrl;
                        } else {
                            tempObject.waterReport = "";
                        }
                        if (objectToSend[i].seasonalData && objectToSend[i].seasonalData.qualityJotforms && objectToSend[i].seasonalData.qualityJotforms.preharvestQCLink) {
                            tempObject.preharvestQCLinks = objectToSend[i].seasonalData.qualityJotforms.preharvestQCLink;
                        } else {
                            tempObject.preharvestQCLinks = "";
                        }
                        if (objectToSend[i].seasonalData && objectToSend[i].seasonalData.qualityJotforms && objectToSend[i].seasonalData.qualityJotforms.primaryIssuesFacedAtHarvest) {
                            tempObject.primaryIssuesFacedAtHarvest = objectToSend[i].seasonalData.qualityJotforms.primaryIssuesFaced;
                        } else {
                            tempObject.primaryIssuesFacedAtHarvest = "";
                        }
                        if (objectToSend[i].seasonalData && objectToSend[i].seasonalData.qualityJotforms && objectToSend[i].seasonalData.qualityJotforms.inwardQClinks) {
                            tempObject.inwardQClinks = objectToSend[i].seasonalData.qualityJotforms.inwardQClink;
                        } else {
                            tempObject.inwardQClinks = "";
                        }
                        if (objectToSend[i].seasonalData && objectToSend[i].seasonalData.qualityJotforms && objectToSend[i].seasonalData.qualityJotforms.knittingQCLinks) {
                            tempObject.knittingQCLinks = objectToSend[i].seasonalData.qualityJotforms.knittingQCLinks.join(" , ");
                        } else {
                            tempObject.knittingQCLinks = "";
                        }
                        if (objectToSend[i].seasonalData && objectToSend[i].seasonalData.qualityJotforms && objectToSend[i].seasonalData.qualityJotforms.packingQCLinks) {
                            tempObject.packingQCLinks = objectToSend[i].seasonalData.qualityJotforms.packingQCLinks.join(" , ");
                        } else {
                            tempObject.packingQCLinks = "";
                        }
                        if (objectToSend[i].seasonalData && objectToSend[i].seasonalData.qualityJotforms && objectToSend[i].seasonalData.qualityJotforms.FGQCLinks) {
                            tempObject.FGQCLinks = objectToSend[i].seasonalData.qualityJotforms.FGQCLinks.join(" , ");
                        } else {
                            tempObject.FGQCLinks = "";
                        }
                        if (objectToSend[i].seasonalData && objectToSend[i].seasonalData.qualityJotforms && objectToSend[i].seasonalData.qualityJotforms.onArrivalQCLinks) {
                            tempObject.onArrivalQCLinks = objectToSend[i].seasonalData.qualityJotforms.onArrivalQCLinks.join(" , ");
                        } else {
                            tempObject.onArrivalQCLinks = "";
                        }
                        if (objectToSend[i].seasonalData && objectToSend[i].seasonalData.primaryQualityIssuesFaced && objectToSend[i].seasonalData.primaryQualityIssuesFaced.length > 0) {
                            tempObject.primaryQualityIssuesFaced = objectToSend[i].seasonalData.primaryQualityIssuesFaced.join(" , ");
                        } else {
                            tempObject.primaryQualityIssuesFaced = "";
                        }
                        if (objectToSend[i].seasonalData && objectToSend[i].seasonalData.MRLResults && objectToSend[i].seasonalData.MRLResults.maxIndividual) {
                            tempObject.MRLMaxIndividual = objectToSend[i].seasonalData.MRLResults.maxIndividual;
                        } else {
                            tempObject.MRLMaxIndividual = "";
                        }
                        if (objectToSend[i].seasonalData && objectToSend[i].seasonalData.MRLResults && objectToSend[i].seasonalData.MRLResults.sum) {
                            tempObject.MRLSum = objectToSend[i].seasonalData.MRLResults.sum;
                        } else {
                            tempObject.MRLSum = "";
                        }
                        if (objectToSend[i].seasonalData && objectToSend[i].seasonalData.MRLResults && objectToSend[i].seasonalData.MRLResults.numberOfDetection) {
                            tempObject.MRLNumberOfDetections = objectToSend[i].seasonalData.MRLResults.numberOfDetection;
                        } else {
                            tempObject.MRLNumberOfDetections = "";
                        }
                        if (objectToSend[i].seasonalData && objectToSend[i].seasonalData.MRLResults && objectToSend[i].seasonalData.MRLResults.redlistChemicals) {
                            tempObject.MRLRedlistChemicals = objectToSend[i].seasonalData.MRLResults.redlistChemicals;
                        } else {
                            tempObject.MRLRedlistChemicals = "";
                        }
                        if (objectToSend[i].seasonalData && objectToSend[i].seasonalData.MRLResults && objectToSend[i].seasonalData.MRLResults.MRLReportLink) {
                            tempObject.MRLReportLink = objectToSend[i].seasonalData.MRLResults.MRLReportLink;
                        } else {
                            tempObject.MRLReportLink = "";
                        }
                        if (objectToSend[i].seasonalData && objectToSend[i].seasonalData.quality) {
                            tempObject.quality = objectToSend[i].seasonalData.quality;
                        } else {
                            tempObject.quality = "";
                        }
                        csvData.push(tempObject);
                    }
                    //building csv data and parsing it in scv format.
                    const parser = new Parser({ fields });
                    const csv = parser.parse(csvData);
                    // creating a file name and a file path.
                    res.setHeader("Content-Type", "text/csv");
                    res.attachment("farmersDataExport.csv")
                    res.status(200).end(csv);
                })
                .catch((err) => {
                    //console.log(err);
                    res.status(400).send({ message: err.message });
                });
            // res.status(200).send(objectToSend);
        })
        .catch((err) => {
            //console.log("err", err);
            res.status(400).send({ message: err.message });
        });
})


//to get list of all plots of farmer.
function getPlotsForExport(result, i) {
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


//supportive functions
//to get list of all farmers if farmer is family head.
function getPlotsForHead(result, i) {
    const gcnKey = result[i].personalInformation.GGN;
    const resultLength = result.length;
    const resultantArray = [];
    for (let j = 0; j < resultLength; j++) {
        if (result[j].personalInformation.GGN === gcnKey) {
            const plots = getPlots(result, j);
            for (let k = 0; k < plots.length; k++)
                resultantArray.push(plots[k]);
        }
    }
    return resultantArray;
}

//to get plot information of any one farmer plots.
function getPlots(result, i) {
    const plotsArray = result[i].plots;
    const numberOfPlots = plotsArray.length;
    const resultantArray = [];
    for (let j = 0; j < numberOfPlots; j++) {
        //console.log(plotsArray[j]);
        resultantArray.push({
            plotId: plotsArray[j]._id,
            plot: plotsArray[j].farmInformation.plotNumber,
            farmerId: result[i]._id,
            farmerName: result[i].personalInformation.name,
            MHCode: plotsArray[j].farmInformation.MHCode,
        });
    }
    return resultantArray;
}