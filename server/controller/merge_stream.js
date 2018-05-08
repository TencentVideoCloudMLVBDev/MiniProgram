const liveutil = require('../logic/live_util.js')
const auth = require('../logic/auth.js')

module.exports = async (ctx, next) => {
  if (!auth.checkResult(ctx)) {
    return
  }

  if (!auth.checkParams(ctx, ['roomID', 'userID', 'mergeParams'])) {
    return
  }

  /**
   * Web 端跨域只支持urlencode方式，json对象嵌套太深，urldecode会出错
   * 这里通过 json 字符串方式，算是一种兼容方案。
   */
  var mergeParams = ctx.request.body.mergeParams
  if (typeof (mergeParams) === typeof ('str')) {
    try {
      mergeParams = JSON.parse(mergeParams)
    } catch (e) {
      ctx.body = { code: 10, message: 'mergeParams 不是合法的JSON格式的字符串' }
      return
    }
  }

  var ret = {code: 0, message: '请求成功'}
  ret.result = await liveutil.mergeStream(mergeParams)
  ctx.body = ret
}
