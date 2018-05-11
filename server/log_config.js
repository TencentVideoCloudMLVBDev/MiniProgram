var path = require('path')

// 日志根目录
var baseLogPath = path.resolve(__dirname, 'logs')

// 错误日志目录
var errorPath = '/error'
// 错误日志文件名
var errorFileName = 'error'
// 错误日志输出完整路径
var errorLogPath = baseLogPath + errorPath + '/' + errorFileName
// var errorLogPath = path.resolve(__dirname, "../logs/error/error");

// 响应日志目录
var responsePath = '/response'
// 响应日志文件名
var responseFileName = 'response'
// 响应日志输出完整路径
var responseLogPath = baseLogPath + responsePath + '/' + responseFileName
// var responseLogPath = path.resolve(__dirname, "../logs/response/response");

// v1 配置
// var logConfig = {
//   "appenders":
//   [
//     //错误日志
//     {
//       "category": "errorLogger",             //logger名称
//       "type": "dateFile",                   //日志类型
//       "filename": errorLogPath,             //日志输出位置
//       "alwaysIncludePattern": true,          //是否总是有后缀名
//       "pattern": "-yyyy-MM-dd-hh.log",      //后缀，每小时创建一个新的日志文件
//       "backups": 7 * 24,
//       "path": errorPath                     //自定义属性，错误日志的根目录
//     },
//     //响应日志
//     {
//       "category": "resLogger",
//       "type": "dateFile",
//       "filename": responseLogPath,
//       "alwaysIncludePattern": true,
//       "pattern": "-yyyy-MM-dd-hh.log",
//       "backups": 7 * 24,
//       "path": responsePath
//     },
//     //控制台输出
//     {
//       "category": "default",
//       "type": "console"
//     }
//   ],
//   "levels":                                   //设置logger名称对应的的日志等级
//   {
//     "errorLogger": "ERROR",
//     "resLogger": "ALL"
//   },
//   "baseLogPath": baseLogPath                  //logs根目录
// }

// v2 配置。
var logConfig = {
  appenders:
  {
    // 错误日志
    errorLogger: {
      type: 'dateFile', // 日志类型
      filename: errorLogPath, // 日志输出位置
      alwaysIncludePattern: true, // 是否总是有后缀名
      pattern: '-yyyy-MM-dd-hh.log', // 后缀，每小时创建一个新的日志文件
      daysToKeep: 7 // 自定义属性，错误日志的根目录
    },
    // 响应日志
    resLogger: {
      type: 'dateFile',
      filename: responseLogPath,
      alwaysIncludePattern: true,
      pattern: '-yyyy-MM-dd-hh.log',
      daysToKeep: 7
    },
    // 控制台输出
    consoleLogger: {
      type: 'console'
    }
  },
  categories: // 设置logger名称对应的的日志等级
  {
    default: {
      appenders: ['consoleLogger'],
      level: 'info'
    },
    errorLogger: {
      appenders: ['errorLogger'],
      level: 'info'
    },

    resLogger: {
      appenders: ['resLogger'],
      level: 'info'
    }
  }
}

module.exports = logConfig
