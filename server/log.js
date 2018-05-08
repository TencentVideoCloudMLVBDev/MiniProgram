'use strict'
var log4js = require('log4js')

var logConfig = require('./log_config')

// 加载配置文件
log4js.configure(logConfig)

var log = {}

var errorLogger = log4js.getLogger('errorLogger')
var resLogger = log4js.getLogger('resLogger')
var consoleLogger = log4js.getLogger('default')

log.warn = function (msg) {
  var logText = ''
  logText += msg
  errorLogger.warn(logText)
  consoleLogger.warn(logText)
}

log.info = function (msg) {
  var logText = ''
  logText += msg
  errorLogger.info(logText)
  consoleLogger.info(logText)
}

// 简化版的错误日志
log.logErrMsg = function (ctx, msg, resTime) {
  var error = {}
  error.name = ''
  error.message = msg
  error.stack = ''
  log.logError(ctx, error, resTime)
}

// 封装错误日志
log.logError = function (ctx, error, resTime) {
  if (ctx && error) {
    errorLogger.error(formatError(ctx, error, resTime))
    // consoleLogger.error(formatError(ctx, error,resTime));
  }
}

// 封装响应日志
log.logResponse = function (ctx, resTime) {
  if (ctx) {
    resLogger.info(formatRes(ctx, resTime))
    // consoleLogger.info(formatRes(ctx, resTime))
  }
}

// 格式化响应日志
var formatRes = function (ctx, resTime) {
  var logText = ''

  // 响应日志开始
  logText += '*** response {'

  // 添加请求日志
  logText += formatReqLog(ctx.request, resTime)

  // 响应状态码
  logText += 'response status: ' + ctx.status + ';'

  // 响应内容
  logText += 'response body: ' + ' ' + JSON.stringify(ctx.body) + ';'

  // 响应日志结束
  logText += '} response ***'

  return logText
}

// 格式化错误日志
var formatError = function (ctx, err, resTime) {
  var logText = ''

  // 错误信息开始
  logText += '*** error {'

  // 添加请求日志
  logText += formatReqLog(ctx.request, resTime)

  // 错误名称
  logText += 'err name: ' + err.name + ';'
  // 错误信息
  logText += 'err message: ' + err.message + ';'
  // 错误详情
  logText += 'err stack: ' + err.stack + ';'

  // 错误信息结束
  logText += '} error ***'

  return logText
}

// 格式化请求日志
var formatReqLog = function (req, resTime) {
  var logText = ''

  var method = req.method
  // 访问方法
  logText += 'request method: ' + method + ';'

  // 请求原始地址
  logText += 'request originalUrl:  ' + req.originalUrl + ';'

  // 客户端ip
  logText += 'request client ip:  ' + req.ip + ';'

  // 请求参数
  if (method === 'GET') {
    logText += 'request query:  ' + JSON.stringify(req.query) + ';'
    // startTime = req.query.requestStartTime;
  } else {
    logText += 'request body: ' + JSON.stringify(req.body) + ';'
    // startTime = req.body.requestStartTime;
  }
  // 服务器响应时间
  logText += 'response time: ' + resTime + ';'

  return logText
}

module.exports = log
