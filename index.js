const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const userModel = require('./schemas/User')

dotenv.config()
const port = process.env.PORT
const mongodb = process.env.MONGODB

const app = express()
app.use(cors())
app.use(express.json())

app.post('/register', async (req, res) => {
    const { username, password } = req.body

    try {
        const user = await userModel.create({ username, password })

        res.status(201).json(user)
    } catch (error) {
        res.status(400).json(error)
    }
})

mongoose.connect(mongodb)
    .then(() => {
        console.log("Database connected.")
    }).catch((err) => {
        console.log(err.message)
        throw err;
    })

app.listen(port, () => console.log(`Example app listening on port ${port}!`))