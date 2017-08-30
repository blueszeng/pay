let utils = require('./utils')
let dyh_order = require('./dao/dyh_order')

let orderCache = {}
function AddItem(orderid, data) {
	orderCache[orderid] = data
	return data
}
const CreateOrder = async (openid, userid, fee, count, cb) => {
	let order = new dyh_order({
		openid,
		userid,
		date: Date.now(),
		status: 0,
		way: "wx", //weichat
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

export default {
	CreateOrder,
	GetOrderByID
}