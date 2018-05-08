var logfilestream = require('logfilestream');
var chalk = require('chalk');
var STYLES = chalk.styles;
var _ = require('lodash');
var _renderPrintf = require('printf');
var util = require('./util.js');


var LOG_TYPES = [{
  type: 'log',
  color: 'white'
}, {
  type: 'error',
  color: 'red'
}, {
  type: 'info',
  color: 'green'
}, {
  type: 'warn',
  color: 'yellow'
}]


function Log(options) {
  var logDir = options.logdir || './logs';
  var env = options.env || process.env.NODE_ENV || "development";

  var writestream = logfilestream({
    logdir: logDir,
    nameformat: '[' + env + '.]YYYY-MM-DD[.log]',
    mkdir:true
  })


  function _write(str) {
      //only development env will output to console
      if (env === 'development') {
        console.log(str);
      }
      writestream.write(str+'\n');
    }
    //"{{#red}}{{/red}}"
  function _renderColor(str) {

    return str.replace(/\{\{([#\/])([^}]+)\}\}/g, function($0, $1, $2) {
      if (!_.has(STYLES, $2)) return $0;

      if ($1=='#') return STYLES[$2].open;
      if ($1=='/') return STYLES[$2].close;

    })
  }

  function _generateLogger(cache) {

    var logger = {};
    var msg = '';

    LOG_TYPES.forEach(function(typeObj) {

      logger[typeObj.type] = function() {

        if (_.isEmpty(arguments)) return;

        var msg = '';

        try{
          //c风格的输出转换
          //printf比较严格，没有很好的处理错误，这边如果不符合直接不用它
          msg = _renderPrintf.apply(this,arguments);
        }catch(err){
          //给出警告提示
          var warnColor = _.find(LOG_TYPES, {'type':'warn'}).color;
          msg = chalk[warnColor]('warn:not match c print style,skiped.\n');
          //降级处理打出基本信息
          msg += util.arg2String(arguments);
        }

        try{
          //标签颜色转换
          msg = _renderColor(msg);
          //当前日志类型的总颜色转换
          msg = chalk[typeObj.color](msg);

        }catch(err){
          var errorColor = _.find(LOG_TYPES, {'type':'error'}).color;
          msg = chalk[errorColor](util.error2string(err));
        }

        if (cache) {
          cache.push(msg);
        } else {
          _write(msg);
        }

      }
    })

    if (cache) {
      logger.flush = function() {
        cache.forEach(function(msg) {
          _write(msg);
        })
      }
    }

    return logger;
  }

  return {
    //如果有cache代表需要做异步处理
    generate: function(cache) {
      return _generateLogger(cache);
    }
  }
}

module.exports = Log;