const express = require('express')
const app = express()
const redis = require('redis')
const morgan = require('morgan')
const pkg = require('./package.json')
const {
  PORT = 3000,
  RELEASE_NAME = '',
  APP_COMMIT_REF,
  APP_BUILD_DATE,
  SECRET
} = process.env

function getEnv (name) {
  const releaseNameUpper = RELEASE_NAME.toUpperCase()
  return releaseNameUpper
    ? process.env[`${releaseNameUpper}_${name}`]
    : process.env[name]
}

const REDIS_HOST = getEnv('REDIS_MASTER_SERVICE_HOST')
const REDIS_PORT = getEnv('REDIS_MASTER_SERVICE_PORT')

let gracefullyExiting = false

console.log('release name', RELEASE_NAME)
console.log('redis host', REDIS_HOST)

const client = redis.createClient({
  host: REDIS_HOST,
  port: REDIS_PORT
})

app.use(morgan('dev'))
app.get('/', (req, res) => res.send('Hello World!'))

// liveness probe
app.get('/status/health', (req, res) => res.json({
  version: pkg.version,
  sha1: APP_COMMIT_REF,
  updatedAt: APP_BUILD_DATE,
  secret: SECRET
}))

// readness probe
app.get('/status/ready', (req, res) => res
  .status(client.connected && !gracefullyExiting ? 200 : 502)
  .send({})
)

// kill process
app.get('kill', (req, res) => res.sendStatus(204) && process.exit(-1))

app.get('/set/:key/:value', (req, res, next) => {
  const { key, value } = req.params
  client.set(key, value, err => {
    if (err) return next(err)
    res.send(`${key}: ${value}`)
  })
})

app.get('/get/:key', (req, res, next) => {
  const { key } = req.params
  client.get(key, (err, value) => {
    if (err) return next(err)
    res.send(`${key}: ${value}`)
  })
})

// error handler
app.use((err, req, res, next) => {
  res.status(500)
  res.render('error', { error: err })
})

const server = app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`))

function gracefulShutdown () {
  console.info('> SIGTERM received. Trying to execute a graceful shutdown...')
  gracefullyExiting = true
  server.close(err => {
    if (err) console.error('> Express failed to quit')
    client.quit(err => {
      if (err) console.error('> Redis failed to quit')
      console.info('> Graceful shutdown completed.')
      process.exit(0)
    })
  })
}

// gracefull shutdown
process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)
