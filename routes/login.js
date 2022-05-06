import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
const router = express.Router();

import session from 'express-session';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import axios from 'axios';

import middleware from '../middleware.js';

const corsOptions = {
    'Access-Control-Allow-Origin': '*',
    origin: '*',
    credentials: true,            //access-control-allow-credentials:true
    optionSuccessStatus: 200
}
router.use(cors(corsOptions));
router.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));


router.use(cookieParser());
router.use(express.json());


//to verify cookie from client.
router.get("/", middleware, (req, res) => {
    console.log(req.get('host'));
    console.log(req.get('url'));
    if (req.cookies[process.env.COOKIE_NAME]) {
        const data = jwt.verify(req.cookies[process.env.COOKIE_NAME], process.env.JWT_ACCESS_TOKEN);
        //create access token.
        const accessToken = jwt.sign(data, process.env.JWT_ACCESS_TOKEN);
        //pass cookie with response with token and data.
        res.cookie(process.env.COOKIE_NAME, accessToken, {
            path: "/",
            httpOnly: true,
            //time for 3 hours
            maxAge: 1000 * 60 * 60 * 3,
            secure: true,
            sameSite: 'none'
        });
        res.status(200).send({
            loggedIn: true, data
        });
    } else {
        console.log("no cookie exists");
        res.status(200).send({ loggedIn: false });
    }
});

router.get("/usernames", middleware, (req, res) => {
    axios.get(process.env.API_URL + "/login/usernames", {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            console.log(data.data);
            res.status(200).send(data.data);
        })
        .catch((err) => {
            console.log(err);
            res.status(500).send({ message: err.message });
        })
});

router.post("/forgotPassword", middleware, (req, res) => {
    const data = req.body;
    axios.post(process.env.API_URL + "/login/forgotPassword", {
        data
    }, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            console.log("broadcast inserted", data.data);
            res.status(200).send({ message: "password updated successfully" });
        })
        .catch((err) => {
            console.log("Broadcast insert err", err);
            res.status(400).send({ message: err.message });
        });
});

//to login user and check in database.
router.post("/", middleware, (req, res) => {
    console.log(req.get('host'));
    console.log(req.get('url'));
    const userId = req.body.userId;
    const password = req.body.password;
    console.log(userId, password);
    axios.post(process.env.API_URL + "/login/verify", {
        data: {
            userId, password
        }
    }, {
        headers: {
            'Content-Type': 'application/json',
            'apiid': process.env.API_KEY
        }
    })
        .then((data) => {
            console.log(data.data);
            if (data.data && data.data.loggedIn) {
                //if user is authenticated then create cookie and send it to client.
                //get data in cookieData.
                const cookieData = data.data.data;
                //create access token.
                const accessToken = jwt.sign(cookieData, process.env.JWT_ACCESS_TOKEN);
                //pass cookie with response with token and data.
                res.cookie(process.env.COOKIE_NAME, accessToken, {
                    path: "/",
                    httpOnly: true,
                    //time for 3 hours
                    maxAge: 1000 * 60 * 60 * 3,
                    secure: true,
                    sameSite: 'none'
                });
                res.status(200).send(data.data);
            } else {
                res.status(200).send(data.data);
            }
        })
        .catch((err) => {
            console.log(err);
            res.status(400).send({ message: err.message });
        });
});


export default router;