import dotenv from "dotenv";
dotenv.config();
function middleware(req, res, next) {
    console.log("middleware", req.headers.origin);
    console.log(req.headers);
    const corsWhitelist = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'https://quirky-heisenberg-5d299a.netlify.app'];
    if (corsWhitelist.indexOf(req.headers.origin) !== -1) {
        console.log("correct origin");
        res.header('Access-Control-Allow-Origin', req.headers.origin);

        res.header('Access-Control-Allow-Headers', process.env.ALLOW_HEADERS);
        // res.header('Access-Control-Allow-Headers', '*');
        res.header('Access-Control-Allow-Credentials', true);
        res.header("Access-Control-Allow-Methods", process.env.METHODS);
    }
    // res.header('Access-Control-Allow-Credentials', true);
    // res.header("Access-Control-Allow-Headers", "content-type");
    // res.header("Access-Control-Allow-Methods", "*");
    // res.header("Access-Control-Allow-Origin", ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'https://quirky-heisenberg-5d299a.netlify.app/']);
    next();
}
export default middleware;