const config = require('../config')
const crypto = require('crypto')
const immgr = require('./im_mgr')

/**
 * 存放用户登录票据
 */
var tokens = {}

/**
 * 
 */
function S4() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
}

/**
 * 构建一个token = md5(APIKey+appID+instID+userID) * appID.hex * instID.hex
 */
function makeToken (appID, instID, apiKey, userID) {
  var md5 = crypto.createHash('md5')
  var random = S4()+ S4() + S4()
  var Token = md5.update(apiKey + appID.toString() + instID + userID + random).digest('hex')
  var buf = new Buffer(instID, 'utf8')
  var loginToken = Token + '*' + appID.toString(16) + '*' + buf.toString('base64')
  return loginToken
}

/**
 * 从 Token 中分离出appID 和 instID。
 */
function fromToken (Token) {
  var fields = Token.split('*')
  if (fields.length != 3) {
    return null
  }

  if (fields[0].length != 32) {
    return null
  }

  var buf = new Buffer(fields[2], 'base64')

  var client = {
    appID: parseInt(fields[1], 16),
    instID: buf.toString()
  }

  return client
}

/**
 *
 */
function makeTokenKey (appID, instID, userID) {
  return JSON.stringify({ a: appID, i: instID, u: userID })
}

/**
 * 从redis中查询 用户login Token
 */
function getLoginToken (appID, instID, userID) {
  return tokens[makeTokenKey(appID, instID, userID)]
}

/**
 * 将login Token 写入redis
 */
function setLoginToken (appID, instID, userID, token) {
  tokens[makeTokenKey(appID, instID, userID)] = token
}

/**
 * 删除login Token
 */
function delLoginToken (appID, instID, userID) {
  delete tokens[makeTokenKey(appID, instID, userID)]
}

/**
 * 登录验证
 * 验证通过 派发login Token
 * 验证失败 返回登录失败
 *
 * ctx.state 鉴权结果
 * 0： 鉴权成功
 * 1： 鉴权失败-userSig格式不正确
 * 2： 鉴权失败-sdkAppID/accountType/userID和userSig信息不一致
 * 3： 鉴权失败-userSig票据过期
 * 4： 鉴权失败-数字签名验证失败
 */
async function authorizeMiddleware (ctx, next) {
  // 从ctx获取参数
  var query = ctx.query
  if (('sdkAppID' in query) &&
    ('accountType' in query) &&
    ('userID' in query) &&
    ('userSig' in query)) {
    var sdkAppID = parseInt(query.sdkAppID)
    var accountType = query.accountType
    var userID = query.userID
    var userSig = query.userSig
    var appID = config.live.appID
    var APIKey = config.live.APIKey

    var result = immgr.verifySig(sdkAppID, accountType, userID, userSig)

    if (result.code === 0) {
      ctx.state.result = { code: 0, message: '登录鉴权成功' }
      ctx.state.config = config
      ctx.state.token = makeToken(sdkAppID, accountType, APIKey, userID)
      setLoginToken(sdkAppID, accountType, userID, ctx.state.token)
    } else {
      ctx.state.result = result.code
    }
  } else {
    ctx.state.result = { code: 4, message: '请求参数不全，请检查sdkAppID，accountType，userID，userSig参数是否都存在' }
  }
  return next()
}

/**
 * ctx.state 鉴权结果
 * 0： 鉴权成功
 * 1： 鉴权失败-Token不一致
 * 2： 鉴权失败-Token格式异常
 * 3： 鉴权失败-用户未登录
 * 4： 鉴权失败-参数不全
 * 5:  鉴权失败-用户账号不存在
 */
async function validationMiddleware (ctx, next) {
  var query = ctx.query
  if ('userID' in query &&
    'token' in query) {
    var client = fromToken(query.token)

    if (client) {
      var userID = query.userID
      var appID = client.appID
      var accountType = client.instID
      var token = query.token

      var sToken = getLoginToken(appID, accountType, userID)

      if (sToken) {
        if (sToken == token) {
          ctx.state.result = 0
          ctx.state.config = config
        } else {
          ctx.state.result = 1
        }
      } else {
        ctx.state.result = 3
      }
    } else {
      ctx.state.result = 2
    }
  } else {
    ctx.state.result = 4
  }
  return next()
}

const msgResult = [
  '成功',
  'token 错误',
  'token 错误',
  '用户未登录或token过期',
  '参数不全，请检查是否忘记携带参数userID和token',
  '客户配置不存在，请检查appID和businessID是否正确'
]
/**
 * 检查鉴权结果
 */
function checkResult (ctx) {
  if ('result' in ctx.state && ctx.state.result != 0) {
    ctx.body = { code: 7, message: '鉴权失败 错误码:' + ctx.state.result + ' 错误信息:' + msgResult[ctx.state.result] }
    return false
  }
  return true
}

/**
 * 检查请求参数的存在性
 * params: list 待检查的参数列表
 */
function checkParams (ctx, params) {
  var flag = true
  params.forEach(param => {
    if (!(param in ctx.request.body)) {
      flag = false
    }
  })

  if (!flag) {
    ctx.body = { code: 1, message: '参数不全' }
  }
  return flag
}

module.exports = {
  authorizeMiddleware,
  validationMiddleware,
  delLoginToken,
  checkResult,
  checkParams
}
