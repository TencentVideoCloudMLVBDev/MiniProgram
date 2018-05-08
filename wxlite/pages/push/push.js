// pages/push/push.js

Page({

  /**
   * 页面的初始数据
   */
  data: {
    focus: false,
    playing: false,
    frontCamera: true,
    cameraContext: {},
    pushUrl: "",
    showHDTips: false, //显示清晰度弹窗
    mode: "HD",
    muted: false,
    enableCamera: true,
    orientation: "vertical",
    beauty: 6.3,
    whiteness: 3.0,
    backgroundMute: false,
    hide: false,
    debug: false,
    playUrl: "",
  },

  onInputTap: function() {
    this.setData({
      focus: true
    })
  },

  // input框内容同步到js
  onInputChange:function(e) {
    this.setData({
      pushUrl: e.detail.value,
      playUrl: "",
    })
  },

  onScanQR: function() {

    this.stop();
    console.log("onScaneQR");
    var self = this;
    wx.scanCode({
      onlyFromCamera: true,
      success: (res) => {
        console.log(res);
        self.setData({
          pushUrl: res.result,
          playUrl: "",
        })
      }
    })
  },

  onNewUrlClick: function() {
    var self = this;

    wx.request({
      url: 'https://lvb.qcloud.com/weapp/utils/get_test_pushurl',
      success: (res) => {
        // if (res.data.returnValue != 0) {
        //   wx.showToast({
        //     title: '获取推流地址失败',
        //   })
        //   return;
        // }

        var pushUrl = res.data['url_push'];
        var rtmpUrl = res.data['url_play_rtmp'];
        var flvUrl = res.data['url_play_flv'];
        var hlsUrl = res.data['url_play_hls'];
        var accUrl = res.data['url_play_acc'];
        console.log(pushUrl);
        self.setData({
          pushUrl: pushUrl,
          playUrl: flvUrl,
        })

        wx.setClipboardData({
          data: "rtmp播放地址:" + rtmpUrl + "\nflv播放地址:" + flvUrl + "\nhls播放地址:" + hlsUrl + "\n低延时播放地址:" + accUrl,
        })

        wx.showToast({
          title: '获取地址成功',
        })
        setTimeout(function () {
          wx.showToast({
            title: '可点击右侧扫码播放',
            duration: 2000
          })
        }, 1000)
        
      },
      fail: (res) => {
        console.log(res);
        wx.showToast({
          title: '网络或服务器异常',
        })
      }
    })
  },

  onPushClick: function() {
    // this.data.pusherConfig.debug = !this.data.pusherConfig.debug;
    console.log("onPushClick" , this.data);
    if (this.data.pushUrl.indexOf("rtmp://") != 0) {
      wx.showModal({
        title: '提示',
        content: '推流地址不合法，请点击右上角+按钮先获取腾讯云推流地址',
        showCancel: false
      });
      return;
    }
    this.setData({
      playing: !this.data.playing,
    })
    if (this.data.playing) {
      this.data.cameraContext.start();
      console.log("camera start");
    } else {
      this.data.cameraContext.stop();
      console.log("camera stop");
    }
  },

  onSwitchCameraClick: function() {
    this.data.frontCamera = !this.data.frontCamera;
    this.setData({
      frontCamera: this.data.frontCamera
    })
    this.data.cameraContext.switchCamera();
  },

  onBeautyClick: function() {
    if (this.data.beauty != 0) {
      this.data.beauty = 0;
      this.data.whiteness = 0;
    } else {
      this.data.beauty = 6.3;
      this.data.whiteness = 3.0;
    }

    this.setData({
      beauty: this.data.beauty,
      whiteness: this.data.whiteness
    })
  },

  onOrientationClick: function() {
    if (this.data.orientation == "vertical") {
      this.data.orientation = "horizontal";
    } else {
      this.data.orientation = "vertical";
    }
    this.setData({
      orientation: this.data.orientation
    })
  },

  onLogClick: function () {
    this.setData({
      debug: !this.data.debug
    })
  },
  onSwitchMode: function() {
    var showTips = !this.data.showHDTips;
    this.setData({
      showHDTips: showTips
    })
  },
  onModeClick: function (event) {
    var mode = "SD";
    switch (event.target.dataset.mode) {
      case "SD":
        mode = "SD";
        break;
      case "HD":
        mode = "HD";
        break;
      case "FHD":
        mode = "FHD";
        break;
    }
  
    this.setData({
      mode: mode,
      showHDTips: false
    })
  },

  onEnableCameraClick: function() {
    this.setData({
      enableCamera: !this.data.enableCamera
    })
    if (this.data.playing) {
      this.data.cameraContext.stop();
      setTimeout(() => {
        this.data.cameraContext.start();
      }, 500)
    } 
  },

  onMuteClick: function() {
    this.setData({
      muted: !this.data.muted
    })
  },

  onPushEvent: function(e) {
    console.log(e.detail.code);

    if (e.detail.code == -1307) {
      this.stop();
      wx.showToast({
        title: '推流多次失败',
      })
    }
  },

  stop: function() {
    this.setData({
      playing: false,
      //pushUrl: "rtmp://2157.livepush.myqcloud.com/live/2157_wx_live_test1?bizid=2157&txSecret=7b0391fa4d9956a54d1a8238bc358372&txTime=5A071E7F",
      mode: "HD",
      muted: false,
      enableCamera: true,
      orientation: "vertical",
      beauty: 6.3,
      whiteness: 3.0,
      backgroundMute: false,
      debug: false
    })
    this.data.cameraContext.stop();
  },

  createContext: function() {
    this.setData({
      cameraContext: wx.createLivePusherContext('camera-push'),
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    console.log("onLoad onReady");
    this.createContext();

    wx.setKeepScreenOn({
      keepScreenOn: true,
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    console.log("onLoad onShow");
    // 保持屏幕常亮
    wx.setKeepScreenOn({
      keepScreenOn: true
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    console.log("onLoad onHide");

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    console.log("onLoad onUnload");
    this.stop();

    wx.setKeepScreenOn({
      keepScreenOn: false,
    })
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    console.log("onLoad onPullDownRefresh");

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    console.log("onLoad onReachBottom");

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    console.log("onLoad onShareAppMessage");
    return {
      // title: 'RTMP推流',
      // path: '/pages/push/push',
      path: '/pages/main/main',
      imageUrl: 'https://mc.qcloudimg.com/static/img/dacf9205fe088ec2fef6f0b781c92510/share.png'
    }
  },

  /***
   * 显示播放二维码
   */
  onPlayQRClick: function () {
    if (!this.data.playUrl) {
      wx.showModal({
        title: '提示',
        content: '播放地址不合法，请点击右上角+按钮先获取腾讯云推流地址',
        showCancel: false
      });
      return;
    }

    var url = './playqr/playqr?playUrl=' + this.data.playUrl;
    wx.navigateTo({
      url: url
    });
  }
})