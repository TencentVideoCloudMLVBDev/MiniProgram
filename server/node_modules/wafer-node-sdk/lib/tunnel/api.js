const config = require('../../config')
const signature = require('./signature')
const axios = require('axios')
const md5 = require('../helper/md5')
const { ERRORS } = require('../constants')
const debug = require('debug')('qcloud-sdk[tunnelapi]')

module.exports = {
    requestConnect (receiveUrl) {
        const protocolType = 'wss'
        const param = { receiveUrl, protocolType }
        return this._sendRequest('/get/wsurl', param, true)
    },

    emitMessage (tunnelIds, messageType, messageContent) {
        const packetType = 'message'
        const packetContent = JSON.stringify({
            'type': messageType,
            'content': messageContent
        })

        return this.emitPacket(tunnelIds, packetType, packetContent)
    },

    emitPacket (tunnelIds, packetType, packetContent) {
        const param = { tunnelIds, 'type': packetType }
        if (packetContent) {
            param.content = packetContent
        }

        return this._sendRequest('/ws/push', [param], false)
    },

    _sendRequest (apiPath, apiParam, withTcKey) {
        const url = config.tunnelServerUrl + apiPath
        const data = this._packReqData(apiParam, withTcKey)

        debug('_sendRequest: %o', data)

        return axios({ url, method: 'POST', data }).then(result => {
            const statusCode = result.status
            const body = result.data

            if (statusCode !== 200) {
                debug('%s: 请求信道 API 失败，网络异常或信道服务器错误, %o', ERRORS.ERR_REMOTE_TUNNEL_SERVER_ERR, result)
                throw new Error(ERRORS.ERR_REMOTE_TUNNEL_SERVER_ERR)
            }

            if (!body || typeof body !== 'object' || !('code' in body)) {
                debug('%s: 信道服务器响应格式错误，无法解析 JSON 字符串', ERRORS.ERR_REMOTE_TUNNEL_SERVER_RESPONSE)
                throw new Error(ERRORS.ERR_REMOTE_TUNNEL_SERVER_RESPONSE)
            }

            if (body.code !== 0) {
                debug('%s: 信道服务调用失败：%s - %s', ERRORS.ERR_UNKNOWN_TUNNEL_ERROR, body.code, body.message)
                throw new Error(ERRORS.ERR_UNKNOWN_TUNNEL_ERROR)
            }

            return body
        })
    },

    _packReqData (data, withTcKey = false) {
        data = JSON.stringify(data)
        return {
            data,
            tcId: md5(config.serverHost),
            tcKey: config.tunnelSignatureKey,
            signature: signature.compute(data)
        }
    }
}

