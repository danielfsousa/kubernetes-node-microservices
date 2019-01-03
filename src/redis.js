const redis = require('redis')
const { RELEASE_NAME = '' } = process.env

function getEnv (name) {
  const releaseNameUpper = RELEASE_NAME.toUpperCase()
  return releaseNameUpper
    ? process.env[`${releaseNameUpper}_${name}`]
    : process.env[name]
}

const REDIS_HOST = getEnv('REDIS_MASTER_SERVICE_HOST')
const REDIS_PORT = getEnv('REDIS_MASTER_SERVICE_PORT')

console.log('release name', RELEASE_NAME)
console.log('redis host', REDIS_HOST)

module.exports = redis.createClient({
  host: REDIS_HOST,
  port: REDIS_PORT
})
