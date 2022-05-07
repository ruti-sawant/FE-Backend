import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';
const router = express.Router();

import middleware from '../middleware.js';

//method to get all broadcasts data.
router.get("/", middleware, (req, res) => {
    axios.get(process.env.API_URL + "/broadcasts", {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            // console.log("data", data.data);
            res.status(200).send(data.data);
        })
        .catch((err) => {
            // console.log("err", err);
            res.status(400).send({ message: err.message });
        });
});


// method to get single broadcast data by its id.
router.get("/:broadcastId", middleware, (req, res) => {
    const broadcastId = req.params.broadcastId;
    axios.get(process.env.API_URL + "/broadcasts/" + broadcastId, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            // console.log("data", data.data);
            res.status(200).send(data.data);
        })
        .catch((err) => {
            // console.log("err", err);
            res.status(400).send({ message: err.message });
        });
});

//method to get all broadcasts for any farmer by farmerId.
router.get("/farmer/:farmerId", middleware, (req, res) => {
    const farmerId = req.params.farmerId;
    axios.get(process.env.API_URL + "/broadcasts/farmer/" + farmerId, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            // console.log("data", data.data);
            res.status(200).send(data.data);
        })
        .catch((err) => {
            // console.log("err", err);
            res.status(400).send({ message: err.message });
        });
});

// method to add broadcast
router.post("/", middleware, (req, res) => {
    const data = req.body;
    axios.post(process.env.API_URL + "/broadcasts", {
        data
    }, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            // console.log("broadcast inserted", data);
            res.status(200).send({ message: "Broadcast inserted successfully" });
        })
        .catch((err) => {
            // console.log("Broadcast insert err", err);
            res.status(400).send({ message: err.message });
        });
});

//method to add question in broadcast by broadcast id.
router.post("/insertQuestion/:broadcastId", middleware, (req, res) => {
    const data = req.body;
    const broadcastId = req.params.broadcastId;
    axios.patch(process.env.API_URL + "/broadcasts/" + broadcastId, {
        data
    }, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            // console.log("broadcast question inserted", data);
            res.status(200).send({ message: "Broadcast question inserted successfully" });
        })
        .catch((err) => {
            // console.log("Broadcast question insert err", data);
            res.status(400).send({ message: err.message });
        });
});


//method to add answer for a question in particular broadcast by broadcast id and question id.
router.post("/insertAnswer/:broadcastId/:chatId", middleware, (req, res) => {
    const data = req.body;
    const broadcastId = req.params.broadcastId;
    const chatId = req.params.chatId;
    axios.patch(process.env.API_URL + "/broadcasts/" + broadcastId + "/" + chatId, {
        data
    }, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            // console.log("broadcast answer inserted", data);
            res.status(200).send({ message: "Broadcast answer inserted successfully" });
        })
        .catch((err) => {
            // console.log("Broadcast answer insert err", data);
            res.status(400).send({ message: err.message });
        });
});

//method to delete broadcast by its broadcastId.
router.post("/delete/:broadcastId", middleware, (req, res) => {
    const broadcastId = req.params.broadcastId;
    axios.delete(process.env.API_URL + "/broadcasts/" + broadcastId, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            // console.log("broadcast delete", data);
            res.status(200).send({ message: "Broadcast deleted successfully" });
        })
        .catch((err) => {
            // console.log("Broadcast delete err", data);
            res.status(400).send({ message: err.message });
        });
})

export default router;