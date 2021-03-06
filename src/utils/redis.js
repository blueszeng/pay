const redis = require('redis')
const config = require('../config/settings')
import log4js from 'log4js'
import wrapper from 'co-redis'
let redisClient = redis.createClient(config.redis.redisUrl, {})
redisClient = wrapper(redisClient)
const logger = log4js.getLogger(`${__dirname}/${__filename}`)
let HASH_KEY_EXPIRE = 120
let redisAvailable = false
redisClient.on('error', (_error) => {
  logger.info('connect error...')

  redisAvailable = false
})

redisClient.on('end', () => {
  logger.warn('connect end...')
  redisAvailable = false
})

redisClient.on('connect', () => {
  logger.info('connect redis success...')
  redisAvailable = true
})
const setCache = async function (key, value, tty) {
  if (!redisAvailable) {
    return Promise.reject('redis 未连接')
  }
  if (value === undefined) {
    return Promise.reject('value 参数为空')
  }
  value = JSON.stringify(value)
  try {
    if (tty) {
      await redisClient.setex(key, tty, value)
    }
    await redisClient.set(key, value)
  } catch (err) {
    return Promise.reject(`cache set error:${err}`)
  }
}

const getCache = async function (key) {
  if (!redisAvailable) {
    return Promise.reject('redis 未连接')
  }
  try {
    let data = await redisClient.get(key)
    if (data) {
      data = JSON.parse(data.toString())
    }
    return Promise.resolve(data)
  } catch (err) {
    return Promise.reject(`cache get error:${err}`)
  }
}

const cleanCache = async function (key) {
  if (!redisAvailable) {
    return Promise.reject('redis 未连接')
  }
  try {
    await redisClient.del(key)
  } catch (err) {
    return Promise.reject(`cache del error:${err}`)
  }
}

const getHashCache = async function (key, field, isStoreJsonField = false) {
  if (!redisAvailable) {
    return Promise.reject('redis 未连接')
  }
  //  获取单条HASH 字段
  if (field) {
    let data = {}
    let hashData = await redisClient.hget(key, field)
    data = hashData
    // console.log(data)
    if (isStoreJsonField) {
      data = JSON.parse(hashData.toString());
    }
    return Promise.resolve(data)
  }
  // 获得整个hash
  let data = {}
  let hashData = await redisClient.hgetall(key)
  if (isStoreJsonField) {
    for (var userId in hashData) {
      data[userId] = JSON.parse(hashData[userId]);
    }
  } else {
    if (!!hashData) {
      data = hashData
    }
  }
  return Promise.resolve(data)
}

const setHashCache = async function (key, field, value, expire = HASH_KEY_EXPIRE) {
  if (!redisAvailable) {
    return Promise.reject('redis 未连接')
  }

  if (field instanceof Array) {
    let fields = field
    fields.forEach(function (field, index) {
      if (field instanceof Object) {
        fields[index] = JSON.stringify(field)
      }
    })
    try {
      await redisClient.hmset(key, fields)
      //设置过期时间
      await redisClient.expire(key, expire)
    } catch (err) {
      return Promise.reject(`cache hmset 单条error:${err}`)
    }

  } else {
    try {
      value = JSON.stringify(value)
      await redisClient.hset(key, field, value)
      //设置过期时间
      await redisClient.expire(key, expire);
    } catch (err) {
      return Promise.reject(`cache hmset 多条error:${err}`)
    }
  }
}



export default {
  client: redisClient,
  setCache,
  getCache,
  getHashCache,
  setHashCache,
  cleanCache
}
