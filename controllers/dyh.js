

import settings from '../config/settings'
import dbMaster from '../app/dao/dbMaster'


import token from '../app/token'
import api from '../app/wechat/dyhwechat'
import ErrorCode from '../app/ErrorCode'
import fetch from 'node-fetch'
import xml2js from 'xml2js'
import log4js from 'log4js'

//引处需要同步加载 初始化db 后才能加载 Schema
// 因为 import加载是静态异步加载,  require为同步加载 
dbMaster.Init(settings.db)  // init db
const orderManager = require("../app/dyh_orderManger")
const userManager = require("../app/userManager")
let logger = log4js.getLogger(__dirname)



const state = "6688"
/**
 * 重定向页面
 * @param {Object} ctx 
 * @param {Object} next 
 */
const page = async (ctx, next) => {
  let url = api.getAuthorizeURL('http://dlip.jdy518.com/pub/pay/dyh.html', state)
  return ctx.redirect(url)
}

let userCache = {}
let nameCache = {}

//filter
const TimeBreak = 1000
let requestVersion = {}
let frequency = {}

/**
 * 登陆
 * @param {Object} ctx 
 * @param {Object} next 
 */
const login = async (ctx, next) => {
  const { code } = ctx.request.query
  if (!code || ctx.request.query.state != state) {
    return Promise.reject({ codec: ErrorCode.ParamError })
  }
  try {
    let ret = await api.getAccessTokenAsync(code)
    let openid = ret.data.openid
    let key = token.create(settings.server.gameType, openid, Date.now(), settings.server.baseToken)
    userCache[openid] = key
    ret = {
      code: ErrorCode.OK,
      id: openid,
      key: key,
    }
    return Promise.resolve(ret)
  } catch (err) {
    logger.error(err)
    return Promise.reject({ code: ErrorCode.LoginError })
  }
}



/**
 * 获取用户名
 * @param {Object} ctx  
 * @param {Object} next 
 */
const getusername = async (ctx, next) => {
  const { uid } = ctx.request.query
  if (!uid) {
    return Promise.reject({ code: ErrorCode.ParamError })
  }
  if (nameCache[uid]) {
    return Promise.reject({ code: ErrorCode.OK, name: nameCache[uid] })
  }
  try {
    let ret = await userManager.FindInGameByID(uid)
    if (!ret) {
      return Promise.reject({ code: ErrorCode.UserNotExist })
    }
    nameCache[uid] = ret.name
    return Promise.resolve({ code: ErrorCode.OK, name: nameCache[uid] })
  } catch (err) {
    logger.error(err)
    return Promise.reject({ code: ErrorCode.UserNotExist })
  }
}




/**
 * 订单
 * @param {Object} ctx  
 * @param {Object} next 
 */
const order = async (ctx, next) => {
  let ip = req.connection.remoteAddress
  let str = "" + ip
  let arr = str.match(/((25[0-5]|2[0-4]\d|[01]?\d\d?)($|(?!\.$)\.)){4}/g)
  if (!arr || arr.length == 0) {
    str = ""
  }
  else {
    str = arr[0]
  }
  ip = str
  const { pid, uid } = ctx.request.query
  if (!pid || !product[pid] || !uid || !nameCache[uid]) {
    return Promise.reject({ code: ErrorCode.ParamError })
  }
  let item = product[pid]
  try {
    let order = await orderManager.CreateOrder(req.query.id, uid, item.fee, item.coun)
    let pkgs = await api.wxpay.order(ip, item.attach, item.body, req.query.id, order.id, item.fee)
    let ret = { code: ErrorCode.OK, data: pkgs }
    return Promise.resolve(ret)
  } catch (err) {
    logger.log(err)
    Promise.reject({ code: ErrorCode.OrderFailed })
  }
}




/**
 * 微信通知
 * @param {Object} ctx  
 * @param {Object} next 
 */
const wxnotify = async (ctx, next) => {
  let xml
  // load dowload xml file
  try {
    let buf = await load(ctx)
    xml = buf.toString('utf-8')
    if (!xml) {
      let emptyErr = new Error('body is empty')
      emptyErr.name = 'Wechat'
      await Promise.reject(emptyErr)
    }
  } catch (err) {
    logger.error(err)
    return Promise.reject(err)
  }

  // parse xml and operator save data
  try {
    let result = await xml2js.parseString(xml, { trim: true })
    if (!result) {
      return Promise.reject(api.wxpay.Result(false))
    }
    let xml = result.xml
    let obj = {}
    for (let src in xml) {
      obj[src] = xml[src][0]
    }
    result = obj
    if (result.return_code != "SUCCESS") {
      return await Promise.reject(api.wxpay.Result(false))
    }
    let passSign = api.wxpay.CheckSign(result)
    if (!passSign) {
      return Promise.reject(api.wxpay.Result(false))
    }
    let orderID = result.out_trade_no
    let order = await orderManager.GetOrderByID(orderID)
    if (!order) {
      return Promise.reject(api.wxpay.Result(false))
    }
    if (result.result_code != "SUCCESS") {
      return await Promise.reject(api.wxpay.Result(false))
    }
    if (order.status != 0) {
      return Promise.resolve(api.wxpay.Result(true))
    }
    order.status = 1
    let num = Number(order.count)
    let params = "?uid=" + order.userid + "&count=" + num
    let data = await fetch(settings.server.payUrl + params).json()
    if (data.code != 200) {
      logger.error("dyh request", data)
    }
    order.after = data.after
    order.wxid = result.transaction_id

    let user = await userManager.FindUserByID(order.uid)
    if (!user) {
      // order.status = 0
      return Promise.reject(api.wxpay.Result(false))
    }
    user.data.cards += order.count
    order.after = user.data.cards
    order.wxid = result.transaction_id
    await order.save()
    return Promise.resolve(api.wxpay.Result(true))

  } catch (err) {
    logger.error(err)
    return Promise.reject(api.wxpay.Result(false))
  }
}



export default {
  page,
  login,
  getusername,
  order,
  wxnotify
}