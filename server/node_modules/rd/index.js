'use strict';

/**
 * 列出目录下的所有文件
 *
 * @author Zongmin Lei<leizongmin@gmail.com>
 */


var fs = require('fs');
var path = require('path');
var os = require('os');


// 默认并发线程数
var THREAD_NUM = os.cpus().length;

/**
 * 将数组中的文件名转换为完整路径
 *
 * @param {String} dir
 * @param {Array} files
 * @return {Array}
 */
function fullPath(dir, files) {
  return files.map(function (f) {
    return path.join(dir, f);
  });
}

/**
 * 遍历目录里面的所有文件和目录
 *
 * @param {String} dir        目录名
 * @param {Number} thread_num 并发线程数
 * @param {Function} findOne  找到一个文件时的回调
 *                            格式：function (filename, stats, next)
 * @param {Function} callback 格式：function (err)
 */
function eachFile(dir, thread_num, findOne, callback) {
  fs.stat(dir, function (err, stats) {
    if (err) return callback(err);

    // findOne回调
    findOne(dir, stats, function () {

      if (stats.isFile()) {
        // 如果为文件，则表示终结
        return callback(null);

      } else if (stats.isDirectory()) {
        // 如果为目录，则接续列出该目录下的所有文件
        fs.readdir(dir, function (err, files) {
          if (err) return callback(err);

          files = fullPath(dir, files);

          // 启动多个并发线程
          var finish = 0;
          var threadFinish = function () {
            finish++;
            if (finish >= thread_num) return callback(null);
          };
          var next = function () {
            var f = files.pop();
            if (!f) return threadFinish();
            eachFile(f, thread_num, findOne, function (err, s) {
              if (err) return callback(err);
              next();
            });
          };
          for (var i = 0; i < thread_num; i++) {
            next();
          }
        });

      } else {
        // 未知文件类型
        callback(null);
      }
    });
  });
}

/**
 * 遍历目录里面的所有文件和目录 (同步)
 *
 * @param {String} dir        目录名
 * @param {Function} findOne  找到一个文件时的回调
 *                            格式：function (filename, stats, next)
 */
function eachFileSync(dir, findOne) {
  var stats = fs.statSync(dir);
  findOne(dir, stats);

  // 遍历子目录
  if (stats.isDirectory()) {
    var files = fullPath(dir, fs.readdirSync(dir));

    files.forEach(function (f) {
      eachFileSync(f, findOne);
    });
  }
}

// -----------------------------------------------------------------------------

/**
 * 遍历目录下的所有文件和目录
 *
 * @param {String} dir
 * @param {Number} thread_num  (optional)
 * @param {Function} findOne
 * @param {Function} callback
 */
exports.each = function (dir, callback) {
  if (arguments.length < 3) return callback(new TypeError('Bad arguments number'));
  if (arguments.length === 3) {
    var thread_num = THREAD_NUM;
    var findOne = arguments[1];
    var callback = arguments[2];
  } else {
    var thread_num = arguments[1];
    var findOne = arguments[2];
    var callback = arguments[3];
  }

  if (!(thread_num > 0)) {
    return callback(new TypeError('The argument "thread_num" must be number and greater than 0'));
  }
  if (typeof findOne !== 'function') {
    return callback(new TypeError('The argument "findOne" must be a function'));
  }
  if (typeof callback !== 'function') {
    return callback(new TypeError('The argument "callback" must be a function'));
  }

  eachFile(path.resolve(dir), thread_num, findOne, callback);
};

/**
 * 遍历目录下的所有文件和目录 (同步)
 *
 * @param {String} dir
 * @param {Function} findOne
 */
exports.eachSync = function (dir, findOne) {
  if (arguments.length < 2) throw new TypeError('Bad arguments number');

  if (typeof findOne !== 'function') {
    throw new TypeError('The argument "findOne" must be a function');
  }

  eachFileSync(path.resolve(dir), findOne);
};

// -----------------------------------------------------------------------------

/**
 * 列出目录下所有文件和目录
 *
 * @param {String} dir
 * @param {Number} thread_num  (optional)
 * @param {Function} callback
 */
exports.read = function (dir) {
  if (arguments.length < 2) return callback(new TypeError('Bad arguments number'));
  if (arguments.length === 2) {
    var thread_num = THREAD_NUM;
    var callback = arguments[1];
  } else {
    var thread_num = arguments[1];
    var callback = arguments[2];
  }

  if (!(thread_num > 0)) {
    return callback(new TypeError('The argument "thread_num" must be number and greater than 0'));
  }
  if (typeof callback !== 'function') {
    return callback(new TypeError('The argument "callback" must be a function'));
  }

  var files = [];
  eachFile(path.resolve(dir), thread_num, function (filename, stats, next) {
    files.push(filename);
    next();
  }, function (err) {
    callback(err, files);
  });
};

/**
 * 列出目录下所有文件和目录 (同步)
 *
 * @param {String} dir
 * @return {Array}
 */
exports.readSync = function (dir) {
  var files = [];
  eachFileSync(path.resolve(dir), function (filename, stats) {
    files.push(filename);
  });
  return files;
};

// -----------------------------------------------------------------------------
/**
 * 取each系列的参数
 *
 * @param {Array} args
 * @return {Mixed}
 */
function getEachArguments(args) {
  return Array.prototype.slice.call(args, 0, -2);
}

/**
 * 取read系列参数
 *
 * @param {Array} args
 * @return {Mixed}
 */
function getReadArguments(args) {
  return Array.prototype.slice.call(args, 0, -1);
}

/**
 * 取callback参数
 *
 * @param {Array} args
 * @return {Mixed}
 */
function getCallback(args) {
  return args[args.length - 1];
}

/**
 * 取findOne参数
 *
 * @param {Array} args
 * @return {Mixed}
 */
function getFindOne(args) {
  return args[args.length - 2];
}

/**
 * 取pattern参数
 *
 * @param {Array} args
 * @return {Mixed}
 */
function getPattern(args) {
  return args[1];
}

/**
 * 去掉pattern参数
 *
 * @param {Array} args
 * @return {Array}
 */
function stripPattern(args) {
  args.splice(1, 1);
  return args;
}

/**
 * 仅列出目录下指定规则的所有文件和目录
 *
 * @param {String} dir
 * @param {RegExp|Function} pattern
 * @param {Number} thread_num  (optional)
 * @param {Function} callback
 */
exports.eachFilter = function () {
  var args = stripPattern(getEachArguments(arguments));
  var findOne = getFindOne(arguments);
  var callback = getCallback(arguments);
  var test = patternToFunction(getPattern(arguments));
  args.push(function (f, s, next) {
    if (test(f)) {
      findOne.apply(this, arguments);
    } else {
      next();
    }
  });
  args.push(callback);
  return exports.each.apply(this, args);
};

/**
 * 仅列出目录下的所有文件
 *
 * @param {String} dir
 * @param {Number} thread_num  (optional)
 * @param {Function} callback
 */
exports.eachFile = function () {
  var args = getEachArguments(arguments);
  var findOne = getFindOne(arguments);
  var callback = getCallback(arguments);
  args.push(function (f, s, next) {
    if (s.isFile()) {
      findOne.apply(this, arguments);
    } else {
      next();
    }
  });
  args.push(callback);
  return exports.each.apply(this, args);
};

/**
 * 仅列出目录下的所有目录
 *
 * @param {String} dir
 * @param {Number} thread_num  (optional)
 * @param {Function} callback
 */
exports.eachDir = function () {
  var args = getEachArguments(arguments);
  var findOne = getFindOne(arguments);
  var callback = getCallback(arguments);
  args.push(function (f, s, next) {
    if (s.isDirectory()) {
      findOne.apply(this, arguments);
    } else {
      next();
    }
  });
  args.push(callback);
  return exports.each.apply(this, args);
};

/**
 * 仅列出目录下指定规则的所有文件
 *
 * @param {String} dir
 * @param {RegExp|Function} pattern
 * @param {Number} thread_num  (optional)
 * @param {Function} callback
 */
exports.eachFileFilter = function () {
  var args = stripPattern(getEachArguments(arguments));
  var findOne = getFindOne(arguments);
  var callback = getCallback(arguments);
  var test = patternToFunction(getPattern(arguments));
  args.push(function (f, s, next) {
    if (test(f)) {
      findOne.apply(this, arguments);
    } else {
      next();
    }
  });
  args.push(callback);
  return exports.eachFile.apply(this, args);
};

/**
 * 仅列出目录下指定规则的所有目录
 *
 * @param {String} dir
 * @param {RegExp|Function} pattern
 * @param {Number} thread_num  (optional)
 * @param {Function} callback
 */
exports.eachDirFilter = function () {
  var args = stripPattern(getEachArguments(arguments));
  var findOne = getFindOne(arguments);
  var callback = getCallback(arguments);
  var test = patternToFunction(getPattern(arguments));
  args.push(function (f, s, next) {
    if (test(f)) {
      findOne.apply(this, arguments);
    } else {
      next();
    }
  });
  args.push(callback);
  return exports.eachDir.apply(this, args);
};

// -----------------------------------------------------------------------------

/**
 * 列出目录下指定规则的所有文件和目录
 *
 * @param {String} dir
 * @param {RegExp|Function} pattern
 * @param {Number} thread_num  (optional)
 * @param {Function} callback
 */
exports.readFilter = function () {
  var args = stripPattern(getReadArguments(arguments));
  var callback = getCallback(arguments);
  var test = patternToFunction(getPattern(arguments));
  var list = [];
  args.push(function (f, s, next) {
    if (test(f)) {
      list.push(f);
    }
    next();
  });
  args.push(function (err) {
    callback(err, list);
  });
  exports.each.apply(this, args);
};

/**
 * 列出目录下所有文件
 *
 * @param {String} dir
 * @param {Number} thread_num  (optional)
 * @param {Function} callback
 */
exports.readFile = function () {
  var args = getReadArguments(arguments);
  var callback = getCallback(arguments);
  var list = [];
  args.push(function (f, s, next) {
    list.push(f);
    next();
  });
  args.push(function (err) {
    callback(err, list);
  });
  exports.eachFile.apply(this, args);
};

/**
 * 列出目录下所有目录
 *
 * @param {String} dir
 * @param {Number} thread_num  (optional)
 * @param {Function} callback
 */
exports.readDir = function () {
  var args = getReadArguments(arguments);
  var callback = getCallback(arguments);
  var list = [];
  args.push(function (f, s, next) {
    list.push(f);
    next();
  });
  args.push(function (err) {
    callback(err, list);
  });
  exports.eachDir.apply(this, args);
};

/**
 * 列出目录下指定规则的所有文件
 *
 * @param {String} dir
 * @param {RegExp|Function} pattern
 * @param {Number} thread_num  (optional)
 * @param {Function} callback
 */
exports.readFileFilter = function () {
  var args = stripPattern(getReadArguments(arguments));
  var callback = getCallback(arguments);
  var test = patternToFunction(getPattern(arguments));
  var list = [];
  args.push(function (f, s, next) {
    if (test(f)) {
      list.push(f);
    }
    next();
  });
  args.push(function (err) {
    callback(err, list);
  });
  exports.eachFile.apply(this, args);
};

/**
 * 列出目录下指定规则的所有目录
 *
 * @param {String} dir
 * @param {RegExp|Function} pattern
 * @param {Number} thread_num  (optional)
 * @param {Function} callback
 */
exports.readDirFilter = function () {
  var args = stripPattern(getReadArguments(arguments));
  var callback = getCallback(arguments);
  var test = patternToFunction(getPattern(arguments));
  var list = [];
  args.push(function (f, s, next) {
    if (test(f)) {
      list.push(f);
    }
    next();
  });
  args.push(function (err) {
    callback(err, list);
  });
  exports.eachDir.apply(this, args);
};

// -----------------------------------------------------------------------------

/**
 * 遍历目录下指定规则的所有文件和目录(同步)
 *
 * @param {String} dir
 * @param {RegExp|Function} pattern
 * @param {Function} findOne
 */
exports.eachFilterSync = function (dir, pattern, findOne) {
  var test = patternToFunction(pattern);
  exports.eachSync(dir, function (f, s) {
    if (test(f)) {
      findOne(f, s);
    }
  });
};

/**
 * 遍历目录下的所有文件(同步)
 *
 * @param {String} dir
 * @param {Function} findOne
 */
exports.eachFileSync = function (dir, findOne) {
  exports.eachSync(dir, function (f, s) {
    if (s.isFile()) {
      findOne(f, s);
    }
  });
};

/**
 * 遍历目录下指定规则的所有文件(同步)
 *
 * @param {String} dir
 * @param {RegExp|Function} pattern
 * @param {Function} findOne
 */
exports.eachFileFilterSync = function (dir, pattern, findOne) {
  var test = patternToFunction(pattern);
  exports.eachFileSync(dir, function (f, s) {
    if (test(f)) {
      findOne(f, s);
    }
  });
};

/**
 * 读取目录下指定规则的所有文件和目录(同步)
 *
 * @param {String} dir
 * @param {RegExp|Function} pattern
 * @return {Array}
 */
exports.readFilterSync = function (dir, pattern) {
  var list = [];
  exports.eachFilterSync(dir, pattern, function (f, s) {
    list.push(f);
  });
  return list;
};

/**
 * 读取目录下的所有文件(同步)
 *
 * @param {String} dir
 * @return {Array}
 */
exports.readFileSync = function (dir) {
  var list = [];
  exports.eachFileSync(dir, function (f, s) {
    list.push(f);
  });
  return list;
};

/**
 * 读取目录下指定规则的所有文件(同步)
 *
 * @param {String} dir
 * @param {RegExp|Function} pattern
 * @return {Array}
 */
exports.readFileFilterSync = function (dir, pattern) {
  var list = [];
  exports.eachFileFilterSync(dir, pattern, function (f, s) {
    list.push(f);
  });
  return list;
};

/**
 * 遍历目录下的所有文件(同步)
 *
 * @param {String} dir
 * @param {Function} findOne
 */
exports.eachDirSync = function (dir, findOne) {
  exports.eachSync(dir, function (f, s) {
    if (s.isDirectory()) {
      findOne(f, s);
    }
  });
};

/**
 * 遍历目录下的所有文件(同步)
 *
 * @param {String} dir
 * @param {RegExp|Function} pattern
 * @param {Function} findOne
 */
exports.eachDirFilterSync = function (dir, pattern, findOne) {
  var test = patternToFunction(pattern);
  exports.eachDirSync(dir, function (f, s) {
    if (test(f)) {
      findOne(f, s);
    }
  });
};

/**
 * 读取目录下的所有文件(同步)
 *
 * @param {String} dir
 * @return {Array}
 */
exports.readDirSync = function (dir) {
  var list = [];
  exports.eachDirSync(dir, function (f, s) {
    list.push(f);
  });
  return list;
};

/**
 * 读取目录下指定规则的所有文件(同步)
 *
 * @param {String} dir
 * @param {RegExp|Function} pattern
 * @return {Array}
 */
exports.readDirFilterSync = function (dir, pattern) {
  var list = [];
  exports.eachDirFilterSync(dir, pattern, function (f, s) {
    list.push(f);
  });
  return list;
};

// -----------------------------------------------------------------------------

/**
 * 规则转为函数
 *
 * @param {RegExp|Function} pattern
 * @return {Function}
 */
function patternToFunction(pattern) {
  if (typeof pattern === 'function') {
    return pattern;
  } else if (pattern instanceof RegExp) {
    return function (s) {
      return pattern.test(s);
    };
  }
  return function () {
    return false;
  };
  
}
