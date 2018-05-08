var webrtcroom = require('../../../utils/webrtcroom.js')
var imHandler = require('./im_handler.js')
var webim = require('./webim_wx');

const SHOWINTERACT_TYPE = {
  BOARD: 1, // 白板
  COMMENT: 2 // 聊天
}

const ROLE_TYPE = {
  AUDIENCE: 'audience', // 观众， 可以看到白板
  PRESENTER: 'presenter' // 主播， 没有白板，暂时不支持小程序端作为老师
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    webrtcroomComponent: null,
    roomID: '', // 房间id
    roomname: '', // 房间名称
    beauty: 5,
    muted: false,
    debug: false,
    frontCamera: true,
    userID: '',
    userSig: '',
    sdkAppID: '',
    accountType: null,
    comment: [],
    toview: null,
    showInteractType: SHOWINTERACT_TYPE.COMMENT, // 标识不展示
    // 互动类型
    SHOWINTERACT_TYPE: SHOWINTERACT_TYPE,
    ROLE_TYPE: ROLE_TYPE,
    sketchpad: {
      width: 0,
      height: 0
    },
    role: null
  },

  /**
   * 监听 IM 事件
   */
  onIMEvent: function (e) {
    const CONSTANT = this.data.webrtcroomComponent.data.CONSTANT;
    let code = e.detail.code;
    let tag = e.detail.tag;
    let data = e.detail.detail;

    switch (tag) {
      // 登录事件
      case CONSTANT.IM.LOGIN_EVENT:
        if (code) {
          wx.showToast({
            icon: 'none',
            title: `登录IM失败，ErrCode: ${code}`
          });
        } else {
          wx.showToast({
            title: '登录IM成功'
          });
        }
        break;
        // 创建群|进群状态
      case CONSTANT.IM.JOIN_GROUP_EVENT:
        if (code) {
          wx.showToast({
            icon: 'none',
            title: `创建群|进群失败，ErrCode: ${code}`
          });
        } else {
          wx.showToast({
            title: '创建群|进群成功'
          });
        }
        break;
        // 连接状态
      case CONSTANT.IM.CONNECTION_EVENT:
        switch (code) {
          case webim.CONNECTION_STATUS.ON:
            console.log('连接状态正常...');
            break;
          case webim.CONNECTION_STATUS.OFF:
            console.error('连接已断开，无法收到新消息，请检查下你的网络是否正常');
            break;
          default:
            console.error('未知连接状态,status=' + code);
            break;
        }
        break;

      case CONSTANT.IM.GROUP_SYSTEM_NOTIFYS: // 监听（多终端同步）群系统消息事件，必填
        console.log(`群系统消息事件，code:${code}`);
        break;

      case CONSTANT.IM.GROUP_INFO_CHANGE_NOTIFY: // 监听群资料变化事件，选填
        console.log("执行 群资料变化 回调： " + JSON.stringify(groupInfo));
        var groupId = groupInfo.GroupId;
        var newFaceUrl = groupInfo.GroupFaceUrl; //新群组图标, 为空，则表示没有变化
        var newName = groupInfo.GroupName; //新群名称, 为空，则表示没有变化
        var newOwner = groupInfo.OwnerAccount; //新的群主id, 为空，则表示没有变化
        var newNotification = groupInfo.GroupNotification; //新的群公告, 为空，则表示没有变化
        var newIntroduction = groupInfo.GroupIntroduction; //新的群简介, 为空，则表示没有变化

        if (newName) {
          console.log("群id=" + groupId + "的新名称为：" + newName);
        }
        break;
      case CONSTANT.IM.BIG_GROUP_MSG_NOTIFY: // 接收到IM大群消息
        console.log('接收到大群(直播聊天室)消息通知');
        var msgs = data;
        imHandler.handleGroupMessage(msgs, (msg) => {
          if (!msg.content) {
            return;
          }
          var time = new Date();
          var h = time.getHours() + '',
            m = time.getMinutes() + '',
            s = time.getSeconds() + '';
          h.length == 1 ? (h = '0' + h) : '';
          m.length == 1 ? (m = '0' + m) : '';
          s.length == 1 ? (s = '0' + s) : '';
          time = h + ':' + m + ':' + s;
          msg.time = time;

          if (msg.fromAccountNick == '@TIM#SYSTEM') {
            msg.fromAccountNick = '';
            msg.content = msg.content.split(';');
            msg.content = msg.content[0];

            this.updateComment({
              roomID: this.data.roomID,
              userID: msg.fromAccountNick,
              userName: msg.userName,
              userAvatar: msg.userAvatar,
              message: msg.content,
              time: msg.time
            });
          } else {
            // 自定义消息
            var content = JSON.parse(msg.content);
            var data = content.data;
            var desc = null;
            try {
              desc = JSON.parse(content.desc);
            } catch (error) {
              desc = {};
            }
            var ext = content.ext;
            if (ext === 'TXWhiteBoardExt') { // 如果是白板消息
              var whiteBoardCom = this.selectComponent('#white_board');
              if (whiteBoardCom) {
                whiteBoardCom.addData(JSON.parse(data));
              }
            } else if (ext === 'TEXT') { // 如果是普通消息
              this.updateComment({
                roomID: this.data.roomID,
                userID: msg.fromAccountNick,
                userName: desc.nickName,
                message: data,
                time: msg.time
              });
            }
          }
        });
        break;
    }
  },

  /**
   * 监听房间事件
   */
  onRoomEvent: function (e) {
    switch (e.detail.tag) {
      case 'error':
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
                wx.navigateBack({
                  delta: 1
                });
              }
            }
          });
        }
        break;
    }
  },

  /**
   * 更新聊天内容
   * @param {Object} msg 消息内容
   */
  updateComment(msg) {
    // 普通消息
    this.data.comment.push({
      content: msg.message,
      name: msg.userName,
      uid: msg.userID,
      time: msg.time
    });
    this.setData({
      comment: this.data.comment,
      toview: null // 滚动条置底
    });

    this.setData({
      toview: 'scroll-bottom' // 滚动条置底
    });
  },

  /**
   * 切换摄像头
   */
  changeCamera: function () {
    this.data.webrtcroomComponent.switchCamera();
    this.setData({
      frontCamera: !this.data.frontCamera
    })
  },

  /**
   * 设置美颜
   */
  setBeauty: function () {
    this.data.beauty = (this.data.beauty == 0 ? 5 : 0);
    this.setData({
      beauty: this.data.beauty
    });
  },

  /**
   * 切换是否静音
   */
  changeMute: function () {
    this.data.muted = !this.data.muted;
    this.setData({
      muted: this.data.muted
    });
  },

  /**
   * 是否显示日志
   */
  showLog: function () {
    this.data.debug = !this.data.debug;
    this.setData({
      debug: this.data.debug
    });
  },

  /**
   * 创建房间
   * 房间创建成功后，发送心跳包，并启动webrtc-room标签
   */
  createRoom: function () {
    var self = this;
    webrtcroom.createRoom(self.data.userID, this.data.roomname,
      function (res) {
        console.log('创建房间成功:', res);
        self.data.roomID = res.data.roomID;

        // 成功进房后发送心跳包
        self.sendHeartBeat(self.data.userID, self.data.roomID);

        // 设置webrtc-room标签中所需参数，并启动webrtc-room标签
        self.setData({
          userID: self.data.userID,
          userSig: self.data.userSig,
          sdkAppID: self.data.sdkAppID,
          roomID: self.data.roomID,
          accountType: self.data.accountType,
          privateMapKey: res.data.privateMapKey
        }, function () {
          self.data.webrtcroomComponent.start();
        })
      },
      function (res) {
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

  /**
   * 进入房间， 包括进入IM和进入推流房间
   */
  enterRoom: function () {
    var self = this;
    webrtcroom.enterRoom(self.data.userID, self.data.roomID,
      function (res) {

        // 成功进房后发送心跳包
        self.sendHeartBeat(self.data.userID, self.data.roomID);

        // 设置webrtc-room标签中所需参数，并启动webrtc-room标签
        self.setData({
          userID: self.data.userID,
          userSig: self.data.userSig,
          sdkAppID: self.data.sdkAppID,
          accountType: self.data.accountType,
          roomID: self.data.roomID,
          privateMapKey: res.data.privateMapKey
        }, function () {
          self.data.webrtcroomComponent.start();
        })
      },
      function (res) {
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
   * 发送心跳包
   */
  sendHeartBeat(userID, roomID) {
    // 发送心跳
    webrtcroom.startHeartBeat(userID, roomID, function () {}, function () {
      wx.navigateTo({
        url: '../roomlist/roomlist'
      });
    });
  },


  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // webrtcComponent
    this.data.webrtcroomComponent = this.selectComponent('#webrtcroom');

    console.log('room.js onLoad');
    var time = new Date();
    time = time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds();
    console.log('*************开始多人音视频：' + time + '**************');
    this.data.roomID = options.roomID || '';
    this.data.roomname = options.roomName;
    this.data.username = options.userName;
    var self = this;
    webrtcroom.getLoginInfo(
      self.data.userID,
      function (res) {

        self.data.accountType = res.data.accountType;
        self.data.userID = res.data.userID;
        self.data.sdkAppID = res.data.sdkAppID;
        self.data.userSig = res.data.userSig;

        if (self.data.roomID) {
          self.setData({
            role: ROLE_TYPE.AUDIENCE
          });
          self.enterRoom();
        } else {
          self.createRoom();
          self.setData({
            role: ROLE_TYPE.PRESENTER
          });
        }
      },
      function (res) {
        console.error('获取登录信息失败');
      });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    // 设置房间标题
    wx.setNavigationBarTitle({
      title: this.data.roomname
    });
    // 计算一次白板的宽高
    this.resizeSketchpad();
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
  },

  /**
   * 展示白板
   */
  showBoard() {
    this.setData({
      showInteractType: this.data.SHOWINTERACT_TYPE.BOARD
    });
  },

  /**
   * 展示聊天面板
   */
  showComment() {
    this.setData({
      showInteractType: this.data.SHOWINTERACT_TYPE.COMMENT
    });
  },

  // IM输入框的信息
  bindInputMsg: function (e) {
    this.data.inputMsg = e.detail.value;
  },

  // 发送IM消息
  sendComment: function () {
    var msg = this.data.inputMsg || '';

    if (this.data.webrtcroomComponent) {
      if (!msg || !msg.trim()) {
        wx.showToast({
          icon: 'none',
          title: '不能发送空消息'
        });
        console.error('不能发送空消息');
        return;
      }
      var msgLen = webim.Tool.getStrBytes(msg);
      var maxLen, errInfo;
      maxLen = webim.MSG_MAX_LENGTH.GROUP; // 群组最大支持的消息长度
      if (msgLen > maxLen) {
        errInfo = "消息长度超出限制(最多" + Math.round(maxLen / 3) + "汉字)";
        wx.showToast({
          icon: 'none',
          title: errInfo
        });
        console.error(errInfo);
        return;
      }

      this.data.webrtcroomComponent.sendGroupMsg({
        data:  msg, // 要发送的消息内容
        ext: 'TEXT', // 自定义消息的类型
        desc: JSON.stringify({ // 扩展数据
          nickName: '自定义昵称' + new Date().getTime()
        })
      }, (res) => {
        // 发送成功
        this.setData({
          inputMsg: ''
        });
      }, (err) => {
        wx.showToast({
          icon: 'none',
          title: `消息发送失败，code: ${err.ErrorCode}`
        });
        console.error(`消息发送失败，code: ${err.ErrorCode} info:${err.SrcErrorInfo}`);
      });
    }
  },

  /**
   * 计算宽高
   */
  pixel: function ({
    value,
    unit
  }, cb) {
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

  /**
   * 重置画面的宽高
   */
  resizeSketchpad() {
    var self = this;
    self.pixel({
      value: 25,
      unit: 'vh'
    }, function (res1) {
      self.pixel({
        value: 100,
        unit: 'vw'
      }, function (res2) {
        var h1 = res1;
        var w1 = res2;

        self.setData({
          sketchpad: {
            height: h1,
            width: w1,
          }
        }, () => {
          console.log("normal screen: h1 = %d, w1 = %d", h1, w1);
        });
      });
    });
  }
})
