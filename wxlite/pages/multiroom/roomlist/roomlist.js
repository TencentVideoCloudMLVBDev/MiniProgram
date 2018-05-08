var rtcroom = require('../../../utils/rtcroom.js');
var getlogininfo = require('../../../getlogininfo.js');


Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		roomName: '',
		roomList: [],
		userName: '',
    isGetLoginInfo: false,  // 是否已经获取登录信息
		firstshow: true,// 第一次显示页面
		tapTime: ''
	},
	// 拉取房间列表
	getRoomList: function(callback) {
		var self = this;
    if (!self.data.isGetLoginInfo) {
      wx.showModal({
        title: '提示',
        content: '登录信息初始化中，请稍后再试',
        showCancel: false
      })
      return;
    }
		rtcroom.getRoomList({
			data:{
				index: 0,
				cnt: 20
			},
			success: function(ret) {
				self.setData({
					roomList: ret.rooms
				});
				console.log('拉取房间列表成功');
				callback && callback();
			},
			fail: function(ret) {
				console.log(ret);
				wx.showModal({
					title: '提示',
					content: ret.errMsg,
					showCancel: false
				});
				callback && callback();
			}
		});
	},
	// 创建房间，进入创建页面
	create: function() {
		var self = this;
		// 防止两次点击操作间隔太快
		var nowTime = new Date();
		if (nowTime - this.data.tapTime < 1000) {
		  return;
		}
    if (!self.data.isGetLoginInfo) {
      wx.showModal({
        title: '提示',
        content: '登录信息初始化中，请稍后再试',
        showCancel: false
      })
      return;
    }
		var url = '../roomname/roomname?type=create&roomName=' + self.data.roomName + '&userName=' + self.data.userName;
		wx.navigateTo({
		  url: url
		});
		self.setData({ 'tapTime': nowTime });
	},
	// 进入rtcroom页面
	goRoom: function(e) {
		// 防止两次点击操作间隔太快
		var nowTime = new Date();
		if (nowTime - this.data.tapTime < 1000) {
		  return;
		}
    if (e.currentTarget.dataset.num > 3) {
      wx.showModal({
        title: '提示',
        content: '房间人数已满',
        showCancel: false,
        complete: function () { }
      });
      return;
    }
		var url = '../room/room?roomID=' + e.currentTarget.dataset.roomid + '&roomName=' + e.currentTarget.dataset.roomname  + '&userName=' + this.data.userName;
		wx.navigateTo({ url: url });
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
    wx.showLoading({
      title: '登录信息获取中',
    }) 
		// rtcroom初始化
		var self = this;
		console.log(this.data);
		getlogininfo.getLoginInfo({
			type: 'multi_room',
			success: function (ret) {
				self.data.firstshow = false;
        self.data.isGetLoginInfo = true;
				self.getRoomList(function () { });
				console.log('我的昵称：',ret.userName);
				self.setData({
					userName: ret.userName
				});
        wx.hideLoading();
			},
			fail: function (ret) {
        self.data.isGetLoginInfo = false;
        wx.hideLoading();
        wx.showModal({
          title: '获取登录信息失败',
          content: ret.errMsg,
          showCancel: false,
          complete: function() {
            wx.navigateBack({});
          }
        });
			}
		});
	},

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow: function () {
		console.log('roomlist onshow');
		!this.data.firstshow && this.getRoomList(function(){});
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
    rtcroom.logout();
	},

	/**
	 * 页面相关事件处理函数--监听用户下拉动作
	 */
	onPullDownRefresh: function () {
		this.getRoomList(function(){});
		wx.stopPullDownRefresh();
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