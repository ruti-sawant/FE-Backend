import dotenv from "dotenv";
dotenv.config();
import express from 'express';
import { google } from "googleapis";
import middleware from "../middleware.js";
const router = express.Router();


//to initialize google drive api.
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

//to upload file in daily diary.
//according to old method of usage according to old code and files are getting saved in "broadcast Daily Diary images" folder.
router.post("/", middleware, async (req, res) => {
    if (req.files) {
        //function to asyncly upload file to drive
        const result = await uploadFile(req.files.image.name, req.files.image.mimetype, req.files.image.data, "OLD_FOLDER");
        res.status(200).json({
            link: result.webViewLink,
            id: result.id
        });
    } else {
        //console.log("No file uploaded");
        res.status(400).send({ message: "No file uploaded" });
    }
});

//to upload file in specific folder.
router.post("/:folderName", middleware, async (req, res) => {
    if (req.files) {
        //function to asyncly upload file to drive
        const result = await uploadFile(req.files.image.name, req.files.image.mimetype, req.files.image.data, req.params.folderName);
        res.status(200).json({
            link: result.webViewLink,
            id: result.id
        });
    } else {
        //console.log("No file uploaded");
        res.status(400).send({ message: "No file uploaded" });
    }
});

//to delete file from drive.
router.delete("/", middleware, async (req, res) => {
    //console.log(req.body);
    //console.log(req.body.id);
    await deleteFile(req.body.id);
    res.status(200).send({ data: "deleted" });
});

export default router;


//supporting functions
//to delete file from drive.
async function deleteFile(fileId) {
    //drive function of google api.
    drive.files.delete({
        'fileId': fileId
    })
        .then((res) => {
            // console.log(res);
            //console.log("file deleted ", fileId);
        }).catch((err) => {
            //console.log(err);
        })
}

async function uploadFile(fileName, mimeType, data, folderName) {
    try {
        // get drive folder id from folder name from .env file
        const folderId = process.env[folderName];

        // create file from data 
        const responce = await drive.files.create({
            name: fileName,
            media: {
                mimeType: mimeType,
                body: data,
            },
        });//firstly to upload file.
        //update name and folder and filename of file.
        await drive.files.update({
            fileId: responce.data.id,
            addParents: folderId,
            resource: { name: fileName }
        });//to rename file to required name.
        //generate and send public url.
        return await generatePublicUrl(responce.data.id);
    } catch (err) {
        //console.log(err.message);
    }
}

async function generatePublicUrl(id) {
    try {
        //set permission to public as viewer.
        await drive.permissions.create({//to change permissions
            fileId: id,
            requestBody: {
                role: "reader",
                type: "anyone",
            }
        });
        //get url by get function.
        const result = await drive.files.get({//to get public urls
            fileId: id,
            fields: "webViewLink, webContentLink, id",
        });
        return result.data;
    } catch (err) {
        //console.log(err);
    }
}
