import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';
const router = express.Router();

router.get("/", (req, res) => {
    axios.get(process.env.API_URL + "/broadcasts", {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            console.log("data", data.data);
            res.status(200).send(data.data);
        })
        .catch((err) => {
            console.log("err", err);
            res.status(400).send({ message: err.message });
        });
});

router.get("/:broadcastId", (req, res) => {
    const broadcastId = req.params.broadcastId;
    axios.get(process.env.API_URL + "/broadcasts/" + broadcastId, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            console.log("data", data.data);
            res.status(200).send(data.data);
        })
        .catch((err) => {
            console.log("err", err);
            res.status(400).send({ message: err.message });
        });
});

router.get("/farmer/:farmerId", (req, res) => {
    const farmerId = req.params.farmerId;
    axios.get(process.env.API_URL + "/broadcasts/farmer/" + farmerId, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            console.log("data", data.data);
            res.status(200).send(data.data);
        })
        .catch((err) => {
            console.log("err", err);
            res.status(400).send({ message: err.message });
        });
});

export default router;