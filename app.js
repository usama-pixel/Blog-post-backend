const path = require('path')
const fs = require('fs')

const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const multer = require('multer')
const { graphqlHTTP } = require('express-graphql')

const graphqlSchema = require('./graphql/schema')
const graphqlResolver = require('./graphql/resolvers')
const auth = require('./middleware/auth')
const { clearImage } = require('./util/file')

const app = express()

const MONGODB_URI = process.env.MONGODB_URI
const PORT = process.env.PORT || 8080

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
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

// app.use((error, req, res, next) => {
//   console.log(error)
//   const status = error.statusCode || 500
//   const message = error.message
//   const { data } = error
//   res.status(status).json({
//     message,
//     data
//   })
// })

app.use(auth)

app.put('/post-image', (req, res, next) => {
  if (!req.isAuth) {
    throw new Error('Not Authenticated!')
  }
  if (!req.file) {
    return res.status(200).json({ message: 'No file provided!' })
  }
  if (req.body.oldPath) {
    clearImage(req.body.oldPath)
  }
  return res.status(201).json({ message: 'File stored', filePath: req.file.path.replace('\\', '/') })
})



app.use('/graphql', graphqlHTTP({
  schema: graphqlSchema,
  rootValue: graphqlResolver,
  graphiql: true, // this allows us to use get request from browser and allows us to play withour graphql api there
  formatError(err) {
    if (!err.originalError) {
      return err
    }
    const data = err.originalError.data
    const message = err.message || 'An error occured'
    const code = err.originalError.code || 500
    return { message, status: code, data }
  }
}))

mongoose.connect(MONGODB_URI || 'mongodb://127.0.0.1:27017/messages')
  .then(result => {
    app.listen(PORT, () => console.log('listening on port 8080'))

  })
  .catch(err => console.log(err))