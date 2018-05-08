
var _ = require('lodash');
var path = require('path');

var STATIC_EXT = /(.css)|(.gif)|(.html)|(.ico)|(.jpeg)|(.jpg)|(.js)|(.json)|(.pdf)|(.png)|(.svg)|(.swf)|(.tiff)|(.txt)|(.wav)|(.wma)|(.wmv)|(.xml)/;


/**
 * Show the response time in a human readable format.
 * In milliseconds if less than 10 seconds,
 * in seconds otherwise.
 */

function _time(start) {
  var delta = new Date - start;
  delta = delta < 10000 ? delta + 'ms' : Math.round(delta / 1000) + 's';
  return delta;
}



function _error2string(err){
  if (err.stack) {
    return err.stack.replace(/^/gm, '  ')+'\n\n';
  }
  return err.toString();
}


function _arg2String(args){
  var str = '';
  _.each(args,function(arg,k){
    str += arg.toString();
  });

  return str;

}

function _isStatic(url){
  var trueUrl = url.replace(/\?.*/ig,'');
  var ext = path.extname(trueUrl);
  return STATIC_EXT.test(ext);
}

module.exports = {
  time:_time,
  error2string:_error2string,
  arg2String:_arg2String,
  isStatic:_isStatic
}