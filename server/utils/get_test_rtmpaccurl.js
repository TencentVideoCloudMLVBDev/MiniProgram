const liveutil = require('../logic/live_util')
const config = require('../config')

module.exports = async (ctx, next) => {
  var txTime = new Date()
  txTime.setTime(txTime.getTime() + config.live.validTime * 1000)
  var ret = {}
  var userid = 'testclock_rtmpacc'
  ret.url_rtmpacc = liveutil.genAcceleratePlayUrl(userid, txTime)
  ctx.body = ret
}