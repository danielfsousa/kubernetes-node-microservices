const app = require('./app')
const gracefullyExiting = require('./status')
const redis = require('./redis')
const { PORT = 3000 } = process.env

const server = app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`))

function configureGracefulShutdown (signal) {
  process.on(signal, () => {
    console.info(`> ${signal} received. Trying to execute a graceful shutdown...`)
    gracefullyExiting.set(true)
    server.close(err => {
      if (err) console.error('> Express failed to quit')
      redis.quit(err => {
        if (err) console.error('> Redis failed to quit')
        console.info('> Graceful shutdown completed.')
        process.exit(0)
      })
    })
  })
}

// gracefull shutdown
configureGracefulShutdown('SIGINT')
configureGracefulShutdown('SIGTERM')
