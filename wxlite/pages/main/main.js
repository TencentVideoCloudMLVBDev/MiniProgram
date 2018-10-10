// pages/main/main.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    canShow: 0,
    tapTime: '',		// 防止两次点击操作间隔太快
    entryInfos: [
      { icon: "../Resources/liveroom.png", title: "手机直播", desc: "<live-room>", navigateTo: "../live-phone/roomlist/roomlist" },
      { icon: "../Resources/liveroom.png", title: "PC直播", desc: "<live-room>", navigateTo: "../live-pc/roomlist/roomlist" },
      { icon: "../Resources/doubleroom.png", title: "双人通话", desc: "<rtc-room>", navigateTo: "../doubleroom/roomlist/roomlist" },
      { icon: "../Resources/multiroom.png", title: "多人通话", desc: "<rtc-room>", navigateTo: "../multiroom/roomlist/roomlist" },
      { icon: "../Resources/push.png", title: "RTMP推流", desc: "<live-pusher>", navigateTo: "../push/push" },
      { icon: "../Resources/play.png", title: "直播播放", desc: "<live-player>", navigateTo: "../play/play" },
      { icon: "../Resources/multiroom.png", title: "TRTC", desc: "<webrtc-room>", navigateTo: "../webrtcroom/roomlist/roomlist" },
    ]
  },

  onEntryTap: function (e) {
    if (this.data.canShow) {
    // if(1) {
      // 防止两次点击操作间隔太快
      var nowTime = new Date();
      if (nowTime - this.data.tapTime < 1000) {
        return;
      }
      var toUrl = this.data.entryInfos[e.currentTarget.id].navigateTo;
      console.log(toUrl);
      wx.navigateTo({
        url: toUrl,
      });
      this.setData({ 'tapTime': nowTime });
    } else {
      wx.showModal({
        title: '提示',
        content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后再试。',
        showCancel: false
      });
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log("onLoad");
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    console.log("onReady");
    if(!wx.createLivePlayerContext) {
      setTimeout(function(){
        wx.showModal({
          title: '提示',
          content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后再试。',
          showCancel: false
        });
      },0);
    } else {
      // 版本正确，允许进入
      this.data.canShow = 1;
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    console.log("onShow");

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    console.log("onHide");

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    console.log("onUnload");

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    console.log("onPullDownRefresh");

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    console.log("onReachBottom");

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    console.log("onShareAppMessage");
    return {
      title: '腾讯视频云',
      path: '/pages/main/main',
      imageUrl: 'https://mc.qcloudimg.com/static/img/dacf9205fe088ec2fef6f0b781c92510/share.png'
    }
  }
})