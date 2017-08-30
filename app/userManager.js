var accountUser = require('./dao/accountUser')
var UserModel = require('./dao/UserModel')
var utils = require('./utils')
var cacheUser = {

}

function AddItem(openid, data) {
	if (cacheUser[openid])
		return cacheUser[openid]
	var item = {
		data: data
	}
	cacheUser[openid] = item
	return item
}

const GetUserFast = (id) => {
	return cacheUser[id]
}

/**
 * FindUserByID
 * @param {*} openid 
 */
const FindUserByID = async (openid) => {
	if (cacheUser[openid]) {
		return Promise.resolve(cacheUser[openid])
	}
	try {
		let ret = await accountUser.findOne({ id: openid })
		if (!!ret) {
			var item = AddItem(openid, ret)
			return Promise.resolve(ret)
		}
		return Promise.resolve(null)
	} catch (err) {
		return Promise.reject(err)
	}
}

/**
 * 创建用户
 * @param  {[type]}   openid [description]
 * @param  {[type]}   userid [description]
 * @param  {[type]}   phone  [description]
 * @param  {Function} cb     [description]
 * @return {[type]}          [description]
 */
const createUser = async (openid, userid, phone, cb) => {
	var user = new accountUser({
		id: openid, userid, phone
	})
	try {
		let ret = await user.save()
		var item = AddItem(openid, ret)
		return Promise.resolve(ret)
	} catch (err) {
		return Promise.reject(err)
	}
}

const FindInGameByID = async (id, cb) => {
	try {
		let ret = await UserModel.findOne({ id: id })
		if (!!ret) {
			return Promise.resolve(ret)
		}
		return Promise.resolve(null)
	} catch (err) {
		return Promise.reject(err)
	}
}

const FindInGameByPhone = async (id, cb) => {
	try {
		let ret = await accountUser.findOne({ phone: "" + id })
		if (!!ret) {
			var item = AddItem(openid, ret)
			return Promise.resolve(ret)
		}
		return Promise.resolve(null)
	} catch (err) {
		return Promise.reject(err)
	}
}
