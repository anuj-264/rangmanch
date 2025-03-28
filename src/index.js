import dotenv from "dotenv";
dotenv.config({path:"./.env"});
import connectDB from "./db/db.js";
import app from "./app.js";

connectDB()
    .then(() => {
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, (err) => {
            if (err) {
                console.error(`Error while starting the server: ${err.message}`);
                process.exit(1); // Exit the process if the server fails to start
            }
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error(`Error while connecting to DB: ${error.message}`);
        process.exit(1); // Exit the process if DB connection fails
    });

