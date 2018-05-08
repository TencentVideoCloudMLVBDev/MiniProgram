var rtcroom = require('../../../utils/rtcroom.js');

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
      frontCamera: true
    },
    
    onRoomEvent: function (e) {
      switch (e.detail.tag) {
        case 'recvTextMsg': {
          console.log('收到消息:', e.detail.detail);
          break;
        }
        case 'roomClosed': {
          /*
            房间关闭时会收到此通知，客户可以提示用户房间已经关闭，做清理操作
          */
          // 在房间内部才显示提示
          console.log("roomClose:", e.detail.detail);
          var pages = getCurrentPages();
          console.log(pages, pages.length, pages[pages.length - 1].__route__);
          if (pages.length > 1 && (pages[pages.length - 1].__route__ == 'pages/multiroom/room/room')) {
            wx.showModal({
              title: '提示',
              content: e.detail.detail || '房间已解散',
              showCancel: false,
              complete: function () {
              pages = getCurrentPages();
                console.log(pages, pages.length, pages[pages.length - 1].__route__);
                if (pages.length > 1 && (pages[pages.length - 1].__route__ == 'pages/multiroom/room/room')) {
                  wx.navigateBack({ delta: 1 });
                }
              }
            });
          }
          break;
        }
        case 'error': {
          // 在房间内部才显示提示
          console.error("error:", e.detail.detail);
          var pages = getCurrentPages();
          console.log(pages, pages.length, pages[pages.length - 1].__route__);
          if (pages.length > 1 && (pages[pages.length - 1].__route__ == 'pages/multiroom/room/room')) {
            wx.showModal({
              title: '提示',
              content: e.detail.detail,
              showCancel: false,
              complete: function () {
                pages = getCurrentPages();
                if (pages.length > 1 && (pages[pages.length - 1].__route__ == 'pages/multiroom/room/room')) {
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
      var rtcroomCom = this.selectComponent('#rtcroom');
      if (rtcroomCom) {
        rtcroomCom.switchCamera();
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
      this.setData({
        roomID: this.data.roomID,
        roomname: this.data.roomname,
        username: this.data.username
      }, function() {
        var rtcroomCom = this.selectComponent('#rtcroom');
        if (rtcroomCom) {
          rtcroomCom.start();
        }
      });
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {
      var self = this;
      if (!self.data.username) {
        wx.showModal({
          title: '提示',
          content: '登录信息还未获取到，请稍后再试',
          showCancel: false,
          complete: function () {
            var pages = getCurrentPages();
            console.log(pages, pages.length, pages[pages.length - 1].__route__);
            if (pages.length > 1 && (pages[pages.length - 1].__route__ == 'pages/multiroom/room/room')) {
              wx.navigateBack({ delta: 1 });
            }
          }
        });
        return;
      }
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
    }
})