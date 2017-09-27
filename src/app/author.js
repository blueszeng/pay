
var https = require("https");
var request = require("request");
// import fetch from 'node-fetch';

var WXAuthor =
{

	"/": function(req, res)
	{
		var code  = req.query.code;
		req.session.code = code;
		var state = req.query.state;
		req.session.state = state;
		  if(!req.session.code){
              //没有code。
           }else{
           https.get('https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid='+weChatConfig.Corpid+'&corpsecret='+weChatConfig.corpsecret,function(_res){
           _res.on('data', function(result) {
                var json = JSON.parse(result);//将josn文件转化为对象
                var accesstoken = json.access_token;
                req.session.accesstoken = accesstoken;
                //获取到accesstoken。加上code获取用户信息
               https.get('https://qyapi.weixin.qq.com/cgi-bin/user/getuserinfo?access_token='+ req.session.accesstoken+'&code='+req.session.code,function(_res){
                   _res.on('data', function(data) {
                        var jsondata = JSON.parse(data);
                        //获取到用户userid
                        req.session.UserId = jsondata.UserId;
                        req.session.DeviceId = jsondata.DeviceId;
                        res.redirect('/name');
                     });
                     }).on('error', function(e) {                                                     
                     return callback(err);
                     });
             });
             }).on('error', function(e) {
                 console.log('--------------err'+err);
                 return callback(err);
             });
           }
	}

}