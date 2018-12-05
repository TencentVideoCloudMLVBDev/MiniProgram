// pages/debug-tools/debug-tools.js
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    tapTime: '',		// 防止两次点击操作间隔太快
    entryInfos: [
      { icon: "../Resources/push.png", title: "RTMP推流", desc: "<live-pusher>", navigateTo: "./push/push-config/push-config" },
      { icon: "../Resources/play.png", title: "直播播放", desc: "<live-player>", navigateTo: "./play/play" },
      { icon: "../Resources/rtplay.png", title: "低延时播放", desc: "<live-player>", navigateTo: "./rtplay/rtplay" },
      { icon: "../Resources/multiroom.png", title: "视频通话", desc: "<rtc-room>", navigateTo: "./rtc-room-demo/roomlist/roomlist" },
    ],
    headerHeight: app.globalData.headerHeight, 
    statusBarHeight: app.globalData.statusBarHeight,
  },

  onEntryTap: function (e) {
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
    
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: '腾讯视频云',
      path: '/pages/main/main',
      imageUrl: 'https://mc.qcloudimg.com/static/img/dacf9205fe088ec2fef6f0b781c92510/share.png'
    }
  },
  onBack: function () {
    wx.navigateBack({
      delta: 1
    });
  },
})