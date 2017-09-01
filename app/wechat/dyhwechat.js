import settings from '../../config/settings'
import wxpay from './wxpay'
import bluebird from 'bluebird'
import log4js from 'log4js'
const logger = log4js.getLogger(__dirname)
//初始化订阅号
let OAuth = require('wechat-oauth')
let api = new OAuth(settings.dyh.appID, settings.dyh.secret, function (openid, callback) {
    cache.client.hget('wechat:oauth', openid)
        .then((result) => {
            if (!result) {
                logger.warn('在缓存中获取用户(openid: %s)微信OAuth Token为空', openid)
                return callback(null, null)
            }
            let dyhToken = JSON.parse(result)
            callback(null, dyhToken)
        }).catch((err) => {
            logger.warn('在缓存中获取用户(openid: %s)微信OAuth Token错误: %s', openid, err)
            return callback(err)
        })
}, function (openid, token, callback) {
    cache.client.hset('wechat:oauth', openid, JSON.stringify(token))
        .then(() => {
            return callback(null, token)
        }).catch((err) => {
            logger.warn('向缓存中写入用户(openid: %s)微信OAuth Token错误: %s', openid, err)
            return callback(err)
        })
})

//初始化微信支付
let wpay = new wxpay()

wpay.init(settings.dyh)
api.wxpay = wpay

bluebird.promisifyAll(api)  // 转换成promise函数  Async 
module.exports = api
