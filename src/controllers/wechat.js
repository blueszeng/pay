import fetch from 'node-fetch'
import log4js from 'log4js'
import xml2js from 'xml2js'
import token from '../app/token'
import { load, parseString } from '../utils/load'
import settings from '../config/settings'
import api from '../app/wechat/wechat'

import ErrorCode from '../app/ErrorCode'

const userManager = require("../app/userManager").default
const orderManager = require("../app/orderManager").default

const logger = log4js.getLogger(`${__dirname}/${__filename}`)
let product = settings.product
let nameCache = {}

/**
 * 登陆
 * @param {Object} ctx 
 * @param {Object} next 
 */
const login = async (ctx, next) => {
    const { code, state } = ctx.request.query
    if (!code || !state) {
        return Promise.reject({ code: ErrorCode.ParamError })
    }
    try {
        let ret = await api.getUserIdByCodeAsync(code)        //通过code 获取用户 userid
        if (!ret.UserId) {
            await Promise.reject({ code: ErrorCode.LoginError })  // 主动throw 
        }
        let userid = ret.UserId
        ret = await api.convertOpenidAsync({ "userid": ret.UserId })  //转换openid
        let openid = ret.openid
        let user = await userManager.FindUserByID(openid)
        if (!user) {
            ret = await api.getUserAsync(userid)
            let phone = ret.mobile
            user = await userManager.createUser(openid, userid, phone)
        }
        console.log(user)
        user.data.login = Date.now()
        await user.data.save()
        user.token = token.create(settings.server.gameType, openid, Date.now(), settings.server.baseToken)
        ret = {
            code: ErrorCode.OK,
            id: openid,
            key: user.token,
            cards: user.data.cards
        }
        return Promise.resolve(ret)

    } catch (err) {
        //无效token 自动获取
        if (err.code == 40014) {
            await api.getAccessTokenAsync()
        }
        logger.error(err)
        return Promise.reject({ code: ErrorCode.LoginError })
    }
}

/**
 * 订单
 * @param {Object} ctx  
 * @param {Object} next 
 */
const order = async (ctx, next) => {
    let ip = ctx.req.connection.remoteAddress
    let str = "" + ip
    let arr = str.match(/((25[0-5]|2[0-4]\d|[01]?\d\d?)($|(?!\.$)\.)){4}/g)
    if (!arr || arr.length == 0) {
        str = ""
    } else {
        str = arr[0]
    }
    ip = str
    const { pid, id } = ctx.request.query
    if (!pid || !product[pid]) {
        return Promise.reject({ code: ErrorCode.ParamError })
    }
    let item = product[pid]
    let pkgs
    try {
        let order = await orderManager.CreateOrder(id, item.fee, item.count)
        let orderId = `ruijin${order.id}`
        pkgs = await api.wxpay.order(ip, item.attach, item.body, id, orderId, item.fee)
        let ret = { code: ErrorCode.OK, data: pkgs }
        return Promise.resolve(ret)
    } catch (err) {
        logger.info(err)
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
        let buf = await load(ctx.req)
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

//     xml = `
//     <xml><appid><![CDATA[wxcf0528b62d7cd09e]]></appid>
// <attach><![CDATA[充值]]></attach>
// <bank_type><![CDATA[CFT]]></bank_type>
// <cash_fee><![CDATA[1]]></cash_fee>
// <fee_type><![CDATA[CNY]]></fee_type>
// <is_subscribe><![CDATA[Y]]></is_subscribe>
// <mch_id><![CDATA[1430855702]]></mch_id>
// <nonce_str><![CDATA[mrl9tjz7swu9qlw]]></nonce_str>
// <openid><![CDATA[odukqwu2PR36lHOT_Nthv5WLswZ0]]></openid>
// <out_trade_no><![CDATA[ruijin10000008]]></out_trade_no>
// <result_code><![CDATA[SUCCESS]]></result_code>
// <return_code><![CDATA[SUCCESS]]></return_code>
// <sign><![CDATA[F5555497442552E3BCB35D9A49298643]]></sign>
// <time_end><![CDATA[20170927151151]]></time_end>
// <total_fee>1</total_fee>
// <trade_type><![CDATA[JSAPI]]></trade_type>
// <transaction_id><![CDATA[4200000014201709274558215142]]></transaction_id>
// </xml>
//     `

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
        if (result.return_code != "SUCCESS") {
            return await Promise.reject(api.wxpay.Result(false))
        }
        let passSign = api.wxpay.CheckSign(result)
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
        let user = await userManager.FindUserByID(order.uid)
        if (!user) {
            order.status = 0
            return Promise.reject(api.wxpay.Result(false))
        }
        user.data.cards += order.count
        order.after = user.data.cards
        order.wxid = result.transaction_id
        await user.data.save()
        await order.save()
        return Promise.resolve(api.wxpay.Result(true))

    } catch (err) {
        logger.error(err)
        return Promise.reject(api.wxpay.Result(false))
    }
}

/**
 * 获取用户名
 * @param {Object} ctx  
 * @param {Object} next 
 */
const getusername = async (ctx, next) => {
    const { uid } = ctx.request.query
    console.log('juuiiiid', uid)
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
 * 获得用户卡片
 * @param {Object} ctx  
 * @param {Object} next 
 */
const getcard = async (ctx, next) => {
    try {
        let user = await userManager.FindUserByID(req.query.id)
        if (!user) {
            return Promise.reject({ code: ErrorCode.ServerIsBusy })
        }
        let ret = { code: ErrorCode.OK, cards: user.data.cards }
        return Promise.resolve(ret)
    } catch (err) {
        logger.error(err)
        return Promise.reject({ code: ErrorCode.ServerIsBusy })
    }
}


/**
 * 卖
 * @param {Object} ctx  
 * @param {Object} next 
 */
const sell = async (ctx, next) => {
    console.log('numb=================>er')
    const { id, uid } = ctx.request.query
    const num = Math.round(ctx.request.query.num)
    if (!uid || !nameCache[uid] || !num || num <= 0 || num >= 10000) {
        return Promise.reject({ code: ErrorCode.ParamError })
    }
    try {
        let user = await userManager.FindUserByID(id)
        let myUser = user
        if (user.data.cards < num) {
            return Promise.reject({ code: ErrorCode.CardsNotEnough })
        }
        user.data.cards -= num
        let params = "?uid=" + uid + "&count=" + num
        console.log(settings.server.payUrl + params)
        let data = await fetch(settings.server.payUrl + params)
        console.log('23423423423434');
        data = await data.json()
        if (data.code != 200) {
            myUser.data.cards += num
            return Promise.reject({ code: ErrorCode.SellFailed })
        }
        await myUser.data.save()
        let ret = orderManager.CreateSellOrder(id, uid, nameCache[uid], num, data.after)
        return Promise.resolve({ code: ErrorCode.OK, after: data.after, cards: myUser.data.cards })
    } catch (err) {
        logger.error(err)
        return Promise.reject({ code: ErrorCode.SellFailed })
    }
}


/**
 * 卖历史记录
 * @param {Object} ctx  
 * @param {Object} next 
 */
const sellhistory = async (ctx, next) => {
    let page = Number(ctx.request.query.page)
    const { id } = ctx.request.query
    page = page || 0
    try {
        let count = await orderManager.QueryOrderCount(id)
        let result = await orderManager.QuerySellOrder(id, page)
        let data = []
        for (let i = 0, len = result.length; i < len; i++) {
            data[i] = {
                id: result[i].id,
                pid: result[i].pid,
                name: result[i].name,
                count: result[i].count,
                date: result[i].date,
            }
        }
        let ret = { code: ErrorCode.OK, data: data, count: count }
        // console.log(err, ret)
        return Promise.resolve(ret)

    } catch (err) {
        logger.error(err)
        return Promise.reject({ code: ErrorCode.ServerIsBusy })
    }
}

/**
 * 购买历史记录
 * @param {Object} ctx  
 * @param {Object} next 
 */
const buyhistory = async (ctx, next) => {
    let page = Number(ctx.request.query.page)
    const { id } = ctx.request.query
    page = page || 0
    try {
        let count = await orderManager.QueryBuyOrderCount(id)
        let result = await orderManager.QueryBuyOrder(id, page)
        let data = []
        for (let i = 0, len = result.length; i < len; i++) {
            data[i] = {
                id: result[i].id,
                cost: result[i].cost,
                count: result[i].count,
                date: result[i].date,
                status: result[i].status,
                wxid: result[i].wxid
            }
        }
        let ret = { code: ErrorCode.OK, data: data, count: count }
        console.log(ret)
        return Promise.resolve(ret)

    } catch (err) {
        logger.error(err)
        return Promise.reject({ code: ErrorCode.ServerIsBusy })
    }
}

/**
 * tmpcharge
 * @param {Object} ctx  
 * @param {Object} next 
 */
const tmpcharge = async (ctx, next) => {
    let num = Number(ctx.request.query.num)
    const { id } = ctx.request.query
    if (!id || !num || req.query.aha != "jdyjdyjdy")
        return Promise.reject("{state:0}")
    try {
        let user = await userManager.FindInGameByPhone(id)
        if (!user) {
            return Promise.reject("{state:0}")
        }
        user.data.cards += num
        await user.data.save()
        return Promise.resolve("{state:1}")
    } catch (err) {
        logger.error(err)
        return Promise.reject("{state:0}")
    }
}



export default {
    login,
    order,
    wxnotify,
    getusername,
    getcard,
    sell,
    sellhistory,
    buyhistory,
    tmpcharge
}