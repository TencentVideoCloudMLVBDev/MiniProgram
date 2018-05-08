var webrtcroom = require('../../../utils/webrtcroom.js')

Page({
    /**
     * 页面的初始数据
     */
    data: {
      roomID: '',         // 房间id
      roomname: '',       // 房间名称
      beauty: 5,
      muted: false,
      debug: false,
      frontCamera: true,

      userID: '',
      userSig: '',
      sdkAppID: '',
    },
    
    onRoomEvent: function (e) {
      switch (e.detail.tag) {
        case 'error': {
          // 在房间内部才显示提示
          console.error("error:", e.detail.detail);
          var pages = getCurrentPages();
          console.log(pages, pages.length, pages[pages.length - 1].__route__);
          if (pages.length > 1 && (pages[pages.length - 1].__route__ == 'pages/webrtcroom/room/room')) {
            wx.showModal({
              title: '提示',
              content: e.detail.detail,
              showCancel: false,
              complete: function () {
                pages = getCurrentPages();
                if (pages.length > 1 && (pages[pages.length - 1].__route__ == 'pages/webrtcroom/room/room')) {
                  wx.navigateBack({ delta: 1 });
                }
              }
            });
          }
          break;
        }
      }
    },
    
    changeCamera: function () {
      var webrtcroomCom = this.selectComponent('#webrtcroom');
      if (webrtcroomCom) {
        webrtcroomCom.switchCamera();
      }
      this.setData({
        frontCamera: !this.data.frontCamera
      })
    },
    setBeauty: function () {
      this.data.beauty = (this.data.beauty == 0 ? 5 : 0);
      this.setData({
        beauty: this.data.beauty
      });
    },
    changeMute: function () {
      this.data.muted = !this.data.muted;
      this.setData({
        muted: this.data.muted
      });
    },
    showLog: function () {
      this.data.debug = !this.data.debug;
      this.setData({
        debug: this.data.debug
      });
    },

    createRoom: function() {
      var self = this;
      webrtcroom.createRoom(self.data.userID, this.data.roomname,
          function(res) {
              console.log('创建房间成功:', res);
              self.data.roomID = res.data.roomID;
              self.setData({
                userID: self.data.userID,
                userSig: self.data.userSig,
                sdkAppID: self.data.sdkAppID,
                roomID: self.data.roomID,
                privateMapKey: res.data.privateMapKey
              }, function() {
                var webrtcroomCom = this.selectComponent('#webrtcroom');
                if (webrtcroomCom) {
                  webrtcroomCom.start();
                }
              })
          },
          function(res) {
              console.error('创建房间失败[' + res.errCode + ';' + res.errMsg + ']');
              self.onRoomEvent({
                detail: {
                  tag: 'error',
                  code: -999,
                  detail: '创建房间失败[' + res.errCode + ';' + res.errMsg + ']'
                }
              })
          });
    },

    enterRoom: function() {
      var self = this;
      webrtcroom.enterRoom(self.data.userID, self.data.roomID,
          function(res) {
            self.setData({
              userID: self.data.userID,
              userSig: self.data.userSig,
              sdkAppID: self.data.sdkAppID,
              roomID: self.data.roomID,
              privateMapKey: res.data.privateMapKey
            }, function() {
              var webrtcroomCom = this.selectComponent('#webrtcroom');
              if (webrtcroomCom) {
                webrtcroomCom.start();
              }
            })
          },
          function(res) {
              console.error(self.data.ERROR_CREATE_ROOM, '进入房间失败[' + res.errCode + ';' + res.errMsg + ']')
              self.onRoomEvent({
                detail: {
                  tag: 'error',
                  code: -999,
                  detail: '进入房间失败[' + res.errCode + ';' + res.errMsg + ']'
                }
              })
          });
    },


    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
      console.log('room.js onLoad');
      var time = new Date();
      time = time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds();
      console.log('*************开始多人音视频：' + time + '**************');
      this.data.role = options.type;
      this.data.roomID = options.roomID || '';
      this.data.roomname = options.roomName;
      this.data.username = options.userName;
      var self = this;
      webrtcroom.getLoginInfo(
        self.data.userID,
        function(res) {
            self.data.userID = res.data.userID;
            self.data.userSig = res.data.userSig;
            self.data.sdkAppID = res.data.sdkAppID;
            
            if (self.data.roomID) {
              self.enterRoom();
            } else {
              self.createRoom();
            }
        },
        function(res) {
            console.error('获取登录信息失败');
        });
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {
      var self = this;
      // 设置房间标题
      wx.setNavigationBarTitle({ title: self.data.roomname });
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
      var self = this;
      console.log('room.js onShow');
      // 保持屏幕常亮
      wx.setKeepScreenOn({
        keepScreenOn: true
      })
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {
      var self = this;
      console.log('room.js onHide');
    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {
      console.log('room.js onUnload');
      webrtcroom.quitRoom(this.data.userID, this.data.roomID);
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
        // title: '',
        path: '/pages/main/main',
        imageUrl: 'https://mc.qcloudimg.com/static/img/dacf9205fe088ec2fef6f0b781c92510/share.png'
      }
    }
})