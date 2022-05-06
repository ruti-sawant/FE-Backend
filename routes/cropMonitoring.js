import express from "express";
import dotenv from "dotenv";
dotenv.config();
import axios from "axios";
const router = express.Router();

import middleware from '../middleware.js';

export default router;

router.get("/", middleware, (req, res) => {
  axios
    .get(process.env.API_URL + "/cropMonitoring", {
      headers: {
        "Content-Type": "application/json",
        apiid: process.env.API_KEY,
      },
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

// /cropMonitoring/data/<monitoringId>
router.get("/data/:monitoringId", middleware, (req, res) => {
  const monitoringId = req.params.monitoringId;
  axios
    .get(process.env.API_URL + "/cropMonitoring/data/" + monitoringId, {
      headers: {
        "Content-Type": "application/json",
        apiid: process.env.API_KEY,
      },
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

// /cropMonitoring/MHCode/<MHCode>
router.get("/MHCode/:MHCode", middleware, (req, res) => {
  const MHCode = req.params.MHCode;
  axios
    .get(process.env.API_URL + "/cropMonitoring/MHCode/" + MHCode, {
      headers: {
        "Content-Type": "application/json",
        apiid: process.env.API_KEY,
      },
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

// delete according MonitoringId
router.post("/delete/:monitoringId", middleware, (req, res) => {
  const monitoringId = req.params.monitoringId;
  axios
    .delete(process.env.API_URL + "/cropMonitoring/" + monitoringId, {
      headers: {
        "Content-Type": "application/json",
        apiid: process.env.API_KEY,
      },
    })
    .then((data) => {
      console.log("Crop Monitoring item deleted based on MonitoringId", data);
      res.status(200).send({ message: "Data deleted successfully" });
    })
    .catch((err) => {
      console.log("Deleting error", err);
      res.status(400).send({ message: err.message });
    });
});

// delete according MHCode
router.post("/delete/MHCode/:MHCode", middleware, (req, res) => {
  const MHCode = req.params.MHCode;
  axios
    .delete(process.env.API_URL + "/cropMonitoring/MHCode/" + MHCode, {
      headers: {
        "Content-Type": "application/json",
        apiid: process.env.API_KEY,
      },
    })
    .then((data) => {
      console.log("Crop Monitoring item deleted based on MHCode", data);
      res.status(200).send({ message: "Data deleted successfully" });
    })
    .catch((err) => {
      console.log("Deleting error", err);
      res.status(400).send({ message: err.message });
    });
});
