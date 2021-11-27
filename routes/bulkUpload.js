import express from 'express';
import csv from "csv-parser";
import fetch from 'node-fetch';
import { Readable } from "stream";
import axios from 'axios';

const router = express.Router();

router.post("/", (req, res) => {
    const readable = Readable.from(req.files.fileToUpload.data);
    const farmerId = req.body.farmerId;
    const plotNumber = req.body.plotNumber;

    //NOTE: after testing delete.
    const dataToSend = [];
    readable.pipe(csv())
        .on('data', (row) => {
            // console.log(row);
            const diary = {};
            diary.farmerId = farmerId;
            diary.plot = [plotNumber];
            diary.proposedDate = new Date();
            const arr1 = [];
            for (let i = 1; i <= 5; i++) {
                const spray = {};
                spray.category = row["sprayCategory" + i];
                if (!spray.category)
                    continue;
                spray.chemical = row["sprayChemical" + i];
                spray.quantity = row["sprayQuantity" + i];
                spray.imageUrl = row["sprayImageUrl" + i];
                arr1.push(spray);
            }
            diary.spraying = {
                details: arr1
            };
            const arr2 = [];
            for (let i = 1; i <= 5; i++) {
                const irrigation = {};
                irrigation.fertilizer = row["irrigationFertilizer" + i];
                if (!irrigation.fertilizer)
                    continue;
                irrigation.quantity = row["irrigationQuantity" + i];
                irrigation.imageUrl = row["irrigationImageUrl" + i];
                arr2.push(irrigation);
            }
            diary.irrigation = {
                numberOfHours: row["irrigationHours"],
                details: arr2,
            }
            const arr3 = [];
            for (let i = 1; i <= 5; i++) {
                const farmWork = {};
                farmWork.work = row["farmWork" + i];
                if (!farmWork.work)
                    continue;
                farmWork.comments = row["farmWorkComment" + i];
                farmWork.imageUrl = row["farmWorkImageUrl" + i];
                arr3.push(farmWork);
            }
            diary.farmWork = {
                details: arr3
            };
            const arr4 = [];
            for (let i = 1; i <= 5; i++) {
                const soilWork = {};
                soilWork.work = row["soilWork" + i];
                if (!soilWork.work)
                    continue;
                soilWork.area = row["soilWorkArea" + i];
                soilWork.imageUrl = row["soilWorkImageUrl" + i];
                arr4.push(soilWork);
            }
            diary.soilWork = {
                details: arr4
            };
            const arr5 = [];
            for (let i = 1; i <= 5; i++) {
                const maintenanceWork = {};
                maintenanceWork.item = row["maintenanceWorkItem" + i];
                if (!maintenanceWork.item)
                    continue;
                maintenanceWork.comments = row["maintenanceWorkComment" + i];
                maintenanceWork.imageUrl = row["maintenanceWorkImageUrl" + i];
                arr5.push(maintenanceWork);
            }
            diary.maintenanceWork = {
                details: arr5
            };
            diary.notes = row["notes"];

            const bodyObject = {
                'data': diary,
            }
            dataToSend.push(diary);
            console.log(diary);
            // fetch('https://secure-bastion-17136.herokuapp.com/dailyDiary', {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'apiid': "fresh_express_api"
            //     },
            //     body: JSON.stringify(bodyObject)
            // })
            //     .then(responce => {
            //         console.log(responce);
            //         console.log(responce.status);
            //         return responce.json();
            //     })
            //     .then((data) => {
            //         console.log(data);
            //         // res.send(data);
            //     }).catch((err) => {
            //         console.log("error in catch");
            //         console.error(err);
            //     });
        })
        .on('end', () => {
            res.send(dataToSend);
        });
});

export default router;