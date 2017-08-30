
var buyHistory = require('./dao/buyHistory')
var sellHistory = require('./dao/sellHistory')
var utils = require('./utils')

var orderCache = {}
function AddItem(openid, data) {
	orderCache[openid] = data
	return data
}
const CreateOrder = async (userid, fee, count) => {
	var order = new buyHistory({
		uid: userid,
		date: Date.now(),
		status: 0,
		way: "wxe", //weichat enterprise
		cost: fee,
		count: count,
		after: 0
	})
	try {
		let ret = await order.save()
		let item = AddItem(ret.id, ret)
		return Promise.resolve(item)
	} catch (err) {
		return Promise.reject(err)
	}
}

const GetOrderByID = async (id) => {
	if (orderCache[id]) {
		return Promise.resolve(orderCache[id])
	}
	try {
		let ret = await buyHistory.findOne({ id: id })
		if (!!ret) {
			let item = AddItem(id, ret)
			return Promise.resolve(item)
		}
		return Promise.resolve(null)
	} catch (err) {
		return Promise.reject(err)
	}
}


const CreateSellOrder = async (uid, pid, name, count, after) => {
	var sellOrder = new sellHistory({
		uid,
		pid,
		name,
		date: Date.now(),
		count,
		after
	})
	try {
		let ret = await sellOrder.save()
		return Promise.resolve(ret)
	} catch (err) {
		return Promise.reject(err)
	}
}

const QuerySellOrder = async (uid, from) => {
	var query = sellHistory.find({ uid })
	query.sort({ id: -1 }).skip(from * 10).limit(10)
	try {
		let ret = await query.exec()
		return Promise.resolve(ret)
	} catch (err) {
		return Promise.reject(err)
	}
}

const QueryOrderCount = async (uid) => {
	var query = sellHistory.find({ uid })
	try {
		let ret = await query.count()
		return Promise.resolve(ret)
	} catch (err) {
		return Promise.reject(err)
	}
}

const QueryBuyOrder = async (uid, from) => {
	var query = buyHistory.find({ uid })
	query.sort({ id: -1 }).skip(from * 10).limit(10)
	try {
		let ret = await query.exec()
		return Promise.resolve(ret)
	} catch (err) {
		return Promise.reject(err)
	}
}

const QueryBuyOrderCount = async (uid) => {
	var query = buyHistory.find({ uid })
	try {
		let ret = await query.count()
		return Promise.resolve(ret)
	} catch (err) {
		return Promise.reject(err)
	}
}


export default {
	CreateOrder,
	GetOrderByID,
	CreateSellOrder,
	QuerySellOrder,
	QueryOrderCount,
	QueryBuyOrder,
	QueryBuyOrderCount
}