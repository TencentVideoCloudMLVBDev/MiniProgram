'use strict';

const crypto = require('crypto');

module.exports = message => {
    return crypto.createHash('md5').update(message, 'utf8').digest('hex');
};