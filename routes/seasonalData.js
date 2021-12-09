import express from 'express';
import axios from 'axios';
const router = express.Router();

router.get("/", (req, res) => {
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

router.get("/plots/:plotId", (req, res) => {
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

router.post("/", (req, res) => {
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

router.post("/edit/:seasonalDataId", (req, res) => {
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

export default router;