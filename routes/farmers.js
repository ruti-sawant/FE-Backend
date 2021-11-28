import express from 'express';
import fetch from 'node-fetch';
import axios from 'axios';
const router = express.Router();

// /farmers/plots
router.get("/plots", (req, res) => {
    fetch('https://secure-bastion-17136.herokuapp.com/farmers?personalInformation=1&plots.farmInformation=1', {
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
    axios.get("https://secure-bastion-17136.herokuapp.com/farmers", {
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

// /farmers/data/{farmerId}
router.get("/data/:farmerId", (req, res) => {
    const farmerId = req.params.farmerId;
    axios.get("https://secure-bastion-17136.herokuapp.com/farmers/" + farmerId, {
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
    axios.get("https://secure-bastion-17136.herokuapp.com/farmers/MHCode/" + MHCode, {
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


router.post("/edit/:farmerId", (req, res) => {
    const farmerId = req.params.farmerId;
    const data = req.body;
    console.log("patch body", req.body);
    axios.patch("https://secure-bastion-17136.herokuapp.com/farmers/" + farmerId, {
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
    axios.patch("https://secure-bastion-17136.herokuapp.com/farmers/plots/" + plotId, {
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