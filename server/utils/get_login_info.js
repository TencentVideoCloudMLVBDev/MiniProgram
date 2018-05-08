const liveutil = require('../logic/live_util')
const config = require('../config')
const checker = require('../logic/auth')
const immgr = require('../logic/im_mgr')
module.exports = async (ctx, next) => {

  var userID = ctx.query.userID ? ctx.query.userID : ''
  if (userID === '') {
    userID = liveutil.genUserIdByRandom()
  }

  var ret = {code: 0, message: '请求成功'}
  ret.userID = userID
  ret.sdkAppID = config.im.sdkAppID
  ret.accType = config.im.accountType
  ret.userSig = immgr.getSig(ret.userID)
  ctx.body = ret
}
