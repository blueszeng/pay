
import wechat from 'wechat-enterprise'
import fetch from 'node-fetch'

var API = wechat.API;
var postJSON = wechat.util.postJSON;
var wrapper = wechat.util.wrapper;
var extend = {};
/**
 * 转换user_id 到 openid
 * http://qydev.weixin.qq.com/wiki/index.php?title=Userid%E4%B8%8Eopenid%E4%BA%92%E6%8D%A2%E6%8E%A5%E5%8F%A3
 */
extend.convertOpenid = function (info, callback) {
  this.preRequest(this._convertOpenid, arguments);
};


/**
 * 转换user_id 到 openid
 * http://qydev.weixin.qq.com/wiki/index.php?title=Userid%E4%B8%8Eopenid%E4%BA%92%E6%8D%A2%E6%8E%A5%E5%8F%A3
 */

// extend.convertOpenid = async function (info) {

//   this.getAccessToken(function (err, token) {
//     // 如遇错误，通过回调函数传出
//     if (err) {
//       return Promise.reject(err)
//     }
//     // 暂时保存token
//     this.token = token;
//     var url = this.prefix + 'user/convert_to_openid?access_token=' + this.token.accessToken;
//     let ret = await fetch(url, { method: 'POST', body: info }).json()
//     return Promise.resolve(ret)
//   });
// }

extend.convertOpenid = async function (info, callback) {
  var url = this.prefix + 'user/convert_to_openid?access_token=' + this.token.accessToken;
  this.request(url, postJSON(info), wrapper(callback));
}

// };

API.mixin(extend);
module.exports = API;