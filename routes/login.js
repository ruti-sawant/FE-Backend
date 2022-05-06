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

router.get("/", middleware, (req, res) => {
    console.log(req.get('host'));
    console.log(req.get('url'));
    if (req.cookies[process.env.COOKIE_NAME]) {
        const data = jwt.verify(req.cookies[process.env.COOKIE_NAME], process.env.JWT_ACCESS_TOKEN);
        res.status(200).send({
            loggedIn: true, data
        });
    } else {
        console.log("no cookie exists");
        res.status(200).send({ loggedIn: false });
    }
});

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
                const cookieData = data.data.data;
                const accessToken = jwt.sign(cookieData, process.env.JWT_ACCESS_TOKEN);
                res.cookie(process.env.COOKIE_NAME, accessToken, {
                    path: "/",
                    httpOnly: true,
                    maxAge: 3600000,
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