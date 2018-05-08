const gconfig = require('../config.js')
const liveutil = require('./live_util.js')
const roommgr = require('./room_mgr.js')
const immgr = require('./im_mgr.js')

/**
 * 解析房间类型
 */
function fillRoomType (ctx) {
  var paths = ctx.request.url.split('/')

  // 这个写法可能不安全。
  var roomtype = paths.slice(-2, -1)[0]

  return ctx.state.roomtype = roomtype
}

/**
 * 封装 - 房间分配
 */
async function doCreateRoom (ctx) {
  fillRoomType(ctx)

  let roomtype = ctx.state.roomtype
  let userID = ctx.request.body.userID
  let roomInfo = ctx.request.body.roomInfo
  if (Buffer.byteLength(roomInfo) > 1024) {
    var ret = {
      code: 10,
      message: 'roomInfo 字符串字节长度不能超过1024字节'
    }
    ctx.body = ret
    return
  }

  let roomID = liveutil.genRoomIdByRandom()
  if (ctx.request.body.roomID && ctx.request.body.roomID != '') {
    roomID = ctx.request.body.roomID
    if (await roommgr.isRoomExist(roomID, roomtype) == 1) {
      ctx.body = { code: 11, message: '房间已经存在', roomID: roomID }
      return
    }
  } else {
    while (await roommgr.isRoomExist(roomID, roomtype) == 1) {
      roomID = liveutil.genRoomIdByRandom()
    }
  }

  // 创建群。
  var result = await immgr.createGroup(roomID)
  if (result) {
    if (result.ErrorCode == 0 || result.ErrorCode == 10025) {

    }
  } else {
    ctx.body = { code: 6, message: '群组创建失败' }
    return
  }

  await roommgr.createRoom(roomID, roomInfo, roomtype)

  var ret = { code: 0, message: '请求成功' }
  ret.roomID = roomID
  ctx.body = ret
}

/**
 * 封装 - 房间销毁
 */
async function doDestroyRoom (ctx) {
  fillRoomType(ctx)

  let roomtype = ctx.state.roomtype
  let roomID = ctx.request.body.roomID
  let userID = ctx.request.body.userID

  if (!await roommgr.isRoomCreator(roomID, userID, roomtype)) {
    ctx.body = { code: 3, message: '不是房间主人，无法销毁房间' }
    return
  }

  await roommgr.delRoom(roomID, roomtype)

  await immgr.destroyGroup(roomID)

  var ret = { code: 0, message: '请求成功' }
  ctx.body = ret
}

/**
 * 封装 - 加入房间
 */
async function doEnterRoom (ctx) {
  fillRoomType(ctx)

  let roomtype = ctx.state.roomtype
  let roomID = ctx.request.body.roomID
  let roomInfo = ''
  let userID = ctx.request.body.userID
  let userName = ctx.request.body.userName
  let userAvatar = ctx.request.body.userAvatar
  let pushURL = ctx.request.body.pushURL

  /**
   * 房间不存在，创建房间，并进房。
   */
  if (await roommgr.isRoomExist(roomID, roomtype) == 0) {
    // 创建群。
    var result = await immgr.createGroup(roomID)
    if (result) {
      if (result.ErrorCode == 0 || result.ErrorCode == 10025) {

      }
    } else {
      ctx.body = { code: 6, message: '创建群组失败' }
      return
    }
    // 建房并进房。
    var txTime = new Date()
    txTime.setTime(txTime.getTime() + gconfig.live.validTime * 1000)
    var IDS = liveutil.getStreamIdFromPushUrl(pushURL)
    await roommgr.addRoom(
      roomID,
      roomInfo,
      userID,
      liveutil.genMixedPlayUrl(IDS.subID, 'flv'),
      userName,
      userAvatar,
      pushURL,
      liveutil.genAcceleratePlayUrl(IDS.subID, txTime),
      roomtype)

    var ret = { code: 0, message: '请求成功' }
    ret.roomID = roomID
    ctx.body = ret
    return
  }

  /**
   * 房间已经存在，直接进房，或更新成员信息。
   */
  var txTime = new Date()
  txTime.setTime(txTime.getTime() + gconfig.live.validTime * 1000)
  var IDS = liveutil.getStreamIdFromPushUrl(pushURL)
  if (await roommgr.isMember(roomID, userID, roomtype)) {
    await roommgr.updateMember(
      roomID,
      userID,
      userName,
      userAvatar,
      pushURL,
      liveutil.genAcceleratePlayUrl(IDS.subID, txTime),
      roomtype
    )
    await immgr.notifyPushersChange(roomID)
  } else {
    let maxMembers = 0
    if (roomtype == 'double_room') {
      maxMembers = 2
    } else if (roomtype == 'multi_room') {
      maxMembers = gconfig.multi_room.maxMembers
    } else if (roomtype == 'live_room') {
      maxMembers = gconfig.live_room.maxMembers
    }

    if (await roommgr.getMemberCnt(roomID, roomtype) >= maxMembers) {
      var err_ret = {}
      err_ret.code = 5001
      err_ret.message = '超出房间人数上限'
      ctx.body = err_ret
      return
    } else {
      await roommgr.addMember(
        roomID,
        userID,
        userName,
        userAvatar,
        pushURL,
        liveutil.genAcceleratePlayUrl(IDS.subID, txTime),
        roomtype)

      await immgr.notifyPushersChange(roomID)
    }
  }

  var ret = { code: 0, message: '请求成功' }
  ctx.body = ret
}

/**
 *
 */
async function doLeaveRoom (ctx) {
  fillRoomType(ctx)

  let roomtype = ctx.state.roomtype
  let roomID = ctx.request.body.roomID
  let userID = ctx.request.body.userID

  if (!await roommgr.isMember(roomID, userID, roomtype)) {
    ctx.body = { code: 5, message: '退出房间失败，不是房间成员' }
    return
  }

  var r = await roommgr.delMember(roomID, userID, roomtype)

  var ret = { code: 0, message: '请求成功' }
  ctx.body = ret
}

/**
 *
 */
async function doListRooms (ctx) {
  fillRoomType(ctx)

  let roomtype = ctx.state.roomtype
  let cnt = ctx.request.body.cnt
  let index = ctx.request.body.index

  var ret = { code: 0, message: '请求成功' }
  ret.rooms = await roommgr.getRoomList(cnt, index, 1, roomtype)
  ctx.body = ret
}

/**
 *
 */
async function doListPushers (ctx) {
  fillRoomType(ctx)

  let roomtype = ctx.state.roomtype
  let roomID = ctx.request.body.roomID

  var room = await roommgr.getRoomMembers(roomID, roomtype)
  if (!room) {
    ctx.body = { code: 3, message: '请求的房间不存在' }
    return
  }

  var ret = { code: 0, message: '请求成功' }
  ret.roomID = room.roomID
  ret.roomInfo = room.roomInfo
  ret.roomCreator = room.roomCreator
  ret.mixedPlayURL = room.mixedPlayURL
  ret.custom = room.custom
  ret.pushers = room.pushers
  ctx.body = ret
}

/**
 *
 */
async function doSetCustomField (ctx) {
  fillRoomType(ctx)

  let roomtype = ctx.state.roomtype
  let roomID = ctx.request.body.roomID
  let fieldName = ctx.request.body.fieldName
  let operation = ctx.request.body.operation
  let value = ctx.request.body.value

  if (!await roommgr.isRoomExist(roomID, roomtype)) {
    ctx.body = { code: 3, message: '请求的房间不存在' }
    return
  }

  if (ctx.request.body.operation == 'set' && !value) {
    ctx.body = { code: 1, message: '参数不全' }
    return
  }

  ctx.body = await roommgr.setCustomField(
    roomID,
    fieldName,
    operation,
    value,
    roomtype)
}

/**
 *
 */
async function doGetCustom (ctx) {
  fillRoomType(ctx)

  let roomtype = ctx.state.roomtype
  let roomID = ctx.request.body.roomID

  if (!await roommgr.isRoomExist(roomID, roomtype)) {
    ctx.body = { code: 3, message: '请求的房间不存在' }
    return
  }

  var ret = { code: 0, message: '请求成功' }
  ret.custom = await roommgr.getCustomInfo(roomID, roomtype)
  ctx.body = ret
}

/**
 *
 */
async function doHeartBeat (ctx) {
  fillRoomType(ctx)

  let roomtype = ctx.state.roomtype
  let roomID = ctx.request.body.roomID
  let userID = ctx.request.body.userID

  if (!await roommgr.isMember(roomID, userID, roomtype)) {
    ctx.body = { code: 5, message: '不是房间成员' }
    return
  }

  await roommgr.updateMemberTS(roomID, userID, roomtype)

  ctx.body = { code: 0, message: '请求成功' }
}

/**
 *
 */
async function doAddAudience (ctx) {
  let roomID = ctx.request.body.roomID
  let userID = ctx.request.body.userID
  let userInfo = ctx.request.body.userInfo

  ctx.body = await roommgr.addAudience(roomID, userID, userInfo)
}

/**
 *
 */
async function doDelAudience (ctx) {
  let roomID = ctx.request.body.roomID
  let userID = ctx.request.body.userID
  await roommgr.delAudience(roomID, userID)
  ctx.body = { code: 0, message: '请求成功' }
}

/**
 *
 */
async function doGetAudiences (ctx) {
  let roomID = ctx.request.body.roomID
  var ret = { code: 0, message: '请求成功' }
  var audiences = await roommgr.getAudiences(roomID)
  ret.audienceCount = audiences.count
  ret.audiences = audiences.audiences
  ctx.body = ret
}

module.exports = {
  doSetCustomField,
  doGetCustom,
  doEnterRoom,
  doLeaveRoom,
  doCreateRoom,
  doDestroyRoom,
  doListRooms,
  doListPushers,
  doHeartBeat,
  doAddAudience,
  doDelAudience,
  doGetAudiences
}
