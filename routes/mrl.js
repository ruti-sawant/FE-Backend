import express from "express";
import dotenv from 'dotenv';
dotenv.config();
import axios from "axios";
import csv from "csv-parser";
import { Readable } from "stream";
const router = express.Router();


router.get("", (req, res) => {
    axios.get(process.env.API_URL + "/mrlReports", {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            console.log(data.data);
            res.status(200).send(data.data);
        })
        .catch((err) => {
            console.log(err);
            res.status(400).send({ message: err.message });
        });
});

router.get("/data/:mrlId", (req, res) => {
    const mrlId = req.params.mrlId;
    axios.get(process.env.API_URL + "/mrlReports/data/" + mrlId, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            console.log(data.data);
            res.status(200).send(data.data);
        })
        .catch((err) => {
            console.log(err);
            res.status(400).send({ message: err.message });
        });
});

router.get("/MHCode/:MHCode", (req, res) => {
    const MHCode = req.params.MHCode;
    axios.get(process.env.API_URL + "/mrlReports/MHCode/" + MHCode, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            console.log(data.data);
            res.status(200).send(data.data);
        })
        .catch((err) => {
            console.log(err);
            res.status(400).send({ message: err.message });
        });
});

router.get("/sampleNumber/:sampleNumber", (req, res) => {
    const sampleNumber = req.params.sampleNumber;
    axios.get(process.env.API_URL + "/mrlReports/sampleNumber/" + sampleNumber, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            console.log(data.data);
            res.status(200).send(data.data);
        })
        .catch((err) => {
            console.log(err);
            res.status(400).send({ message: err.message });
        });
});


router.post("/", (req, res) => {
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
            console.log(data.data);
            res.status(200).send(data.data);
        })
        .catch((err) => {
            console.log(err);
            res.status(400).send({ message: err.message });
        });
});

router.post("/delete/:mrlId", (req, res) => {
    const mrlId = req.params.mrlId;
    axios.delete(process.env.API_URL + "/mrlReports/" + mrlId, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            console.log(data.data);
            res.status(200).send(data.data);
        })
        .catch((err) => {
            console.log(err);
            res.status(400).send({ message: err.message });
        });
});

router.post("/delete/MHCode/:MHCode/:year?", (req, res) => {
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
            console.log(data.data);
            res.status(200).send(data.data);
        })
        .catch((err) => {
            console.log(err);
            res.status(400).send({ message: err.message });
        });
});

//handling approved chemicals.
router.get("/approvedChemicals", (req, res) => {
    axios.get(process.env.API_URL + "/mrlReports/approvedChemicals", {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            console.log(data.data);
            res.status(200).send(data.data);
        })
        .catch((err) => {
            console.log(err);
            res.status(400).send({ message: err.message });
        });
});

router.post("/uploadApprovedChemicals", (req, res) => {
    if (req.files) {
        const readable = Readable.from(req.files.approvedChemicals.data);
        const dataToSend = [];
        try {
            readable.pipe(csv())
                .on('data', (row) => {
                    const chemical = {
                        srNo: row["srNo"],
                        chemicalName: row["chemicalName"],
                        EULimit: row["EULimit"].match("[0-9]*\.?[0-9]*")[0],
                    }
                    // const number = row["EULimit"].match("[0-9]*\.?[0-9]*")[0];
                    dataToSend.push(chemical);
                })
                .on('end', () => {
                    axios.post(process.env.API_URL + "/mrlReports/approvedChemicals", {
                        data: dataToSend
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'apiid': process.env.API_KEY
                        }
                    })
                        .then((data) => {
                            console.log(data.data);
                            res.status(200).send(data.data);
                        })
                        .catch((err) => {
                            console.log(err);
                            res.status(400).send({ message: err.message });
                        });
                })
        } catch (err) {
            console.log(err);
            res.status(400).send({ message: err.message });
        }
    } else {
        console.log("No file uploaded");
        res.status(400).send({ message: "File not uploaded" });
    }
});



//handling banned chemicals.
router.get("/bannedChemicals", (req, res) => {
    axios.get(process.env.API_URL + "/mrlReports/bannedChemicals", {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            console.log(data.data);
            res.status(200).send(data.data);
        })
        .catch((err) => {
            console.log(err);
            res.status(400).send({ message: err.message });
        });
});

router.post("/uploadBannedChemicals", (req, res) => {
    if (req.files) {
        const readable = Readable.from(req.files.bannedChemicals.data);
        const dataToSend = [];
        try {
            readable.pipe(csv())
                .on('data', (row) => {
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

                    // if (fairTrade_PPO && fairTrade_PPO.length > 0)
                    chemical.fairTrade_PPO = fairTrade_PPO
                    // if (EUG_Germany && EUG_Germany.length > 0)
                    chemical.EUG_Germany = EUG_Germany
                    // if (MMUK_MS && MMUK_MS.length > 0)
                    chemical.MMUK_MS = MMUK_MS
                    // if (MMUK_COOP_UK && MMUK_COOP_UK.length > 0)
                    chemical.MMUK_COOP_UK = MMUK_COOP_UK
                    // if (global2000 && global2000.length > 0)
                    chemical.global2000 = global2000
                    // if (EUMRL && EUMRL.length > 0)
                    chemical.EUMRL = EUMRL
                    dataToSend.push(chemical);
                })
                .on('end', () => {
                    axios.post(process.env.API_URL + "/mrlReports/bannedChemicals", {
                        data: dataToSend
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'apiid': process.env.API_KEY
                        }
                    })
                        .then((data) => {
                            console.log(data.data);
                            res.status(200).send(data.data);
                        })
                        .catch((err) => {
                            console.log(err);
                            res.status(400).send({ message: err.message });
                        });
                })
        } catch (err) {
            console.log(err);
            res.status(400).send({ message: err.message });
        }
    } else {
        console.log("No file uploaded");
        res.status(400).send({ message: "File not uploaded" });
    }
});


export default router;