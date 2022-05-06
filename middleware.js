import dotenv from "dotenv";
dotenv.config();
function middleware(req, res, next) {
    res.header('Access-Control-Allow-Credentials', true);
    res.header("Access-Control-Allow-Headers", "content-type");
    res.header("Access-Control-Allow-Methods", "*");
    res.header("Access-Control-Allow-Origin", ['localhost:3000', 'localhost:3001', 'localhost:3002', 'https://quirky-heisenberg-5d299a.netlify.app/']);
    next();
}
export default middleware;