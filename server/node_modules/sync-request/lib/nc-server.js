'use strict';

const net = require('net');
const request = require('then-request');
const JSON = require('./json-buffer');

const server = net.createServer({allowHalfOpen: true}, c => {
  function respond(data) {
    c.end(JSON.stringify(data));
  }

  let buffer = '';
  c.on('data', function (data) {
    buffer += data.toString('utf8');
    if (/\r\n/.test(buffer)) {
      onMessage(buffer.trim());
    }
  });
  function onMessage(str) {
    if (str === 'ping') {
      c.end('pong');
      return;
    }
    try {
      const req = JSON.parse(str);
      request(req.method, req.url, req.options).done(function (response) {
        respond({success: true, response: response});
      }, function (err) {
        respond({success: false, error: { message: err.message, code: err.code }});
      });
    } catch (ex) {
      respond({success: false, error: { message: ex.message, code: ex.code }});
    }
  }
});

server.listen(+process.argv[2]);
