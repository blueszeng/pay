import wechat from 'wechat-enterprise'
import wXBizMsgCrypt from 'wechat-crypto'
import settings from '../../config/settings'
import { load } from '../../utils/load'
import xml2js from 'xml2js'
import Session from 'wechat-enterprise/lib/session'
import List from 'wechat-enterprise/lib/List'
import bluebird from 'bluebird'
// 转换成promise函数  Async 
const config = settings.wechat
let handle = wechat(config)

let respond = function (handler) {
    return async function (ctx, next) {
        let message = ctx.request.weixin
        let callback = handler.getHandler(message.MsgType)
        ctx.reply = function (content) {
            ctx.status = 200
            // 响应空字符串，用于响应慢的情况，避免微信重试
            if (!content) {
                return ctx.body = ''
            }
            let xml = wechat.reply(content, message.ToUserName, message.FromUserName)
            let cryptor = ctx.request.cryptor || handler.cryptor
            let wrap = {}
            wrap.encrypt = cryptor.encrypt(xml)
            wrap.nonce = parseInt((Math.random() * 100000000000), 10)
            wrap.timestamp = new Date().getTime()
            wrap.signature = cryptor.getSignature(wrap.timestamp, wrap.nonce, wrap.encrypt)
            ctx.body = wechat.encryptWrap(wrap)
        }
        ctx.end = function () {
            ctx.body = arguments
        }

        let done = async function () {
            // 如果session中有_wait标记
            if (message.MsgType === 'text' && ctx.request.wxsession && ctx.request.wxsession._wait) {
                let list = List.get(ctx.request.wxsession._wait)
                let handle = list.get(message.Content)
                let wrapper = function (message) {
                    return handler.handle ? function (ctx) {
                        ctx.reply(message)
                    } : function (info, ctx) {
                        ctx.reply(message)
                    }
                }

                // 如果回复命中规则，则用预置的方法回复
                if (handle) {
                    callback = typeof handle === 'string' ? wrapper(handle) : handle
                }
            }

            // 兼容旧API
            if (handler.handle) {
                await callback(ctx, next)
            } else {
                await callback(message, ctx, next)
            }
        }

        if (ctx.request.sessionStore) {
            let storage = req.sessionStore
            let openid = message.FromUserName + ':' + message.ToUserName
            ctx.end = function () {
                ctx.body = arguments
                if (ctx.request.wxsession) {
                    ctx.request.wxsession.save()
                }
            }
            // 等待列表
            ctx.wait = async function (name, callback) {
                let list = List.get(name)
                if (list) {
                    ctx.request.wxsession._wait = name
                    ctx.reply(list.description)
                } else {
                    let err = new Error('Undefined list: ' + name)
                    err.name = 'UndefinedListError'
                    ctx.status = 500
                    ctx.end(err.name)
                    if (callback) {
                        await callback(err)
                    }
                }
            }

            // 清除等待列表
            ctx.nowait = function () {
                delete ctx.request.wxsession._wait
                ctx.reply.apply(ctx, arguments)
            }
            bluebird.promisify(storage) 
            let session = await storage.getAsync(openid)
            if (!session) {
                ctx.request.wxsession = new Session(openid, ctx.request)
                ctx.request.wxsession.cookie = ctx.request.session.cookie
            } else {
                ctx.request.wxsession = new Session(openid, ctx.request, session)
            }
            return await done()
        }
        return await done()
    }
}

const formatMessage = function (result) {
    let message = {}
    if (typeof result === 'object') {
        for (let key in result) {
            if (!Array.isArray(result[key]) || result[key].length === 0) {
                continue
            }
            if (result[key].length === 1) {
                let val = result[key][0]
                if (typeof val === 'object') {
                    message[key] = formatMessage(val)
                } else {
                    message[key] = (val || '').trim()
                }
            } else {
                message[key] = []
                result[key].forEach(function (item) {
                    message[key].push(formatMessage(item))
                })
            }
        }
    }
    return message
}

const parseString = async function (xml, config) {
    xml2js.parseString(xml, { trim: true }, function (err, result) {
        if (err) {
            err.name = 'BadMessage' + err.name
            return Promise.reject(err)
        }
        return Promise.reject(result)
    })
}

handle.getHandler = function (type) {
    return this.handle || this.handlers[type] || async function (info, ctx, next) {
        await next()
    }
}

handle.middlewarify = function () {
    let that = this
    const WXBizMsgCrypt = wXBizMsgCrypt
    let config = this.config
    that.cryptor = new WXBizMsgCrypt(config.token, config.encodingAESKey, config.corpId)
    let _respond = respond(this)
    return async function (ctx, next) {
        const method = ctx.method
        const { timestamp, nonce } = ctx.request.query
        const signature = ctx.request.query.msg_signature
        let cryptor = ctx.request.cryptor || that.cryptor
        if (method === 'GET') {
            let echostr = ctx.request.query.echostr
            // // console.log(echostr, cryptor)
            if (signature !== cryptor.getSignature(timestamp, nonce, echostr)) {
                ctx.status = 401
                ctx.body = 'Invalid signature'
                return
            }
            let result = cryptor.decrypt(echostr)
            // TODO 检查corpId的正确性
            ctx.status = 200
            ctx.body = result.message
        } else if (method === 'POST') {
            try {
                let buf = await load(ctx.req)
                let xml = buf.toString('utf-8')
                if (!xml) {
                    let emptyErr = new Error('body is empty')
                    emptyErr.name = 'Wechat'
                    return await next(emptyErr)
                }
                let result = await parseString(xml, { trim: true })
                xml = formatMessage(result.xml)
                let encryptMessage = xml.Encrypt
                if (signature !== cryptor.getSignature(timestamp, nonce, encryptMessage)) {
                    ctx.status = 401
                    ctx.body = 'Invalid signature'
                    return
                }
                let decrypted = cryptor.decrypt(encryptMessage)
                let messageWrapXml = decrypted.message
                if (messageWrapXml === '') {
                    ctx.status = 401
                    ctx.body = 'Invalid corpid'
                    return
                }
                ctx.request.weixin_xml = messageWrapXml
                result = xml2js.parseString(messageWrapXml, { trim: true })
                ctx.request.weixin = formatMessage(result.xml)
                await _respond(ctx, next)
            } catch (err) {
                console.log(err)
                return await next(err)
            }
        } else {
            ctx.status = 501
            ctx.body = 'Not Implemented'
        }
    }
}

module.exports = handle;