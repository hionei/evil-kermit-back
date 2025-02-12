import dotenv from "dotenv";
import express from "./app/services/express";
import { Application } from "express";
import routes from "./app/routes";
import mongoose, { ConnectOptions } from "mongoose";
import { ServerApiVersion } from "mongodb";

//For env File
dotenv.config();

const app: Application = express(routes);
const port = process.env.PORT || 8000;
const uri = "mongodb://127.0.0.1:27017/events";

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
  } as ConnectOptions)
  .then((db) => {
    console.log("database is connected", db.models.data);
  })
  .catch((err) => console.log(err));

app.listen(8000, "0.0.0.0", () => {
  console.log(`Server is Fire at http://0.0.0.0:${port}`);
});
