var settings = require("../config/settings");
var orderManager = require("./dyh_orderManger");
var userManager = require("./userManager");
var token = require("./token");
var xml2js =require('xml2js');
var api = require("./wechat/dyhwechat");
var async = require("async");
var request = require("request");
var logger = require('log4js').getLogger("app");
var product = settings.dyhProduct;
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

var state = "6688";
exports.page = function(req, res)
{
	var url = api.getAuthorizeURL('http://dlip.jdy518.com/pub/pay/dyh.html', state);
	res.redirect(url) 
}



var userCache = {

}

//filter
const TimeBreak = 1000;
var requestVersion = {};
var frequency = {

};
exports.filter = function(req, res, cb){
	function response(result)
	{
		console.log(result);
		res.jsonp(result);
	}
	function next(){
		cb(req, response);
	}
	var id = req.query.id;
	var key = req.query.key;
	if(!id|| !key)
	{
		if(req.route.path.indexOf("login") <0)
		{
			res.status(404).end("");
			return;
		}
		cb(req, function(result){
			if(result.code ==  ErrorCode.OK){
				requestVersion[result.id] = 1;
			}
			response(result);
		});
		return;
	}
	if(!req.query._v || requestVersion[id] != req.query._v)
	{
		return response({code:ErrorCode.WrongRequest, v:requestVersion[id]});
	}
	requestVersion[id]++;
	var now = Date.now();
	if(!!frequency[id] && frequency[id] > now)
	{
		return response({code:ErrorCode.VisitTooMuch});
	}
	frequency[id] = now + TimeBreak;


	if(userCache[id] != key)
	{
		res.jsonp({code:ErrorCode.LoginFirst});
		return;
	}

	next();
}

//登入相关
exports.login = function(req, next){
	var code = req.query.code;
	if(!code || req.query.state != state)
	{
		next({code: ErrorCode.ParamError});
		return;
	}
	var openid = "";
	async.waterfall([
    function(cb) {
    	//通过code 获取用户 userid
        api.getAccessToken(code, cb);
    
    }
	], function(err, ret){
		if(err)
		{
			logger.error(err);
			next({code: ErrorCode.LoginError});
			return;
		}
		openid = ret.data.openid;
		var key = token.create(settings.server.gameType, openid, Date.now(), settings.server.baseToken);
		userCache[openid] = key;
		// logger.log("user");
		var ret = {
			code: ErrorCode.OK,
			id: openid,
			key: key,
		} 
		next(ret);
	})
}

var nameCache = {
};
exports.getusername = function(req, next)
{
	var uid = req.query.uid;
	if(!uid )
	{
		next({code: ErrorCode.ParamError});
		return;
	}
	if(nameCache[uid])
	{
		next({code: ErrorCode.OK, name: nameCache[uid]});
		return;
	}
	userManager.FindInGameByID(uid, function(err, ret){
		if(err || !ret)
		{
			next({code: ErrorCode.UserNotExist});
			return;
		}
		nameCache[uid] = ret.name;
		next({code: ErrorCode.OK, name: nameCache[uid]});
		return;
	});
}

exports.order = function(req, next)
{
	var ip = req.connection.remoteAddress;
	var str = ""+ ip;
	var arr = str.match(/((25[0-5]|2[0-4]\d|[01]?\d\d?)($|(?!\.$)\.)){4}/g);
	if(!arr || arr.length == 0)
		str = "";
	else str = arr[0];
	var ip = str;
	var uid = req.query.uid;
	var pid = req.query.pid;	
	if(!pid || !product[pid] || !uid || !nameCache[uid]) 
	{
		next({code: ErrorCode.ParamError});
		return;
	}
	var item = product[pid];
	// logger.log(item);
	async.waterfall([
		function(cb){
			// logger.log(ip, pid);
			orderManager.CreateOrder(req.query.id, uid, item.fee, item.count, cb);
		},
		function(order, cb){
			// logger.log(order);
			api.wxpay.order(ip, item.attach, item.body, req.query.id, order.id, item.fee, cb);
		}
		],
		function(err, pkgs)
		{
			// logger.log(err, pkgs);
			if(err)
			{
				// logger.log(err);
				next({code:ErrorCode.OrderFailed});
				return;
			}
			var ret = {code:ErrorCode.OK, data:pkgs}
			next(ret);
		});
	
}

exports.wxnotify = function(req, next)
{
	load(req,(err, buf)=>{
        if (err) {
			return next(err);
        }
        var xml = buf.toString('utf-8');
        if (!xml) {
			var emptyErr = new Error('body is empty');
			emptyErr.name = 'Wechat';
			return next(emptyErr);
        }
        xml2js.parseString(xml, {trim: true}, function (err, result) {
			if(err || !result)
			{
				return next(err);
			}
			var xml = result.xml;
			var obj = {};
			for(var src in xml)
			{
				obj[src] = xml[src][0];
			}
			result = obj;
			// logger.log(result);
			if(result.return_code == "SUCCESS")
			{
				var passSign = api.wxpay.CheckSign(result);
				if(!passSign)
				{
					return next(api.wxpay.Result(false));
				}

				var orderID = result.out_trade_no;
				orderManager.GetOrderByID(orderID, function(err, order){
					//logger.log("GetOrderByID",err, order);
					if(err || !order)
					{
						return next(api.wxpay.Result(false));
					}
					 //logger.log("GetOrderByID", result);
					if(result.result_code == "SUCCESS")
					{
						if(order.status != 0)
						{
							return next(api.wxpay.Result(true));
						}
						order.status = 1;
						var num = Number(order.count);
						var params = "?uid="+ order.userid +"&count=" + num;
						//console.log(settings.server.payUrl + params);
						request(settings.server.payUrl + params, function(err, ret, body){
							//console.log(err,ret);
							if(err){
								logger.error(err, order);
							}
							try{
								var data = JSON.parse(body);
								if(data.code != 200)
								{
									logger.error("dyh request", data);
								}
								order.after = data.after;
								order.wxid = result.transaction_id;
								order.save(function(err, ret)
								{
									if(err){
										logger.error("order save",err);
									}
								});
							}
							catch(e){
								logger.error("notify",e);
							}
						});
					}

					return next(api.wxpay.Result(true));
				});
				
			}
        });
    })
}


