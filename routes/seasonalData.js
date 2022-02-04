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

router.post("/delete/deleteByYear/:year", (req, res) => {
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

router.post("/delete/deleteByPlot/:plotId", (req, res) => {
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


router.post("/delete/deleteByFarmer/:farmerId", (req, res) => {
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

router.post("/delete/deleteBySeasonalId/:seasonalId", (req, res) => {
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