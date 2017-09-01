import API from './API'
import settings from '../../config/settings'
var config = settings.wechat
import wxpay from './wxpay'
import bluebird from 'bluebird'
import cache from '../../utils/redis'
import log4js from 'log4js'
const logger = log4js.getLogger(__dirname)
const expire = 7200000
//初始化微信企业号
var api = new API(config.corpId, config.secret, config.angentid, function (callback) {
	cache.client.get('wechat:api')
		.then((result) => {
			if (!result) {
				logger.warn('在缓存中微信Api Token为空')
				return callback(null, null)
			}
			let globetoken = JSON.parse(result)
			return callback(null, globetoken)
		}).catch((err) => {
			logger.warn('在缓存中获取微信Api Token错误: %s', err)
			return callback(err)
		})
}, function (token, callback) {
	cache.client.setex('wechat:api', expire, JSON.stringify(token))
		.then(() => {
			return callback(null, token)
		}).catch((err) => {
			logger.warn('向缓存中写入微信Api Token错误: %s', err)
			return callback(err)
		})
})

//初始化微信支付
var wpay = new wxpay()
wpay.init(config)
api.wxpay = wpay

bluebird.promisifyAll(api);  // 转换成promise函数  Async 
// console.log(api)
module.exports = api
