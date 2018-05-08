var liveroom = require('../../../utils/liveroom.js');
var config = require('../../../config.js')

Page({
    component: null,
    data: {
        userName: '',
        roomID: '',
        roomName: '',
        pureAudio: false,
        role: 'audience',
        showLiveRoom: false,
        rooms: [],
        comment: [],
        linked: false,
        debug: false,
        inputMsg: [],
        muted: false,
        toview: '',
        showSketachpad: false,
        skettachpadData: null,
        sketchpadSetFullScreen: false,
        //默认 16：9
        sketchpad: {
            height: 0,
            width: 0
        },
        canDraw: false
    },

    onLoad: function (options) {
        var self = this;
        console.log("--> onLoad: ", options)
        var role = options.type == 'create' ? 'presenter' : 'audience';

        if (role == 'audience') {
            self.setData({
                roomID: options.roomID,
                roomName: options.roomName,
                userName: options.userName,
                role: role,
                showLiveRoom: true,
                skettachpadData: {},
            }, function () {
                self.start();
            })
            self.setupSketchpad(false);  
        } else {
            self.setData({
                roomName: options.roomName,
                userName: options.userName,
                pureAudio: JSON.parse(options.pureAudio),
                role: role,
                showLiveRoom: true
            }, function () {
                console.log('======> page data: ', self.data)
                self.start();
            })
        }
    },

    onReady: function () {
        var self = this;
        wx.setNavigationBarTitle({
            title: self.data.roomName
        })
    },

    onRoomEvent: function (e) {
        var self = this;
        var args = e.detail;
        console.log('onRoomEvent', args)
        switch (args.tag) {
            case 'roomClosed': {
                wx.showModal({
                    content: `房间已解散`,
                    showCancel: false,
                    complete: () => {
                        wx.navigateBack({ delta: 1 })
                    }
                });
                break;
            }
            case 'error': {
                wx.showToast({
                    title: `${args.detail}[${args.code}]`,
                    icon: 'none',
                    duration: 1500
                })
                break;
            }
            case 'LinkOn':{ // 连麦连上
                self.setData({
                    linked: true
                })
                break;
            }
            case 'LinkOut':{ //连麦断开
                self.setData({
                    linked: false
                })
                break;
            }
            case 'recvTextMsg': {
                console.log('收到消息:', e.detail.detail);
                var msg = e.detail.detail;
                self.data.comment.push({
                    content: msg.message,
                    name: msg.userName,
                    uid: msg.userID,
                    time: msg.time
                });
                self.setData({
                    comment: self.data.comment,
                    toview: ''
                });
                // 滚动条置底
                self.setData({
                    toview: 'scroll-bottom'
                });
                break;
            }
            case 'joinPusher': {
                var jioner = args.detail;
                wx.showModal({
                    content: `${jioner.userName} 请求连麦`,
                    success: function (sm) {
                        if (sm.confirm) {
                            console.log('用户点击同意')
                            self.component && self.component.respondJoinReq(true, jioner);
                        } else if (sm.cancel) {
                            console.log('用户点击取消')
                        }
                    }
                })
                break;
            }
            case 'sketchpadData': {
                console.log('收到白板消息: ' + e.detail.detail);
                try{
                    var contentObj = JSON.parse(e.detail.detail);
                    self.setSketchData(contentObj);
                }catch(exception){
                    console.log('exception: ', exception)
                }
                break;
            }
            default: {
                console.log('onRoomEvent default: ', e)
                break;
            }
        }
    },

    start: function () {
        var self = this;
        self.component = self.selectComponent("#id_liveroom")
        console.log('self.component: ', self.component)
        console.log('self:', self);
        self.component.start();
    },

    onLinkClick: function () {
        var self = this;
        self.component && self.component.requestJionPusher();
    },

    goRoom: function (e) {
        var self = this;
        var index = parseInt(e.currentTarget.dataset.index);
        var roomID = self.data.rooms[index].roomID;
        self.setData({
            roomID: roomID
        })
    },

    setSketchData(obj){
        var self = this;
        var redo = () => {};
        if (!self.data.sketchpadData){
            //第一次填充数据需要写两次激活白板
            redo = () => { self.setSketchData(obj)}
        }
        self.setData({
            sketchpadData: obj
        }, () => {
            redo(obj);
            console.log('成功设置sketchpadData')
        });
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        var self = this;
        self.component && self.component.resume();
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {
        var self = this;
        self.component && self.component.pause();
    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {
        var self = this;
        self.component && self.component.stop();
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {
        return {
            // title: '多人音视频',
            // path: '/pages/multiroom/roomlist/roomlist',
            path: '/pages/main/main',
            imageUrl: 'https://mc.qcloudimg.com/static/img/dacf9205fe088ec2fef6f0b781c92510/share.png'
        }
    },

    showLog: function() {
        var self = this;
        self.setData({
            debug: !self.data.debug
        })
    },

    changeMute: function() {
        var self = this;
        self.setData({
            muted: !self.data.muted
        })
    },
    setBeauty: function() {
        var self = this;
        self.setData({
            beauty: self.data.beauty == 5 ? 0 : 5
        })
    },
    changeCamera: function() {
        self.component && self.component.switchCamera();
    },
    bindInputMsg: function(e){
        this.data.inputMsg = e.detail.value;
    },
    sendComment: function(){
        var self = this;
        if (self.component) {
            self.component.sendTextMsg(this.data.inputMsg);
            this.setData({
                inputMsg: ''
            });
        }
    },

    showSketachpad(){
        var self = this;
        self.setData({
            showSketachpad: true
        })
    },
    showComment(){
        var self = this;
        self.setData({
            showSketachpad: false
        })
    },
    // 计算像素
    pixel: function ({ value, unit }, cb) {
        wx.getSystemInfo({
            success: function (res) {
                var vw = res.windowWidth;
                var vh = res.windowHeight;
                var resultPixelValue = 0;
                if (unit == 'px') {
                    resultPixelValue = value;
                } else if (unit == 'vw') {
                    resultPixelValue = value / 100 * vw;
                } else if (unit == 'vh') {
                    resultPixelValue = value / 100 * vh;
                } else {
                    console.log('支持单位：vw, vh');
                }
                console.log("{value: %d, unit: %s} ==> %d px", value, unit, resultPixelValue);
                cb(resultPixelValue);
            },
            fail: function () {
                console.log('获取系统信息失败');
                cb(0);
            }
        })
    },

    setupSketchpad: function (fullscreen) {
        var self = this;
        if (!fullscreen) {

            self.pixel({ value: 100, unit: 'vh' }, function (res1) {
                self.pixel({ value: 98, unit: 'vw' }, function (res2) {
                    self.pixel({ value: 100, unit: 'vw' }, function (res3) {
                        var h1 = res1 - res2;
                        var w1 = res3;
                        self.setData({
                            sketchpad: {
                                height: h1,
                                width: w1,
                            },
                            sketchpadSetFullScreen: false
                        }, () => {
                            console.log("normal screen: h1 = %d, w1 = %d", h1, w1);
                        });
                    });
                });
            });
        } else {
            self.pixel({ value: 100, unit: 'vh' }, function (res1) {
                self.pixel({ value: 100, unit: 'vw' }, function (res2) {
                    var w = res1; //需要纵向是width，横向是height
                    var h = res2;
                    self.setData({
                        sketchpadSetFullScreen: true
                    }, ()=> {
                        self.setData({
                            sketchpad: {
                                height: h,
                                width: w,
                            },
                        }, () => {
                            console.log("full screen: h=%d, w=%d", h, w);
                        });
                    })
                    
                });
            });
        }
    },
    tabToggleScetchpadFullScreen: function() {
        this.setupSketchpad(!this.data.sketchpadSetFullScreen);
    }


})
