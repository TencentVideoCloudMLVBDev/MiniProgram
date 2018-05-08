const crypto = require('crypto')

module.exports = message => {
    return crypto.createHash('sha1').update(message, 'utf8').digest('hex')
}
