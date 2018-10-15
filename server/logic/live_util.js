const config = require('../config')
const md5 = require('md5')
const request = require('request')
const queryString = require('querystring')

/**
 * 后台自动分配id，当前游标位置。
 */
var ids = {}
ids.user = 0
ids.room = 0

/**
 * 生成加速拉流播放地址
 */
function genAcceleratePlayUrl (userid, txTime) {
  var liveCode = config.live.bizid + '_' + userid

  var txSecret = md5(config.live.pushSecretKey + liveCode + parseInt(txTime.getTime() / 1000).toString(16).toUpperCase())

  var ext = '?' + 'bizid=' + config.live.bizid + '&txSecret=' + txSecret + '&txTime=' + parseInt(txTime.getTime() / 1000).toString(16).toUpperCase()

  var push_url = 'rtmp://' + config.live.playHost + '/live/' + liveCode + ext
  return push_url
}

/**
 * 生成推流地址
 */
function genPushUrl (userid, txTime) {
  var liveCode = config.live.bizid + '_' + userid + '_' + S4()

  var txSecret = md5(config.live.pushSecretKey + liveCode + parseInt(txTime.getTime() / 1000).toString(16).toUpperCase())

  var ext = '?' + 'bizid=' + config.live.bizid + '&txSecret=' + txSecret + '&txTime=' + parseInt(txTime.getTime() / 1000).toString(16).toUpperCase()

  var push_url = 'rtmp://' + config.live.bizid + '.livepush.myqcloud.com/live/' + liveCode + ext
  return push_url
}

/**
 * 生成混流地址
 */
function genMixedPlayUrl (userid, stream_type) {
  var liveCode = config.live.bizid + '_' + userid
  return 'https://' + config.live.playHost + '/live/' + liveCode + '.flv'
}

/**
 * 生成一组播放地址
 */
function genPlayURLs (userid, txTime) {
  var liveCode = config.live.bizid + '_' + userid

  var txSecret = md5(config.live.pushSecretKey + liveCode + parseInt(txTime.getTime() / 1000).toString(16).toUpperCase())

  var ext = '?' + 'bizid=' + config.live.bizid + '&txSecret=' + txSecret + '&txTime=' + parseInt(txTime.getTime() / 1000).toString(16).toUpperCase()

  var ret = {}
  ret.url_play_flv = 'http://' + config.live.playHost + '/live/' + liveCode + '.flv'
  ret.url_play_rtmp = 'rtmp://' + config.live.playHost + '/live/' + liveCode
  ret.url_play_hls = 'http://' + config.live.playHost + '/live/' + liveCode + '.m3u8'
  ret.url_play_acc = 'rtmp://' + config.live.playHost + '/live/' + liveCode + ext
  return ret
}

/**
 * 从推流地址中提取流ID，完整的(推流状态检查) + 去掉bizid前缀的(生成对应的播放地址)
 */
function getStreamIdFromPushUrl (pushUrl) {
  var index = pushUrl.indexOf('?')
  // console.log("?:", index)
  if (index == -1) {
    return null
  }
  var substr = pushUrl.substring(0, index)
  // console.log('substring:', substr);
  var index_2 = substr.lastIndexOf('/')
  // console.log("/:", index_2);
  var streamID = substr.substring(index_2 + 1, index)
  // console.log("streamID:", streamID)
  var prefix = config.live.bizid.toString() + '_'
  var subID = streamID.substring(prefix.length, streamID.length)
  // console.log("subID:", subID)
  return { streamID: streamID, subID: subID }
}

function S4 () {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
}

/**
 * 随机生成room_id
 */
function genRoomIdByRandom () {
  return 'room_' + (S4() + S4() + '_' + S4())
}

/**
 * 随机生成user_id
 */
function genUserIdByRandom () {
  return 'user_' + (S4() + S4() + '_' + S4())
}

/**
 * 自增生成userid
 */
function genUserId () {
  ids.user++
  var txTime = new Date()
  return 'user_' + txTime.getTime().toString() + '_' + ids.user.toString()
}

/**
 * 自增生成roomid
 */
function genRoomId () {
  ids.room++
  var txTime = new Date()
  return 'room_' + txTime.getTime().toString() + '_' + ids.room.toString()
}

/**
 *
 */
function genSign (time, userID) {
  var date = new Date()
  var t = parseInt(date.getTime() / 1000 + time)
  var sign = md5(config.live.APIKey + t.toString() + userID)
  return { txTime: t, sign: sign, userID: userID }
}

function getQueryString () {
  var date = new Date()
  var t = parseInt(date.getTime() / 1000 + 60)
  var sign = md5(config.live.APIKey + t.toString())

  var query = '?appid=' + config.live.appID.toString() + '&interface=mix_streamv2.start_mix_stream_advanced' +
    '&t=' + t.toString() + '&sign=' + sign
  return query
}

/**
 * 向云直播后台请求混流操作
 */
function mergeStream (mergeParam) {
  var data = mergeParam
  var host = 'http://fcgi.video.qcloud.com'
  var myreq = {
    url: host + '/common_access' + getQueryString(),
    form: JSON.stringify(data)
  }

  return new Promise(function (resolve, reject) {
    request.post(myreq, function (error, rsp, body) {
      if (!error && rsp.statusCode == 200) {
        try {
           resolve(JSON.parse(body))
        }catch(e){
           console.log('merge_stream call result: body is not json string')
           resolve({})
        }
      } else {
        console.log('merge_stream call result: request error')
        resolve({})
      }
    })
  })
}

/**
 * 向微信后台请求 获取openid。
 */
function jscode2Session (code) {
  var data = {
    appid: config.appId,
    secret: config.appSecret,
    js_code: code,
    grant_type: 'authorization_code'
  }
  var myreq = 'https://api.weixin.qq.com/sns/jscode2session?' + queryString.stringify(data)
  return new Promise(function (resolve, reject) {
    request.get(myreq, function (error, rsp, body) {
      if (!error && rsp.statusCode == 200) {
        resolve(JSON.parse(body))
      } else {
        reject(error)
      }
    })
  })
}

/**
 * 获取当前的时间戳 单位秒
 * ex: ts = 1509679482, 代表时间 2017-11-3 11:24:42
 */
function getTimeStamp () {
  var date = new Date()
  return parseInt(date.getTime() / 1000)
}

/**
 * 心跳超时检查流状态
 * 1000: api异常，APIKey 或者 appID错误
 * 0: 表示流在推
 * 1: 表示流不在推
 * 2: 请求出错
 */
async function getStreamStatus (streamid) {
  // 5分钟
  var SigTS = getTimeStamp() + 300

  var txSecret = md5(config.live.APIKey + SigTS).toString(32)

  var url = 'http://fcgi.video.qcloud.com/common_access?appid=' + config.live.appID.toString() + '&interface=Live_Channel_GetStatus&Param.s.channel_id=' + streamid + '&t=' + SigTS + '&sign=' + txSecret

  return new Promise(function (resolve, reject) {
    request.get(url, function (error, rsp, body) {
      // console.log('查询流结果：' + body);
      if (!error && rsp.statusCode == 200) {
        try {
          body = JSON.parse(body)
        } catch (e) {
          resolve({ ret: 1000, msg: body })
          return
        }

        if (!body.ret && body.output[0] && body.output[0].status == 1) {
          resolve({ ret: 0 })
        } else {
          resolve({ ret: 1 })
        }
      } else {
        resolve({ ret: 2 })
      }
    })
  })
}

module.exports = {
  genAcceleratePlayUrl,
  genPushUrl,
  genMixedPlayUrl,
  genPlayURLs,
  genUserId,
  genRoomId,
  genUserIdByRandom,
  genRoomIdByRandom,
  mergeStream,
  genSign,
  jscode2Session,
  getStreamStatus,
  getStreamIdFromPushUrl
}
