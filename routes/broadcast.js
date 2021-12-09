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

router.post("/", (req, res) => {
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
            console.log("broadcast inserted", data);
            res.status(200).send({ message: "Broadcast inserted successfully" });
        })
        .catch((err) => {
            console.log("Broadcast insert err", data);
            res.status(400).send({ message: err.message });
        });
});

router.post("/insertQuestion/:broadcastId", (req, res) => {
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
            console.log("broadcast question inserted", data);
            res.status(200).send({ message: "Broadcast question inserted successfully" });
        })
        .catch((err) => {
            console.log("Broadcast question insert err", data);
            res.status(400).send({ message: err.message });
        });
});

router.post("/insertAnswer/:broadcastId/:chatId", (req, res) => {
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
            console.log("broadcast answer inserted", data);
            res.status(200).send({ message: "Broadcast answer inserted successfully" });
        })
        .catch((err) => {
            console.log("Broadcast answer insert err", data);
            res.status(400).send({ message: err.message });
        });
});

router.post("/delete/:broadcastId", (req, res) => {
    const broadcastId = req.params.broadcastId;
    axios.delete(process.env.API_URL + "/broadcasts/" + broadcastId, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            console.log("broadcast delete", data);
            res.status(200).send({ message: "Broadcast deleted successfully" });
        })
        .catch((err) => {
            console.log("Broadcast delete err", data);
            res.status(400).send({ message: err.message });
        });
})

export default router;