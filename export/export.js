

var buyHistory = require("../app/dao/buyHistory");
var account = require("../app/dao/accountUser");

var hash = {};
var count = 0;
var QueryUid = function (id, cb) {
	console.log(id);
	account.findOne({ id: id }, function (err, ret) {
		console.log(id, ret);
		hash[id] = ret.userid;
		cb();
	});
}

exports.QueryOrder = function (cb) {
	var query = buyHistory.find({ status: 1 });
	query.exec(function (err, result) {
		if (err)
			return cb(err);

		console.log(result.length);
		for (var i = 0, len = result.length; i < len; i++) {
			hash[result[i].uid] = 0;
		}

		count = 0;
		for (var src in hash) {
			count++
			QueryUid(src, function () {
				count--;
				if (count == 0) {
					for (var i = 0, len = result.length; i < len; i++) {
						result[i].userid = hash[result[i].uid];
					}
					return cb(null, result);
				}
			})
		}
	});
}
