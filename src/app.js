const express = require('express')
const redis = require('./redis')
const morgan = require('morgan')
const gracefullyExiting = require('./status')
const pkg = require('../package.json')
const {
  APP_COMMIT_REF,
  APP_BUILD_DATE,
  APP_CI_BRANCH,
  APP_CI_REF,
  SECRET
} = process.env

const app = express()

app.use(morgan('dev'))
app.get('/', (req, res) => res.send('Hello World!'))

// liveness probe
app.get('/status/health', (req, res) => res.json({
  version: pkg.version,
  sha1: APP_COMMIT_REF,
  ci: APP_CI_REF,
  branch: APP_CI_BRANCH,
  updatedAt: APP_BUILD_DATE,
  secret: SECRET
}))

// readiness probe
app.get('/status/ready', (req, res) => res
  .status(redis.connected && !gracefullyExiting.get() ? 200 : 502)
  .send({})
)

// kill process
app.get('kill', (req, res) => res.sendStatus(204) && process.exit(-1))

app.get('/set/:key/:value', (req, res, next) => {
  const { key, value } = req.params
  redis.set(key, value, err => {
    if (err) return next(err)
    res.send(`${key}: ${value}`)
  })
})

app.get('/get/:key', (req, res, next) => {
  const { key } = req.params
  redis.get(key, (err, value) => {
    if (err) return next(err)
    res.send(`${key}: ${value}`)
  })
})

// error handler
app.use((err, req, res, next) => {
  res.status(500)
  res.render('error', { error: err })
})

module.exports = app
