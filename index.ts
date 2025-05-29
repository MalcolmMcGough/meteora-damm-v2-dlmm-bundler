import express, { Request, Response } from "express";
const app = express();

import dotenv from "dotenv"
dotenv.config()
const port = process.env.PORT || 5001;

import bodyParser from "body-parser";
import meteoraDlmmRouter from "./route/meteoraDlmm";


app.get("/", async (req, res) => {
    res.json("Success!!");
  });

app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use("/meteora-dlmm", meteoraDlmmRouter);

const start = async () => {
    try {
        // only connect to server if successfully-connected to DB
        app.listen(port, () =>
            console.log(`Server is listening on http://localhost:${port}`)
        );
    } catch (error) {
        console.log(error);
    }
};
start();

