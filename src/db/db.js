import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDB = async () => { 
    try {
        const connection = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        console.log(`MONGODB connected!! DB host : ${connection.connection.host}`); //which instance we are  in dev,prod,testing
    } catch (error) {
        console.error(` MONGODB connection Failed: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;