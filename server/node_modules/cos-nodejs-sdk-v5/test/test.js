var fs = require('fs');
var path = require('path');
var COS = require('../index');
var request = require('request');
var util = require('../demo/util');
var config = require('../demo/config');
var Writable = require('stream').Writable;

if (process.env.AppId) {
    config = {
        AppId: process.env.AppId,
        SecretId: process.env.SecretId,
        SecretKey: process.env.SecretKey,
        Bucket: process.env.Bucket,
        Region: process.env.Region,
    }
}

var cos = new COS({
    AppId: config.AppId,
    SecretId: config.SecretId,
    SecretKey: config.SecretKey,
});

var AppId = config.AppId;
var Bucket = config.Bucket;
if (config.Bucket.indexOf('-') > -1) {
    var arr = config.Bucket.split('-');
    Bucket = arr[0];
    AppId = arr[1];
}

var assert = require("assert");

function prepareBucket() {
    return new Promise(function (resolve, reject) {
        cos.putBucket({
            Bucket: config.Bucket,
            Region: config.Region
        }, function (err, data) {
            resolve();
        });
    });
}

function prepareBigObject() {
    return new Promise(function (resolve, reject) {
        // 创建测试文件
        var filename = 'big.zip';
        var filepath = path.resolve(__dirname, filename);
        var put = function () {
            // 调用方法
            cos.putObject({
                Bucket: config.Bucket,
                Region: config.Region,
                Key: filename,
                Body: fs.createReadStream(filepath),
                ContentLength: fs.statSync(filepath).size,
            }, function (err, data) {
                err ? reject(err) : resolve()
            });
        };
        if (fs.existsSync(filepath)) {
            put();
        } else {
            util.createFile(filepath, 1024 * 1024 * 10, put);
        }
    });
}

function comparePlainObject(a, b) {
    if (Object.keys(a).length !== Object.keys(b).length) {
        return false;
    }
    for (var key in a) {
        if (typeof a[key] === 'object' && typeof b[key] === 'object') {
            if (!comparePlainObject(a[key], b[key])) {
                return false;
            }
        } else if (a[key] != b[key]) {
            return false;
        }
    }
    return true;
}

describe('getService()', function () {
    this.timeout(60000);
    it('能正常列出 Bucket', function (done) {
        prepareBucket().then(function () {
            cos.getService(function (err, data) {
                var hasBucket = false;
                data.Buckets && data.Buckets.forEach(function (item) {
                    if (item.Name === Bucket + '-' + AppId && item.Location === config.Region) {
                        hasBucket = true;
                    }
                });
                assert.equal(true, hasBucket);
                done();
            });
        }).catch(function () {
        });
    });
});

describe('getAuth()', function () {
    this.timeout(60000);
    it('通过获取签名能正常获取文件', function (done) {
        var content = Date.now().toString();
        var key = '1mb.zip';
        prepareBucket().then(function () {
            cos.putObject({
                Bucket: config.Bucket,
                Region: config.Region,
                Key: key,
                Body: new Buffer(content)
            }, function (err, data) {
                var auth = cos.getAuth({
                    Method: 'get',
                    Key: key
                });
                var link = 'http://' + Bucket + '-' + AppId + '.cos.' + config.Region + '.myqcloud.com/' + key + '?sign=' + encodeURIComponent(auth);
                request(link, function (err, response, body) {
                    assert(response.statusCode === 200);
                    assert(body === content);
                    done();
                });
            });
        }).catch(function () {
        });
    });
});

describe('putBucket()', function () {
    this.timeout(60000);
    var bucket = 'test' + Date.now().toString(36);
    it('正常创建 bucket', function (done) {
        cos.putBucket({
            Bucket: bucket,
            Region: config.Region
        }, function (err, data) {
            assert.equal('http://' + bucket + '-' + AppId + '.cos.' + config.Region + '.myqcloud.com', data.Location);
            cos.headBucket({
                Bucket: bucket,
                Region: config.Region
            }, function (err, data) {
                assert(data.BucketExist);
                assert(data.BucketAuth);
                cos.deleteBucket({
                    Bucket: bucket,
                    Region: config.Region
                }, function (err, data) {
                    done();
                });
            });
        });
    });
});

describe('getBucket()', function () {
    this.timeout(60000);
    it('正常获取 bucket 里的文件列表', function (done) {
        prepareBucket().then(function () {
            cos.getBucket({
                Bucket: config.Bucket,
                Region: config.Region
            }, function (err, data) {
                assert.equal(true, data.Name === Bucket + '-' + config.AppId);
                assert.equal(data.Contents.constructor, Array);
                done();
            });
        }).catch(function () {
        });
    });
});

describe('putObject()', function () {
    this.timeout(60000);
    var filename = '1.txt';
    var filepath = path.resolve(__dirname, filename);
    var getObjectContent = function (callback) {
        var objectContent = new Buffer([]);
        var outputStream = new Writable({
            write: function (chunk, encoding, callback) {
                objectContent = Buffer.concat([objectContent, chunk]);
            }
        });
        setTimeout(function () {
            cos.getObject({
                Bucket: config.Bucket,
                Region: config.Region,
                Key: filename,
                Output: outputStream
            }, function (err, data) {
                var content = objectContent.toString();
                callback(content);
            });
        }, 2000);
    };
    it('fs.createReadStream 创建 object', function (done) {
        var content = Date.now().toString();
        fs.writeFileSync(filepath, content);
        var lastPercent = 0;
        cos.putObject({
            Bucket: config.Bucket,
            Region: config.Region,
            Key: filename,
            Body: fs.createReadStream(filepath),
            ContentLength: fs.statSync(filepath).size,
            onProgress: function (processData) {
                lastPercent = processData.percent;
            },
        }, function (err, data) {
            if (err) throw err;
            assert(data.ETag.length > 0);
            fs.unlinkSync(filepath);
            getObjectContent(function (objectContent) {
                assert(objectContent === content);
                done();
            });
        });
    });
    it('fs.readFileSync 创建 object', function (done) {
        var content = Date.now().toString();
        fs.writeFileSync(filepath, content);
        var lastPercent = 0;
        cos.putObject({
            Bucket: config.Bucket,
            Region: config.Region,
            Key: filename,
            Body: fs.readFileSync(filepath),
            onProgress: function (processData) {
                lastPercent = processData.percent;
            },
        }, function (err, data) {
            if (err) throw err;
            assert(data.ETag.length > 0);
            fs.unlinkSync(filepath);
            getObjectContent(function (objectContent) {
                assert(objectContent === content);
                done();
            });
        });
    });
    it('捕获输入流异常', function (done) {
        var filename = 'big.zip';
        var filepath = path.resolve(__dirname, filename);
        var put = function () {
            var Body = fs.createReadStream(filepath);
            setTimeout(function () {
                Body.emit('error', new Error('some error'))
            }, 1000);
            cos.putObject({
                Bucket: config.Bucket,
                Region: config.Region,
                Key: filename,
                Body: Body,
                ContentLength: fs.statSync(filepath).size,
            }, function (err, data) {
                fs.unlinkSync(filepath);
                done();
            });
        };
        if (fs.existsSync(filepath)) {
            put();
        } else {
            util.createFile(filepath, 5 << 20, put);
        }
    });
});

describe('getObject()', function () {
    this.timeout(60000);
    it('stream', function (done) {
        var key = '1.txt';
        var objectContent = new Buffer([]);
        var outputStream = new Writable({
            write: function (chunk, encoding, callback) {
                objectContent = Buffer.concat([objectContent, chunk]);
            }
        });
        var content = Date.now().toString(36);
        cos.putObject({
            Bucket: config.Bucket,
            Region: config.Region,
            Key: key,
            Body: new Buffer(content)
        }, function (err, data) {
            setTimeout(function () {
                cos.getObject({
                    Bucket: config.Bucket,
                    Region: config.Region,
                    Key: key,
                    Output: outputStream
                }, function (err, data) {
                    if (err) throw err;
                    objectContent = objectContent.toString();
                    assert(data.headers['content-length'] === '' + content.length);
                    assert(objectContent === content);
                    done();
                });
            }, 2000);
        });
    });
    it('body', function (done) {
        var key = '1.txt';
        var content = Date.now().toString();
        cos.putObject({
            Bucket: config.Bucket,
            Region: config.Region,
            Key: key,
            Body: new Buffer(content)
        }, function (err, data) {
            setTimeout(function () {
                cos.getObject({
                    Bucket: config.Bucket,
                    Region: config.Region,
                    Key: key
                }, function (err, data) {
                    if (err) throw err;
                    var objectContent = data.Body.toString();
                    assert(data.headers['content-length'] === '' + content.length);
                    assert(objectContent === content);
                    done();
                });
            }, 2000);
        });
    });
});

describe('sliceUploadFile()', function () {
    this.timeout(120000);
    it('正常分片上传 object', function (done) {
        var filename = '3mb.zip';
        var filepath = path.resolve(__dirname, filename);
        var put = function () {
            var lastPercent = 0;
            cos.sliceUploadFile({
                Bucket: config.Bucket,
                Region: config.Region,
                Key: filename,
                FilePath: filepath,
                SliceSize: 1024 * 1024,
                AsyncLimit: 5,
                onHashProgress: function (progressData) {
                },
                onProgress: function (progressData) {
                    lastPercent = progressData.percent;
                },
            }, function (err, data) {
                assert.equal(true, data.ETag.length > 0 && lastPercent === 1);
                fs.unlinkSync(filepath);
                done();
            });
        };
        if (fs.existsSync(filepath)) {
            put();
        } else {
            util.createFile(filepath, 3 * 1024 * 1024, put);
        }
    });
});

describe('BucketAcl', function () {
    this.timeout(60000);
    var AccessControlPolicy = {
        "Owner": {
            "ID": 'qcs::cam::uin/10001:uin/10001' // 10001 是 QQ 号
        },
        "Grants": [{
            "Grantee": {
                "ID": "qcs::cam::uin/10002:uin/10002", // 10002 是 QQ 号
            },
            "Permission": "READ"
        }]
    };
    var AccessControlPolicy2 = {
        "Owner": {
            "ID": 'qcs::cam::uin/10001:uin/10001' // 10001 是 QQ 号
        },
        "Grant": {
            "Grantee": {
                "ID": "qcs::cam::uin/10002:uin/10002", // 10002 是 QQ 号
            },
            "Permission": "READ"
        }
    };
    it('putBucketAcl() header ACL:private', function (done) {
        cos.putBucketAcl({
            Bucket: config.Bucket,
            Region: config.Region,
            ACL: 'private'
        }, function (err, data) {
            assert(!err);
            cos.getBucketAcl({Bucket: config.Bucket, Region: config.Region}, function (err, data) {
                assert(data.Grants.length === 1);
                done();
            });
        });
    });
    it('putBucketAcl() header ACL:public-read', function (done) {
        cos.putBucketAcl({
            Bucket: config.Bucket,
            Region: config.Region,
            ACL: 'public-read',
        }, function (err, data) {
            assert(!err);
            cos.getBucketAcl({Bucket: config.Bucket, Region: config.Region}, function (err, data) {
                assert(data.Grants.length === 1);
                assert(data.Grants[0].Grantee.ID === 'qcs::cam::anyone:anyone');
                assert(data.Grants[0].Permission === 'READ');
                done();
            });
        });
    });
    it('putBucketAcl() header ACL:public-read-write', function (done) {
        cos.putBucketAcl({
            Bucket: config.Bucket,
            Region: config.Region,
            ACL: 'public-read-write',
        }, function (err, data) {
            assert(!err);
            cos.getBucketAcl({Bucket: config.Bucket, Region: config.Region}, function (err, data) {
                assert(data.Grants.length === 1);
                assert(data.Grants[0].Grantee.ID === 'qcs::cam::anyone:anyone');
                assert(data.Grants[0].Permission === 'FULL_CONTROL');
                done();
            });
        });
    });
    it('putBucketAcl() header GrantRead:1001,1002', function (done) {
        cos.putBucketAcl({
            Bucket: config.Bucket,
            Region: config.Region,
            GrantRead: 'id="qcs::cam::uin/1001:uin/1001",id="qcs::cam::uin/1002:uin/1002"',
        }, function (err, data) {
            assert(!err);
            cos.getBucketAcl({Bucket: config.Bucket, Region: config.Region}, function (err, data) {
                assert(data.Grants.length === 2);
                assert(data.Grants[0].Grantee.ID === 'qcs::cam::uin/1001:uin/1001');
                assert(data.Grants[0].Permission === 'READ');
                assert(data.Grants[1].Grantee.ID === 'qcs::cam::uin/1002:uin/1002');
                assert(data.Grants[1].Permission === 'READ');
                done();
            });
        });
    });
    it('putBucketAcl() header GrantWrite:1001,1002', function (done) {
        cos.putBucketAcl({
            Bucket: config.Bucket,
            Region: config.Region,
            GrantWrite: 'id="qcs::cam::uin/1001:uin/1001",id="qcs::cam::uin/1002:uin/1002"',
        }, function (err, data) {
            assert(!err);
            cos.getBucketAcl({Bucket: config.Bucket, Region: config.Region}, function (err, data) {
                assert(data.Grants.length === 2);
                assert(data.Grants[0].Grantee.ID === 'qcs::cam::uin/1001:uin/1001');
                assert(data.Grants[0].Permission === 'WRITE');
                assert(data.Grants[1].Grantee.ID === 'qcs::cam::uin/1002:uin/1002');
                assert(data.Grants[1].Permission === 'WRITE');
                done();
            });
        });
    });
    it('putBucketAcl() header GrantFullControl:1001,1002', function (done) {
        cos.putBucketAcl({
            Bucket: config.Bucket,
            Region: config.Region,
            GrantFullControl: 'id="qcs::cam::uin/1001:uin/1001",id="qcs::cam::uin/1002:uin/1002"',
        }, function (err, data) {
            assert(!err);
            cos.getBucketAcl({Bucket: config.Bucket, Region: config.Region}, function (err, data) {
                assert(data.Grants.length === 2);
                assert(data.Grants[0].Grantee.ID === 'qcs::cam::uin/1001:uin/1001');
                assert(data.Grants[0].Permission === 'FULL_CONTROL');
                assert(data.Grants[1].Grantee.ID === 'qcs::cam::uin/1002:uin/1002');
                assert(data.Grants[1].Permission === 'FULL_CONTROL');
                done();
            });
        });
    });
    it('putBucketAcl() header ACL:public-read, GrantFullControl:1001,1002', function (done) {
        cos.putBucketAcl({
            Bucket: config.Bucket,
            Region: config.Region,
            GrantFullControl: 'id="qcs::cam::uin/1001:uin/1001",id="qcs::cam::uin/1002:uin/1002"',
            ACL: 'public-read',
        }, function (err, data) {
            assert(!err);
            cos.getBucketAcl({Bucket: config.Bucket, Region: config.Region}, function (err, data) {
                assert(data.Grants.length === 3);
                assert(data.Grants[0].Grantee.ID === 'qcs::cam::anyone:anyone');
                assert(data.Grants[0].Permission === 'READ');
                assert(data.Grants[1].Grantee.ID === 'qcs::cam::uin/1001:uin/1001');
                assert(data.Grants[1].Permission === 'FULL_CONTROL');
                assert(data.Grants[2].Grantee.ID === 'qcs::cam::uin/1002:uin/1002');
                assert(data.Grants[2].Permission === 'FULL_CONTROL');
                done();
            });
        });
    });
    it('putBucketAcl() xml', function (done) {
        cos.putBucketAcl({
            Bucket: config.Bucket,
            Region: config.Region,
            AccessControlPolicy: AccessControlPolicy
        }, function (err, data) {
            assert(!err);
            cos.getBucketAcl({Bucket: config.Bucket, Region: config.Region}, function (err, data) {
                assert(data.Grants.length === 1);
                assert(data.Grants[0].Grantee.ID === 'qcs::cam::uin/10002:uin/10002');
                assert(data.Grants[0].Permission === 'READ');
                done();
            });
        });
    });
    it('putBucketAcl() xml2', function (done) {
        cos.putBucketAcl({
            Bucket: config.Bucket,
            Region: config.Region,
            AccessControlPolicy: AccessControlPolicy2,
        }, function (err, data) {
            assert(!err);
            cos.getBucketAcl({Bucket: config.Bucket, Region: config.Region}, function (err, data) {
                assert(data.Grants.length === 1);
                assert(data.Grants[0].Grantee.ID === 'qcs::cam::uin/10002:uin/10002');
                assert(data.Grants[0].Permission === 'READ');
                done();
            });
        });
    });
    it('putBucketAcl() decodeAcl', function (done) {
        cos.getBucketAcl({
            Bucket: config.Bucket,
            Region: config.Region
        }, function (err, data) {
            cos.putBucketAcl({
                Bucket: config.Bucket,
                Region: config.Region,
                GrantFullControl: data.GrantFullControl,
                GrantWrite: data.GrantWrite,
                GrantRead: data.GrantRead,
                ACL: data.ACL,
            }, function (err, data) {
                assert(data);
                done();
            });
        });
    });
});

describe('ObjectAcl', function () {
    this.timeout(60000);
    var AccessControlPolicy = {
        "Owner": {
            "ID": 'qcs::cam::uin/10001:uin/10001' // 10001 是 QQ 号
        },
        "Grants": [{
            "Grantee": {
                "ID": "qcs::cam::uin/10002:uin/10002", // 10002 是 QQ 号
            },
            "Permission": "READ"
        }]
    };
    var AccessControlPolicy2 = {
        "Owner": {
            "ID": 'qcs::cam::uin/10001:uin/10001' // 10001 是 QQ 号
        },
        "Grant": {
            "Grantee": {
                "ID": "qcs::cam::uin/10002:uin/10002", // 10002 是 QQ 号
            },
            "Permission": "READ"
        }
    };
    it('putObjectAcl() header ACL:private', function (done) {
        cos.putObject({
            Bucket: config.Bucket,
            Region: config.Region,
            Key: '1.txt',
            Body: new Buffer('hello!'),
        }, function (err, data) {
            assert(!err);
            cos.putObjectAcl({
                Bucket: config.Bucket,
                Region: config.Region,
                ACL: 'private',
                Key: '1.txt',
            }, function (err, data) {
                assert(!err);
                cos.getObjectAcl({Bucket: config.Bucket, Region: config.Region, Key: '1.txt'}, function (err, data) {
                    assert(data.Grants.length === 1);
                    done();
                });
            });
        });
    });
    it('putObjectAcl() header ACL:public-read', function (done) {
        cos.putObjectAcl({
            Bucket: config.Bucket,
            Region: config.Region,
            ACL: 'public-read',
            Key: '1.txt',
        }, function (err, data) {
            assert(!err);
            cos.getObjectAcl({Bucket: config.Bucket, Region: config.Region, Key: '1.txt'}, function (err, data) {
                assert(data.Grants.length === 1);
                assert(data.Grants[0].Grantee.ID === 'qcs::cam::anyone:anyone');
                assert(data.Grants[0].Permission === 'READ');
                done();
            });
        });
    });
    it('putObjectAcl() header ACL:public-read-write', function (done) {
        cos.putObjectAcl({
            Bucket: config.Bucket,
            Region: config.Region,
            ACL: 'public-read-write',
            Key: '1.txt',
        }, function (err, data) {
            assert(!err);
            cos.getObjectAcl({Bucket: config.Bucket, Region: config.Region, Key: '1.txt'}, function (err, data) {
                assert(data.Grants.length === 1);
                assert(data.Grants[0].Grantee.ID === 'qcs::cam::anyone:anyone');
                assert(data.Grants[0].Permission === 'FULL_CONTROL');
                done();
            });
        });
    });
    it('putObjectAcl() header GrantRead:1001,1002', function (done) {
        cos.putObjectAcl({
            Bucket: config.Bucket,
            Region: config.Region,
            GrantRead: 'id="qcs::cam::uin/1001:uin/1001",id="qcs::cam::uin/1002:uin/1002"',
            Key: '1.txt',
        }, function (err, data) {
            assert(!err);
            cos.getObjectAcl({Bucket: config.Bucket, Region: config.Region, Key: '1.txt'}, function (err, data) {
                assert(data.Grants.length === 2);
                assert(data.Grants[0].Grantee.ID === 'qcs::cam::uin/1001:uin/1001');
                assert(data.Grants[0].Permission === 'READ');
                assert(data.Grants[1].Grantee.ID === 'qcs::cam::uin/1002:uin/1002');
                assert(data.Grants[1].Permission === 'READ');
                done();
            });
        });
    });
    it('putObjectAcl() header GrantWrite:1001,1002', function (done) {
        cos.putObjectAcl({
            Bucket: config.Bucket,
            Region: config.Region,
            GrantWrite: 'id="qcs::cam::uin/1001:uin/1001",id="qcs::cam::uin/1002:uin/1002"',
            Key: '1.txt',
        }, function (err, data) {
            assert(!err);
            cos.getObjectAcl({Bucket: config.Bucket, Region: config.Region, Key: '1.txt'}, function (err, data) {
                assert(data.Grants.length === 2);
                assert(data.Grants[0].Grantee.ID === 'qcs::cam::uin/1001:uin/1001');
                assert(data.Grants[0].Permission === 'WRITE');
                assert(data.Grants[1].Grantee.ID === 'qcs::cam::uin/1002:uin/1002');
                assert(data.Grants[1].Permission === 'WRITE');
                done();
            });
        });
    });
    it('putObjectAcl() header GrantFullControl:1001,1002', function (done) {
        cos.putObjectAcl({
            Bucket: config.Bucket,
            Region: config.Region,
            GrantFullControl: 'id="qcs::cam::uin/1001:uin/1001",id="qcs::cam::uin/1002:uin/1002"',
            Key: '1.txt',
        }, function (err, data) {
            assert(!err);
            cos.getObjectAcl({Bucket: config.Bucket, Region: config.Region, Key: '1.txt'}, function (err, data) {
                assert(data.Grants.length === 2);
                assert(data.Grants[0].Grantee.ID === 'qcs::cam::uin/1001:uin/1001');
                assert(data.Grants[0].Permission === 'FULL_CONTROL');
                assert(data.Grants[1].Grantee.ID === 'qcs::cam::uin/1002:uin/1002');
                assert(data.Grants[1].Permission === 'FULL_CONTROL');
                done();
            });
        });
    });
    it('putObjectAcl() header ACL:public-read, GrantRead:1001,1002', function (done) {
        cos.putObjectAcl({
            Bucket: config.Bucket,
            Region: config.Region,
            GrantFullControl: 'id="qcs::cam::uin/1001:uin/1001",id="qcs::cam::uin/1002:uin/1002"',
            ACL: 'public-read',
            Key: '1.txt',
        }, function (err, data) {
            assert(!err);
            cos.getObjectAcl({Bucket: config.Bucket, Region: config.Region, Key: '1.txt'}, function (err, data) {
                assert(data.Grants.length === 3);
                assert(data.Grants[0].Grantee.ID === 'qcs::cam::anyone:anyone');
                assert(data.Grants[0].Permission === 'READ');
                assert(data.Grants[1].Grantee.ID === 'qcs::cam::uin/1001:uin/1001');
                assert(data.Grants[1].Permission === 'FULL_CONTROL');
                assert(data.Grants[2].Grantee.ID === 'qcs::cam::uin/1002:uin/1002');
                assert(data.Grants[2].Permission === 'FULL_CONTROL');
                done();
            });
        });
    });
    it('putObjectAcl() xml', function (done) {
        cos.putObjectAcl({
            Bucket: config.Bucket,
            Region: config.Region,
            AccessControlPolicy: AccessControlPolicy,
            Key: '1.txt',
        }, function (err, data) {
            assert(!err);
            cos.getBucketAcl({Bucket: config.Bucket, Region: config.Region, Key: '1.txt'}, function (err, data) {
                assert(data.Grants.length === 1);
                assert(data.Grants[0].Grantee.ID === 'qcs::cam::uin/10002:uin/10002');
                assert(data.Grants[0].Permission === 'READ');
                done();
            });
        });
    });
    it('putObjectAcl() xml2', function (done) {
        cos.putObjectAcl({
            Bucket: config.Bucket,
            Region: config.Region,
            AccessControlPolicy: AccessControlPolicy2,
            Key: '1.txt',
        }, function (err, data) {
            assert(!err);
            cos.getObjectAcl({Bucket: config.Bucket, Region: config.Region, Key: '1.txt'}, function (err, data) {
                assert(data.Grants.length === 1);
                assert(data.Grants[0].Grantee.ID === 'qcs::cam::uin/10002:uin/10002');
                assert(data.Grants[0].Permission === 'READ');
                done();
            });
        });
    });
    it('putObjectAcl() decodeAcl', function (done) {
        cos.getObjectAcl({
            Bucket: config.Bucket,
            Region: config.Region,
            Key: '1.txt'
        }, function (err, data) {
            cos.putObjectAcl({
                Bucket: config.Bucket,
                Region: config.Region,
                Key: '1.txt',
                GrantFullControl: data.GrantFullControl,
                GrantWrite: data.GrantWrite,
                GrantRead: data.GrantRead,
                ACL: data.ACL,
            }, function (err, data) {
                assert(data);
                done();
            });
        });
    });
});

describe('BucketCors', function () {
    this.timeout(60000);
    var CORSRules = [{
        "AllowedOrigins": ["*"],
        "AllowedMethods": ["GET", "POST", "PUT", "DELETE", "HEAD"],
        "AllowedHeaders": ["*"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": "5"
    }];
    var CORSRules1 = [{
        "AllowedOrigin": "*",
        "AllowedMethods": ["GET", "POST", "PUT", "DELETE", "HEAD"],
        "AllowedHeaders": ["*"],
        "ExposeHeader": "ETag",
        "MaxAgeSeconds": "5"
    }];
    var CORSRulesMulti = [{
        "AllowedOrigins": ["*"],
        "AllowedMethods": ["GET", "POST", "PUT", "DELETE", "HEAD"],
        "AllowedHeaders": ["*"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": "5"
    }, {
        "AllowedOrigins": ["http://qq.com", "http://qcloud.com"],
        "AllowedMethods": ["GET", "POST", "PUT", "DELETE", "HEAD"],
        "AllowedHeaders": ["*"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": "5"
    }];
    it('deleteBucketCors()', function (done) {
        cos.deleteBucketCors({
            Bucket: config.Bucket,
            Region: config.Region
        }, function (err, data) {
            assert(!err);
            setTimeout(function () {
                cos.getBucketCors({
                    Bucket: config.Bucket,
                    Region: config.Region
                }, function (err, data) {
                    assert(comparePlainObject([], data.CORSRules));
                    done();
                });
            }, 2000);
        });
    });
    it('putBucketCors(),getBucketCors()', function (done) {
        CORSRules[0].AllowedHeaders[CORSRules[0].AllowedHeaders.length - 1] =
            'test-' + Date.now().toString(36);
        cos.putBucketCors({
            Bucket: config.Bucket,
            Region: config.Region,
            CORSConfiguration: {
                CORSRules: CORSRules
            }
        }, function (err, data) {
            assert(!err);
            setTimeout(function () {
                cos.getBucketCors({
                    Bucket: config.Bucket,
                    Region: config.Region
                }, function (err, data) {
                    assert(comparePlainObject(CORSRules, data.CORSRules));
                    done();
                });
            }, 2000);
        });
    });
    it('putBucketCors() old', function (done) {
        var testVal = 'test-' + Date.now().toString(36);
        CORSRules[0].AllowedHeaders.push(testVal);
        cos.putBucketCors({
            Bucket: config.Bucket,
            Region: config.Region,
            CORSConfiguration: {
                CORSRules: CORSRules
            }
        }, function (err, data) {
            assert(!err);
            setTimeout(function () {
                cos.getBucketCors({
                    Bucket: config.Bucket,
                    Region: config.Region
                }, function (err, data) {
                    assert(comparePlainObject(CORSRules, data.CORSRules));
                    done();
                });
            }, 2000);
        });
    });
    it('putBucketCors() old', function (done) {
        CORSRules[0].AllowedHeaders[CORSRules[0].AllowedHeaders.length - 1] =
            'test-' + Date.now().toString(36);
        cos.putBucketCors({
            Bucket: config.Bucket,
            Region: config.Region,
            CORSRules: CORSRules
        }, function (err, data) {
            assert(!err);
            setTimeout(function () {
                cos.getBucketCors({
                    Bucket: config.Bucket,
                    Region: config.Region
                }, function (err, data) {
                    assert(comparePlainObject(CORSRules, data.CORSRules));
                    done();
                });
            }, 2000);
        });
    });
    it('putBucketCors() multi', function (done) {
        cos.putBucketCors({
            Bucket: config.Bucket,
            Region: config.Region,
            CORSConfiguration: {
                CORSRules: CORSRulesMulti
            }
        }, function (err, data) {
            assert(!err);
            setTimeout(function () {
                cos.getBucketCors({
                    Bucket: config.Bucket,
                    Region: config.Region
                }, function (err, data) {
                    assert(comparePlainObject(CORSRulesMulti, data.CORSRules));
                    done();
                });
            }, 2000);
        });
    });
});

describe('BucketTagging', function () {
    this.timeout(60000);
    var Tags = [
        {Key: "k1", Value: "v1"}
    ];
    var TagsMulti = [
        {Key: "k1", Value: "v1"},
        {Key: "k2", Value: "v2"},
    ];
    it('putBucketTagging(),getBucketTagging()', function (done) {
        Tags[0].Value = Date.now().toString(36);
        cos.putBucketTagging({
            Bucket: config.Bucket,
            Region: config.Region,
            Tagging: {
                Tags: Tags
            }
        }, function (err, data) {
            assert(!err);
            setTimeout(function () {
                cos.getBucketTagging({
                    Bucket: config.Bucket,
                    Region: config.Region
                }, function (err, data) {
                    assert(comparePlainObject(Tags, data.Tags));
                    done();
                });
            }, 2000);
        });
    });
    it('deleteBucketTagging()', function (done) {
        cos.deleteBucketTagging({
            Bucket: config.Bucket,
            Region: config.Region
        }, function (err, data) {
            assert(!err);
            setTimeout(function () {
                cos.getBucketTagging({
                    Bucket: config.Bucket,
                    Region: config.Region
                }, function (err, data) {
                    assert(comparePlainObject([], data.Tags));
                    done();
                });
            }, 2000);
        });
    });
    it('putBucketTagging() multi', function (done) {
        Tags[0].Value = Date.now().toString(36);
        cos.putBucketTagging({
            Bucket: config.Bucket,
            Region: config.Region,
            Tagging: {
                Tags: TagsMulti
            }
        }, function (err, data) {
            assert(!err);
            setTimeout(function () {
                cos.getBucketTagging({
                    Bucket: config.Bucket,
                    Region: config.Region
                }, function (err, data) {
                    assert(comparePlainObject(TagsMulti, data.Tags));
                    done();
                });
            }, 2000);
        });
    });
});

describe('BucketPolicy', function () {
    this.timeout(60000);
    var Prefix = Date.now().toString(36);
    var Policy = {
        "version": "2.0",
        "principal": {"qcs": ["qcs::cam::uin/10001:uin/10001"]}, // 这里的 10001 是 QQ 号
        "statement": [{
            "effect": "allow",
            "action": [
                "name/cos:GetBucket",
                "name/cos:PutObject",
                "name/cos:PostObject",
                "name/cos:PutObjectCopy",
                "name/cos:InitiateMultipartUpload",
                "name/cos:UploadPart",
                "name/cos:UploadPartCopy",
                "name/cos:CompleteMultipartUpload",
                "name/cos:AbortMultipartUpload",
                "name/cos:AppendObject"
            ],
            "resource": ["qcs::cos:" + config.Region + ":uid/" + AppId + ":" + Bucket + "-" + AppId + ".cos." + config.Region + ".myqcloud.com//" + AppId + "/" + Bucket + "/" + Prefix + "/*"] // 1250000000 是 appid
        }]
    };
    it('putBucketPolicy(),getBucketPolicy()', function (done) {
        cos.putBucketPolicy({
            Bucket: config.Bucket,
            Region: config.Region,
            Policy: Policy
        }, function (err, data) {
            assert(!err);
            cos.getBucketPolicy({
                Bucket: config.Bucket,
                Region: config.Region
            }, function (err, data) {
                assert(Policy, data.Policy);
                done();
            });
        });
    });
    it('putBucketPolicy() s3', function (done) {
        cos.putBucketPolicy({
            Bucket: config.Bucket,
            Region: config.Region,
            Policy: JSON.stringify(Policy)
        }, function (err, data) {
            assert(!err);
            cos.getBucketPolicy({
                Bucket: config.Bucket,
                Region: config.Region
            }, function (err, data) {
                assert(Policy, data.Policy);
                done();
            });
        });
    });
});

describe('BucketLocation', function () {
    this.timeout(60000);
    it('getBucketLocation()', function (done) {
        cos.getBucketLocation({
            Bucket: config.Bucket,
            Region: config.Region
        }, function (err, data) {
            var map = {
                'tianjin': 'ap-beijing-1',
                'cn-south-2': 'ap-guangzhou-2',
                'cn-south': 'ap-guangzhou',
                'cn-east': 'ap-shanghai',
                'cn-southwest': 'ap-chengdu',
            };
            assert(data.LocationConstraint === (map[config.Region] || config.Region));
            done();
        });
    });
});

describe('BucketLifecycle', function () {
    this.timeout(60000);
    var Rules = [{
        'ID': '1',
        'Filter': {
            'Prefix': 'test_' + Date.now().toString(36),
        },
        'Status': 'Enabled',
        'Transition': {
            'Date': '2018-07-30T00:00:00+08:00',
            'StorageClass': 'STANDARD_IA'
        }
    }];
    var RulesMulti = [{
        'ID': '1',
        'Filter': {
            'Prefix': 'test1_' + Date.now().toString(36),
        },
        'Status': 'Enabled',
        'Transition': {
            'Date': '2018-07-30T00:00:00+08:00',
            'StorageClass': 'STANDARD_IA'
        }
    }, {
        'ID': '2',
        'Filter': {
            'Prefix': 'test2_' + Date.now().toString(36),
        },
        'Status': 'Enabled',
        'Transition': {
            'Date': '2018-07-30T00:00:00+08:00',
            'StorageClass': 'STANDARD_IA'
        }
    }];
    it('deleteBucketLifecycle()', function (done) {
        cos.deleteBucketLifecycle({
            Bucket: config.Bucket,
            Region: config.Region
        }, function (err, data) {
            assert(!err);
            setTimeout(function () {
                cos.getBucketLifecycle({
                    Bucket: config.Bucket,
                    Region: config.Region
                }, function (err, data) {
                    assert(comparePlainObject([], data.Rules));
                    done();
                });
            }, 2000);
        });
    });
    it('putBucketLifecycle(),getBucketLifecycle()', function (done) {
        Rules[0].Filter.Prefix = 'test_' + Date.now().toString(36);
        cos.putBucketLifecycle({
            Bucket: config.Bucket,
            Region: config.Region,
            LifecycleConfiguration: {
                Rules: Rules
            }
        }, function (err, data) {
            assert(!err);
            setTimeout(function () {
                cos.getBucketLifecycle({
                    Bucket: config.Bucket,
                    Region: config.Region
                }, function (err, data) {
                    assert(comparePlainObject(Rules, data.Rules));
                    done();
                });
            }, 2000);
        });
    });
    it('putBucketLifecycle() multi', function (done) {
        Rules[0].Filter.Prefix = 'test_' + Date.now().toString(36);
        cos.putBucketLifecycle({
            Bucket: config.Bucket,
            Region: config.Region,
            LifecycleConfiguration: {
                Rules: RulesMulti
            }
        }, function (err, data) {
            assert(!err);
            setTimeout(function () {
                cos.getBucketLifecycle({
                    Bucket: config.Bucket,
                    Region: config.Region
                }, function (err, data) {
                    assert(comparePlainObject(RulesMulti, data.Rules));
                    done();
                });
            }, 2000);
        });
    });
});

describe('params check', function () {
    it('Region', function (done) {
        cos.headBucket({
            Bucket: config.Bucket,
            Region: 'gz'
        }, function (err, data) {
            assert(err.error === 'Region should be ap-guangzhou');
            done();
        });
    });
});

describe('params check', function () {
    it('Region', function (done) {
        cos.headBucket({
            Bucket: config.Bucket,
            Region: 'cos.ap-guangzhou'
        }, function (err, data) {
            assert(err.error === 'Region should not be start with "cos."');
            done();
        });
    });
});