const debug = require('debug')('qcloud-sdk[CosUploader]')
const multiparty = require('multiparty')
const readChunk = require('read-chunk')
const shortid = require('shortid')
const fs = require('fs')
const fileType = require('file-type')
const CosSdk = require('cos-nodejs-sdk-v5')
const ERRORS = require('../constants').ERRORS
const config = require('../../config')

const regionMap = {
    'ap-beijing-1': 'tj',
    'ap-beijing': 'bj',
    'ap-shanghai': 'sh',
    'ap-guangzhou': 'gz',
    'ap-chengdu': 'cd',
    'ap-singapore': 'sgp',
    'ap-hongkong': 'hk',
    'na-toronto': 'ca',
    'eu-frankfurt': 'ger'
}

/**
 * 对象上传 API
 * @param {express request} req
 * @return {Promise} 上传任务的 Promise 对象
 */
module.exports = (req) => {
    // 初始化 sdk
    const cos = new CosSdk({
        AppId: config.qcloudAppId,
        SecretId: config.qcloudSecretId,
        SecretKey: config.qcloudSecretKey,
        Domain: `http://${config.cos.fileBucket}-${config.qcloudAppId}.cos.${config.cos.region}.myqcloud.com/`
    })

    const maxSize = config.cos.maxSize ? config.cos.maxSize : 10
    const fieldName = config.cos.fieldName ? config.cos.fieldName : 'file'

    debug('Cos sdk init finished')

    // 初始化 multiparty
    const form = new multiparty.Form({
        encoding: 'utf8',
        maxFilesSize: maxSize * 1024 * 1024,
        autoFiles: true,
        uploadDir: '/tmp'
    })

    return new Promise((resolve, reject) => {
        // 从 req 读取文件
        form.parse(req, (err, fields = {}, files = {}) => {
            err ? reject(err) : resolve({fields, files})
        })
    }).then(({files}) => {
        if (!(fieldName in files)) {
            debug('%s: 请求中没有名称为 %s 的field，请检查请求或 SDK 初始化配置', ERRORS.ERR_REQUEST_LOST_FIELD, fieldName)
            throw new Error(ERRORS.ERR_REQUEST_LOST_FIELD)
        }

        const imageFile = files.file[0]

        // 判断文件类型
        const buffer = readChunk.sync(imageFile.path, 0, 262)
        const resultType = fileType(buffer)
        if (!resultType || !['image/jpeg', 'image/png'].includes(resultType.mime)) {
            debug('%s: 不支持上传类型为 %s 的文件', ERRORS.ERR_UNSUPPORT_FILE_TYPE, resultType.mime)
            throw new Error(ERRORS.ERR_UNSUPPORT_FILE_TYPE)
        }

        // 生成上传传参数
        const srcpath = imageFile.path
        const imgKey = `${Date.now()}-${shortid.generate()}.${resultType.ext}`
        const uploadFolder = config.cos.uploadFolder ? config.cos.uploadFolder + '/' : ''
        const params = {
            Bucket: config.cos.fileBucket,
            Region: config.cos.region,
            Key: `${uploadFolder}${imgKey}`,
            Body: fs.createReadStream(srcpath),
            ContentLength: imageFile.size
        }

        return new Promise((resolve, reject) => {
            // 检查 bucket 是否存在，不存在则创建 bucket
            cos.getService(params, (err, data) => {
                if (err) {
                    reject(err)
                    // remove uploaded file
                    fs.unlink(srcpath)
                }

                // 检查提供的 Bucket 是否存在
                const hasBucket = data.Buckets && data.Buckets.reduce((pre, cur) => {
                    return pre || cur.Name === `${config.cos.fileBucket}-${config.qcloudAppId}`
                }, false)

                if (data.Buckets && !hasBucket) {
                    cos.putBucket({
                        Bucket: config.cos.fileBucket,
                        Region: config.cos.region,
                        ACL: 'public-read'
                    }, function (err, data) {
                        if (err) {
                            reject(err)
                            // remove uploaded file
                            fs.unlink(srcpath)
                        } else {
                            resolve()
                        }
                    })
                } else {
                    resolve()
                }
            })
        }).then(() => {
            return new Promise((resolve, reject) => {
                // 上传图片
                cos.putObject(params, (err, data) => {
                    if (err) {
                        reject(err)
                        // remove uploaded file
                        fs.unlink(srcpath)
                    }

                    resolve({
                        imgUrl: `http://${config.cos.fileBucket}-${config.qcloudAppId}.cos${regionMap[config.cos.region]}.myqcloud.com/${imgKey}`,
                        size: imageFile.size,
                        mimeType: resultType.mime,
                        name: imgKey
                    })

                    // remove uploaded file
                    fs.unlink(srcpath)
                })
            })
        })
    }).catch(e => {
        if (e.statusCode === 413) {
            debug('%s: %o', ERRORS.ERR_FILE_EXCEEDS_MAX_SIZE, e)
            throw new Error(`${ERRORS.ERR_FILE_EXCEEDS_MAX_SIZE}\n${e}`)
        } else {
            throw e
        }
    })
}
