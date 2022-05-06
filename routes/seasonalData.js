import express from 'express';
import axios from 'axios';
const router = express.Router();

import middleware from '../middleware.js';

//to get all seasonal data's.
router.get("/", middleware, (req, res) => {
    axios.get(process.env.API_URL + "/seasonalData", {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            res.status(200).send(data.data);
        })
        .catch((err) => {
            res.status(400).send({ message: err.message });
        });
});

//to get seasonal data's by plotId.
router.get("/plots/:plotId", middleware, (req, res) => {
    const plotId = req.params.plotId;
    axios.get(process.env.API_URL + "/seasonalData/farmers/plots/" + plotId, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            res.status(200).send(data.data);
        })
        .catch((err) => {
            res.status(400).send({ message: err.message });
        });
});


//to add new seasonal data.
router.post("/", middleware, (req, res) => {
    const data = req.body;
    console.log("post body", req.body);
    axios.post(process.env.API_URL + "/seasonalData", {
        data
    }, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            console.log("SeasonalData updated data", data);
            res.status(200).send({ message: "SeasonalData updated successfully" });
        })
        .catch((err) => {
            console.log("SeasonalData updated err", data);
            res.status(400).send({ message: err.message });
        });
});

//to edit seasonal data by its id.
router.post("/edit/:seasonalDataId", middleware, (req, res) => {
    const seasonalDataId = req.params.seasonalDataId;
    const data = req.body;
    console.log("patch body", req.body);
    axios.patch(process.env.API_URL + "/seasonalData/" + seasonalDataId, {
        data
    }, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            res.status(200).send({ message: "SeasonalData updated successfully" });
        })
        .catch((err) => {
            // console.log(err);
            res.status(400).send({ message: err.message });
        });
});

//to delete seasonal data by year.
router.post("/delete/deleteByYear/:year", middleware, (req, res) => {
    const year = req.params.year;
    axios.delete(process.env.API_URL + "/seasonalData/deleteByYear/data/" + year, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            console.log("data", data);
            res.status(200).send({ message: "year " + year + " records deleted successfully" });
        })
        .catch((err) => {
            console.log("err", err);
            res.status(400).send({ message: err.message });
        });
});

//to delete seasonal data by plotId.
router.post("/delete/deleteByPlot/:plotId", middleware, (req, res) => {
    const plotId = req.params.plotId;
    axios.delete(process.env.API_URL + "/seasonalData/deleteByPlot/data/" + plotId, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            console.log("data", data);
            res.status(200).send({ message: "year " + plotId + " records deleted successfully" });
        })
        .catch((err) => {
            console.log("err", err);
            res.status(400).send({ message: err.message });
        });
});


// to delete seasonal data by farmerId
router.post("/delete/deleteByFarmer/:farmerId", middleware, (req, res) => {
    const farmerId = req.params.farmerId;
    axios.delete(process.env.API_URL + "/seasonalData/" + farmerId, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            console.log("data", data);
            res.status(200).send({ message: "farmer " + farmerId + " records deleted successfully" });
        })
        .catch((err) => {
            console.log("err", err);
            res.status(400).send({ message: err.message });
        });
});

//to delete seasonal data by id.
router.post("/delete/deleteBySeasonalId/:seasonalId", middleware, (req, res) => {
    const seasonalId = req.params.seasonalId;
    axios.delete(process.env.API_URL + "/seasonalData/data/" + seasonalId, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            console.log("data", data);
            res.status(200).send({ message: "seasonal data " + seasonalId + " record deleted successfully" });
        })
        .catch((err) => {
            console.log("err", err);
            res.status(400).send({ message: err.message });
        });
});

export default router;