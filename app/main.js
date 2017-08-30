var settings = require("../config/settings");
var dbMaster = require("./dao/dbMaster");
dbMaster.Init(settings.db);
var userManager = require("./userManager");
var orderManager = require("./orderManager");
var token = require("./token");
var xml2js = require('xml2js');

var api = require("./wechat/wechat");
var async = require("async");
var request = require("request");
var logger = require('log4js').getLogger("app");
var product = settings.product;
var ErrorCode = require("./ErrorCode");

var load = function (stream, callback) {
	var buffers = [];
	stream.on('data', function (trunk) {
		buffers.push(trunk);
	});
	stream.on('end', function () {
		callback(null, Buffer.concat(buffers));
	});
	stream.once('error', callback);
};



exports.login = function (req, next) {
	var code = req.query.code;
	if (!code || !req.query.state) {
		next({ code: ErrorCode.ParamError });
		return;
	}
	var userid = "";
	var openid = "";
	async.waterfall([
		function (cb) {
			// logger.log("getUserIdByCode");
			//通过code 获取用户 userid
			api.getUserIdByCode(code, cb);

		}, function (ret, res, cb) {
			if (!ret.UserId) {
				cb({ code: ErrorCode.LoginError });
				return;
			}
			// logger.log("convertOpenid", cb);
			userid = ret.UserId;
			//转换openid
			api.convertOpenid({
				"userid": ret.UserId
			}, cb);

		}, function (ret, res, cb) {
			// logger.log("FindUserByID");
			openid = ret.openid;
			userManager.FindUserByID(openid, cb);

		}, function (user, cb) {
			if (user) {
				cb(null, user);
				return;
			}
			// logger.log("getUser");
			api.getUser(userid, function (err, ret) {
				if (err) {
					cb(err);
					return;
				}
				var phone = ret.mobile;
				// logger.log(openid, userid, phone);
				userManager.createUser(openid, userid, phone, cb)
			});
			//userManager.createUser
		}
	], function (err, user) {
		if (err) {
			//无效token 自动获取
			if (err.code == 40014) {
				api.getAccessToken(function (err, token) {

				});
			}
			logger.error(err);
			next({ code: ErrorCode.LoginError });
			return;
		}
		user.data.login = Date.now();
		user.data.save(function (err, ret) {
			if (err)
				logger.error(err);
		});

		user.token = token.create(settings.server.gameType, openid, Date.now(), settings.server.baseToken);
		// logger.log("user");
		var ret = {
			code: ErrorCode.OK,
			id: openid,
			key: user.token,
			cards: user.data.cards
		}
		next(ret);
	})
}
var userTimeCount = {
};
var product = settings.product;
exports.order = function (req, next) {
	var ip = req.connection.remoteAddress;
	var str = "" + ip;
	var arr = str.match(/((25[0-5]|2[0-4]\d|[01]?\d\d?)($|(?!\.$)\.)){4}/g);
	if (!arr || arr.length == 0)
		str = "";
	else str = arr[0];
	var ip = str;
	var pid = req.query.pid;
	if (!pid || !product[pid]) {
		next({ code: ErrorCode.ParamError });
		return;
	}
	var item = product[pid];
	// logger.log(item);
	async.waterfall([
		function (cb) {
			// logger.log(ip, pid);
			orderManager.CreateOrder(req.query.id, item.fee, item.count, cb);
		},
		function (order, cb) {
			// logger.log(order);
			api.wxpay.order(ip, item.attach, item.body, req.query.id, order.id, item.fee, cb);
		}
	],
		function (err, pkgs) {
			// logger.log(err, pkgs);
			if (err) {
				// logger.log(err);
				next({ code: ErrorCode.OrderFailed });
				return;
			}
			var ret = { code: ErrorCode.OK, data: pkgs }
			next(ret);
		});

}

exports.wxnotify = function (req, next) {
	load(req, (err, buf) => {
		if (err) {
			return next(err);
		}
		var xml = buf.toString('utf-8');
		if (!xml) {
			var emptyErr = new Error('body is empty');
			emptyErr.name = 'Wechat';
			return next(emptyErr);
		}
		xml2js.parseString(xml, { trim: true }, function (err, result) {
			if (err || !result) {
				return next(err);
			}
			var xml = result.xml;
			var obj = {};
			for (var src in xml) {
				obj[src] = xml[src][0];
			}
			result = obj;
			// logger.log(result);
			if (result.return_code == "SUCCESS") {
				var passSign = api.wxpay.CheckSign(result);
				if (!passSign) {
					return next(api.wxpay.Result(false));
				}

				var orderID = result.out_trade_no;
				orderManager.GetOrderByID(orderID, function (err, order) {
					//// logger.log("GetOrderByID",err, order);
					if (err || !order) {
						return next(api.wxpay.Result(false));
					}
					//// logger.log("GetOrderByID", result);
					if (result.result_code == "SUCCESS") {
						if (order.status != 0) {
							return next(api.wxpay.Result(true));
						}
						order.status = 1;
						//// logger.log(order);
						userManager.FindUserByID(order.uid, function (err, user) {
							// logger.log("FindUserByID",err, user);
							if (err || !user) {
								order.status = 0;
								return next(api.wxpay.Result(false));
							}
							user.data.cards += order.count;
							order.after = user.data.cards;
							order.wxid = result.transaction_id;
							// logger.log(user.data, order);
							user.data.save(function (err, ret) {
								if (!err) {
									logger.error(err);
								}
							});
							order.save(function (err, ret) {
								if (err) {
									logger.error(err);
								}
							});
							return next(api.wxpay.Result(true));
						})
						return;
					}

					return next(api.wxpay.Result(false));
				});

			}
		});
	})
}


var nameCache = {
};
exports.getusername = function (req, next) {
	var uid = req.query.uid;
	if (!uid) {
		next({ code: ErrorCode.ParamError });
		return;
	}
	if (nameCache[uid]) {
		next({ code: ErrorCode.OK, name: nameCache[uid] });
		return;
	}
	userManager.FindInGameByID(uid, function (err, ret) {
		if (err || !ret) {
			next({ code: ErrorCode.UserNotExist });
			return;
		}
		nameCache[uid] = ret.name;
		next({ code: ErrorCode.OK, name: nameCache[uid] });
		return;
	});
}

exports.getcard = function (req, next) {
	userManager.FindUserByID(req.query.id, function (err, user) {
		if (err || !user)
			return next({ code: ErrorCode.ServerIsBusy });
		var ret = { code: ErrorCode.OK, cards: user.data.cards }
		return next(ret);
	});
};

exports.sell = function (req, next) {
	var id = req.query.id;
	var uid = req.query.uid;
	var num = Math.round(req.query.num);
	console.log(uid, num);
	if (!uid || !nameCache[uid] || !num || num <= 0 || num >= 10000) {
		return next({ code: ErrorCode.ParamError });
	}
	var myUser;
	async.waterfall([
		function (cb) {
			userManager.FindUserByID(req.query.id, cb);
		},
		function (user, cb) {
			myUser = user;
			if (user.data.cards < num) {
				return cb({ code: ErrorCode.CardsNotEnough });
			}

			user.data.cards -= num;
			var params = "?uid=" + uid + "&count=" + num;
			request(settings.server.payUrl + params, cb);
		}
	], function (err, ret, body) {
			if (err) {
				return next({ code: ErrorCode.SellFailed });
			}
			console.log(err, body);
			try {
				var data = JSON.parse(body);
				if (data.code != 200) {
					myUser.data.cards += num;
					return next({ code: ErrorCode.SellFailed });
				}
				console.log(err, body, myUser.data);
				myUser.data.save(function (err, ret) {
					if (err)
						logger.error(err, myUser, data);
				});
				console.log(err, body, num);
				orderManager.CreateSellOrder(id, uid, nameCache[uid], num, data.after, function (err, ret) {
					if (err)
						logger.error("CreateSellOrder", id, pid, nameCache[uid], num, data.after);
				});
				return next({ code: ErrorCode.OK, after: data.after, cards: myUser.data.cards });
			}
			catch (e) {
				logger.error(e);
				myUser.data.cards += num;
				return next({ code: ErrorCode.SellFailed });
			}
		});

};

exports.sellhistory = function (req, next) {
	var page = Number(req.query.page);
	page = page || 0;
	orderManager.QueryOrderCount(req.query.id, function (err, count) {
		if (err) {
			return next({ code: ErrorCode.ServerIsBusy });
		}
		orderManager.QuerySellOrder(req.query.id, page, function (err, result) {
			if (err) {
				return next({ code: ErrorCode.ServerIsBusy });
			}
			var data = []
			for (var i = 0, len = result.length; i < len; i++) {

				data[i] = {
					id: result[i].id,
					pid: result[i].pid,
					name: result[i].name,
					count: result[i].count,
					date: result[i].date,
				}
			}

			var ret = { code: ErrorCode.OK, data: data, count: count };
			console.log(err, ret);
			return next(ret);
		});
	});
};

exports.buyhistory = function (req, next) {
	var page = Number(req.query.page);
	page = page || 0;

	orderManager.QueryBuyOrderCount(req.query.id, function (err, count) {
		if (err) {
			return next({ code: ErrorCode.ServerIsBusy });
		}
		orderManager.QueryBuyOrder(req.query.id, page, function (err, result) {
			if (err) {
				return next({ code: ErrorCode.ServerIsBusy });
			}
			var data = []
			for (var i = 0, len = result.length; i < len; i++) {
				//console.log(result[i]);
				data[i] = {
					id: result[i].id,
					cost: result[i].cost,
					count: result[i].count,
					date: result[i].date,
					status: result[i].status,
					wxid: result[i].wxid
				}
			}

			var ret = { code: ErrorCode.OK, data: data, count: count };
			//console.log(err, ret);
			return next(ret);
		});
	});
};

exports.tmpcharge = function (req, next) {
	var id = req.query.id;
	var num = Number(req.query.num);
	console.log(req.query);
	if (!id || !num || req.query.aha != "jdyjdyjdy")
		return next("{state:0}");
	//console.log(id, num);
	userManager.FindInGameByPhone(id, function (err, user) {
		if (err || !user) {
			return next("{state:0}");
		}
		console.log(id, user);
		logger.log(id, num);
		user.data.cards += num;
		user.data.save(function (err) {
			if (err)
				logger.error(err, user);
		});
		next("{state:1}");
	});
}