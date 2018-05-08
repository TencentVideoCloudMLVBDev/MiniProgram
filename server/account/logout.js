const auth = require('../logic/auth.js')

module.exports = async (ctx, next) => {
  if (!auth.checkResult(ctx)) {
    return
  }

  await auth.delLoginSession(ctx.query.appID, ctx.query.instID, ctx.query.userID)

  var ret = { code: 0, message: '请求成功' }
  ctx.body = ret
}
