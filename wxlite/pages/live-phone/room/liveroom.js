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
        beauty: 5
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
                showLiveRoom: true
            }, function () {
                self.start();
            })
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
            case 'LinkOn': { // 连麦连上
                self.setData({
                    linked: true
                })
                break;
            }
            case 'LinkOut': { //连麦断开
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

    showLog: function () {
        var self = this;
        self.setData({
            debug: !self.data.debug
        })
    },
    changeMute: function () {
        var self = this;
        self.setData({
            muted: !self.data.muted
        })
    },
    setBeauty: function () {
        var self = this;
        self.setData({
            beauty: self.data.beauty == 5 ? 0 : 5
        })
    },
    changeCamera: function () {
        self.component && self.component.switchCamera();
    },
    bindInputMsg: function (e) {
        this.data.inputMsg = e.detail.value;
    },
    sendComment: function () {
        var self = this;
        if (self.component) {
            self.component.sendTextMsg(this.data.inputMsg);
            this.setData({
                inputMsg: ''
            });
        }
    }

})
