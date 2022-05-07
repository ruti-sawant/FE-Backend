import express from "express";
import dotenv from 'dotenv';
dotenv.config();
import axios from "axios";
import csv from "csv-parser";
import { Readable } from "stream";
const router = express.Router();


import middleware from '../middleware.js';

//to get all mrlReports.
router.get("", middleware, (req, res) => {
    axios.get(process.env.API_URL + "/mrlReports", {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            //console.log(data.data);
            res.status(200).send(data.data);
        })
        .catch((err) => {
            //console.log(err);
            res.status(400).send({ message: err.message });
        });
});

//to get mrlReport by id.
router.get("/data/:mrlId", middleware, (req, res) => {
    const mrlId = req.params.mrlId;
    axios.get(process.env.API_URL + "/mrlReports/data/" + mrlId, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            //console.log(data.data);
            res.status(200).send(data.data);
        })
        .catch((err) => {
            //console.log(err);
            res.status(400).send({ message: err.message });
        });
});


//to get mrlReports by MHCode.
router.get("/MHCode/:MHCode", middleware, (req, res) => {
    const MHCode = req.params.MHCode;
    axios.get(process.env.API_URL + "/mrlReports/MHCode/" + MHCode, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            //console.log(data.data);
            res.status(200).send(data.data);
        })
        .catch((err) => {
            //console.log(err);
            res.status(400).send({ message: err.message });
        });
});

//to get mrlReport by sampleNumber
router.get("/sampleNumber/:sampleNumber", middleware, (req, res) => {
    const sampleNumber = req.params.sampleNumber;
    axios.get(process.env.API_URL + "/mrlReports/sampleNumber/" + sampleNumber, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            //console.log(data.data);
            res.status(200).send(data.data);
        })
        .catch((err) => {
            //console.log(err);
            res.status(400).send({ message: err.message });
        });
});

//to add new mrl report.
router.post("/", middleware, (req, res) => {
    const data = req.body;
    axios.post(process.env.API_URL + "/mrlReports", {
        data
    }, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            //console.log(data.data);
            res.status(200).send(data.data);
        })
        .catch((err) => {
            //console.log(err);
            res.status(400).send({ message: err.message });
        });
});



router.post("/uploadCSV", middleware, (req, res) => {
    if (req.files) {
        const readable = Readable.from(req.files.allMRLReports.data);
        const dataToSend = [];
        const tempData = [];
        try {
            readable
                .pipe(csv())
                .on("data", (row) => {
                    tempData.push(row);
                })
                .on("end", () => {
                    //sort data by firstly sampleNumber if equal then by year 
                    tempData.sort((a, b) =>
                        a.sampleNumber > b.sampleNumber
                            ? 1
                            : a.sampleNumber === b.sampleNumber
                                ? a.year > b.year
                                    ? 1
                                    : -1
                                : -1
                    );

                    for (let i = 0; i < tempData.length; i++) {
                        let flg = 0;
                        for (let j = 0; j < dataToSend.length; j++) {
                            // Pushing new Chemical in existing Item if sampleNumber and year is same.
                            if (
                                tempData[i].sampleNumber === dataToSend[j].sampleNumber &&
                                tempData[i].year === dataToSend[j].year
                            ) {
                                flg = 1;
                                let newChemical = {
                                    srNo: tempData[i].srNo,
                                    detectedPesticide: tempData[i].detectedPesticide,
                                    result: tempData[i].result,
                                    EUMRL: tempData[i].EUMRL,
                                    LOQ: tempData[i].LOQ,
                                    ArFD: tempData[i].ArFD,
                                    intake: tempData[i].intake,
                                    ArFDPercent: tempData[i].ArFDPercent,
                                    remark: tempData[i].remark,
                                };
                                dataToSend[j].chemicals.push(newChemical);
                            }
                        }
                        // if chemical is not added to any list then add it to new list.
                        if (flg === 0) {
                            //creating new data object.
                            //Pushing new Item
                            let newChemical = {
                                srNo: tempData[i].srNo,
                                detectedPesticide: tempData[i].detectedPesticide,
                                result: tempData[i].result,
                                EUMRL: tempData[i].EUMRL,
                                LOQ: tempData[i].LOQ,
                                ArFD: tempData[i].ArFD,
                                intake: tempData[i].intake,
                                ArFDPercent: tempData[i].ArFDPercent,
                                remark: tempData[i].remark,
                            };
                            let splittedDate = tempData[i].dateOfSampling.split("/");
                            if (splittedDate.length != 3)
                                splittedDate = tempData[i].dateOfSampling.split("-");
                            // console.log(splittedDate);
                            if (splittedDate.length != 3 || splittedDate[0].length != 2 || splittedDate[1].length != 2 || splittedDate[2].length != 4) {
                                res.status(400).send({ message: "Date is not in correct format." });
                                return;
                            }
                            const dateObj = new Date(new Date(splittedDate[1] + "-" + splittedDate[0] + "-" + splittedDate[2]) - new Date().getTimezoneOffset() * 60000);
                            // console.log(dateObj);
                            let newItem = {
                                year: tempData[i].year,
                                sealNumber: tempData[i].sealNumber,
                                sampleNumber: tempData[i].sampleNumber,
                                labName: tempData[i].labName,
                                farmerName: tempData[i].farmerName,
                                dateOfSampling: dateObj,
                                address: tempData[i].address,
                                MHCode: tempData[i].MHCode,
                                variety: tempData[i].variety,
                                quantityMT: tempData[i].quantityMT_4B,
                                brix: tempData[i].brix,
                                fePoRef: tempData[i].fePoRef,
                                samplerName: tempData[i].samplerName,
                                chemicals: [],
                            };
                            newItem.chemicals.push(newChemical);
                            dataToSend.push(newItem);
                        }
                    }
                    //method to post data to API server.
                    axios.post(process.env.API_URL + "/mrlReports/postAll", {
                        data: dataToSend
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'apiid': process.env.API_KEY
                        }
                    })
                        .then((data) => {
                            //console.log(data.data);
                            res.status(200).send(data.data);
                        })
                        .catch((err) => {
                            //console.log(err);
                            if (err.response && err.response.data && err.response.data.message) {
                                res.status(400).send({ message: err.response.data.message });
                            } else {
                                res.status(400).send({ message: err.message });
                            }
                        });

                });
        } catch (err) {
            //console.log(err);
            res.status(400).send({ message: err.message });
        }
    } else {
        //console.log("No file uploaded");
        res.status(400).send({ message: "File not uploaded" });
    }
});

//to delete mrlReport by its id.
router.post("/delete/:mrlId", middleware, (req, res) => {
    const mrlId = req.params.mrlId;
    axios.delete(process.env.API_URL + "/mrlReports/" + mrlId, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            //console.log(data.data);
            res.status(200).send(data.data);
        })
        .catch((err) => {
            //console.log(err);
            res.status(400).send({ message: err.message });
        });
});


// to delete mrlReports by MHCode and year
router.post("/delete/MHCode/:MHCode/:year?", middleware, (req, res) => {
    const MHCode = req.params.MHCode;
    const year = req.params.year;
    let url = "";
    if (year) {
        url = process.env.API_URL + "/mrlReports/MHCode/" + MHCode + "/" + year;
    } else {
        url = process.env.API_URL + "/mrlReports/MHCode/" + MHCode;
    }
    axios.delete(url, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            //console.log(data.data);
            res.status(200).send(data.data);
        })
        .catch((err) => {
            //console.log(err);
            res.status(400).send({ message: err.message });
        });
});

//handling approved chemicals.
router.get("/approvedChemicals", middleware, (req, res) => {
    axios.get(process.env.API_URL + "/mrlReports/approvedChemicals", {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            //console.log(data.data);
            res.status(200).send(data.data);
        })
        .catch((err) => {
            //console.log(err);
            res.status(400).send({ message: err.message });
        });
});

//upload approved chemicals from csv.
router.post("/uploadApprovedChemicals", middleware, (req, res) => {
    if (req.files) {
        const readable = Readable.from(req.files.approvedChemicals.data);
        const dataToSend = [];
        try {
            readable.pipe(csv())
                .on('data', (row) => {
                    // extract data from csv
                    const chemical = {
                        srNo: row["srNo"],
                        chemicalName: row["chemicalName"],
                        EULimit: row["EULimit"].match("[0-9]*\.?[0-9]*")[0],
                    }
                    // const number = row["EULimit"].match("[0-9]*\.?[0-9]*")[0];
                    dataToSend.push(chemical);
                })
                .on('end', () => {
                    //push data to database api.
                    axios.post(process.env.API_URL + "/mrlReports/approvedChemicals", {
                        data: dataToSend
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'apiid': process.env.API_KEY
                        }
                    })
                        .then((data) => {
                            //console.log(data.data);
                            res.status(200).send(data.data);
                        })
                        .catch((err) => {
                            //console.log(err);
                            res.status(400).send({ message: err.message });
                        });
                })
        } catch (err) {
            //console.log(err);
            res.status(400).send({ message: err.message });
        }
    } else {
        //console.log("No file uploaded");
        res.status(400).send({ message: "File not uploaded" });
    }
});



//to get banned chemicals.
router.get("/bannedChemicals", middleware, (req, res) => {
    axios.get(process.env.API_URL + "/mrlReports/bannedChemicals", {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            //console.log(data.data);
            res.status(200).send(data.data);
        })
        .catch((err) => {
            //console.log(err);
            res.status(400).send({ message: err.message });
        });
});

//upload banned chemicals from csv.
router.post("/uploadBannedChemicals", middleware, (req, res) => {
    if (req.files) {
        const readable = Readable.from(req.files.bannedChemicals.data);
        const dataToSend = [];
        try {
            readable.pipe(csv())
                .on('data', (row) => {
                    //get data from csv.
                    const chemical = {
                        srNo: row["srNo"],
                        chemicalName: row["chemicalName"],
                    }
                    //extracting severity from column
                    const fairTrade_PPO = row["fairTrade_PPO"].toUpperCase().match("(RED)?(YELLOW)?(ORANGE)?")[0];
                    const EUG_Germany = row["EUG_Germany"].toUpperCase().match("(RED)?(YELLOW)?(ORANGE)?")[0];
                    const MMUK_MS = row["MMUK_MS"].toUpperCase().match("(RED)?(YELLOW)?(ORANGE)?")[0];
                    const MMUK_COOP_UK = row["MMUK_COOP_UK"].toUpperCase().match("(RED)?(YELLOW)?(ORANGE)?")[0];
                    const global2000 = row["global2000"].toUpperCase().match("(RED)?(YELLOW)?(ORANGE)?")[0];
                    const EUMRL = row["EUMRL"].toUpperCase().match("(RED)?(YELLOW)?(ORANGE)?")[0];

                    chemical.fairTrade_PPO = fairTrade_PPO
                    chemical.EUG_Germany = EUG_Germany
                    chemical.MMUK_MS = MMUK_MS
                    chemical.MMUK_COOP_UK = MMUK_COOP_UK
                    chemical.global2000 = global2000
                    chemical.EUMRL = EUMRL
                    dataToSend.push(chemical);
                })
                .on('end', () => {
                    //push data to database api.
                    axios.post(process.env.API_URL + "/mrlReports/bannedChemicals", {
                        data: dataToSend
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'apiid': process.env.API_KEY
                        }
                    })
                        .then((data) => {
                            //console.log(data.data);
                            res.status(200).send(data.data);
                        })
                        .catch((err) => {
                            //console.log(err);
                            res.status(400).send({ message: err.message });
                        });
                })
        } catch (err) {
            //console.log(err);
            res.status(400).send({ message: err.message });
        }
    } else {
        //console.log("No file uploaded");
        res.status(400).send({ message: "File not uploaded" });
    }
});


export default router;