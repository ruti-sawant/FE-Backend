import express from 'express';
import fetch from 'node-fetch';
const router = express.Router();

router.get("/", (req, res) => {
    fetch('https://secure-bastion-17136.herokuapp.com/farmers', {
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


export default router;


//supportive functions
function getPlotsForHead(result, i) {
    const gcnKey = result[i].personalInformation.GCN;
    const resultLength = result.length;
    const resultantArray = [];
    for (let j = 0; j < resultLength; j++) {
        if (result[j].personalInformation.GCN === gcnKey) {
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
            farmerName: result[i].personalInformation.name
        });
    }
    return resultantArray;
}