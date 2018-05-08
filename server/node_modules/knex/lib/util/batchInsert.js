'use strict';

exports.__esModule = true;

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _flatten2 = require('lodash/flatten');

var _flatten3 = _interopRequireDefault(_flatten2);

var _chunk2 = require('lodash/chunk');

var _chunk3 = _interopRequireDefault(_chunk2);

var _isArray2 = require('lodash/isArray');

var _isArray3 = _interopRequireDefault(_isArray2);

var _isNumber2 = require('lodash/isNumber');

var _isNumber3 = _interopRequireDefault(_isNumber2);

exports.default = batchInsert;

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function batchInsert(client, tableName, batch) {
  var chunkSize = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1000;


  var _returning = void 0;
  var autoTransaction = true;
  var transaction = null;

  var getTransaction = function getTransaction() {
    return new _bluebird2.default(function (resolve, reject) {
      if (transaction) {
        return resolve(transaction);
      }

      client.transaction(resolve).catch(reject);
    });
  };

  var wrapper = (0, _assign3.default)(new _bluebird2.default(function (resolve, reject) {
    var chunks = (0, _chunk3.default)(batch, chunkSize);

    if (!(0, _isNumber3.default)(chunkSize) || chunkSize < 1) {
      return reject(new TypeError('Invalid chunkSize: ' + chunkSize));
    }

    if (!(0, _isArray3.default)(batch)) {
      return reject(new TypeError('Invalid batch: Expected array, got ' + (typeof batch === 'undefined' ? 'undefined' : (0, _typeof3.default)(batch))));
    }

    //Next tick to ensure wrapper functions are called if needed
    return _bluebird2.default.delay(1).then(getTransaction).then(function (tr) {
      return _bluebird2.default.mapSeries(chunks, function (items) {
        return tr(tableName).insert(items, _returning);
      }).then(function (result) {
        result = (0, _flatten3.default)(result || []);

        if (autoTransaction) {
          //TODO: -- Oracle tr.commit() does not return a 'thenable' !? Ugly hack for now.
          return (tr.commit(result) || _bluebird2.default.resolve()).then(function () {
            return result;
          });
        }

        return result;
      }).catch(function (error) {
        if (autoTransaction) {
          return tr.rollback(error).then(function () {
            return _bluebird2.default.reject(error);
          });
        }

        return _bluebird2.default.reject(error);
      });
    }).then(resolve).catch(reject);
  }), {
    returning: function returning(columns) {
      _returning = columns;

      return this;
    },
    transacting: function transacting(tr) {
      transaction = tr;
      autoTransaction = false;

      return this;
    }
  });

  return wrapper;
}
module.exports = exports['default'];