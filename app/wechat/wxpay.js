var request = require("request");
var crypto = require('crypto');
var ejs = require('ejs');
var fs = require('fs');

var messageTpl = fs.readFileSync(__dirname + '/message.ejs', 'utf-8');
function createPay(){
var key = "";
var mch_id = "";
var appid = "";
var notify_url = "";
var WxPay = {
    init: function(wechat)
    {
        key = wechat.key;
        mch_id = wechat.mchID;
        notify_url = wechat.cb;
        appid = wechat.appID;
        console.log(notify_url);
        return;
         request({
            url: wechat.cb,
            method: 'POST',
            headers: {
                'ContentType': 'text/xml; charset=utf-8'
            },
            body: "<xml> <return_code>FAIL</return_code> </xml>"
        }, function(err, res, body)
        {
            console.log(err, res);
        });
    },
    getXMLNodeValue: function(node_name, xml) {
        var tmp = xml.split("<" + node_name + ">");
        var _tmp = tmp[1].split("</" + node_name + ">");
        return _tmp[0];
    },

    raw: function(args) {
        var keys = Object.keys(args);
        keys = keys.sort()
        var newArgs = {};
        keys.forEach(function(key) {
            newArgs[key] = args[key];
        });
        var string = '';
        for (var k in newArgs) {
            string += '&' + k + '=' + newArgs[k];
        }
        string = string.substr(1);
        return string;
    },

    paysignjs: function(appid, nonceStr, package, signType, timeStamp) {
        var ret = {
            appId: appid,
            nonceStr: nonceStr,
            package: package,
            signType: signType,
            timeStamp: timeStamp
        };
        var string = this.raw(ret);
        string = string + '&key=' + key;
        var sign = crypto.createHash('md5').update(string, 'utf8').digest('hex');
        return sign.toUpperCase();
    },

    paysignjsapi: function(appid, attach, body, mch_id, nonce_str, notify_url, openid, out_trade_no, spbill_create_ip, total_fee, trade_type) {
        var ret = {
            appid: appid,
            attach: attach,
            body: body,
            mch_id: mch_id,
            nonce_str: nonce_str,
            notify_url: notify_url,
            openid: openid,
            out_trade_no: out_trade_no,
            spbill_create_ip: spbill_create_ip,
            total_fee: total_fee,
            trade_type: trade_type
        };
        console.log(ret);
        var string = this.raw(ret);
        string = string + '&key=' + key; //key为在微信商户平台(pay.weixin.qq.com)-->账户设置-->API安全-->密钥设置
        var crypto = require('crypto');
        var sign = crypto.createHash('md5').update(string, 'utf8').digest('hex');
        return sign.toUpperCase();
    },

    // 随机字符串产生函数
    createNonceStr: function() {
        return Math.random().toString(36).substr(2, 15);
    },

    // 时间戳产生函数
    createTimeStamp: function() {
        return parseInt(new Date().getTime() / 1000) + '';
    },


    // 此处的attach不能为空值 否则微信提示签名错误
    order: function(ip, attach, body, openid, bookingNo, total_fee, cb) {

        var nonce_str = this.createNonceStr();
        var timeStamp = this.createTimeStamp();
        var url = "https://api.mch.weixin.qq.com/pay/unifiedorder";
        var formData = "<xml>";
        formData += "<appid>" + appid + "</appid>"; //appid
        formData += "<attach>" + attach + "</attach>"; //附加数据
        formData += "<body>" + body + "</body>";
        formData += "<mch_id>" + mch_id + "</mch_id>"; //商户号
        formData += "<nonce_str>" + nonce_str + "</nonce_str>"; //随机字符串，不长于32位。
        formData += "<notify_url>" + notify_url + "</notify_url>";
        formData += "<openid>" + openid + "</openid>";
        formData += "<out_trade_no>" + bookingNo + "</out_trade_no>";
        formData += "<spbill_create_ip>"+ip+"</spbill_create_ip>";
        formData += "<total_fee>" + total_fee + "</total_fee>";
        formData += "<trade_type>JSAPI</trade_type>";
        formData += "<sign>" + this.paysignjsapi(appid, attach, body, mch_id, nonce_str, notify_url, openid, bookingNo, ip, total_fee, 'JSAPI') + "</sign>";
        formData += "</xml>";
        //fs.writeFileSync("r.xml", formData);
        var self = this;
        request({
            url: url,
            method: 'POST',
            headers: {
                'ContentType': 'text/xml; charset=utf-8'
            },
            body: formData
        }, function(err, response, body) {
            if (!err && response.statusCode == 200) {
                console.log(body);
                var prepay_id = self.getXMLNodeValue('prepay_id', body.toString("utf-8"));
                var tmp = prepay_id.split('[');
                var tmp1 = tmp[2].split(']');
                //签名
                pkg = 'prepay_id=' + tmp1[0];
                var _paySignjs = self.paysignjs(appid, nonce_str, pkg, 'MD5', timeStamp);
                var args = {
                    appId: appid,
                    timeStamp: timeStamp,
                    nonceStr: nonce_str,
                    signType: "MD5",
                    package: pkg,
                    paySign: _paySignjs
                };
                console.log(args);
                cb(null, args);
            } else {
                console.error(err, body);
                cb({err:err, body:body});
            }
        });
    },

    //支付回调通知
    Result: function(success) {
        var output = "";
        if (success) {
            var reply = {
                return_code: "SUCCESS",
                return_msg: "OK"
            };

        } else {
            var reply = {
                return_code: "FAIL",
                return_msg: "FAIL"
            };
        }

        output = ejs.render(messageTpl, reply);
        return output;
    },
    //验证签名
    CheckSign: function(data){
        var osign = data.sign;
        delete data.sign;

        var string = this.raw(data);
        string = string + '&key=' + key; //key为在微信商户平台(pay.weixin.qq.com)-->账户设置-->API安全-->密钥设置
        var crypto = require('crypto');
        var sign = crypto.createHash('md5').update(string, 'utf8').digest('hex');
        sign = sign.toUpperCase();
        if(sign != osign)
            return false;
        return true;
    }
};
return WxPay;
}
module.exports = createPay;