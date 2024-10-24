import express from "express";
import { movieFileRouter} from "./movie.file.router.js";

const router = express.Router();

export function routerMovie (app) {
 
    app.use("/api/v1", router);

    router.use( "/movies", movieFileRouter );

}