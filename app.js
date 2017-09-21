import path from 'path'
import Koa from 'koa'
import session from 'koa-generic-session'
import convert from 'koa-convert'
import json from 'koa-json'
import cors from 'koa-cors'
import _logger from 'koa-logger'
import bodyParser from 'koa-bodyparser'
import router from './routes'
import settings from './config/settings'
import log4js from 'log4js'

log4js.configure(settings.log)
const logger = log4js.getLogger(`${__dirname}/${__filename}`)
const app = new Koa()
app.use(convert(cors()))

app.use(convert(require('koa-static')(path.join(__dirname, './html'))))

app.use(bodyParser())

app.use(convert(json()))
app.use(convert(_logger()))

app.use(router.routes(), router.allowedMethods())

app.listen(settings.server.port, function () {
    logger.info('Listening on port %d', settings.server.port)
})

process.on('uncaughtException', function (err) {
    logger.error(' Caught exception: ' + err.stack)
})


