const debug = require('debug')('qcloud-sdk[AuthDbService]')
const uuidGenerator = require('uuid/v4')
const moment = require('moment')
const ERRORS = require('../constants').ERRORS
const mysql = require('./index')

/**
 * 储存用户信息
 * @param {object} userInfo
 * @param {string} sessionKey
 * @return {Promise}
 */
function saveUserInfo (userInfo, skey, session_key) {
    const uuid = uuidGenerator()
    const create_time = moment().format('YYYY-MM-DD HH:mm:ss')
    const last_visit_time = create_time
    const open_id = userInfo.openId
    const user_info = JSON.stringify(userInfo)

    // 查重并决定是插入还是更新数据
    return mysql('cSessionInfo').count('open_id as hasUser').where({
        open_id
    })
    .then(res => {
        // 如果存在用户则更新
        if (res[0].hasUser) {
            return mysql('cSessionInfo').update({
                uuid, skey, create_time, last_visit_time, session_key, user_info
            }).where({
                open_id
            })
        } else {
            return mysql('cSessionInfo').insert({
                uuid, skey, create_time, last_visit_time, open_id, session_key, user_info
            })
        }
    })
    .then(() => ({
        userinfo: userInfo,
        skey: skey
    }))
    .catch(e => {
        debug('%s: %O', ERRORS.DBERR.ERR_WHEN_INSERT_TO_DB, e)
        throw new Error(`${ERRORS.DBERR.ERR_WHEN_INSERT_TO_DB}\n${e}`)
    })
}

/**
 * 通过 skey 获取用户信息
 * @param {string} skey 登录时颁发的 skey 为登录态标识
 */
function getUserInfoBySKey (skey) {
    if (!skey) throw new Error(ERRORS.DBERR.ERR_NO_SKEY_ON_CALL_GETUSERINFOFUNCTION)

    return mysql('cSessionInfo').select('*').where({
        skey
    })
}

module.exports = {
    saveUserInfo,
    getUserInfoBySKey
}
