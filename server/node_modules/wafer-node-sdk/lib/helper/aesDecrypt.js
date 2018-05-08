const crypto = require('crypto')

// aes-128-cbc decrypt
// params are base64 encode
module.exports = (key, iv, crypted) => {
    crypted = new Buffer(crypted, 'base64')
    key = new Buffer(key, 'base64')
    iv = new Buffer(iv, 'base64')
    const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv)
    let decoded = decipher.update(crypted, 'base64', 'utf8')
    decoded += decipher.final('utf8')
    return decoded
}
