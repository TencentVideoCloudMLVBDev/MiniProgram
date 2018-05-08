const url = require('url')
const config = require('../../config')
const debug = require('debug')('qcloud-sdk[tunnelSerivce]')
const signature = require('./signature')
const { ERRORS, LOGIN_STATE } = require('../constants')
const { receiveUrl, broadcast, closeTunnel } = require('./service')
const TunnelApi = require('./api')
const { validation } = require('../auth')

function getTunnelUrl (req) {
    const pathname = `${config.rootPathname}${url.parse(req.url).pathname}`

    return validation(req).then(({ loginState, userinfo }) => {
        if (loginState === LOGIN_STATE.SUCCESS) {
            return TunnelApi.requestConnect(receiveUrl(pathname)).then(res => ({
                tunnel: JSON.parse(res.data),
                userinfo: userinfo
            }))
        } else {
            throw new Error(ERRORS.ERR_UNLOGIN)
        }
    })
}

function onTunnelMessage (body) {
    return _checkRequestBody(body).then(packet => {
        if (packet.type === 'message') {
            const result = _decodePacketContent(packet)
            packet.content = result
            return packet
        } else {
            return packet
        }
    })
}

// To support koa
function onTunnelMessageMiddleware (ctx, next) {
    const body = ctx.request.body
    return _checkRequestBody(body).then(packet => {
        if (packet.type === 'message') {
            const result = _decodePacketContent(packet)
            packet.content = result
            ctx.state.$wxMessage = packet
        } else {
            ctx.state.$wxMessage = packet
        }

        return next()
    })
}

function _checkRequestBody (body) {
    return new Promise((resolve, reject) => {
        if (!body.data || !body.signature) {
            debug('%s: 响应的数据没有 data 或 signature 字段', ERRORS.ERR_INVALID_RESPONSE)
            reject(new Error(ERRORS.ERR_INVALID_RESPONSE))
        }

        // 校验签名
        if (!signature.check(body.data, body.signature)) {
            debug('%s: 响应的数据签名错误', ERRORS.ERR_INVALID_RESPONSE)
            reject(new Error(ERRORS.ERR_INVALID_RESPONSE))
        }

        try {
            body.data = JSON.parse(body.data)
        } catch (e) {
            debug('%s: 响应的数据 data 不是 JSON 字符串', ERRORS.ERR_REMOTE_TUNNEL_SERVER_RESPONSE)
            reject(new Error(ERRORS.ERR_REMOTE_TUNNEL_SERVER_RESPONSE))
        }

        resolve(body.data)
    })
}

function _decodePacketContent (packet) {
    let packetContent = {}
    if (packet.content) {
        try {
            packetContent = JSON.parse(packet.content)
        } catch (e) {}
    }

    const messageType = packetContent.type || 'UnknownRaw'
    const messageContent = ('content' in packetContent
        ? packetContent.content
        : packet.content
    )

    return { messageType, messageContent }
}

module.exports = {
    getTunnelUrl,
    onTunnelMessage,
    onTunnelMessageMiddleware,
    broadcast,
    closeTunnel
}
