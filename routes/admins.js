import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';
const router = express.Router();

router.get("/", (req, res) => {
    axios.get(process.env.API_URL + "/admins", {
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

router.get("/:adminId", (req, res) => {
    const adminId = req.params.adminId;
    axios.get(process.env.API_URL + "/admins/" + adminId, {
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
    axios.post(process.env.API_URL + "/admins", {
        data
    }, {
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

router.patch("/:adminId", (req, res) => {
    const adminId = req.params.adminId;
    const data = req.body;
    axios.patch(process.env.API_URL + "/admins/" + adminId, {
        data
    }, {
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

router.delete("/:adminId", (req, res) => {
    const adminId = req.params.adminId;
    axios.delete(process.env.API_URL + "/admins/" + adminId, {
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