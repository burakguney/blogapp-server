const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')

const userModel = require('./schemas/User')

dotenv.config()
const port = process.env.PORT
const mongodb = process.env.MONGODB
const secret = process.env.SECRET
const salt = bcrypt.genSaltSync(10)

const app = express()

app.use(cors({ credentials: true, origin: 'http://localhost:3000' }))
app.use(express.json())
app.use(cookieParser())

app.post('/register', async (req, res) => {
    const { username, password } = req.body

    try {
        const user = await userModel.create({
            username,
            password: bcrypt.hashSync(password, salt)
        })

        res.status(201).json(user)
    } catch (error) {
        console.log(error)
        res.status(400).json(error)
    }
})

app.post('/login', async (req, res) => {
    const { username, password } = req.body

    try {
        const user = await userModel.findOne({ username })

        if (!user) {
            return res.status(400).json("User not found.")
        }

        const passOk = bcrypt.compareSync(password, user.password)

        if (!passOk) {
            return res.status(403).json("Wrong password.")
        }

        jwt.sign({ username, id: user._id }, secret, {}, (err, token) => {
            if (err) throw err
            return res.cookie('token', token).json({
                id: user._id,
                username
            })
        })
    } catch (error) {
        console.log(error)
        res.status(400).json(error)
    }
})

app.get('/profile', (req, res) => {
    const { token } = req.cookies

    if (token) {
        jwt.verify(token, secret, {}, (err, info) => {
            if (err) throw err
            res.json(info)
        })
    }
})

app.post('/logout', (req, res) => {
    return res.cookie('token', '').json('logout successfully')
})

mongoose.connect(mongodb)
    .then(() => {
        console.log("Database connected.")
    }).catch((err) => {
        console.log(err.message)
        throw err;
    })

app.listen(port, () => console.log(`Example app listening on port ${port}!`))