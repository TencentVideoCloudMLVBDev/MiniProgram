const liveutil = require('../logic/live_util')
const config = require('../config')

module.exports = async (ctx, next) => {
  var txTime = new Date()
  txTime.setTime(txTime.getTime() + config.live.validTime * 1000)
  var userid = liveutil.genUserIdByRandom()
  var pushurl = liveutil.genPushUrl(userid, txTime)

  var playurls = liveutil.genPlayURLs(userid, txTime)
  var ret = {}
  ret.url_push = pushurl
  ret.url_play_flv = playurls.url_play_flv
  ret.url_play_rtmp = playurls.url_play_rtmp
  ret.url_play_hls = playurls.url_play_hls
  ret.url_play_acc = playurls.url_play_acc
  ctx.body = ret
}