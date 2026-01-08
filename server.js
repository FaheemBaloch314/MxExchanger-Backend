import dotenv from 'dotenv';
dotenv.config({ path: './config/config.env' });
import { dbConnection } from './database/databaseCon.js';
import app from './app.js';





const server = app.listen(process.env.PORT, () => {
    console.log(`server is working on http://localhost:${process.env.PORT}`)
    dbConnection()
})




// Unhandled Promise Rejection

process.on("unhandledRejection", err => {
    console.log("Error : ", err.message)
    console.log("Shutting Down The Server due to Unhandled Promise Rejection")
    server.close(() => {
        process.exit(1)
    })

})
// Handling Uncaught Exception
process.on('uncaughtException', (err) => {
    console.log(`ERROR : ${err.message}`)
    console.log("Shutting Down The Server due to Handling Uncaught Exception")
    process.exit(1)

})




