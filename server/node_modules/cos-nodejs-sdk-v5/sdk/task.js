var fs = require('fs');
var util = require('./util');

var initTask = function (cos) {

    var queue = [];
    var tasks = {};
    var uploadingFileCount = 0;
    var nextUploadIndex = 0;

    // 接口返回简略的任务信息
    var formatTask = function (task) {
        var t = {
            id: task.id,
            Bucket: task.Bucket,
            Region: task.Region,
            Key: task.Key,
            FilePath: task.FilePath,
            state: task.state,
            loaded: task.loaded,
            size: task.size,
            speed: task.speed,
            percent: task.percent,
            hashPercent: task.hashPercent,
        };
        if (task.FilePath) t.FilePath = task.FilePath;
        return t;
    };

    var startNextTask = function () {
        if (nextUploadIndex < queue.length &&
            uploadingFileCount < cos.options.FileParallelLimit) {
            var task = queue[nextUploadIndex];
            if (task.state === 'waiting') {
                uploadingFileCount++;
                task.state = 'checking';
                !task.params.UploadData && (task.params.UploadData = {});
                cos[task.api](task.params, function (err, data) {
                    if (task.state === 'checking' || task.state === 'uploading') {
                        task.state = err ? 'error' : 'success';
                        uploadingFileCount--;
                        startNextTask(cos);
                        task.callback && task.callback(err, data);
                        if (task.state === 'success') {
                            delete task.params;
                            delete task.callback;
                        }
                    }
                });
            }
            nextUploadIndex++;
            startNextTask(cos);
        }
    };

    var killTask = function (id, switchToState) {
        var task = tasks[id];
        var waiting = task && task.state === 'waiting';
        var running = task && (task.state === 'checking' || task.state === 'uploading');
        if (waiting || running || (switchToState === 'canceled' && task.state === 'paused')) {
            if (switchToState === 'paused' && task.params.Body && typeof task.params.Body.pipe === 'function') {
                console.error('stream not support pause');
                return;
            }
            task.state = switchToState;
            cos.emit('inner-kill-task', {TaskId: id});
            cos.emit('task-update', {task: formatTask(task)});
            if (running) {
                uploadingFileCount--;
                startNextTask(cos);
            }
            if (switchToState === 'canceled') {
                delete task.params;
                delete task.callback;
            }
        }
    };

    cos._addTask = function (id, api, params, callback) {
        var size;
        if (params.Body && params.Body.size) {
            size = params.Body.size;
        } else if (params.Body && params.Body.length) {
            size = params.Body.length;
        } else if (params.ContentLength !== undefined) {
            size = params.ContentLength;
        } else if (params.FilePath) {
            try {
                size = fs.statSync(params.FilePath).size;
            } catch (err) {
                callback(err);
                return;
            }
        }
        if (params.ContentLength === undefined) params.ContentLength = size;
        params.TaskId = id;
        var task = {
            // env
            params: params,
            callback: callback,
            api: api,
            index: queue.length,
            // task
            id: id,
            Bucket: params.Bucket,
            Region: params.Region,
            Key: params.Key,
            FilePath: params.FilePath || '',
            state: 'waiting',
            loaded: 0,
            size: size,
            speed: 0,
            percent: 0,
            hashPercent: 0,
        };
        var onHashProgress = params.onHashProgress;
        params.onHashProgress = function (info) {
            if (!cos._isRunningTask(task.id)) return;
            task.hashPercent = info.percent;
            onHashProgress && onHashProgress(info);
            cos.emit('task-update', {task: formatTask(task)});
        };
        var onProgress = params.onProgress;
        params.onProgress = function (info) {
            if (!cos._isRunningTask(task.id)) return;
            task.state === 'checking' && (task.state = 'uploading');
            task.loaded = info.loaded;
            task.speed = info.speed;
            task.percent = info.percent;
            onProgress && onProgress(info);
            cos.emit('task-update', {task: formatTask(task)});
        };
        queue.push(task);
        tasks[id] = task;
        cos.emit('task-list-update', {list: util.map(queue, formatTask)});
        startNextTask(cos);
        return id;
    };
    cos._isRunningTask = function (id) {
        var task = tasks[id];
        return !!(task && (task.state === 'checking' || task.state === 'uploading'));
    };
    cos.getTaskList = function () {
        return util.map(queue, formatTask);
    };
    cos.cancelTask = function (id) {
        killTask(id, 'canceled')
    };
    cos.pauseTask = function (id) {
        killTask(id, 'paused')
    };
    cos.restartTask = function (id) {
        var task = tasks[id];
        if (task && (task.state === 'paused' || task.state === 'error')) {
            task.state = 'waiting';
            cos.emit('task-update', {task: formatTask(task)});
            nextUploadIndex = Math.min(nextUploadIndex, task.index);
            startNextTask();
        }
    };

};

module.exports.init = initTask;