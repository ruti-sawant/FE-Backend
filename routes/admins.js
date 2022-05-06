import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';
import middleware from '../middleware.js';
const router = express.Router();


//method to get all admins data.
router.get("/", middleware, (req, res) => {
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

//method to get a specific admin data by its id.
router.get("/:adminId", middleware, (req, res) => {
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


//method to post or add new Admin.
router.post("/", middleware, (req, res) => {
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


//method to update admin data by its id.
router.patch("/:adminId", middleware, (req, res) => {
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


//method to delete admin data by its id.
router.delete("/:adminId", middleware, (req, res) => {
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