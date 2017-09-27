
import Router from 'koa-router'
import dyh from '../controllers/dyh'
import wechat from '../controllers/wechat'
import { wrapRoute } from '../utils/wrapRoute'
import settings from '../config/settings'
import middleware from '../app/wechat/middleware'
let version = settings.server.version;
import log4js from 'log4js'
const logger = log4js.getLogger(`${__dirname}/${__filename}`)
const router = Router({
  prefix: '/wechat'
})

router.all('/sg',
  middleware.text(async function (message, ctx, next) {
    // TODO
    logger.info(req.url)
    logger.info("location", req.weixin)
    ctx.status = 200
    ctx.body = ""
  }).text(async function (message, ctx, next) {
    // TODO
    logger.info(req.url)
    logger.info("location", req.weixin)
    ctx.status = 200
    ctx.body = ""
  })
    .middlewarify())


//不需要token认证
let check = { isCheck: false, isToken: false } // default false, false
router.get(`/dyh/${version}/login`, wrapRoute(dyh.login, check))
router.get(`/dyh/${version}/order`, wrapRoute(dyh.order, check))
router.get(`/dyh/${version}/getusername`, wrapRoute(dyh.getusername, check))
router.post(`/dyh/${version}/wxnotify`, wrapRoute(dyh.wxnotify))
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