import { google } from "googleapis";
import path from "path";
import express from "express";
import fileUpload from "express-fileupload";
import cors from 'cors';
const app = express();
import fetch from 'node-fetch';

import dotenv from "dotenv";
dotenv.config();

//to allow get from anywhere.
const corsOptions = {
    origin: '*',
    credentials: true,            //access-control-allow-credentials:true
    optionSuccessStatus: 200
}
app.use(cors(corsOptions));



app.use(fileUpload());
app.use(express.json());

// app.use((req, res) => {
//     res.header('Access-Control-Allow-Origin', '*');
// });

const clientID = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRETE;
const redirectUri = process.env.REDIRECT_URI;
const refreshToken = process.env.REFRESH_TOKEN;

const oauth2Client = new google.auth.OAuth2(
    clientID,
    clientSecret,
    redirectUri
);
oauth2Client.setCredentials({ refresh_token: refreshToken });

const drive = google.drive({
    version: 'v3',
    auth: oauth2Client,
});
async function deleteFile(fileId) {
    drive.files.delete({
        'fileId': fileId
    })
        .then((res) => {
            console.log(res);
        }).catch((err) => {
            console.log(err);
        })
}

async function uploadFile(fileName, mimeType, data) {
    try {
        // console.log(fileName);
        // console.log(typeof data);
        const responce = await drive.files.create({
            name: fileName,
            media: {
                mimeType: mimeType,
                body: data,
            },
        });//firstly to upload file.
        await drive.files.update({
            fileId: responce.data.id,
            resource: { name: fileName }
        });//to rename file to required name.
        return await generatePublicUrl(responce.data.id);
    } catch (err) {
        console.log(err.message);
    }
}

async function generatePublicUrl(id) {
    try {
        await drive.permissions.create({//to change permissions
            fileId: id,
            requestBody: {
                role: "reader",
                type: "anyone",
            }
        });
        const result = await drive.files.get({//to get public urls
            fileId: id,
            fields: "webViewLink, webContentLink, id",
        });
        // console.log(result.data);
        return result.data;
    } catch (err) {
        console.log(err);
    }
}

app.get("/", (req, res) => {
    res.sendFile(path.resolve() + "/index.html");
})
app.post("/uploadFile", async (req, res) => {
    if (req.files) {
        // console.log(req.files);

        //function to asyncly upload file to drive
        const result = await uploadFile(req.files.image.name, req.files.image.mimetype, req.files.image.data);
        res.status(200).json({
            link: result.webViewLink,
            id: result.id
        });
    } else {
        console.log("No file uploaded");
    }
});

app.delete("/uploadFile", (req, res) => {
    console.log(req.body);
    deleteFile(req.body.id);
    res.status(200).send({ data: "deleted" });
});


app.post("/dailyDiary", async (req, res) => {
    console.log(req.body.data);
    const data = req.body.data;
    const objectToPush = generateObjectFromData(data);
    if (data.Plot.PlotID !== 'ALL') {
        objectToPush.farmerId = data.Farmer.FarmerID;
        objectToPush.plot = data.Plot.PlotID;
        await fetch("https://secure-bastion-17136.herokuapp.com/farmers/" + objectToPush.farmerId + "?personalInformation.GCN=1", {
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
                objectToPush.GCN = result.personalInformation.GCN;
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
                    const gcnKey = result.personalInformation.GCN;
                    fetch("https://secure-bastion-17136.herokuapp.com/farmers/GCN/" + gcnKey + "?_id=1&plots.farmInformation=1", {
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
                                objectToPush.GCN = gcnKey;
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
                    objectToPush.GCN = result.personalInformation.GCN;
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

app.get("/farmers", (req, res) => {
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



const port = 3000;

app.listen(3000, () => {
    console.log("Server started on port ", port);
});


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
    const maintainanceworkData = data.Maintenance;
    if (maintainanceworkData) {
        const arr = [];
        for (let i = 1; i <= 5; i++) {
            const workDetails = {};
            if (!maintainanceworkData["row" + i].MaintenanceWork)
                continue;
            workDetails.item = maintainanceworkData["row" + i].MaintenanceWork;
            workDetails.comments = maintainanceworkData["row" + i].Details;
            workDetails.imageUrl = maintainanceworkData["row" + i].ImageLink;
            arr.push(workDetails);
        }
        objectToPush.maintainanceWork = {
            details: arr,
        }
    }
    const notes = data.Notes;
    if (notes) {
        objectToPush.notes = notes.Notes;
    }
    return objectToPush;
}