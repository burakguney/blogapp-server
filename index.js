const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const userModel = require('./schemas/User')
const postModel = require('./schemas/Post')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const multer = require('multer')
const uploadMiddleware = multer({ dest: 'uploads/' })
const fs = require('fs')
const PostModel = require('./schemas/Post')
const path = require('path')

dotenv.config()
const port = process.env.PORT
const mongodb = process.env.MONGODB
const secret = process.env.SECRET
const salt = bcrypt.genSaltSync(10)

const app = express()

app.use(cors({ credentials: true, origin: 'http://localhost:3000' }))
app.use(express.json())
app.use(cookieParser())
app.use('/uploads', express.static(__dirname + '/uploads'))

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

app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
    try {
        const { originalname, path } = req.file
        const parts = originalname.split('.')
        const ext = parts[parts.length - 1]
        const newPath = path + '.' + ext
        fs.renameSync(path, newPath)

        const { token } = req.cookies

        if (token) {
            jwt.verify(token, secret, {}, async (err, info) => {
                if (err) throw err

                const { title, summary, content } = req.body

                const post = await PostModel.create({
                    title,
                    summary,
                    content,
                    cover: newPath,
                    author: info.id
                })
                return res.status(201).json(post)
            })
        }

    } catch (error) {
        return res.status(400).json(error)
    }
})

app.put('/post', uploadMiddleware.single('file'), async (req, res) => {
    let newPath = null;
    if (req.file) {
        const { originalname, path } = req.file;
        const parts = originalname.split('.');
        const ext = parts[parts.length - 1];
        newPath = path + '.' + ext;
        fs.renameSync(path, newPath);
    }

    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (err, info) => {
        if (err) throw err;
        const { id, title, summary, content } = req.body;
        const postDoc = await PostModel.findById(id);
        const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
        if (!isAuthor) {
            return res.status(400).json('you are not the author');
        }
        await postDoc.updateOne({
            title,
            summary,
            content,
            cover: newPath ? newPath : postDoc.cover,
        });

        res.json(postDoc);
    });

});

app.get('/post', async (req, res) => {
    res.status(200).json(await PostModel
        .find()
        .populate('author', 'username')
        .sort({ createdAt: -1 })
        .limit(20)
    )
})

app.get('/post/:id', async (req, res) => {

    const { id } = req.params

    const post = await PostModel.findById(id).populate('author', 'username')

    res.status(200).json(post)
})

mongoose.connect(mongodb)
    .then(() => {
        console.log("Database connected.")
    }).catch((err) => {
        console.log(err.message)
        throw err;
    })

app.listen(port, () => console.log(`Example app listening on port ${port}!`))