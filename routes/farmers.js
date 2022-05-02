import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import fetch from 'node-fetch';
import axios from 'axios';
const router = express.Router();

// /farmers/plots
router.get("/plots", (req, res) => {
    fetch(process.env.API_URL + "/farmers?personalInformation=1&plots.farmInformation=1", {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((result) => {
            console.log("status", result.status);
            if (result.status == 200)
                return result.json();
            else
                return [];
        })
        .then((result) => {
            // console.log("res", result);
            let resultLength = result.length;
            let objectToSend = [];
            for (let i = 0; i < resultLength; i++) {
                const farmerObject = {};
                farmerObject.farmerID = result[i]._id;
                farmerObject.farmerName = result[i].personalInformation.name;
                if (result[i].personalInformation.name.trim() === result[i].personalInformation.familyName.trim()) {
                    farmerObject.plot = getPlotsForHead(result, i);
                } else {
                    farmerObject.plot = getPlots(result, i);
                }
                // console.log(farmerObject.farmerName, farmerObject.plot);
                objectToSend.push(farmerObject);
            }
            // console.log(objectToSend);
            res.status(200).send(objectToSend);
        })
        .catch((err) => {
            console.log("err", err);
        });
});

router.get("/", (req, res) => {
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
                    const farmerDataReceived = data.data;
                    const seasonalDataReceived = seasonalData.data;
                    const farmerMapping = new Map();
                    for (let i = 0; i < farmerDataReceived.length; i++) {
                        for (let j = 0; j < farmerDataReceived[i].plots.length; j++) {
                            farmerMapping.set(farmerDataReceived[i].plots[j].farmInformation.MHCode, { i, j });
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
                        // console.log(key, seasonalDataMapping.get(key));
                        if (farmerMapping.get(key))
                            farmerDataReceived[farmerMapping.get(key).i].plots[farmerMapping.get(key).j].farmInformation.fruitPruning = seasonalDataMapping.get(key);

                    }
                    res.status(200).send(farmerDataReceived);
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

// /farmers/data/{farmerId}
router.get("/data/:farmerId", (req, res) => {
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


router.get("/MHCode/:MHCode", (req, res) => {
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

router.post("/", async (req, res) => {
    const data = req.body;
    console.log("post farmer body", data);
    try {
        if (data.personalInformation.familyName.trim() === "") {
            await axios.get(process.env.API_URL + "/farmers/GGN/" + data.personalInformation.GGN, {
                headers: {
                    'Content-Type': 'application/json',
                    'apiid': process.env.API_KEY
                }
            })
                .then((resData) => {
                    if (resData.data && resData.data[0]) {
                        console.log("data from api for GGN", resData.data);
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
                console.log(err);
                res.status(400).send({ message: err.message });
            });
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

router.post("/plots/addPlot/:farmerId", (req, res) => {
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
            console.log("data in post of farmer plot insert", data);
            res.status(200).send({ message: "Farmer plot inserted successfully" });
        })
        .catch((err) => {
            console.log(err);

            res.status(400).send({ message: err.message });
        });
});

router.post("/edit/:farmerId", (req, res) => {
    const farmerId = req.params.farmerId;
    const data = req.body;
    console.log("patch body", req.body);
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

router.post("/plots/edit/:plotId", (req, res) => {
    const plotId = req.params.plotId;
    const data = req.body;
    console.log("plots patch body", data);
    axios.patch(process.env.API_URL + "/farmers/plots/" + plotId, {
        data
    }, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            console.log("plots patch then", data);
            res.status(200).send({ message: "Farmer updated successfully" });
        })
        .catch((err) => {
            console.log("plots patch err", err);
            res.status(400).send({ message: err.message });
        });
});


router.post("/delete/:farmerId", (req, res) => {
    const farmerId = req.params.farmerId;
    axios.delete(process.env.API_URL + "/farmers/" + farmerId, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            console.log("data", data);
            res.status(200).send({ message: "Farmer " + farmerId + " deleted successfully" });
        })
        .catch((err) => {
            console.log("err", err);
            res.status(400).send({ message: err.message });
        });
});

router.post("/delete/plot/:plotId", (req, res) => {
    const plotId = req.params.plotId;
    axios.patch(process.env.API_URL + "/farmers/deletePlot/" + plotId, {
    }, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            console.log("data", data);
            res.status(200).send({ message: "Farmer plot " + plotId + " deleted successfully" });
        })
        .catch((err) => {
            console.log("err", err);
            res.status(400).send({ message: err.response.data.message });
        });
});

export default router;


//supportive functions
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

function getPlots(result, i) {
    const plotsArray = result[i].plots;
    const numberOfPlots = plotsArray.length;
    const resultantArray = [];
    for (let j = 0; j < numberOfPlots; j++) {
        resultantArray.push({
            plot: plotsArray[j].farmInformation.plotNumber,
            farmerId: result[i]._id,
            farmerName: result[i].personalInformation.name,
            MHCode: plotsArray[j].farmInformation.MHCode,
        });
    }
    return resultantArray;
}