'use strict';

const concat = require('concat-stream');
const request = require('then-request');
const JSON = require('./json-buffer');

function respond(data) {
  process.stdout.write(JSON.stringify(data), function() {
    process.exit(0);
  });
}

process.stdin.pipe(concat(function (stdin) {
  var req = JSON.parse(stdin.toString());
  request(req.method, req.url, req.options).done(function (response) {
    respond({success: true, response: response});
  }, function (err) {
    respond({success: false, error: { message: err.message, code: err.code }});
  });
}));
