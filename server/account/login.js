module.exports = async (ctx, next) => {
  var ret
  if (!('result' in ctx.state) || ctx.state.result.code != 0) {
    ret = { code: 7, message: '鉴权失败' }
    ret.result = ctx.state.result.message
    ctx.body = ret
    return
  }

  ret = { code: 0, message: '请求成功' }
  ret.token = ctx.state.token
  ret.userID = ctx.query.userID
  ctx.body = ret
}
