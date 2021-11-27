import express from 'express';
import fetch from 'node-fetch';
const router = express.Router();


router.post("/", async (req, res) => {
    console.log(req.body.data);
    const data = req.body.data;
    const objectToPush = generateObjectFromData(data);
    if (data.Plot.PlotID !== 'ALL') {
        objectToPush.farmerId = data.Farmer.FarmerID;
        objectToPush.plot = data.Plot.PlotID;
        objectToPush.MHCode = "123";
        await fetch("https://secure-bastion-17136.herokuapp.com/farmers/" + objectToPush.farmerId + "?personalInformation.GGN=1", {
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
                objectToPush.GGN = result.personalInformation.GGN;
            })
            .catch((err) => {
                res.status(400).send(err.message);
            });
        console.log("object", objectToPush);
        fetch('https://secure-bastion-17136.herokuapp.com/dailyDiary', {
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
                console.log("res", result);
                res.status(200).send(result);
            })
            .catch((err) => {
                console.log("err", err);
                res.status(400).send(err.message);
            });
    } else {
        const farmerID = data.Farmer.FarmerID;
        await fetch("https://secure-bastion-17136.herokuapp.com/farmers/" + farmerID + "?personalInformation=1&plots.farmInformation=1", {
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
                if (result.personalInformation.name.trim() === result.personalInformation.familyName.trim()) {
                    const gcnKey = result.personalInformation.GGN;
                    fetch("https://secure-bastion-17136.herokuapp.com/farmers/GGN/" + gcnKey + "?_id=1&plots.farmInformation=1", {
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
                                for (let j = 0; j < result[i].plots.length; j++) {
                                    objectToPush.plot = result[i].plots[j].farmInformation.plotNumber;
                                    fetch('https://secure-bastion-17136.herokuapp.com/dailyDiary', {
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
                                            console.log("err", err);
                                            if (i == result.length - 1)
                                                res.status(400).send(err.message);
                                        });
                                }
                            }
                        })
                        .catch((err) => {
                            res.status(400).send(err.message);
                        });
                } else {
                    objectToPush.farmerId = result._id;
                    objectToPush.GGN = result.personalInformation.GGN;
                    const plots = result.plots;
                    const objectArrayToPush = [];
                    for (let i = 0; i < plots.length; i++) {
                        objectToPush.plot = plots[i].farmInformation.plotNumber;
                        // const tempObjectToPush = objectToPush;
                        // tempObjectToPush.plot = plots[i].farmInformation.plotNumber;
                        // objectArrayToPush.push(tempObjectToPush);
                        // console.log(i + " loop", objectArrayToPush);
                        fetch('https://secure-bastion-17136.herokuapp.com/dailyDiary', {
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
                                    console.log(result.text().then(r => console.log(r)));
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
                    // console.log("Topush", objectArrayToPush);

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
    const sprayingData = data.Spraying;
    if (sprayingData) {
        const arr = [];
        for (let i = 1; i <= 5; i++) {
            // console.log(sprayingData["row" + i]);
            const sprayDetail = {};
            if (!(sprayingData["row" + i].SprayingType))
                continue;
            sprayDetail.category = sprayingData["row" + i].SprayingType;
            sprayDetail.chemical = sprayingData["row" + i].Chemical;
            sprayDetail.quantity = sprayingData["row" + i].Quantity;
            sprayDetail.imageUrl = sprayingData["row" + i].ImageLink;
            arr.push(sprayDetail);
        }
        objectToPush.spraying = {
            details: arr
        }
    }
    const fertilizerData = data.Fertilizer;
    if (fertilizerData) {
        const arr = [];
        for (let i = 1; i <= 5; i++) {
            const fertilizerDetail = {};
            if (!(fertilizerData["row" + i].FertilizerWork))
                continue;
            fertilizerDetail.fertilizer = fertilizerData["row" + i].FertilizerWork;
            fertilizerDetail.quantity = fertilizerData["row" + i].Details;
            fertilizerDetail.imageUrl = fertilizerData["row" + i].ImageLink;
            arr.push(fertilizerDetail);
        }
        objectToPush.irrigation = {
            numberOfHours: fertilizerData.IrrigationTime,
            details: arr,
        }
    }
    const farmworkData = data.FarmWork;
    if (farmworkData) {
        const arr = [];
        for (let i = 1; i <= 5; i++) {
            const workDetails = {};
            if (!farmworkData["row" + i].FarmWork)
                continue;
            workDetails.work = farmworkData["row" + i].FarmWork;
            workDetails.comments = farmworkData["row" + i].Details;
            workDetails.imageUrl = farmworkData["row" + i].ImageLink;
            arr.push(workDetails);
        }
        objectToPush.farmWork = {
            details: arr,
        }
    }
    const soilworkData = data.SoilWork;
    if (soilworkData) {
        const arr = [];
        for (let i = 1; i <= 5; i++) {
            const workDetails = {};
            if (!soilworkData["row" + i].soilWork)
                continue;
            workDetails.work = soilworkData["row" + i].soilWork;
            workDetails.area = soilworkData["row" + i].Details;
            workDetails.imageUrl = soilworkData["row" + i].ImageLink;
            arr.push(workDetails);
        }
        objectToPush.soilWork = {
            details: arr,
        }
    }
    const maintenanceworkData = data.Maintenance;
    if (maintenanceworkData) {
        const arr = [];
        for (let i = 1; i <= 5; i++) {
            const workDetails = {};
            if (!maintenanceworkData["row" + i].MaintenanceWork)
                continue;
            workDetails.item = maintenanceworkData["row" + i].MaintenanceWork;
            workDetails.comments = maintenanceworkData["row" + i].Details;
            workDetails.imageUrl = maintenanceworkData["row" + i].ImageLink;
            arr.push(workDetails);
        }
        objectToPush.maintenanceWork = {
            details: arr,
        }
    }
    const notes = data.Notes;
    if (notes) {
        objectToPush.notes = notes.Notes;
    }
    return objectToPush;
}