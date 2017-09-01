import fs from 'fs'
import ejs from 'ejs'
import crypto from 'crypto'
import fetch from 'node-fetch'
import settings from '../../config/settings'
import log4js from 'log4js'
const logger = log4js.getLogger(__dirname)
let messageTpl = fs.readFileSync(__dirname + '/message.ejs', 'utf-8')

function createPay() {
 
    let key = ""
    let mch_id = ""
    let appid = ""
    let notify_url = ""
    let WxPay = {
        init: function (wechat) {
            key = wechat.key
            mch_id = wechat.mchID
            notify_url = wechat.cb
            appid = wechat.appID
            logger.info(notify_url)
            fetch(wechat.cb, { method: 'POST', body: "<xml> <return_code>FAIL</return_code> </xml>" })
            .then(res => {
                logger.debug(res)
            }).catch(err => {
                logger.log(err)
            })
         },
        getXMLNodeValue: function (node_name, xml) {
            let tmp = xml.split("<" + node_name + ">")
            let _tmp = tmp[1].split("</" + node_name + ">")
            return _tmp[0]
        },

        raw: function (args) {
            let keys = Object.keys(args)
            keys = keys.sort()
            let newArgs = {}
            keys.forEach(function (key) {
                newArgs[key] = args[key]
            })
            let string = ''
            for (let k in newArgs) {
                string += '&' + k + '=' + newArgs[k]
            }
            string = string.substr(1)
            return string
        },

        paysignjs: function (appid, nonceStr, packages, signType, timeStamp) {
            let ret = {
                appId: appid,
                nonceStr: nonceStr,
                package: packages,
                signType: signType,
                timeStamp: timeStamp
            }
            let string = this.raw(ret)
            string = string + '&key=' + key
            let sign = crypto.createHash('md5').update(string, 'utf8').digest('hex')
            return sign.toUpperCase()
        },

        paysignjsapi: function (appid, attach, body, mch_id, nonce_str, notify_url, openid, out_trade_no, spbill_create_ip, total_fee, trade_type) {
            let ret = {
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
            }
            console.log(ret)
            let string = this.raw(ret)
            string = string + '&key=' + key //key为在微信商户平台(pay.weixin.qq.com)-->账户设置-->API安全-->密钥设置
            let crypto = require('crypto')
            let sign = crypto.createHash('md5').update(string, 'utf8').digest('hex')
            return sign.toUpperCase()
        },

        // 随机字符串产生函数
        createNonceStr: function () {
            return Math.random().toString(36).substr(2, 15)
        },

        // 时间戳产生函数
        createTimeStamp: function () {
            return parseInt(new Date().getTime() / 1000) + ''
        },


        // 此处的attach不能为空值 否则微信提示签名错误
        order: async function (ip, attach, body, openid, bookingNo, total_fee) {
            let nonce_str = this.createNonceStr()
            let timeStamp = this.createTimeStamp()
            let url = "https://api.mch.weixin.qq.com/pay/unifiedorder"
            let formData = "<xml>"
            formData += "<appid>" + appid + "</appid>" //appid
            formData += "<attach>" + attach + "</attach>" //附加数据
            formData += "<body>" + body + "</body>"
            formData += "<mch_id>" + mch_id + "</mch_id>" //商户号
            formData += "<nonce_str>" + nonce_str + "</nonce_str>" //随机字符串，不长于32位。
            formData += "<notify_url>" + notify_url + "</notify_url>"
            formData += "<openid>" + openid + "</openid>"
            formData += "<out_trade_no>" + bookingNo + "</out_trade_no>"
            formData += "<spbill_create_ip>" + ip + "</spbill_create_ip>"
            formData += "<total_fee>" + total_fee + "</total_fee>"
            formData += "<trade_type>JSAPI</trade_type>"
            formData += "<sign>" + this.paysignjsapi(appid, attach, body, mch_id, nonce_str, notify_url, openid, bookingNo, ip, total_fee, 'JSAPI') + "</sign>"
            formData += "</xml>"
            //fs.writeFileSync("r.xml", formData)
            let self = this
            try {
                let body = await fetch(url, { method: 'POST', body: formData }).json()
                let prepay_id = self.getXMLNodeValue('prepay_id', body.toString("utf-8"))
                let tmp = prepay_id.split('[')
                let tmp1 = tmp[2].split(']')
                //签名
                pkg = 'prepay_id=' + tmp1[0]
                let _paySignjs = self.paysignjs(appid, nonce_str, pkg, 'MD5', timeStamp)
                let args = {
                    appId: appid,
                    timeStamp: timeStamp,
                    nonceStr: nonce_str,
                    signType: "MD5",
                    package: pkg,
                    paySign: _paySignjs
                }
                return Promise.resolve(args)
            } catch (err) {
                 console.error(err, body)
                 return Promise.reject({ err: err, body: body })
            }
         },

        //支付回调通知
        Result: function (success) {
            let output = ""
            if (success) {
                let reply = {
                    return_code: "SUCCESS",
                    return_msg: "OK"
                }

            } else {
                let reply = {
                    return_code: "FAIL",
                    return_msg: "FAIL"
                }
            }

            output = ejs.render(messageTpl, reply)
            return output
        },
        //验证签名
        CheckSign: function (data) {
            let osign = data.sign
            delete data.sign

            let string = this.raw(data)
            string = string + '&key=' + key //key为在微信商户平台(pay.weixin.qq.com)-->账户设置-->API安全-->密钥设置
            let crypto = require('crypto')
            let sign = crypto.createHash('md5').update(string, 'utf8').digest('hex')
            sign = sign.toUpperCase()
            if (sign != osign)
                return false
            return true
        }
    }
    return WxPay
}
module.exports = createPay