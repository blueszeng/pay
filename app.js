

import path from 'path'
import Koa from './extendlib/koa.io' // extend socket.io 
import session from 'koa-generic-session'
import convert from 'koa-convert'
import json from 'koa-json'
import cors from 'koa-cors'
import logger from 'koa-logger'
import bodyParser from 'koa-bodyparser'

import config from './configs/config'
import router from './routes'
import middlewares from './middlewares'
import crypto from './utils/crypto'
import ioRoute from './socket/routes'
import settings from './config/settings'

const config = settings.wechat
import log4js from 'log4js'
log4js.configure(settings.log)
// var main = require('./app/main');
// var filter = require("./app/filter");
const logger = log4js.getLogger('app')
// app.use(express.static('html'))




app.use(convert(cors()));

app.use(convert(require('koa-static')(path.join(__dirname, './html'))))

app.use(bodyParser())

app.use(convert(json()))
app.use(convert(logger()))

app.use(router.routes(), router.allowedMethods())

app.listen(config.port)



process.on('uncaughtException', function (err) {
	logger.error(' Caught exception: ' + err.stack)
})




var wechat = require('wechat-enterprise')


app.use('/sg/',wechat(config, function (req, res, next) {

    logger.log(req.url);
    logger.log("location", req.weixin);
//     res.reply([
//     {
//       title: 'ä½ æ¥æˆ‘å®¶æŽ¥æˆ‘å?,
//       description: 'è¿™æ˜¯å¥³ç¥žä¸Žé«˜å¯Œå¸…ä¹‹é—´çš„å¯¹è¯?,
//       picurl: 'http://nodeapi.cloudfoundry.com/qrcode.jpg',
// url: "https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxcf0528b62d7cd09e&redirect_uri=http%3a%2f%2fwww.jdy518.com/weichat.html&response_type=code&scope=SCOPE&state=1288Aa#wechat_redirect"
//     }
//   ]);
        res.status(200).end("");
}));

var version = settings.server.version;
// function createcb(src, cb)
// {
// 	var path = "/" + version + "/" + src;
// 	//logger.log(path);
// 	app.get(path, function (req, res) {
// 		console.log(req.url, req.query);
// 		filter(req, res, cb);
// 	});
// }

for(var src in main)
{	
	if(src == "wxnotify")
	{
		var notify_methon= main[src];
		app.post("/"+version + "/" + src, function(req, res){
			console.log(req.url, req.query);
			notify_methon(req, function(data){
				res.status(200).end(data);
			});
		});
		continue;
	}
	else if(src == "tmpcharge"){
		app.get("/tmpcharge", function (req, res) {
			main.tmpcharge(req,function(data){
				res.jsonp(data);
			});
		});
	}
	createcb(src, main[src]);
}

var dyh = require('./app/dyh');
var dyhFilter = dyh.filter;
function createApi(api, cb)
{
	var path = "/dyh/" + version + "/" + api;
	console.log(path);
	app.get(path, function (req, res) {
		console.log(req.url, req.query);
		dyhFilter(req, res, cb);
	});
}

app.post("/dyh/"+version + "/wxnotify", function(req, res){
	console.log(req.url, req.query);
	dyh.wxnotify(req, function(data){
		res.status(200).end(data);
	});
});
app.get("/dyh/"+version + "/page", function(req, res){
	console.log(req.url, req.query);
	dyh.page(req, res);
});
createApi("login", dyh.login);
createApi("order", dyh.order);
createApi("getusername", dyh.getusername);

// var crypto = require("crypto");
// app.get("/sgp/", function (req, res) {
// 	console.log(require.url);
//     var echostr, nonce, signature, timestamp;
//     signature = req.query.signature;
//     timestamp = req.query.timestamp;
//     nonce = req.query.nonce;
//     echostr = req.query.echostr;
//     if(check(timestamp,nonce,signature,"yJToEIfucCJOUIdLzSUUaf0zNL")){
//         return res.send(echostr);
//     }else{
//         return res.end();
//     }
// });

// function check(timestamp, nonce, signature ,token) {
//     var currSign, tmp;
//     tmp = [token, timestamp, nonce].sort().join("");
//     currSign = crypto.createHash("sha1").update(tmp).digest("hex");
//     return currSign === signature;
// };
var server = app.listen(settings.server.port, function() {  
    logger.log('Listening on port %d',server.address().port);  
});

process.on('uncaughtException', function (err) {
	logger.error(' Caught exception: ' + err.stack);
});
