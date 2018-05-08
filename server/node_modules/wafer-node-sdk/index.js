const config = require('./config')
const debug = require('debug')('qcloud-sdk[init]')
const { ERRORS } = require('./lib/constants')

/**
 * 初始化 qcloud sdk

 * SDK 所有支持的配置项
 * @param {object} [必须] configs                    配置信息

 * @param {object} [必须] configs.rootPathname       程序运行对应的根路径

 * @param {string} [可选] configs.appId              微信小程序 App ID
 * @param {string} [可选] configs.appSecret          微信小程序 App Secret
 * @param {boolean}[必须] configs.useQcloudLogin     是否腾讯云代理登录

 * @param {object} [必须] configs.mysql              MySQL 配置信息
 * @param {string} [必须] configs.mysql.host         MySQL 主机名
 * @param {string} [可选] configs.mysql.port         MySQL 端口（默认3306）
 * @param {string} [必须] configs.mysql.user         MySQL 用户名
 * @param {string} [必须] configs.mysql.db           MySQL 数据库
 * @param {string} [必须] configs.mysql.pass         MySQL 密码
 * @param {string} [可选] configs.mysql.char         MySQL 编码

 * @param {object} [必须] configs.cos                cos 配置信息
 * @param {string} [必须] configs.cos.region         cos 的地域
 * @param {string} [必须] configs.cos.fileBucket     cos 的 bucket 名
 * @param {string} [必须] configs.cos.uploadFolder   cos 上传文件夹名
 * @param {string} [可选] configs.cos.maxSize        cos 上传最大大小，默认 5M (单位：M)
 * @param {string} [可选] configs.cos.field          cos 上传是 field 名称，默认为 'file'

 * @param {string} [必须] configs.serverHost         服务器 Host

 * @param {string} [必须] configs.tunnelServerUrl    信道服务器地址
 * @param {string} [必须] configs.tunnelSignatureKey 信道服务签名

 * @param {string} [必须] configs.qcloudAppId        腾讯云 AppId
 * @param {string} [必须] configs.qcloudSecretId     腾讯云 SecretId
 * @param {string} [必须] configs.qcloudSecretKey    腾讯云 SecretKey

 * @param {string} [必须] configs.wxMessageToken     微信消息通知 token
 * @param {number} [可选] configs.wxLoginExpires     微信登录态有效期（单位：秒）
 */
module.exports = function init (options) {
    // 检查配置项
    const { rootPathname, useQcloudLogin, cos, serverHost, tunnelServerUrl, tunnelSignatureKey, qcloudAppId, qcloudSecretId, qcloudSecretKey, wxMessageToken } = options
    if ([rootPathname, useQcloudLogin, cos, serverHost, tunnelServerUrl, tunnelSignatureKey, qcloudAppId, qcloudSecretId, qcloudSecretKey, wxMessageToken].some(v => v === undefined)) throw new Error(ERRORS.ERR_INIT_SDK_LOST_CONFIG)

    const { region, fileBucket, uploadFolder } = cos
    if ([region, fileBucket, uploadFolder].some(v => v === undefined)) throw new Error(ERRORS.ERR_INIT_SDK_LOST_CONFIG)

    if (options.mysql) {
        const { host, port, user, db, pass } = options.mysql
        if ([host, port, user, db, pass].some(v => v === undefined)) throw new Error(ERRORS.ERR_INIT_SDK_LOST_CONFIG)
    }

    // 初始化配置
    const configs = config.set(options)

    debug('using config: %o', configs)

    return {
        config,
        mysql: require('./lib/mysql'),
        auth: require('./lib/auth'),
        uploader: require('./lib/upload'),
        tunnel: require('./lib/tunnel'),
        message: require('./lib/message'),
        ci: require('./lib/ci/ocr')
    }
}
