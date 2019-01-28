const redis = require('redis')
const { REDIS_HOST, REDIS_PORT } = process.env

console.log('redis host', REDIS_HOST)
console.log('redis port', REDIS_PORT)

module.exports = redis.createClient({
  host: REDIS_HOST,
  port: REDIS_PORT
})
