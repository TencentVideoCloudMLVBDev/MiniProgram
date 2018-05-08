
const requester = require('../logic/do_request.js')
const auth = require('../logic/auth.js')

module.exports = async (ctx, next) => {
  if (!auth.checkResult(ctx)) {
    return
  }

  if (!auth.checkParams(ctx, ['roomID', 'userID', 'userName', 'userAvatar', 'pushURL'])) {
    return
  }

  await requester.doEnterRoom(ctx)
}
