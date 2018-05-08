const config = require('../config')
const fs = require('fs')
const request = require('request')
const crypto = require('crypto')
const zlib = require('zlib')
const path = require('path')

/**
 * 获取IM用户签名 - 辅助函数
 */
function base64Encode (str) {
  var buf = new Buffer(str, 'base64')
  var newstr = buf.toString('base64')
  newstr = newstr.replace(/\+/g, '*')
  newstr = newstr.replace(/\//g, '-')
  newstr = newstr.replace(/\=/g, '_')
  return newstr
}

/**
 * 获取IM用户签名 - 计算原理参考@https://cloud.tencent.com/document/product/269/1510
 */
function getSig (userid) {
  var time = new Date()
  var expire = '2592000' // 单位秒，相当于30天有效期。

  var orderString = {
    'TLS.appid_at_3rd': config.im.sdkAppID.toString(),
    'TLS.account_type': config.im.accountType,
    'TLS.identifier': userid,
    'TLS.sdk_appid': config.im.sdkAppID.toString(),
    'TLS.time': parseInt(time.getTime() / 1000).toString(),
    'TLS.expire_after': expire
  }

  var content = ''
  content += 'TLS.appid_at_3rd:' + orderString['TLS.appid_at_3rd'] + '\n'
  content += 'TLS.account_type:' + orderString['TLS.account_type'] + '\n'
  content += 'TLS.identifier:' + orderString['TLS.identifier'] + '\n'
  content += 'TLS.sdk_appid:' + orderString['TLS.sdk_appid'] + '\n'
  content += 'TLS.time:' + orderString['TLS.time'] + '\n'
  content += 'TLS.expire_after:' + orderString['TLS.expire_after'] + '\n'

  var private_key = config.im.privateKey
  
  var signer = crypto.createSign('sha256')
  signer.update(content, 'utf8')
  var sign = signer.sign(private_key, 'base64')

  orderString['TLS.sig'] = sign

  var text = JSON.stringify(orderString)

  var compressed = zlib.deflateSync(text)

  return base64Encode(compressed.toString('base64'))
}

/**
 * 验证IM用户签名 - 辅助函数
 */
function base64Decode (str) {
  str = str.replace(/\*/g, '+')
  str = str.replace(/\-/g, '/')
  str = str.replace(/\_/g, '=')
  var buf = new Buffer(str, 'base64')
  return buf
}

/**
 * 验证IM用户签名
 * 0. 成功
 * 1. 票据格式不合法
 * 2. 参数信息不一致
 * 3. 票据过期
 * 4. 签名验证失败
 */
function verifySig (sdkAppID, accountType, userID, userSig) {
  var compressed = base64Decode(userSig)

  // todo:替换成异步解压
  var uncompressed = zlib.inflateSync(compressed)
  try {
    var orderString = JSON.parse(uncompressed)

    console.log(orderString)
  } catch (e) {
    console.log(e)
    return { code: 1, message: 'userSig 格式不正确' }
  }

  if (sdkAppID != orderString['TLS.sdk_appid']) {
    return { code: 2, message: 'sdkAppID 和userSig中的信息不一致' }
  }

  if (userID != orderString['TLS.identifier']) {
    return { code: 2, message: 'userID 和userSig中的信息不一致' }
  }

  var validTs = parseInt(orderString['TLS.time'] + parseInt(orderString['TLS.expire_after']))
  var now = new Date()
  var nowTs = now.getTime() / 1000
  if (nowTs > validTs) {
    return { code: 3, message: 'userSig过期' }
  }

  // 验证
  var content = ''
  content += 'TLS.appid_at_3rd:' + orderString['TLS.appid_at_3rd'] + '\n'
  content += 'TLS.account_type:' + orderString['TLS.account_type'] + '\n'
  content += 'TLS.identifier:' + orderString['TLS.identifier'] + '\n'
  content += 'TLS.sdk_appid:' + orderString['TLS.sdk_appid'] + '\n'
  content += 'TLS.time:' + orderString['TLS.time'] + '\n'
  content += 'TLS.expire_after:' + orderString['TLS.expire_after'] + '\n'

  var verify = crypto.createVerify('sha256')
  verify.update(content, 'utf8')
  var result = verify.verify(config.im.publicKey, orderString['TLS.sig'], 'base64')

  return result ? { code: 0, message: 'success' } : { code: 4, message: '签名验证失败' }
}

/**
 * ================= IM RestFul API 调用相关 ===========================
 */
const host = 'https://console.tim.qq.com/'// IM后台RESTful API的主机地址。

function getQueryString () {
  var query =
    '?sdkappid=' + config.im.sdkAppID.toString() +
    '&identifier=' + config.im.administrator +
    '&usersig=' + getSig(config.im.administrator) +
    '&random=' + (((1 + Math.random()) * 0x10000) | 0).toString() +
    '&contenttype=json'
  return query
}

/**
 * 通知房间成员变动 - 参考@https://cloud.tencent.com/document/product/269/1630
 */
function notifyPushersChange (group_id) {
  var data = {}
  data.GroupId = group_id
  var content = {}
  content.cmd = 'notifyPusherChange'
  content.data = ''
  data.Content = JSON.stringify(content)

  var myreq = {
    url: host + 'v4/group_open_http_svc/send_group_system_notification' + getQueryString(),
    form: JSON.stringify(data)
  }

  return new Promise(function (resolve, reject) {
    request.post(myreq, function (error, rsp, body) {
      if (!error && rsp.statusCode == 200) {
        resolve(body)
      } else {
        reject(error)
      }
    })
  })
}

/**
 * 建群 - 参考@https://cloud.tencent.com/document/product/269/1615
 */
function createGroup (group_id) {
  var data = {
    Owner_Account: config.im.administrator,
    Type: 'AVChatRoom',
    GroupId: group_id,
    Name: 'group_name'
  }
  var myreq = {
    url: host + 'v4/group_open_http_svc/create_group' + getQueryString(),
    form: JSON.stringify(data)
  }

  return new Promise(function (resolve, reject) {
    request.post(myreq, function (error, rsp, body) {
      if (!error && rsp.statusCode == 200) {
        resolve(body)
      } else {
        reject(error)
      }
    })
  })
}

/**
 * 解散群 - 参考@https://cloud.tencent.com/document/product/269/1624
 */
function destroyGroup (group_id) {
  var data = { GroupId: group_id }
  var myreq = {
    url: host + 'v4/group_open_http_svc/destroy_group' + getQueryString(),
    form: JSON.stringify(data)
  }

  return new Promise(function (resolve, reject) {
    request.post(myreq, function (error, rsp, body) {
      if (!error && rsp.statusCode == 200) {
        resolve(body)
      } else {
        reject(error)
      }
    })
  })
}

module.exports = {
  getSig,
  verifySig,
  createGroup,
  destroyGroup,
  notifyPushersChange
}
