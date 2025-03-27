import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));

app.use(express.json()); // To parse the incoming requests with JSON payloads limit can be given as argument
app.use(express.urlencoded({ extended: true })); // To parse the incoming requests with urlencoded payloads
app.use(express.static('public')); // To serve static files
app.use(cookieParser()); // To parse the cookies attached to the client requests


//////////////////////////////routes import //////////////////////////////////////////////
import userRouter from './routes/user.routes.js';



//////Routes declaration//////
app.use('/api/v1/users', userRouter);



export default app;