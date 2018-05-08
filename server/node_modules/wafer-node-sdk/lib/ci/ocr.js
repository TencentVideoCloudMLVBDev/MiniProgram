const debug = require('debug')('qcloud-sdk[ci]')
const crypto = require('crypto')
const config = require('../../config')
const http = require('axios')

function idCardIdentify (imageUrls, ciBucket, cardType) {
    debug(`Identify: ${JSON.stringify(imageUrls)}`)

    return http({
        url: 'http://recognition.image.myqcloud.com/ocr/idcard',
        headers: {
            'Content-Type': 'application/json',
            Authorization: getSignature(ciBucket)
        },
        method: 'POST',
        data: {
            appid: config.qcloudAppId.toString(),
            bucket: ciBucket,
            card_type: cardType,
            url_list: imageUrls
        }
    })
}

function ocr (imageUrl, ciBucket) {
    debug(`Ocr: ${JSON.stringify(imageUrl)}`)

    return http({
        url: 'http://recognition.image.myqcloud.com/ocr/general',
        headers: {
            'Content-Type': 'application/json',
            Authorization: getSignature(ciBucket)
        },
        method: 'POST',
        data: {
            appid: config.qcloudAppId.toString(),
            bucket: ciBucket,
            url: imageUrl
        }
    })
}

/**
 * 获取签名
 */
function getSignature (fileBucket) {
    const appId = config.qcloudAppId
    const secretId = config.qcloudSecretId
    const secretKey = config.qcloudSecretKey

    /**
     * a=[appid]&b=[bucket]&k=[SecretID]&e=[expiredTime]&t=[currentTime]&r=[rand]&u=[userid]&f=[fileid]
     */
    const paramArr = [
        'a=' + appId,
        'b=' + fileBucket,
        'k=' + secretId,
        'e=' + (Math.floor(Date.now() / 1000) + 10),
        't=' + Math.floor(Date.now() / 1000),
        'r=' + Math.floor(Math.random() * 10),
        'u=' + 0
    ]

    debug(`paramArr: ${JSON.stringify(paramArr)}`)

    const signatureStr = paramArr.join('&')
    const temSignBuf = crypto.createHmac('sha1', secretKey).update(signatureStr).digest()
    const signatureBuf = Buffer.from(signatureStr)
    const signature = Buffer.concat([temSignBuf, signatureBuf]).toString('base64')

    debug(`signature: ${signature}`)

    return signature
}

module.exports = {
    idCardIdentify,
    ocr
}
