const config = require('../config.js')
const liveutil = require('../logic/live_util.js')
const auth = require('../logic/auth.js')

module.exports = async (ctx, next) => {
  if (!auth.checkResult(ctx)) {
    return
  }

  if (!auth.checkParams(ctx, ['userID'])) {
    return
  }

  var txTime = new Date()
  txTime.setTime(txTime.getTime() + config.live.validTime * 1000)

  var ret = {code: 0, message: '请求成功'}
  ret.pushURL = liveutil.genPushUrl(ctx.request.body.userID, txTime)
  ctx.body = ret
}
