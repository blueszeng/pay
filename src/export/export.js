

import buyHistory from '../app/dao/buyHistory'
import account from '../app/dao/accountUser'

let hash = {};
let count = 0;

const QueryUid = async function (id) {
	try {
		let ret = await account.findOne({ id: id })
		hash[id] = ret.userid
		return Promise.resolve()
	} catch (err) {
		console.log(err)
		return Promise.reject(err)
	}
}

const QueryOrder = async function () {
	try {
		let query = buyHistory.find({ status: 1 })
		let result = await query.exec()
		for (let i = 0, len = result.length; i < len; i++) {
			hash[result[i].uid] = 0
		}
		count = 0
		for (let src in hash) {
			count++
			await QueryUid(src)
			count--;
			if (count == 0) {
				for (let i = 0, len = result.length; i < len; i++) {
					result[i].userid = hash[result[i].uid]
				}
				return Promise.resolve(result)
			}
		}
	} catch (err) {
		console.log(err)
		return Promise.reject(err)
	}
}

export default {
    QueryOrder
}