const sha1 = require('../helper/sha1')
const config = require('../../config')

function checkSignature (signature, timestamp, nonce) {
    const tmpStr = [config.wxMessageToken, timestamp, nonce].sort().join('')
    const sign = sha1(tmpStr)

    return sign === signature
}

module.exports = {
    checkSignature
}
