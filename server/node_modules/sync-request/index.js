'use strict';

const spawn = require('child_process').spawn;
const spawnSync = require('child_process').spawnSync;
const commandExists = require('command-exists');
const HttpResponse = require('http-response-object');
const JSON = require('./lib/json-buffer');

let started = false;
let command = process.execPath;
let args = [require.resolve('./lib/legacy-worker')];

module.exports = doRequest;
module.exports.legacyRequest = legacyRequest;
function doRequest(method, url, options) {
  if (!started) {
    started = true;
    start();
  }
  return doRequestWith(command, args, method, url, options);
}
function legacyRequest(method, url, options) {
  return doRequestWith(process.execPath, [require.resolve('./lib/legacy-worker')], method, url, options);
}
function start() {
  if (!spawnSync) {
    throw new Error(
      'Sync-request requires node version 0.12 or later.  If you need to use it with an older version of node\n' +
      'you can `npm install sync-request@2.2.0`, which was the last version to support older versions of node.'
    );
  }
  try {
    if (commandExists.sync('nc')) {
      const findPortResult = spawnSync(process.execPath, [require.resolve('./lib/find-port')]);
      if (findPortResult.status !== 0) {
        throw new Error(
          findPortResult.stderr.toString() ||
          ('find port exited with code ' + findPortResult.status)
        );
      }
      if (findPortResult.error) {
        if (typeof findPortResult.error === 'string') {
          throw new Error(findPortResult.error);
        }
        throw findPortResult.error;
      }
      const ncPort = findPortResult.stdout.toString('utf8').trim();
      const p = spawn(process.execPath, [require.resolve('./lib/nc-server'), ncPort], {stdio: 'inherit'});
      p.unref();
      process.on('exit', () => {
        p.kill();
      });
      let response = null;
      while (response !== 'pong') {
        const result = spawnSync('nc', ['127.0.0.1', ncPort], {input: 'ping\r\n'});
        response = result.stdout && result.stdout.toString();
      }
      command = 'nc';
      args = ['127.0.0.1', ncPort];
      return;
    }
  } catch (ex) {
    console.warn(ex.stack || ex);
  }
  console.warn('Could not use "nc", falling back to slower node.js method for sync requests.');
  command = process.execPath;
  args = [require.resolve('./lib/legacy-worker')];
}
function doRequestWith(command, args, method, url, options) {
  var req = JSON.stringify({
    method: method,
    url: url,
    options: options
  });
  var res = spawnSync(command, args, {input: req + '\r\n'});
  if (res.status !== 0) {
    throw new Error(res.stderr.toString());
  }
  if (res.error) {
    if (typeof res.error === 'string') res.error = new Error(res.error);
    throw res.error;
  }
  var response = JSON.parse(res.stdout);
  if (response.success) {
    return new HttpResponse(response.response.statusCode, response.response.headers, response.response.body, response.response.url);
  } else {
    const err = new Error(response.error.message || response.error || response);
    if (response.error.code) {
      err.code = response.error.code;
    }
    throw err;
  }
}
