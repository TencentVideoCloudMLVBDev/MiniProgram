Component({
    properties: {
        roomID: {type: Number, value: 0},
        userID: {type: String, value: ''},
        userSig: {type: String, value: ''},
        sdkAppID: {type: Number, value: 0},
        privateMapKey: {type: String, value: ''},
        template: {type: String, value: '', observer: function(newVal, oldVal) {this.init(newVal)}},        //使用的界面模版
        beauty: {type: String, value: 5},           //美颜程度，取值为0~9
        aspect: {type: String, value: '3:4'},       //设置画面比例，取值为'3:4'或者'9:16'
        minBitrate: {type: Number, value: 200},     //设置码率范围为[minBitrate,maxBitrate]，四人建议设置为200~400
        maxBitrate: {type: Number, value: 300},
        muted: {type: Boolean, value: false},       //设置推流是否静音
        debug: {type: Boolean, value: false},       //是否显示log
        // frontCamera: {type: Boolean, value: true, observer: function (newVal, oldVal) { this.switchCamera(); }},  //设置前后置摄像头，true表示前置
    },
    data: {

        pusherContext: '',
        hasPushStarted: false,
        pushURL: '',
        members: [{},{}, {}],
        maxMembers: 3,
        self: {},
        hasExitRoom: true,

        ERROR_OPEN_CAMERA: -4,   //打开摄像头失败
        ERROR_OPEN_MIC: -5,      //打开麦克风失败
        ERROR_PUSH_DISCONNECT: -6,   //推流连接断开
        ERROR_CAMERA_MIC_PERMISSION: -7,  //获取不到摄像头或者麦克风权限
    },

    ready: function(){
        if (!this.data.pusherContext) {
            this.data.pusherContext = wx.createLivePusherContext('rtcpusher');
        }
        self = this;
    },
    detached: function(){
        console.log("组件 detached");
        self.exitRoom();
    },

    methods: {

        init: function(newVal) {
            self = this;
            switch(newVal) {
                case '1v3':
                    // this.data.maxMembers = 3;
                    // this.data.members = [{}, {}, {}];
                    this.setData({
                        maxMembers: 3,
                        members: [{}, {}, {}],
                        template: newVal
                    });
                    break;
                case '1v1':
                    // this.data.maxMembers = 1;
                    // this.data.members = [{}];
                    this.setData({
                        maxMembers: 1,
                        members: [{}],
                        template: newVal
                    });
                    break;
            }
        },

        start: function() {
            self = this;
            self.data.hasExitRoom = false;

            self.requestSigServer(self.data.userSig, self.data.privateMapKey);
        },

        stop: function() {
            self.data.hasExitRoom = true;
            console.log("组件停止");
            self.exitRoom();
        },

        pause: function() {
            if (!self.data.pusherContext) {
                self.data.pusherContext = wx.createLivePusherContext('rtcpusher');
            }
            self.data.pusherContext && self.data.pusherContext.pause();

            self.data.members.forEach(function (val) {
                val.playerContext && val.playerContext.pause();
            });
        },

        resume: function() {
            if (!self.data.pusherContext) {
                self.data.pusherContext = wx.createLivePusherContext('rtcpusher');
            }
            self.data.pusherContext && self.data.pusherContext.resume();

            self.data.members.forEach(function (val) {
                val.playerContext && val.playerContext.resume();
            });
        },

        switchCamera: function () {
            if (!self.data.pusherContext) {
                self.data.pusherContext = wx.createLivePusherContext('rtcpusher');
            }
            self.data.pusherContext && self.data.pusherContext.switchCamera({});
        },

        exitRoom: function() {
            if (!self.data.pusherContext) {
                self.data.pusherContext = wx.createLivePusherContext('rtcpusher');
            }
            self.data.pusherContext && self.data.pusherContext.stop && self.data.pusherContext.stop();
            
            self.data.members.forEach(function (val) {
                val.playerContext && val.playerContext.stop();
            });

            for (var i = 0; i < self.data.maxMembers; i++) {
                self.data.members[i] = {};
            }
            self.setData({
                members: self.data.members
            });
        },

        postErrorEvent: function(errCode, errMsg) {
            self.postEvent('error', errCode, errMsg);
        },

        postEvent: function(tag, code, detail) {
            self.triggerEvent('onRoomEvent', {
                tag: tag,
                code: code,
                detail: detail
            }, {});
        },

        requestSigServer: function (userSig, privMapEncrypt) {
            console.log('获取sig:', this.data);
            var roomID =  this.data.roomID;
            var userID =  this.data.userID;
            var sdkAppID = this.data.sdkAppID;
            var url = "https://yun.tim.qq.com/v4/openim/jsonvideoapp?sdkappid=" + sdkAppID + "&identifier=" + userID + "&usersig=" + userSig + "&random=9999&contenttype=json";
            var reqHead = { "Cmd": 1, "SeqNo": 1, "BusType": 7, "GroupId": roomID };
            var reqBody = { "PrivMapEncrypt": privMapEncrypt, "TerminalType": 1, "FromType": 3, "SdkVersion": 26280566};
            console.log("requestSigServer params:", url, reqHead, reqBody);
            var self = this;
            wx.request({
              url: url,
              data: {"ReqHead": reqHead, "ReqBody": reqBody},
              method: "POST",
              success: function(res) {
                console.log("requestSigServer success:", res);
                if (res.data["RspHead"]["ErrorCode"] != 0) {
                  console.log(res.data["RspHead"]["ErrorInfo"]);
                  wx.showToast({
                    title: res.data["RspHead"]["ErrorInfo"],
                  })
                  return;
                }
                var roomSig = JSON.stringify(res.data["RspBody"]);
      
                var pushUrl = "room://cloud.tencent.com?sdkappid=" + sdkAppID + "&roomid=" + roomID + "&userid=" + userID + "&roomsig=" + encodeURIComponent(roomSig);
                console.log("roomSigInfo", roomID, userID, roomSig, pushUrl);
      
                self.setData({
                  pushURL: pushUrl,
                  userID: userID
                })
              },
              fail: function(res) {
                console.log("requestSigServer fail:", res);
                wx.showToast({
                  title: '获取房间签名失败',
                })
              }
            })
        },

        onWebRTCUserListPush: function(msg) {
            if (!msg) {
                return;
            }

            var jsonDic = JSON.parse(msg);
            if (!jsonDic) {
                return;
            }

            console.log("onWebRTCUserListPush.jsonDict:", jsonDic);
            var newUserList = jsonDic.userlist;
            if (!newUserList) {
                return;
            }

            var pushers = [];
            newUserList && newUserList.forEach(function(val) {
                var pusher = {
                    userID: val.userid,
                    accelerateURL: val.playurl
                };
                pushers.push(pusher);
            });

            self.onPusherJoin({
                pushers: pushers
            });

            self.onPusherQuit({
                pushers: pushers
            });
        },

        //将在res.pushers中，但不在self.data.members中的流，加入到self.data.members中
        onPusherJoin: function(res) {
            res.pushers.forEach(function (val) {
                var emptyIndex = -1;
                var hasPlay = false;
                for (var i = 0; self.data.members && i < self.data.members.length; i++) {
                    if (self.data.members[i].userID && self.data.members[i].userID == val.userID) {
                        hasPlay = true;
                    } else if (!self.data.members[i].userID && emptyIndex == -1) {
                        emptyIndex = i;
                    }
                }
                if (!hasPlay && emptyIndex != -1) {
                    val.loading = false;
                    val.playerContext = wx.createLivePlayerContext(val.userID);
                    self.data.members[emptyIndex] = val;
                }
            });
            self.setData({ members: self.data.members });
        },

        //将在self.data.members中，但不在res.pushers中的流删除
        onPusherQuit: function(res) {
            for (var i = 0; i < self.data.members.length; i++) {
                var needDelete = true;
                for (var j=0; j < res.pushers.length; j++) {
                    if (self.data.members[i].userID == res.pushers[j].userID) {
                        needDelete = false;
                    }
                }
                if (needDelete) {
                    self.data.members[i] = {};
                }
            }
            self.setData({ members: self.data.members });
        },

        //删除res.pushers
        delPusher: function(pusher) {
            for (var i = 0; i < self.data.members.length; i++) {
                if (self.data.members[i].userID == pusher.userID) {
                    self.data.members[i] = {};
                }
            }
            self.setData({ members: self.data.members });
        },

        // 推流事件
        onPush: function(e) {
            if (!self.data.pusherContext) {
                self.data.pusherContext = wx.createLivePusherContext('rtcpusher');
            }
            var code;
            if (e.detail) {
                code = e.detail.code;
            } else {
                code = e;
            }
            console.log('推流情况：', code);
            var errmessage = '';
            switch (code) {
            case 1002: {
                console.log('推流成功');
                break;
            }
            case -1301: {
                console.error('打开摄像头失败: ', code);
                self.postErrorEvent(self.data.ERROR_OPEN_CAMERA, '打开摄像头失败');
                self.exitRoom();
                break;
            }
            case -1302: {
                console.error('打开麦克风失败: ', code);
                self.postErrorEvent(self.data.ERROR_OPEN_MIC, '打开麦克风失败');
                self.exitRoom();
                break;
            }
            case -1307: {
                console.error('推流连接断开: ', code);
                self.postErrorEvent(self.data.ERROR_PUSH_DISCONNECT, '推流连接断开');
                self.exitRoom();
                break;
            }
            case 5000: {
                console.log('收到5000: ', code);
                // 收到5000就退房
                self.exitRoom();
                break;
            }
            case 1018: {
                console.log('进房成功', code);
                break;
            }
            case 1019: {
                console.log('退出房间', code);
                break;
            }
            case 1020: {
                console.log('成员列表', code);
                self.onWebRTCUserListPush(e.detail.message);
                break;
            }
            case 1021: {
                console.log('网络类型发生变化，需要重新进房', code);
                //先退出房间
                self.exitRoom();

                //再重新进入房间
                this.setData({
                    retryIndex: 5,
                })
                self.start();

                break;
            }
            case 2007: {
                console.log('视频播放loading: ',e.detail.code);
                break;
            };
            case 2004: {
                console.log('视频播放开始: ',e.detail.code);
                break;
            };
            default: {
            // console.log('推流情况：', code);
            }
            }
        },

        // 标签错误处理
        onError: function(e) {
            console.log('推流错误：',e);
            e.detail.errCode == 10001 ? (e.detail.errMsg = '未获取到摄像头功能权限，请删除小程序后重新打开') : '';
            e.detail.errCode == 10002 ? (e.detail.errMsg = '未获取到录音功能权限，请删除小程序后重新打开') : '';
            self.postErrorEvent(self.data.ERROR_CAMERA_MIC_PERMISSION, e.detail.errMsg || '未获取到摄像头、录音功能权限，请删除小程序后重新打开')
        },

        //播放器live-player回调
        onPlay: function (e) {
            self.data.members.forEach(function(val){
              if(e.currentTarget.id == val.userID) {
                switch (e.detail.code) {
                  case 2007: {
                    console.log('视频播放loading: ', e);
                    val.loading = true;
                    break;
                  }
                  case 2004: {
                    console.log('视频播放开始: ', e);
                    val.loading = false;
                    break;
                  }
                  case -2301: {
                      console.error('网络连接断开，且重新连接亦不能恢复，播放器已停止播放', val);
                      self.delPusher(val);
                    break;
                  }
                  default: {
                    // console.log('拉流情况：', e);
                  }
                }
              }
            });
            self.setData({
                members: self.data.members
            })
        },
    }
})