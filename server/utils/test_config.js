const immgr = require('../logic/im_mgr')
const liveutil = require('../logic/live_util')

module.exports = async (ctx, next) => {
  // 云直播相关的参数
  var ret = {}
  var errflag = 0

  var liveret
  try {
    liveret = await liveutil.getStreamStatus('abc')

    // console.log(liveret)
    if (liveret.ret == 1000) {
      errflag = 1
      ret.live = {}
      ret.live.appID = '请检查 server/config.js 文件 live.appID的填写是否正确'
      ret.live.APIKey = '请检查 server/config.js 文件 live.APIKey的填写是否正确'
    }
  } catch (e) {
    console.log(e)
  }

  // 云通信相关的参数
  var imret
  try {
    imret = await immgr.createGroup('room_test', 'none')
    // console.log(imret)
    var obj = JSON.parse(imret)
    if (obj.ErrorCode == 70020) {
      errflag = 1
      ret.im = {}
      ret.im.sdkAppID = '请检查，server/config.js im.sdkAppID的填写是否正确'
    } else if (obj.ErrorCode == 60010) {
      errflag = 1
      ret.im = {}
      ret.im.administrator = '请检查, server/config.js im.administrator的填写是否正确'
    } else if (obj.ErrorCode == 70009) {
      errflag = 1
      ret.im = {}
      ret.im.privateKey = '请检查, server/config.js im.privateKey的填写是否正确, private_key 文件名以及位置放置正确'
    }
  } catch (e) {
    errflag = 1
    ret.im = {}
    ret.im.privateKey = '请检查, server/config.js im.privateKey的填写是否正确，是否包含特殊字符'
    ret.extinfo = e
  }

  if (errflag == 0) {
    ctx.body = {result: '检查正确'}
  } else {
    ret.result = '检查失败'
    ret.doc = '正确参数获取姿势 https://cloud.tencent.com/document/product/454/12554#.E5.BC.80.E9.80.9A.E7.9B.B4.E6.92.AD.E6.9C.8D.E5.8A.A1'
    ctx.body = ret
  }
}
