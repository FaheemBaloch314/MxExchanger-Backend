import mongoose from "mongoose";

export const dbConnection = () => {
    mongoose.connect(process.env.MONGO_URI, { dbName: "mxechanger" }).then(() => {
        console.log("Database has been connected")
    }).catch((error) => {
        console.log(`ERROR OCCURED \n an ERROR OCCURED during connecting database ERROR \n ${error}`)
    })
}


