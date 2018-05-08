var os = require('os');
var fs = require('fs');
var platform = os.platform();

var createFile = function (filepath, size, callback) {
    var cb = function (err) {
        callback && callback();
    };
    if (fs.existsSync(filepath)) {
        cb('file existed.');
    } else {
        var cmd;
        switch (platform) {
            case 'win32':
                cmd = 'fsutil file createnew ' + filepath + ' ' + size;
                break;
            case 'darwin':
            case 'linux':
                cmd = 'dd if=/dev/zero of=' + filepath + ' count=1 bs=' + size;
                break;
        }
        var exec = require('child_process').exec;
        exec(cmd, function (err, stdout, stderr) {
            cb(err);
        });
    }
};

exports.createFile = createFile;