var settings = require("../../config/settings");
var wxpay = require('./wxpay');
var fs = require("fs");
import bluebird from 'bluebird'
//初始化订阅号
var dyhToken = null;
var dyhTime = 0;
var OAuth = require('wechat-oauth');
var accFile = "dyhToken.txt";
var api = new OAuth(settings.dyh.appID, settings.dyh.secret
    // 	, function (callback) {
    // 	if(!dyhToken){
    // 		fs.readFile(accFile, 'utf8', function (err, txt) {
    // 			if (err) {
    // 				return callback(null, null);
    // 			}
    // 			dyhToken = JSON.parse(txt);
    // 			dyhTime = dyhToken.expireTime || 0;
    // 			if(Date.now() >dyhTime)
    // 				callback(null, null);
    // 			else
    // 				callback(null, dyhToken);
    // 		});
    // 	}
    // 	else{
    // 		if(Date.now() >dyhTime)
    // 			callback(null, null);
    // 		else callback(null, dyhToken);
    // 	}
    // }, function (token, callback) {
    // 	dyhToken = token;
    // 	dyhTime = token.expireTime = Date.now()+ expire;
    // 	fs.writeFile(accFile, JSON.stringify(token), callback);
    // }
);


//初始化微信支付
var wpay = new wxpay();

wpay.init(settings.dyh);
api.wxpay = wpay;

bluebird.promisifyAll(api);  // 转换成promise函数  Async 
module.exports = api;
