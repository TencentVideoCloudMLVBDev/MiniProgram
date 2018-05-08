const CRoomList = require('./room_list')
const config = require('../config')

var RoomFactory = function () {
  /**
   * 双人 实时音视频房间列表管理对象
   */
  this.double_room = new CRoomList('double_room')

  /**
   * 多人 实时音视频房间列表管理对象
   */
  this.multi_room = new CRoomList('multi_room')

  /**
   * 直播-连麦 音视频房间列表管理对象
   */
  this.live_room = new CRoomList('live_room')
}

RoomFactory.prototype.getRoomList = function (roomtype) {
  if (roomtype == 'double_room') {
    return this.double_room
  } else if (roomtype == 'multi_room') {
    return this.multi_room
  } else if (roomtype == 'live_room') {
    return this.live_room
  } else {
    return null
  }
}

var roomFac = new RoomFactory()

/**
 * 心跳检查
 * 会定时检查，房间成员的心跳是否超时，超时时间由config.double_room.heartBeatTimeout指定。
 * 当房间成员为空，也会将对应的房间删除。
 */
function onTimer () {
  roomFac.getRoomList('double_room').onTimerCheckHeartBeat(config.double_room.heartBeatTimeout)
  roomFac.getRoomList('multi_room').onTimerCheckHeartBeat(config.multi_room.heartBeatTimeout)
  roomFac.getRoomList('live_room').onTimerCheckHeartBeat(config.live_room.heartBeatTimeout)
}

/**
 * 默认每隔 5s 检查一次心跳
 */
setInterval(onTimer, 5 * 1000)

/**
 * 房间自定义信息接口 - 设置自定义字段
 */
async function setCustomField (roomID, key, op, value, roomtype) {
  var roommgr = roomFac.getRoomList(roomtype)

  var r = await roommgr.setCustomInfo(roomID, key, op, value)

  if (r.result == 0) {
    var ret = { code: 0, message: '请求成功' }
    ret.custom = JSON.stringify(r.custom)
    return ret
  } else {
    var ret = { code: 0, message: '房间不存在' }
    ret.custom = JSON.stringify({})
    return ret
  }
}

/**
 * 房间自定义信息接口 - 获取自定义信息
 */
async function getCustomInfo (roomID, roomtype) {
  var roommgr = roomFac.getRoomList(roomtype)
  return await roommgr.getCustomInfo(roomID)
}

/**
 * 房间操作接口 - isRoomExist 判断房间是否存在
 */
async function isRoomExist (roomID, roomtype) {
  var roommgr = roomFac.getRoomList(roomtype)
  return await roommgr.isRoomExist(roomID)
}

/**
 * 房间操作接口 - isRoomCreator 判断是否是房间的创建者
 */
async function isRoomCreator (roomID, userID, roomtype) {
  var roommgr = roomFac.getRoomList(roomtype)
  return await roommgr.isRoomCreator(roomID, userID)
}

/**
 * 房间操作接口 - 创建空房间
 */
async function createRoom (roomID, roomInfo, roomtype) {
  var roommgr = roomFac.getRoomList(roomtype)
  return await roommgr.createRoom(roomID, roomInfo)
}

/**
 * 房间操作接口 - addRoom 创建房间
 */
async function addRoom (roomID, roomInfo, userID, mixedURL, userName, userAvatar, pushURL, accelerateURL, roomtype) {
  var roommgr = roomFac.getRoomList(roomtype)
  return await roommgr.addRoom(roomID, roomInfo, userID, mixedURL, userName, userAvatar, pushURL, accelerateURL)
}

/**
 * 房间操作接口 - delRoom 删除房间
 * 无返回
 */
async function delRoom (roomID, roomtype) {
  var roommgr = roomFac.getRoomList(roomtype)
  await roommgr.delRoom(roomID)
}

/**
 * 房间操作接口 - getRoomMembers 获取房间所有成员信息
 * 成功则返回房间信息。
 * 失败返回null。
 */
async function getRoomMembers (roomID, roomtype) {
  var roommgr = roomFac.getRoomList(roomtype)
  var room = await roommgr.getRoom(roomID)
  var j = 0
  if (room) {
    if (room.actived == false) {
      return null
    }

    var ret = {
      roomID: room.roomID,
      roomInfo: room.roomInfo,
      roomCreator: room.roomCreator,
      mixedPlayURL: room.mixedPlayURL,
      custom: JSON.stringify(room.custom),
      pushers: []
    }

    for (j in room.pushers) {
      var member = {
        userID: room.pushers[j].userID,
        userName: room.pushers[j].userName,
        userAvatar: room.pushers[j].userAvatar,
        accelerateURL: room.pushers[j].accelerateURL
      }

      ret.pushers.push(member)
    }
    return ret
  }
  return null
}

/**
 * 房间成员操作接口 - isMember 判断房间是否存在指定的成员
 * 存在返回true
 * 不存在返回false
 */
async function isMember (roomID, userID, roomtype) {
  var roommgr = roomFac.getRoomList(roomtype)
  return roommgr.isPusher(roomID, userID)
}

/**
 * 房间成员操作接口 - getMemberCnt 获取房间当前成员数量
 * 房间存在返回成员个数
 * 房间不存在返回 -1.
 */
async function getMemberCnt (roomID, roomtype) {
  var roommgr = roomFac.getRoomList(roomtype)
  return roommgr.getPusherCnt(roomID)
}

/**
 * 房间成员操作接口 - addMember 新增房间成员
 */
async function addMember (roomID, userID, userName, userAvatar, pushURL, accelerateURL, roomtype) {
  var roommgr = roomFac.getRoomList(roomtype)

  await roommgr.addPusher(roomID, userID, userName, userAvatar, pushURL, accelerateURL)
}

/**
* 房间成员操作接口 - delMember 删除房间成员
 */
async function delMember (roomID, userID, roomtype) {
  var roommgr = roomFac.getRoomList(roomtype)
  await roommgr.delPusher(roomID, userID)
}

/**
 * 房间成员操作接口 - updateMember 更新房间成员的属性
 */
async function updateMember (roomID, userID, userName, userAvatar, pushURL, accelerateURL, roomtype) {
  var roommgr = roomFac.getRoomList(roomtype)
  await roommgr.addPusher(roomID, userID, userName, userAvatar, pushURL, accelerateURL)
  await updateMemberTS(roomID, userID, roomtype)
}

/**
 * 房间成员操作接口 - 更新房间成员的保活时间戳
 */
async function updateMemberTS (roomID, userID, roomtype) {
  var roommgr = roomFac.getRoomList(roomtype)
  await roommgr.setHeartBeat(roomID, userID)
}

/**
 * 获取房间列表
 * cnt 期望返回的个数
 * withmemebers 是否返回房间成员列表
 */
async function getRoomList (cnt, startpos, withpushers, roomtype) {
  var roommgr = roomFac.getRoomList(roomtype)
  var rooms = await roommgr.getRoomList(startpos, cnt)
  var ret = []
  var i = 0
  var j = 0
  if (withpushers) {
    for (i in rooms) {
      var room = {
        roomID: rooms[i].roomID,
        roomInfo: rooms[i].roomInfo,
        roomCreator: rooms[i].roomCreator,
        mixedPlayURL: rooms[i].mixedPlayURL,
        custom: JSON.stringify(rooms[i].custom)
      }

      if (roomtype == 'live_room') {
        var audiences = await roommgr.getAudiences(room.roomID)
        room.audienceCount = audiences.count
      }

      var pushers = []
      for (j in rooms[i].pushers) {
        var pusher = {
          userID: rooms[i].pushers[j].userID,
          userName: rooms[i].pushers[j].userName,
          userAvatar: rooms[i].pushers[j].userAvatar,
          accelerateURL: rooms[i].pushers[j].accelerateURL
        }
        pushers.push(pusher)
      }
      room.pushers = pushers
      ret.push(room)
    }
  } else {
    for (i in rooms) {
      var simpleroom = {
        roomID: rooms[i].roomID,
        roomInfo: rooms[i].roomInfo,
        roomCreator: rooms[i].roomCreator,
        mixedPlayURL: rooms[i].mixedPlayURL,
        custom: JSON.stringify(rooms[i].custom)
      }
      ret.push(simpleroom)
    }
  }
  return ret
}

/**
 *
 */
async function addAudience (roomID, userID, userInfo) {
  var roommgr = roomFac.getRoomList('live_room')
  return await roommgr.addAudience(roomID, userID, userInfo)
}

/**
 *
 */
async function delAudience (roomID, userID) {
  var roommgr = roomFac.getRoomList('live_room')
  await roommgr.delAudience(roomID, userID)
}

/**
 *
 */
async function getAudiences (roomID) {
  var roommgr = roomFac.getRoomList('live_room')
  return await roommgr.getAudiences(roomID)
}

module.exports = {
  isRoomExist,
  isRoomCreator,
  createRoom,
  addRoom,
  delRoom,
  getRoomMembers,
  isMember,
  getMemberCnt,
  addMember,
  delMember,
  updateMember,
  updateMemberTS,
  getRoomList,
  setCustomField,
  getCustomInfo,
  addAudience,
  delAudience,
  getAudiences
}
