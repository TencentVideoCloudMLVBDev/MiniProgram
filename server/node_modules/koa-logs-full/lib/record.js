//处理logo日志
//由于nodejs是单进程单线程的，所以多个请求时，由于时间差。可能造成logo混乱的问题。
//
//使用：
//var logRecord = require('./lib/logger.js');
//
//app.use(logRecord({
//   logdir: path.join(__dirname, 'logs'),
//   exportGlobalLogger:true,
//   env:'development',
//   skipStatic:true
// }));
//
//这样就可以 this.logger.log
//
//
var assert = require('assert');
var libLoggerFactory = require('./logger.js');
var util = require('./util.js');

var RECORD;
var libLoggerInstance;

//var ShowError;

var Logdir;
var Env;
var SkipStatic;



var filter = function*(next) {
  //记录基础的请求时间,跳过静态资源
  //参考koa-logger
  var ctx = this;
  var start = new Date;
  var logsMemory = []; //logs缓存，打log不会真的输出，而是记录

  ctx.logger = libLoggerInstance.generate(logsMemory);


  if (!util.isStatic(this.url) || (util.isStatic(this.url) && !SkipStatic)) {
    ctx.logger.log("Started " + ctx.method + "   " + ctx.url + " for " + ctx.ip + "at " + new Date);
    ctx.query && ctx.logger.log("  {{#magenta}}query{{/magenta}}:" + JSON.stringify(ctx.query));
    ctx.request.body && ctx.logger.log("  {{#magenta}}body{{/magenta}}:" + JSON.stringify(ctx.request.body));
  }

  try{
    yield next

  }catch(err){

    this.logger.error(util.error2string(err));
    this.logger.flush();

    //告诉全局的error监控，此错误已经处理过了
    err.hasHandled = true;
    //抛出去 方便其他程序监控
    ctx.throw(err);
  }

  //静态资源直接return
  if (util.isStatic(this.url) && SkipStatic) return;
  var res = this.res;

  var onfinish = done.bind(null, 'finish');
  var onclose = done.bind(null, 'close');
  res.once('finish', onfinish);
  res.once('close', onclose);

  function done(event) {
    res.removeListener('finish', onfinish);
    res.removeListener('close', onclose);

    ctx.logger.log("Completed in " + util.time(start) + "  " + ctx.status + "\n\n");
    ctx.logger.flush();

  }

}


RECORD = function(app,options) {
  options = options || {};

  Logdir = options.logdir || path.join('./', 'logs');
  Env = options.env || process.env.NODE_ENV || "development";
  SkipStatic = options.skipStatic || true;

  libLoggerInstance = libLoggerFactory({
    logdir:Logdir,
    env:Env
  });

  var globalLogger = libLoggerInstance.generate();
  //重置错误消息处理
  //koa 如果发现没有监听error事件，会默认生成一个所有错误打到console的错误处理。
  //我们要重置掉。
  app.on('error',function(err){
    if (!err.hasHandled) {
      globalLogger.error(util.error2string(err));
    }
  })

  //暴露logger到全局
  if (options.exportGlobalLogger) {
    global.logger = globalLogger
  }

  return filter;
}

module.exports = RECORD;