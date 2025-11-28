import app from "./app";
import mongoose from "mongoose";
import config from "./config";

async function start() {
    try {
        await mongoose.connect(config.mongoURI);
        console.log("Connected to MongoDB");

        app.listen(config.port, () => {
            console.log(`Server listening on http://localhost:${config.port}`);
        });
    } catch (err) {
        console.error("Failed to start server", err);
        process.exit(1);
    }
}

start();
