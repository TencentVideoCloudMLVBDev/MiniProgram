//app.js

var qcloud = require('./lib/index');

App({
  onLaunch: function () {
    // 展示本地存储能力
    // qcloud.setLoginUrl(config.url + 'getwxinfo');
    // qcloud.setLoginUrl(config.url + 'login');
  },
  globalData: {
    userInfo: null
  }
})