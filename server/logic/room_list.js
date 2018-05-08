const config = require('../config')
const log = require('../log')
const immgr = require('./im_mgr')
const liveutil = require('./live_util')
const md5 = require('md5')
const request = require('request')

/**
 * 获取当前的时间戳 单位秒
 * ex: ts = 1509679482, 代表时间 2017-11-3 11:24:42
 */
function getTimeStamp () {
  var date = new Date()
  return parseInt(date.getTime() / 1000)
}

var RoomMgr = function (name) {
  /**
   * 房间名，live_room 特指cdn直播 + 连麦房
   */
  this.name = name

  /**
   * 房间列表
   */
  this.rooms = {}

  /**
   * cdn 直播播放的观众
   */
  this.audiences = {}
}

/**
 * 房间是否存在
 */
RoomMgr.prototype.isRoomExist = function (roomID) {
  return !!this.rooms[roomID]
}

/**
 * 是否是房间创建者
 */
RoomMgr.prototype.isRoomCreator = function (roomID, userID) {
  if (this.rooms[roomID] && this.rooms[roomID].roomCreator == userID) {
    return true
  }
  return false
}

/**
 * 创建房间
 */
RoomMgr.prototype.createRoom = function (roomID, roomInfo) {
  var room = {
    roomID: roomID,
    roomInfo: roomInfo,
    actived: false,
    pushers: {}
  }

  this.rooms[roomID] = room
}

/**
 * 新增房间并进房
 */
RoomMgr.prototype.addRoom = function (roomID, userID, mixedURL, userName, userAvatar, pushURL, accelerateURL) {
  var room = {
    roomID: roomID,
    roomInfo: '',
    roomCreator: userID,
    mixedPlayURL: mixedURL,
    custom: {},
    actived: true,
    pushers: {}
  }

  var IDs = liveutil.getStreamIdFromPushUrl(pushURL)

  room.pushers[userID] = {
    userID: userID,
    userName: userName,
    userAvatar: userAvatar,
    pushURL: pushURL,
    streamID: IDs.streamID,
    accelerateURL: accelerateURL,
    timestamp: getTimeStamp()
  }
  this.rooms[roomID] = room
}

/**
 * 删除房间
 */
RoomMgr.prototype.delRoom = function (roomID) {
  delete this.rooms[roomID]
}

/**
 * 新增推流者 - 进房
 */
RoomMgr.prototype.addPusher = function (roomID, userID, userName, userAvatar, pushURL, accelerateURL) {
  var room = this.getRoom(roomID)
  var IDs = liveutil.getStreamIdFromPushUrl(pushURL)
  var mixedURL = liveutil.genMixedPlayUrl(IDs.subID, 'flv')
  if (room) {
    if (room.actived == false) {
      room.actived = true
      room.roomCreator = userID
      room.mixedPlayURL = mixedURL
      room.custom = {}
    }

    var pusher = room.pushers[userID]
    if (pusher) {
      pusher.userName = userName
      pusher.userAvatar = userAvatar
      pusher.pushURL = pushURL
      pusher.streamID = IDs.streamID
      pusher.accelerateURL = accelerateURL
      pusher.timestamp = getTimeStamp()
    } else {
      var newPusher = {
        userID: userID,
        userName: userName,
        userAvatar: userAvatar,
        pushURL: pushURL,
        streamID: IDs.streamID,
        accelerateURL: accelerateURL,
        timestamp: getTimeStamp()
      }
      room.pushers[userID] = newPusher
    }
  }
}

/**
 * 删除推流者 - 退房
 */
RoomMgr.prototype.delPusher = function (roomID, userID) {
  var creatorCanDestroyRoom = true;
  if (this.name == 'double_room') {
    creatorCanDestroyRoom = config.double_room.creatorCanDestroyRoom;
  } else if (this.name == 'multi_room') {
    creatorCanDestroyRoom = config.multi_room.creatorCanDestroyRoom;
  }
  if (this.isRoomCreator(roomID, userID) && creatorCanDestroyRoom) {
    this.delRoom(roomID)
    // notify
    immgr.destroyGroup(roomID)
  } else {
    if (this.isPusher(roomID, userID)) {
      var room = this.getRoom(roomID)
      if (room) {
        delete room.pushers[userID]
        if (!creatorCanDestroyRoom) {
          //房间没有人推流时，删除该房间
          if (room.pushers && Object.getOwnPropertyNames(room.pushers).length <= 0) {
            this.delRoom(roomID)
            immgr.destroyGroup(roomID)
            return;
          }
        }
        // notify
        immgr.notifyPushersChange(roomID)
      }
    }
  }
}

/**
 *
 */
RoomMgr.prototype.isPusher = function (roomID, userID) {
  var room = this.rooms[roomID]
  if (room) {
    var pusher = room.pushers[userID]
    if (pusher) {
      return true
    }
  }
  return false
}

/**
 * 获取房间推流者人数
 */
RoomMgr.prototype.getPusherCnt = function (roomID) {
  var room = this.getRoom(roomID)
  if (room) {
    return Object.getOwnPropertyNames(room.pushers).length
  }
}

/**
 * 新增观众 - liveroom专用
 */
RoomMgr.prototype.addAudience = function (roomID, userID, userInfo) {
  if (!this.audiences[roomID]) {
    this.audiences[roomID] = { count: 0, audiences: {} }
  }
  this.audiences[roomID].count++
  if (Object.getOwnPropertyNames(this.audiences[roomID].audiences).length + 1 > config.live_room.maxAudiencesLen) {
    return { code: 1, message: '观众列表满了' }
  } else {
    this.audiences[roomID].audiences[userID] = userInfo
    return { code: 0, message: '请求成功' }
  }
}

/**
 * 删除观众 - liveroom专用
 */
RoomMgr.prototype.delAudience = function (roomID, userID) {
  if (this.audiences[roomID]) {
    this.audiences[roomID].count--
    delete this.audiences[roomID].audiences[userID]
  }
}

/**
 * 获取观众列表 - liveroom专用
 */
RoomMgr.prototype.getAudiences = function (roomID) {
  var ret = {
    count: 0,
    audiences: []
  }
  if (this.audiences[roomID]) {
    ret.count = this.audiences[roomID].count
    for (var i in this.audiences[roomID].audiences) {
      var audience = { userID: i, userInfo: this.audiences[roomID].audiences[i] }
      ret.audiences.push(audience)
    }
  }
  return ret
}

/**
 * 设置自定义计数类字段 - liveroom专用
 *
 */
RoomMgr.prototype.setCustomInfo = function (roomID, fieldName, op, value) {
  var room = this.getRoom(roomID)
  if (room) {
    // 若 custom 不存在，初始化为空
    if (!('custom' in room)) {
      room.custom = {}
    }

    // 若要设置的key 不存在，初始化为0
    if (!(fieldName in room.custom)) {
      room.custom[fieldName] = 0
    }

    if (op === 'inc') {
      room.custom[fieldName]++
    } else if (op === 'dec') {
      room.custom[fieldName]--
    }

    return JSON.stringify({ result: 0, custom: room.custom })
  } else {
    return JSON.stringify({ result: 1, custom: {} })
  }
}

/**
 * 获取自定义字段 - liveroom专用
 */
RoomMgr.prototype.getCustomInfo = function (roomID) {
  var room = this.getRoom(roomID)
  if (room) {
    if ('custom' in room) {
      return JSON.stringify(room.custom)
    }
  }

  return JSON.stringify({})
}

/**
 * 心跳超时检查
 * timeout 过期时间，单位秒
 */
RoomMgr.prototype.onTimerCheckHeartBeat = function (timeout) {
  /**
   * 遍历房间每个成员，检查pusher的时间戳是否超过timeout
   */
  var nowTS = getTimeStamp()
  for (var i in this.rooms) {
    if (this.rooms[i].actived == true) {
      for (var j in this.rooms[i].pushers) {
        if (this.rooms[i].pushers[j].timestamp + timeout < nowTS) {
          // 心跳超时
          var roomID = this.rooms[i].roomID
          var userID = this.rooms[i].pushers[j].userID
          var streamID = this.rooms[i].pushers[j].streamID
          var that = this
          /**
           * 查询推流状态
           */
          !(function (that, roomID, userID, streamID) {
            getStreamStatus(streamID, function () {
              log.info('查询流状态推流中，补一个心跳')
              that.setHeartBeat(roomID, userID)
            }, function (result) {
              log.info('查询流状态断流，删除用户')
              // 流状态为非正在推流的情况下，不做任何操作
              if (result.ret == 1) {
                that.delPusher(roomID, userID)
              }
            })
          })(that, roomID, userID, streamID)
        }
      }
    }
  }
  var endTS = getTimeStamp()
  console.log('check heartbeat use time:' + (endTS - nowTS) + 's of ' + this.name)
}

/**
 * 获取房间
 */
RoomMgr.prototype.getRoom = function (roomID) {
  return this.rooms[roomID]
}

/**
 * 获取房间列表
 */
RoomMgr.prototype.getRoomList = function (index, count) {
  var roomlist = []
  var cursor = 0
  var roomcnt = 0
  for (var i in this.rooms) {
    if (this.rooms[i].actived == true) {
      if (cursor >= index) {
        var room = {
          roomID: this.rooms[i].roomID,
          roomInfo: this.rooms[i].roomInfo,
          roomCreator: this.rooms[i].roomCreator,
          mixedPlayURL: this.rooms[i].mixedPlayURL,
          custom: this.rooms[i].custom
        }
        var pushers = []
        for (var j in this.rooms[i].pushers) {
          var pusher = {
            userID: this.rooms[i].pushers[j].userID,
            userName: this.rooms[i].pushers[j].userName,
            userAvatar: this.rooms[i].pushers[j].userAvatar,
            pushURL: this.rooms[i].pushers[j].pushURL,
            accelerateURL: this.rooms[i].pushers[j].accelerateURL
          }
          pushers.push(pusher)
        }
        room.pushers = pushers

        roomlist.push(room)
        roomcnt++
        if (roomcnt < count) {
          continue
        } else {
          break
        }
      } else {
        cursor++
        continue
      }
    }
  }
  return roomlist
}

/**
 * 心跳更新
 */
RoomMgr.prototype.setHeartBeat = function (roomID, userID) {
  var room = this.rooms[roomID]
  if (room) {
    var pusher = room.pushers[userID]
    if (pusher) {
      pusher.timestamp = getTimeStamp()
    }
  }
}

/**
 * 辅助功能函数 - 心跳超时检查流状态
 * 0: 流状态是推流中
 * 1: 流状态是断流
 * 2: 网络请求错误
 */
function getStreamStatus (streamid, success, fail) {
  // 5分钟
  var SigTS = getTimeStamp() + 300

  var txSecret = md5(config.live.APIKey + SigTS).toString(32)

  var url = 'http://fcgi.video.qcloud.com/common_access?appid=' + config.live.appID.toString() + '&interface=Live_Channel_GetStatus&Param.s.channel_id=' + streamid + '&t=' + SigTS + '&sign=' + txSecret

  request.get(url, function (error, rsp, body) {
    log.info('查询流结果：' + body)
    if (!error && rsp.statusCode == 200) {
      try {
        body = JSON.parse(body)
      } catch (e) {
        body = { ret: 1000 }
      }
      if (!body.ret && body.output[0] && body.output[0].status == 1) {
        success && success({ ret: 0 })
      } else {
        fail && fail({ ret: 1 })
      }
    } else {
      fail && fail({ ret: 2 })
    }
  })
}

module.exports = RoomMgr
