import express from 'express'
import userRouter from './routes/userRoutes.js'
import adminRoute from './routes/adminRoutes.js'
import cookieParser from 'cookie-parser'
import { errorMiddleware } from './middlewares/error.js'
import cors from 'cors'


const app = express()



// CORS configuration
const corsOptions = {
    origin: 'http://localhost:5173', // your frontend URL (Vite, React, etc.)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true, // allow cookies or auth headers
};



// middlewares
app.use(cors(corsOptions));
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))

// routes
app.use('/api/v1/', userRouter)
app.use('/api/v1/', adminRoute)


app.get('/', (req, res) => {
    res.send("Server is Working")
})


app.use(errorMiddleware)


export default app;