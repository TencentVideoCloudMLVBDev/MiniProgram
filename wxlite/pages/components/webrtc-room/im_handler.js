const webim = require('./webim_wx.js');

module.exports = {
  initData(userData, groupData) {
    this.userData = userData;

    this.groupData = groupData || {};
    this.groupData['sessionType'] = webim.SESSION_TYPE.GROUP;
    this.selSess = null; // 当前会话
    this.selSessHeadUrl = null; // 当前会话头像
  },

  /**
   * 初始化登录IM的监听函数
   * @param {Object} loginListeners 
   */
  initLoginListeners(loginListeners) {
    this.loginListeners = loginListeners;
  },

  /**
   * 登录IM
   * @param {Function} success 
   * @param {Function} fail 
   */
  loginIm(success, fail) {
    webim.login(this.userData, this.loginListeners, {
      isAccessFormalEnv: true,
      isLogOn: false
    }, success, fail);
  },

  /**
   * 注销IM
   */
  logout() {
    webim.logout();
  },

  /**
   * 创建群组
   * @param {*} groupId 群组ID
   * @param {*} userID 用户ID
   * @param {*} succ 成功回调
   * @param {*} fail 失败回调
   */
  createGroup(groupId, userID, succ, fail) {
    var options = {
      'GroupId': String(groupId),
      'Owner_Account': String(userID),
      'Type': "AVChatRoom", //Private/Public/ChatRoom/AVChatRoom
      'ApplyJoinOption': 'FreeAccess',
      'Name': String(groupId),
      'Notification': "",
      'Introduction': "",
      'MemberList': [],
    };

    webim.createGroup(
      options,
      function (resp) {
        if (succ) succ();
      },
      function (err) {
        if (err.ErrorCode == 10025 || err.ErrorCode == 10021) {
          if (succ) succ();
        } else {
          if (fail) fail(err);
        }
      }
    );
  },

  /**
   * 加入群组
   * @param {*} groupId 群组ID
   * @param {*} succ 成功回调
   * @param {*} fail 失败回调
   */
  joinGroup(groupId, succ, fail) {
    var self = this;
    this.selSess = null;
    // 先创建群，成功后加入群
    this.createGroup(groupId, this.userData.identifier, () => {
      webim.applyJoinBigGroup({
          GroupId: String(groupId)
        },
        function (resp) {
          //JoinedSuccess:加入成功; WaitAdminApproval:等待管理员审批
          if (resp.JoinedStatus && resp.JoinedStatus == 'JoinedSuccess') {
            self.groupData['groupId'] = groupId;
            succ && succ(resp);
          } else {
            fail && fail(resp);
          }
        },
        function (err) {
          if (err.ErrorCode == 10013) { // 被邀请加入的用户已经是群成员,也表示成功
            self.groupData['groupId'] = groupId;
            console.warn('applyJoinGroupSucc', groupId)
            return;
          }
          if (fail) {
            fail(err);
          }
        }
      );
    }, fail);
  },

  /**
   * 发送IM消息
   * @param {*} msg 
   * @param {*} succ 
   * @param {*} fail 
   */
  sendMsg(msg, succ, fail) {
    //调用发送消息接口
    webim.sendMsg(msg, (resp) => {
      succ && succ(resp);
    }, function (err) {
      fail && fail(err);
    });
  },

  /**
   * 发送IM消息
   * @param {*} msg 
   * @param {*} succ 
   * @param {*} fail 
   */
  sendGroupMsg(msg, succ, fail) {
    var imMsgObj = this.formatCustomMsg(msg);
    //调用发送消息接口
    webim.sendMsg(imMsgObj, (resp) => {
      succ && succ(resp);
    }, function (err) {
      fail && fail(err);
    });
  },

  /**
   * 组织自定义消息体
   * @param {*} msg 要发送的消息
   * @param {*} succ 
   */
  formatCustomMsg(msg) {
    // custom消息
    var data = msg.data || '';
    var desc = msg.desc || '';
    var ext = msg.ext || '';

    if (!this.selSess) {
      this.selSess = new webim.Session(this.groupData.sessionType, this.groupData.groupId, this.groupData.groupId, this.selSessHeadUrl, Math.round(new Date().getTime() / 1000));
    }

    var isSend = true; //是否为自己发送
    var seq = -1; //消息序列，-1表示sdk自动生成，用于去重
    var random = Math.round(Math.random() * 4294967296); //消息随机数，用于去重
    var msgTime = Math.round(new Date().getTime() / 1000); //消息时间戳
    var subType; //消息子类型
    if (this.groupData.sessionType == webim.SESSION_TYPE.GROUP) {
      //群消息子类型如下：
      //webim.GROUP_MSG_SUB_TYPE.COMMON-普通消息,
      //webim.GROUP_MSG_SUB_TYPE.LOVEMSG-点赞消息，优先级最低
      //webim.GROUP_MSG_SUB_TYPE.TIP-提示消息(不支持发送，用于区分群消息子类型)，
      //webim.GROUP_MSG_SUB_TYPE.REDPACKET-红包消息，优先级最高
      subType = webim.GROUP_MSG_SUB_TYPE.COMMON;
    } else {
      //C2C消息子类型如下：
      //webim.C2C_MSG_SUB_TYPE.COMMON-普通消息,
      subType = webim.C2C_MSG_SUB_TYPE.COMMON;
    }
    var msg = new webim.Msg(this.selSess, isSend, seq, random, msgTime, this.userData.identifier, subType, this.userData.identifierNick);

    var custom_obj = new webim.Msg.Elem.Custom(data, desc, ext);
    msg.addCustom(custom_obj);
    return msg;
  }
}