const express = require('express')
const cors = require('cors')
const app = express()
const port = 8080

app.use(cors())
app.use(express.json())

app.post('/register', (req, res) => {
    const { username, password } = req.body

    res.json({ requsetData: { username, password } })
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))