
var ErrorCode = require("./ErrorCode");
var logger = require('log4js').getLogger("app");
var userManager = require("./userManager");
const TimeBreak = 1000;
var requestVersion = {};

var frequency = {

};


module.exports = function (req, res, cb) {
	//logger.log("filter", req.query);
	function response(result) {
		//logger.log(result);
		res.jsonp(result);
	}
	function next() {
		cb(req, response);
	}

	var id = req.query.id;
	var key = req.query.key;
	if (!id || !key) {
		if (req.route.path.indexOf("login") < 0) {
			res.status(404).end("");
			return;
		}
		cb(req, function (result) {
			if (result.code == ErrorCode.OK) {
				requestVersion[result.id] = 1;
			}
			response(result);
		});
		return;
	}



	if (!req.query._v || requestVersion[id] != req.query._v) {
		return response({ code: ErrorCode.WrongRequest, v: requestVersion[id] });
	}
	requestVersion[id]++;
	//console.log(now, frequency[id]);
	var now = Date.now();
	if (!!frequency[id] && frequency[id] > now) {
		return response({ code: ErrorCode.VisitTooMuch });
	}
	frequency[id] = now + TimeBreak;
	//logger.log("GetUserFast", req.query);
	var user = userManager.GetUserFast(req.query.id);
	if (!user) {
		res.jsonp({ code: ErrorCode.LoginFirst });
		return;
	}
	//logger.log("token", user.token);
	if (user.token != key) {
		res.jsonp({ code: ErrorCode.LoginFirst });
		return;
	}
	//logger.log(requestVersion[id] , req.query._v);

	next();
}