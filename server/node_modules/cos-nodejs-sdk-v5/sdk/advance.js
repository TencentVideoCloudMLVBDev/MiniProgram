var fs = require('fs');
var Async = require('async');
var EventProxy = require('eventproxy');
var util = require('./util');

// 分块上传入口
function sliceUploadFile(params, callback) {
    var taskId = util.uuid();
    params.TaskReady && params.TaskReady(taskId);
    this._addTask(taskId, '_sliceUploadFile', params, callback);
}

// 文件分块上传全过程，暴露的分块上传接口
function _sliceUploadFile (params, callback) {
    var proxy = new EventProxy();
    var TaskId = params.TaskId;
    var Bucket = params.Bucket;
    var Region = params.Region;
    var Key = params.Key;
    var FilePath = params.FilePath;
    var SliceSize = params.SliceSize || this.options.ChunkSize;
    var AsyncLimit = params.AsyncLimit;
    var StorageClass = params.StorageClass || 'Standard';
    var SliceCount;
    var FileSize;
    var self = this;

    var onProgress = params.onProgress;
    var onHashProgress = params.onHashProgress;

    // 上传过程中出现错误，返回错误
    proxy.all('error', function (err) {
        if (!self._isRunningTask(TaskId)) return;
        return callback(err);
    });

    // 上传分块完成，开始 uploadSliceComplete 操作
    proxy.all('upload_complete', function (UploadCompleteData) {
        callback(null, UploadCompleteData);
    });

    // 上传分块完成，开始 uploadSliceComplete 操作
    proxy.all('upload_slice_complete', function (data) {
        uploadSliceComplete.call(self, {
            Bucket: Bucket,
            Region: Region,
            Key: Key,
            UploadId: data.UploadId,
            SliceList: data.SliceList
        }, function (err, data) {
            if (!self._isRunningTask(TaskId)) return;
            if (err) {
                return proxy.emit('error', err);
            }
            proxy.emit('upload_complete', data);
        });
    });

    // 获取 UploadId 完成，开始上传每个分片
    proxy.all('get_upload_data_finish', function (UploadData) {
        uploadSliceList.call(self, {
            TaskId: TaskId,
            Bucket: Bucket,
            Region: Region,
            Key: Key,
            FilePath: FilePath,
            FileSize: FileSize,
            SliceSize: SliceSize,
            AsyncLimit: AsyncLimit,
            UploadData: UploadData,
            onProgress: onProgress
        }, function (err, data) {
            if (!self._isRunningTask(TaskId)) return;
            if (err) return proxy.emit('error', err);
            proxy.emit('upload_slice_complete', data);
        });
    });

    // 开始获取文件 UploadId，里面会视情况计算 ETag，并比对，保证文件一致性，也优化上传
    proxy.all('get_file_size_finish', function () {
        if (params.UploadData.UploadId) {
            proxy.emit('get_upload_data_finish', params.UploadData);
        } else {
            getUploadIdAndPartList.call(self, {
                TaskId: TaskId,
                Bucket: Bucket,
                Region: Region,
                Key: Key,
                StorageClass: StorageClass,
                FilePath: FilePath,
                FileSize: FileSize,
                SliceSize: SliceSize,
                onHashProgress: onHashProgress,
                // init params
                CacheControl: params.CacheControl,
                ContentDisposition: params.ContentDisposition,
                ContentEncoding: params.ContentEncoding,
                ContentType: params.ContentType,
                ACL: params.ACL,
                GrantRead: params.GrantRead,
                GrantWrite: params.GrantWrite,
                GrantFullControl: params.GrantFullControl
            }, function (err, UploadData) {
                if (!self._isRunningTask(TaskId)) return;
                if (err) return proxy.emit('error', err);
                params.UploadData.UploadId = UploadData.UploadId;
                params.UploadData.PartList = UploadData.PartList;
                proxy.emit('get_upload_data_finish', params.UploadData);
            });
        }
    });

    // 获取上传文件大小
    FileSize = params.ContentLength;
    SliceCount = Math.ceil(FileSize / SliceSize);
    proxy.emit('get_file_size_finish');

}

// 获取上传任务的 UploadId
function getUploadIdAndPartList(params, callback) {
    var TaskId = params.TaskId;
    var Bucket = params.Bucket;
    var Region = params.Region;
    var Key = params.Key;
    var StorageClass = params.StorageClass;
    var self = this;

    // 计算 ETag
    var ETagMap = {};
    var FileSize = params.FileSize;
    var SliceSize = params.SliceSize;
    var SliceCount = Math.ceil(FileSize / SliceSize);
    var FinishSliceCount = 0;
    var FinishSize = 0;
    var progressTimer = 0;
    var time0 = 0;
    var size0 = 0;
    var onHashProgress = function (immediately) {
        var update = function () {
            if (!self._isRunningTask(TaskId)) return;
            progressTimer = 0;
            var time1 = Date.now();
            var speed = parseInt((FinishSize - size0) / ((time1 - time0) / 1000) * 100) / 100 || 0;
            var percent = parseInt(FinishSliceCount / SliceCount * 100) / 100 || 0;
            time0 = time1;
            size0 = FinishSize;
            if (params.onHashProgress && typeof params.onHashProgress === 'function') {
                try {
                    params.onHashProgress({
                        loaded: FinishSize,
                        total: FileSize,
                        speed: speed,
                        percent: percent
                    });
                } catch (e) {
                }
            }
        };
        if (immediately) {
            if (progressTimer) {
                clearTimeout(progressTimer);
                progressTimer = 0;
                update();
            }
        } else {
            if (progressTimer) return;
            progressTimer = setTimeout(update, self.options.ProgressInterval || 1000);
        }
    };
    var getChunkETag = function (PartNumber, callback) {
        var start = SliceSize * (PartNumber - 1);
        var end = Math.min(start + SliceSize, FileSize);
        var ChunkSize = end - start;

        if (ETagMap[PartNumber]) {
            callback(null, {
                PartNumber: PartNumber,
                ETag: ETagMap[PartNumber],
                Size: ChunkSize
            });
        } else {
            var ChunkReadStream = fs.createReadStream(params.FilePath, {start: start, end: end - 1});
            util.getFileMd5(ChunkReadStream, function (err, md5) {
                if (err) return callback(err);
                var ETag = '"' + md5 + '"';
                ETagMap[PartNumber] = ETag;
                FinishSliceCount += 1;
                FinishSize += ChunkSize;
                callback(err, {
                    PartNumber: PartNumber,
                    ETag: ETag,
                    Size: ChunkSize
                });
                onHashProgress();
            });
        }
    };

    // 通过和文件的 md5 对比，判断 UploadId 是否可用
    var isAvailableUploadList = function (PartList, callback) {
        var PartCount = PartList.length;
        // 如果没有分片，通过
        if (PartCount === 0) {
            return callback(null, true);
        }
        // 检查分片数量
        if (PartCount > SliceCount) {
            return callback(null, false);
        }
        // 检查分片大小
        if (PartCount > 1) {
            var PartSliceSize = Math.max(PartList[0].Size, PartList[1].Size);
            if (PartSliceSize !== SliceSize) {
                return callback(null, false);
            }
        }
        // 逐个分片计算并检查 ETag 是否一致
        var next = function (index) {
            if (index < PartCount) {
                var Part = PartList[index];
                getChunkETag(Part.PartNumber, function (err, chunk) {
                    if (chunk && chunk.ETag === Part.ETag && chunk.Size === Part.Size) {
                        next(index + 1);
                    } else {
                        callback(null, false);
                    }
                });
            } else {
                callback(null, true);
            }
        };
        next(0);
    };

    var proxy = new EventProxy();
    proxy.all('error', function (errData) {
        if (!self._isRunningTask(TaskId)) return;
        return callback(errData);
    });

    // 不存在 UploadId
    proxy.all('upload_id_ready', function (UploadData) {
        // 转换成 map
        var map = {};
        var list = [];
        util.each(UploadData.PartList, function (item) {
            map[item.PartNumber] = item;
        });
        for (var PartNumber = 1; PartNumber <= SliceCount; PartNumber++) {
            var item = map[PartNumber];
            if (item) {
                item.PartNumber = PartNumber;
                item.Uploaded = true;
            } else {
                item = {
                    PartNumber: PartNumber,
                    ETag: null,
                    Uploaded: false
                };
            }
            list.push(item);
        }
        UploadData.PartList = list;
        callback(null, UploadData);
    });

    // 不存在 UploadId, 初始化生成 UploadId
    proxy.all('no_available_upload_id', function () {
        if (!self._isRunningTask(TaskId)) return;
        self.multipartInit({
            Bucket: Bucket,
            Region: Region,
            Key: Key,
            StorageClass: StorageClass,
            CacheControl: params.CacheControl,
            ContentDisposition: params.ContentDisposition,
            ContentEncoding: params.ContentEncoding,
            ContentType: params.ContentType,
            ACL: params.ACL,
            GrantRead: params.GrantRead,
            GrantWrite: params.GrantWrite,
            GrantFullControl: params.GrantFullControl,
        }, function (err, data) {
            if (!self._isRunningTask(TaskId)) return;
            if (err) return proxy.emit('error', err);
            var UploadId = data.UploadId;
            if (!UploadId) {
                return callback({Message: 'no upload id'});
            }
            proxy.emit('upload_id_ready', {UploadId: UploadId, PartList: []});
        });
    });

    // 如果已存在 UploadId，找一个可以用的 UploadId
    proxy.all('has_upload_id', function (UploadIdList) {
        // 串行地，找一个内容一致的 UploadId
        UploadIdList = UploadIdList.reverse();
        Async.eachLimit(UploadIdList, 1, function (UploadId, asyncCallback) {
            if (!self._isRunningTask(TaskId)) return;
            wholeMultipartListPart.call(self, {
                Bucket: Bucket,
                Region: Region,
                Key: Key,
                UploadId: UploadId,
            }, function (err, PartListData) {
                if (!self._isRunningTask(TaskId)) return;
                if (err) return proxy.emit('error', err);
                var PartList = PartListData.PartList;
                PartList.forEach(function (item) {
                    item.PartNumber *= 1;
                    item.Size *= 1;
                    item.ETag = item.ETag || '';
                });
                isAvailableUploadList(PartList, function (err, isAvailable) {
                    if (!self._isRunningTask(TaskId)) return;
                    if (err) return proxy.emit('error', err);
                    if (isAvailable) {
                        asyncCallback({
                            UploadId: UploadId,
                            PartList: PartList
                        }); // 马上结束
                    } else {
                        asyncCallback(); // 检查下一个 UploadId
                    }
                });
            });
        }, function(AvailableUploadData){
            if (!self._isRunningTask(TaskId)) return;
            onHashProgress(true);
            if (AvailableUploadData && AvailableUploadData.UploadId) {
                proxy.emit('upload_id_ready', AvailableUploadData);
            } else {
                proxy.emit('no_available_upload_id');
            }
        });
    });

    // 获取符合条件的 UploadId 列表，因为同一个文件可以有多个上传任务。
    wholeMultipartList.call(self, {
        Bucket: Bucket,
        Region: Region,
        Key: Key
    }, function (err, data) {
        if (!self._isRunningTask(TaskId)) return;
        if (err) {
            return proxy.emit('error', err);
        }
        var UploadIdList = data.UploadList.filter(function (item) {
            return item.Key === Key && (!StorageClass || item.StorageClass.toUpperCase() === StorageClass.toUpperCase());
        }).reverse().map(function (item) {
            return item.UploadId || item.UploadID;
        });
        if (UploadIdList.length) {
            proxy.emit('has_upload_id', UploadIdList);
        } else {
            proxy.emit('no_available_upload_id');
        }
    });
}

// 获取符合条件的全部上传任务 (条件包括 Bucket, Region, Prefix)
function wholeMultipartList(params, callback) {
    var self = this;
    var UploadList = [];
    var sendParams = {
        Bucket: params.Bucket,
        Region: params.Region,
        Prefix: params.Key
    };
    var next = function () {
        self.multipartList(sendParams, function (err, data) {
            if (err) return callback(err);
            UploadList.push.apply(UploadList, data.Upload || []);
            if (data.IsTruncated == 'true') { // 列表不完整
                sendParams.KeyMarker = data.NextKeyMarker;
                sendParams.UploadIdMarker = data.NextUploadIdMarker;
                next();
            } else {
                callback(null, {UploadList: UploadList});
            }
        });
    };
    next();
}

// 获取指定上传任务的分块列表
function wholeMultipartListPart(params, callback) {
    var self = this;
    var PartList = [];
    var sendParams = {
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        UploadId: params.UploadId
    };
    var next = function () {
        self.multipartListPart(sendParams, function (err, data) {
            if (err) return callback(err);
            PartList.push.apply(PartList, data.Part || []);
            if (data.IsTruncated == 'true') { // 列表不完整
                sendParams.PartNumberMarker = data.NextPartNumberMarker;
                next();
            } else {
                callback(null, {PartList: PartList});
            }
        });
    };
    next();
}

// 上传文件分块，包括
/*
 UploadId (上传任务编号)
 AsyncLimit (并发量)，
 SliceList (上传的分块数组)，
 FilePath (本地文件的位置)，
 SliceSize (文件分块大小)
 FileSize (文件大小)
 onProgress (上传成功之后的回调函数)
 */
function uploadSliceList(params, cb) {
    var self = this;
    var TaskId = params.TaskId;
    var Bucket = params.Bucket;
    var Region = params.Region;
    var Key = params.Key;
    var UploadData = params.UploadData;
    var FileSize = params.FileSize;
    var SliceSize = params.SliceSize;
    var ChunkParallel = params.AsyncLimit || self.options.ChunkParallelLimit || 1;
    var FilePath = params.FilePath;
    var onProgress = params.onProgress;
    var SliceCount = Math.ceil(FileSize / SliceSize);
    var FinishSize = 0;
    var needUploadSlices = util.filter(UploadData.PartList, function (SliceItem) {
        if (SliceItem['Uploaded']) {
            FinishSize += SliceItem['PartNumber'] >= SliceCount ? (FileSize % SliceSize || SliceSize) : SliceSize;
        }
        return !SliceItem['Uploaded'];
    });

    var onFileProgress = (function () {
        var time0 = Date.now();
        var size0 = FinishSize;
        var progressTimer;
        var update = function () {
            if (!self._isRunningTask(TaskId)) return;
            progressTimer = 0;
            if (onProgress && (typeof onProgress === 'function')) {
                var time1 = Date.now();
                var speed = parseInt((FinishSize - size0) / ((time1 - time0) / 1000) * 100) / 100 || 0;
                var percent = parseInt(FinishSize / FileSize * 100) / 100 || 0;
                time0 = time1;
                size0 = FinishSize;
                try {
                    onProgress({
                        loaded: FinishSize,
                        total: FileSize,
                        speed: speed,
                        percent: percent
                    });
                } catch (e) {
                }
            }
        };
        return function (immediately) {
            if (immediately) {
                clearTimeout(progressTimer);
                update();
            } else {
                if (progressTimer) return;
                progressTimer = setTimeout(update, self.options.ProgressInterval || 1000);
            }
        };
    })();
    Async.mapLimit(needUploadSlices, ChunkParallel, function (SliceItem, asyncCallback) {
        if (!self._isRunningTask(TaskId)) return;
        var PartNumber = SliceItem['PartNumber'];
        var ETag = SliceItem['ETag'];
        var currentSize = Math.min(FileSize, SliceItem['PartNumber'] * SliceSize) - (SliceItem['PartNumber'] - 1) * SliceSize;
        var preAddSize = 0;
        uploadSliceItem.call(self, {
            TaskId: TaskId,
            Bucket: Bucket,
            Region: Region,
            Key: Key,
            SliceSize: SliceSize,
            FileSize: FileSize,
            PartNumber: PartNumber,
            FilePath: FilePath,
            UploadData: UploadData,
            onProgress: function (data) {
                FinishSize += data.loaded - preAddSize;
                preAddSize = data.loaded;
                onFileProgress();
            },
        }, function (err, data) {
            if (!self._isRunningTask(TaskId)) return;
            if (err) {
                FinishSize -= preAddSize;
            } else {
                FinishSize += currentSize - preAddSize;
                SliceItem.ETag = data.ETag;
            }
            asyncCallback(err || null, data);
        });

    }, function (err, datas) {
        if (!self._isRunningTask(TaskId)) return;
        onFileProgress(true);
        if (err) {
            return cb(err);
        }
        cb(null, {
            datas: datas,
            UploadId: UploadData.UploadId,
            SliceList: UploadData.PartList
        });
    });
}

// 上传指定分片
function uploadSliceItem(params, callback) {
    var TaskId = params.TaskId;
    var Bucket = params.Bucket;
    var Region = params.Region;
    var Key = params.Key;
    var FileSize = params.FileSize;
    var FilePath = params.FilePath;
    var PartNumber = params.PartNumber * 1;
    var SliceSize = params.SliceSize;
    var UploadData = params.UploadData;
    var sliceRetryTimes = 3;
    var self = this;

    var start = SliceSize * (PartNumber - 1);

    var ContentLength = SliceSize;

    var end = start + SliceSize;

    if (end > FileSize) {
        end = FileSize;
        ContentLength = end - start;
    }

    var Body = fs.createReadStream(FilePath, {
        start: start,
        end: end - 1
    });
    var PartItem = UploadData.PartList[PartNumber - 1];
    var ContentSha1 = PartItem.ETag;
    Async.retry(sliceRetryTimes, function (tryCallback) {
        if (!self._isRunningTask(TaskId)) return;
        self.multipartUpload({
            TaskId: TaskId,
            Bucket: Bucket,
            Region: Region,
            Key: Key,
            ContentLength: ContentLength,
            ContentSha1: ContentSha1,
            PartNumber: PartNumber,
            UploadId: UploadData.UploadId,
            Body: Body,
            onProgress: params.onProgress
        }, function (err, data) {
            if (!self._isRunningTask(TaskId)) return;
            if (err) {
                return tryCallback(err);
            } else {
                PartItem.Uploaded = true;
                return tryCallback(null, data);
            }
        });
    }, function(err, data) {
        if (!self._isRunningTask(TaskId)) return;
        return callback(err, data);
    });
}



// 完成分块上传
function uploadSliceComplete(params, callback) {
    var Bucket = params.Bucket;
    var Region = params.Region;
    var Key = params.Key;
    var UploadId = params.UploadId;
    var SliceList = params.SliceList;
    var self = this;
    var Parts = SliceList.map(function (item) {
        return {
            PartNumber: item.PartNumber,
            ETag: item.ETag
        };
    });

    self.multipartComplete({
        Bucket: Bucket,
        Region: Region,
        Key: Key,
        UploadId: UploadId,
        Parts: Parts
    }, function (err, data) {
        if (err) {
            return callback(err);
        }

        callback(null, data);
    });
}

// 抛弃分块上传任务
/*
 AsyncLimit (抛弃上传任务的并发量)，
 UploadId (上传任务的编号，当 Level 为 task 时候需要)
 Level (抛弃分块上传任务的级别，task : 抛弃指定的上传任务，file ： 抛弃指定的文件对应的上传任务，其他值 ：抛弃指定Bucket 的全部上传任务)
 */
function abortUploadTask(params, callback) {
    var Bucket = params.Bucket;
    var Region = params.Region;
    var Key = params.Key;
    var UploadId = params.UploadId;
    var Level = params.Level || 'task';
    var AsyncLimit = params.AsyncLimit;
    var self = this;

    var ep = new EventProxy();

    ep.all('error', function (errData) {
        return callback(errData);
    });

    // 已经获取到需要抛弃的任务列表
    ep.all('get_abort_array', function (AbortArray) {
        abortUploadTaskArray.call(self, {
            Bucket: Bucket,
            Region: Region,
            Key: Key,
            AsyncLimit: AsyncLimit,
            AbortArray: AbortArray
        }, function (err, data) {
            if (err) {
                return callback(err);
            }
            callback(null, data);
        });
    });

    if (Level === 'bucket') {
        // Bucket 级别的任务抛弃，抛弃该 Bucket 下的全部上传任务
        wholeMultipartList.call(self, {
            Bucket: Bucket,
            Region: Region
        }, function (err, data) {
            if (err) {
                return callback(err);
            }
            ep.emit('get_abort_array', data.UploadList || []);
        });
    } else if (Level === 'file') {
        // 文件级别的任务抛弃，抛弃该文件的全部上传任务
        if (!Key) return callback({error: 'abort_upload_task_no_key'});
        wholeMultipartList.call(self, {
            Bucket: Bucket,
            Region: Region,
            Key: Key
        }, function (err, data) {
            if (err) {
                return callback(err);
            }
            ep.emit('get_abort_array', data.UploadList || []);
        });
    } else if (Level === 'task') {
        // 单个任务级别的任务抛弃，抛弃指定 UploadId 的上传任务
        if (!UploadId) return callback({error: 'abort_upload_task_no_id'});
        if (!Key) return callback({error: 'abort_upload_task_no_key'});
        ep.emit('get_abort_array', [{
            Key: Key,
            UploadId: UploadId
        }]);
    } else {
        return callback({error: 'abort_unknown_level'});
    }
}

// 批量抛弃分块上传任务
function abortUploadTaskArray(params, callback) {

    var Bucket = params.Bucket;
    var Region = params.Region;
    var Key = params.Key;
    var AbortArray = params.AbortArray;
    var AsyncLimit = params.AsyncLimit || 1;
    var self = this;

    Async.mapLimit(AbortArray, AsyncLimit, function (AbortItem, callback) {
        if (Key && Key != AbortItem.Key) {
            return callback(null, {
                KeyNotMatch: true
            });
        }
        var UploadId = AbortItem.UploadId || AbortItem.UploadID;

        self.multipartAbort({
            Bucket: Bucket,
            Region: Region,
            Key: AbortItem.Key,
            UploadId: UploadId
        }, function (err, data) {
            var task = {
                Bucket: Bucket,
                Region: Region,
                Key: AbortItem.Key,
                UploadId: UploadId
            };
            if (err) {
                return callback(null, {
                    error: err,
                    task: task
                });
            }

            return callback(null, {
                error: false,
                task: task
            });
        });

    }, function (err, datas) {
        if (err) {
            return callback(err);
        }

        var successList = [];
        var errorList = [];

        for (var i = 0, len = datas.length; i < len; i++) {
            var item = datas[i];
            if (item['task']) {
                if (item['error']) {
                    errorList.push(item['task']);
                } else {
                    successList.push(item['task']);
                }
            }
        }

        return callback(null, {
            successList: successList,
            errorList: errorList
        });
    });
}


var API_MAP = {
    sliceUploadFile: sliceUploadFile,
    _sliceUploadFile: _sliceUploadFile,
    abortUploadTask: abortUploadTask,
};

util.each(API_MAP, function (fn, apiName) {
    exports[apiName] = util.apiWrapper(apiName, fn);
});