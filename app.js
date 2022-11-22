const path = require('path')

const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const multer = require('multer')
// const cors = require('cors')

const feedRoutes = require('./routes/feed')

const app = express()

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images')
  },
  filename: (req, file, cb) => {
    cb(null, new Date().getTime() + '-' + file.originalname)
  }
})

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/png'
  ) {
    cb(null, true)
  } else {
    cb(null, false)
  }
}

// app.use(bodyParser.urlencoded()) // x-www-form-urlencoded <form>

app.use(bodyParser.json()) // application/json
app.use(
  multer({ storage: fileStorage, fileFilter }).single('image')
)
app.use('/images', express.static(path.join(__dirname, 'images')))

// app.options('*', cors())
// app.use(cors())
app.use((req, res, next) => { // using this code to avoid CORS error
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader(
    'Access-Control-Allow-Methods',
    'PUT, GET, POST, PATCH, DELETE, OPTIONS'
  )
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Auth-Token, Content-Type, Authorization') // we could also use '*' here if we want to allow all the headers
  next()
})

app.use('/feed', feedRoutes)


app.use((error, req, res, next) => {
  console.log(error)
  const status = error.statusCode || 500
  const message = error.message
  res.status(status).json({
    message
  })
})

mongoose.connect('mongodb://127.0.0.1:27017/messages')
  .then(result => {
    app.listen(8080, () => console.log('listening on port 8080'))
  })
  .catch(err => console.log(err))