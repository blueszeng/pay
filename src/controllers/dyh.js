

import settings from '../config/settings'
import dbMaster from '../app/dao/dbMaster'


import token from '../app/token'
import api from '../app/wechat/dyhwechat'
import ErrorCode from '../app/ErrorCode'

import { load, parseString } from '../utils/load'
import fetch from 'node-fetch'
import xml2js from 'xml2js'
import log4js from 'log4js'

//引处需要同步加载 初始化db 后才能加载 Schema
// 因为 import加载是静态异步加载,  require为同步加载 
dbMaster.Init(settings.db)  // init db
const orderManager = require("../app/dyh_orderManger").default
const userManager = require("../app/userManager").default
let userCache = require('../app/userCache');
let logger = log4js.getLogger(`${__dirname}/${__filename}`)

let product = settings.dyhProduct

const state = "6688"
/**
 * 重定向页面
 * @param {Object} ctx 
 * @param {Object} next 
 */
const page = async (ctx, next) => {
  let url = api.getAuthorizeURL('http://dlip.jdy518.com/pub/pay/dyh.html?v=ruijin', state)
  console.log(url)
  return ctx.redirect(url)
}

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
    logger.info('login', ret, userCache)
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
    console.log(ret)
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

  let ip = ctx.req.connection.remoteAddress
  console.log(ip)
  let str = "" + ip
  let arr = str.match(/((25[0-5]|2[0-4]\d|[01]?\d\d?)($|(?!\.$)\.)){4}/g)
  if (!arr || arr.length == 0) {
    str = ""
  }
  else {
    str = arr[0]
  }
  ip = str
  const { pid, uid, id } = ctx.request.query
  if (!pid || !product[pid] || !uid || !nameCache[uid]) {
    return Promise.reject({ code: ErrorCode.ParamError })
  }
  let item = product[pid]
  try {
    console.log(pid, uid, id)
    let order = await orderManager.CreateOrder(id, uid, item.fee, item.count)
    let orderId = `ruijin${order.id}`
    let pkgs = await api.wxpay.order(ip, item.attach, item.body, id, orderId, item.fee)
    let ret = { code: ErrorCode.OK, data: pkgs }
    return Promise.resolve(ret)
  } catch (err) {
    logger.info(err)
    return Promise.reject({ code: ErrorCode.OrderFailed })
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
  // console.log(load)
  try {
    let buf = await load(ctx.req)
    xml = buf.toString('utf-8')
//     xml = `<xml><appid><![CDATA[wxfe1105bf0e4beb05]]></appid>
// <attach><![CDATA[充值]]></attach>
// <bank_type><![CDATA[CFT]]></bank_type>
// <cash_fee><![CDATA[1]]></cash_fee>
// <fee_type><![CDATA[CNY]]></fee_type>
// <is_subscribe><![CDATA[Y]]></is_subscribe>
// <mch_id><![CDATA[1433459502]]></mch_id>
// <nonce_str><![CDATA[qzsig9rnncendef]]></nonce_str>
// <openid><![CDATA[owhU5wTjaXvop_zknhZYp_dNR3KM]]></openid>
// <out_trade_no><![CDATA[ruijin860000056]]></out_trade_no>
// <result_code><![CDATA[SUCCESS]]></result_code>
// <return_code><![CDATA[SUCCESS]]></return_code>
// <sign><![CDATA[BB4F94F63B9CF2B66D6334C73D1F6F4B]]></sign>
// <time_end><![CDATA[20170926170330]]></time_end>
// <total_fee>1</total_fee>
// <trade_type><![CDATA[JSAPI]]></trade_type>
// <transaction_id><![CDATA[4200000016201709264384488279]]></transaction_id>
// </xml>`
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
    let result = await parseString(xml)
    if (!result) {
      return Promise.reject(api.wxpay.Result(false))
    }
    xml = result.xml
    let obj = {}
    for (let src in xml) {
      obj[src] = xml[src][0]
    }
    result = obj
    console.log(result)
    if (result.return_code != "SUCCESS") {
      return await Promise.reject(api.wxpay.Result(false))
    }
    let passSign = api.wxpay.CheckSign(result)
    console.log(passSign)
    if (!passSign) {
      return Promise.reject(api.wxpay.Result(false))
    }
    let orderID = result.out_trade_no.replace(/ruijin/g, '')
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
    let data = await fetch(settings.server.payUrl + params)
    data = await data.json()
    if (data.code != 200) {
      logger.error("dyh request", data)
    }
    order.after = data.after
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