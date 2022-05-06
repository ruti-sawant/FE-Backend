import dotenv from "dotenv";
dotenv.config();
function middleware(req, res, next) {
    res.header('Access-Control-Allow-Credentials', true);
    res.header("Access-Control-Allow-Headers", "content-type");
    res.header("Access-Control-Allow-Methods", "*");
    res.header("Access-Control-Allow-Origin", ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'https://quirky-heisenberg-5d299a.netlify.app/']);
    next();
}
export default middleware;