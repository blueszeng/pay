import ErrorCode from '../app/ErrorCode'
let userCache = require('../app/userCache')
let userManager = require("../app/userManager").default
let frequency = {}
let requestVersion = {}
const TimeBreak = 1000
const wrapRoute = (fn, ...args) => {
  return async (ctx) => {
    function response(isPost, result) {
      console.log('enter====> client', result, isPost)
      ctx.status = isPost ? 201 : 200
      ctx.body = result
    }
    const isPost = ctx.method === 'POST'
    const { id, key } = ctx.request.query
    const isCheck = args.length > 0 ? !!args[0].isCheck : false
    const isToken = args.length > 0 ? !!args[0].isToken : false
    if (isCheck) {  // 是否需要验证
      if (!id || !key) {
        if (ctx.request.path.indexOf('login') < 0) {
          ctx.status = 404
          ctx.body = ''
          return;
        }
        try {
          const result = await fn.apply(ctx, [ctx, ...args])
          if (result.code == ErrorCode.OK) {
            requestVersion[result.id] = 1;
          }
          return response(isPost, result)
        } catch (err) {
          return response(isPost, err)
        }
      }
      if (!ctx.request.query._v || requestVersion[id] != ctx.request.query._v) {
        // console.log('hooaaoaolaji')
        return response(isPost, { code: ErrorCode.WrongRequest, v: requestVersion[id] })
      }
      console.log(requestVersion[id])
      
      requestVersion[id]++;
      console.log(requestVersion[id])
      
      var now = Date.now();
      if (!!frequency[id] && frequency[id] > now) {
        return response(isPost, { code: ErrorCode.VisitTooMuch });
      }
      frequency[id] = now + TimeBreak;
      if (!isToken) {
        if (userCache[id] != key) {
          response(isPost, { code: ErrorCode.LoginFirst });
          return;
        }
      }
      if (isToken) { // 是否需要Token验证
        var user = userManager.GetUserFast(id);
        if (!user) {
          response(isPost, { code: ErrorCode.LoginFirst });
          return;
        }
        if (user.token != key) {
          response(isPost, { code: ErrorCode.LoginFirst });
          return;
        }
      }
    }
    try {
      console.log('enter===>')
      const result = await fn.apply(ctx, [ctx, ...args])
      return response(isPost, result)
    } catch (err) {
      console.log('enter==errro=>', err)
      return response(isPost, err)
    }


  }
}


const wrapAllRoute = (controllerObject, check = { isCheck: false, isToken: false }) => {
  for (let i in controllerObject) {
    if (_.isFunction(controllerObject[i])) {
      controllerObject[i] = wrapRoute(controllerObject[i], check)
    }
  }
}


export {
  wrapRoute,
  wrapAllRoute
}