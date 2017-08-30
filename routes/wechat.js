
import Router from 'koa-router'
import dyh from '../controllers/dyh'
import wechat from '../controllers/wechat'
import { wrapRoute } from '../utils/wrapRoute'
import settings from './config/settings'
var version = settings.server.version;

const router = Router({
  prefix: '/wechat'
})

//不需要token认证
let check = { isCheck: true, isToken: false } // default false, false
router.get(`/dyh/${version}/login`, wrapRoute(dyh.login, check))
router.get(`/dyh/${version}/order`, wrapRoute(dyh.order, check))
router.get(`/dyh/${version}/getusername`, wrapRoute(dyh.getusername, check))
router.get(`/dyh/${version}/wxnotify`, wrapRoute(dyh.wxnotify))
router.get(`/dyh/${version}/page`, dyh.page) //直接跳转不需要包装验证


//需要token认证
check = { isCheck: true, isToken: true }
for (let funKey in wechat) {
  router.get(`/${version}/${funKey}`, wrapRoute(wechat[funKey], check))
}
//微信第三方回调接口
router.post(`/${version}/wxnotify`, wrapRoute(wechat.wxnotify))
router.post(`/${version}/tmpcharge`, wrapRoute(wechat.tmpcharge))

module.exports = router