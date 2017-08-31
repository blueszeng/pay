var API = require("./API")
var settings = require("../../config/settings")

var config = settings.wechat
var wxpay = require('./wxpay')
import bluebird from 'bluebird'
import cache from '../../utils/redis'
var fs = require("fs")

const expire = 7200000
var globetoken = null
var expireTime = 0
//初始化微信企业号
var api = new API(config.corpId, config.secret, config.angentid, function (callback) {
	if (!globetoken) {
		return cache.client.get('wechat:api')
			.then((result) => {
				if (!result) {
					console.log('在缓存中微信Api Token为空')
					return callback(null, null)
				}
				globetoken = JSON.parse(result)
				expireTime = globetoken.expireTime || 0
				if (Date.now() > expireTime) {
					return callback(null, null)
				}
				return callback(null, globetoken)
			}).catch((err) => {
				console.log('在缓存中获取微信Api Token错误: %s', err)
				return callback(err) // callback(null, null)
			})
	}
	if (Date.now() > expireTime) {
		return callback(null, null)
	}
	return callback(null, globetoken)
}, function (token, callback) {
	globetoken = token
	expireTime = token.expireTime = Date.now() + expire
	cache.client.setex('wechat:api', expire, JSON.stringify(token))
		.then(() => {
			return callback(null, token)
		}).catch((err) => {
			console.log('向缓存中写入微信Api Token错误: %s', err)
			return callback(err)
		})
})

//初始化微信支付
var wpay = new wxpay()
wpay.init(config)
api.wxpay = wpay

bluebird.promisifyAll(api);  // 转换成promise函数  Async 
console.log(api)
module.exports = api
