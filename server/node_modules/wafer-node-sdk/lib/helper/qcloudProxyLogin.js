const debug = require('debug')('qcloud-sdk[proxyLogin]')
const { ERRORS } = require('../constants')
const crypto = require('crypto')
const http = require('axios')

/**
 * 腾讯云代小程序登录换取 session_key
 * @param {string} secretId  腾讯云的 secretId
 * @param {string} secretKey 腾讯云的 secretKey
 * @param {string} wxcode    微信小程序登录的 code
 * @see https://www.qcloud.com/document/api/377/4214 签名算法
 * @see 接入文档
 */
module.exports = function qcloudProxyLogin (secretId, secretKey, wxcode) {
    // 检查参数
    if (!secretId || !secretKey || !wxcode) throw new Error(ERRORS.ERR_REQUEST_PARAM)

    // 一些常量
    const requestUrl = 'wss.api.qcloud.com/v2/index.php'
    const requestMethod = 'GET'
    const requestParams = {
        Action: 'GetSessionKey',
        js_code: wxcode
    }

    // 生成时间戳和随机正整数
    requestParams.Timestamp = Math.floor(Date.now() / 1000)
    requestParams.Nonce = Math.floor(Math.random() * 10000000)
    requestParams.SecretId = secretId
    requestParams.SignatureMethod = 'HmacSHA256'

    debug('Request params: %o', requestParams)

    // 参数按字典序排序并生成字符串
    const requestString = Object.keys(requestParams).sort().map(key => {
        /**
         * 注意：
         * 1、“参数值”为原始值而非 url 编码后的值。
         * 2、若输入参数的 Key 中包含下划线，则需要将其转换为“.”，但是 Value 中的下划线则不用转换。
         */
        return `${key.replace('_', '.')}=${requestParams[key]}`
    }).join('&')

    debug('Request string: %s', requestString)

    // 拼装原始签名字符串
    const signatureRawString = `${requestMethod}${requestUrl}?${requestString}`

    debug('Signature raw string: %s', signatureRawString)

    // 计算签名
    requestParams.Signature = new Buffer(
        crypto.createHmac('sha256', secretKey).update(signatureRawString).digest()
    ).toString('base64')

    debug('Signature: %s', requestParams.Signature)

    return http({
        url: `https://${requestUrl}`,
        method: requestMethod,
        params: requestParams
    })
}
