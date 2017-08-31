

import path from 'path'
import Koa from 'koa'
import session from 'koa-generic-session'
import convert from 'koa-convert'
import json from 'koa-json'
import cors from 'koa-cors'
// import logger from 'koa-logger'
import bodyParser from 'koa-bodyparser'

import router from './routes'
import settings from './config/settings'
import log4js from 'log4js'

const app = new Koa()
// const config = settings.wechat
log4js.configure(settings.log)

const logger = log4js.getLogger(__dirname)

app.use(convert(cors()));

app.use(convert(require('koa-static')(path.join(__dirname, './html'))))

app.use(bodyParser())

app.use(convert(json()))
// app.use(convert(logger()))

app.use(router.routes(), router.allowedMethods())

app.listen(settings.server.port, function() {  
    logger.log('Listening on port %d',settings.server.port);  
})

process.on('uncaughtException', function (err) {
	logger.error(' Caught exception: ' + err.stack)
})




// var wechat = require('wechat-enterprise')

// app.use('/sg/',wechat(config, function (req, res, next) {
//     logger.log(req.url);
//     logger.log("location", req.weixin);
//     res.status(200).end("");
// }));
