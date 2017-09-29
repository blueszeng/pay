import accountUser from './dao/accountUser'
import UserModel from './dao/UserModel'
let cacheUser = {

}

function AddItem(openid, data) {
	if (cacheUser[openid])
		return cacheUser[openid]
	let item = {
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
			let item = AddItem(openid, ret)
			return Promise.resolve(item)
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
const createUser = async (openid, userid, phone) => {
	let user = new accountUser({
		id: openid, userid, phone
	})
	try {
		let ret = await user.save()
		let item = AddItem(openid, ret)
		return Promise.resolve(item)
	} catch (err) {
		return Promise.reject(err)
	}
}

const FindInGameByID = async (id) => {
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
			let item = AddItem(openid, ret)
			return Promise.resolve(item)
		}
		return Promise.resolve(null)
	} catch (err) {
		return Promise.reject(err)
	}
}


export default {
	GetUserFast,
	FindUserByID,
	createUser,
	FindInGameByID,
	FindInGameByPhone
}