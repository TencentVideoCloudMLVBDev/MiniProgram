#腾讯云音视频多人会话解决方案部署指引

## 1.项目简介
在构建直播业务，多人音视频业务等场景下，都需要后台配合完成诸如：
- 生成直播地址，包括推流和播放地址
- 生成IM签名，用于IM独立模式下的用户登录
- 管理IM聊天室，聊天室的创建和销毁还有成员进出通知
- 双人/多人音视频管理视频位。
以上这些都有一定的学习成本，为了**降低学习成本**，我们将后台封装了一套接口，来解决以上问题。再配合IOS，Android，小程序和Win PC端的后台调用封装。对应用开发者提供一套友好的接口，方便您实现多人实时音视频，直播，聊天等业务场景。

**特别说明：**
- [1] 后台没有对接口的调用做安全校验，这需要您结合您自己的账号和鉴权体系，诸如在请求接口上加一个Sig参数，内容是您账号鉴权体系派发的一个字符串，用于校验请求者的身份。**
- [2] 房间管理采用 java对象直接在内存中进行管理。房间信息动态和实效性，因此没有采用数据库做持久存储，而是在内存中动态管理。**

## 云服务开通

### 开通直播服务

#### 申请开通视频直播服务
进入 [直播管理控制台](https://console.cloud.tencent.com/live)，如果服务还没有开通，则会有如下提示:
![](https://mc.qcloudimg.com/static/img/c40ff3b85b3ad9c0cb03170948d93555/image.png)
点击申请开通，之后会进入腾讯云人工审核阶段，审核通过后即可开通。


#### 配置直播码
直播服务开通后，进入【直播控制台】>【直播码接入】>【[接入配置](https://console.cloud.tencent.com/live/livecodemanage)】 完成相关配置，即可开启直播码服务：
![](https://mc.qcloudimg.com/static/img/32158e398ab9543b5ac3acf5f04aa86e/image.png)
点击【确定接入】按钮即可。

### 开通云通信服务
#### 申请开通云通讯服务
进入[云通讯管理控制台](https://console.cloud.tencent.com/avc)，如果还没有服务，直接点击**直接开通云通讯**按钮即可。新认证的腾讯云账号，云通讯的应用列表是空的，如下图：
![](https://mc.qcloudimg.com/static/img/c033ddba671a514c7b160e1c99a08b55/image.png)

点击**创建应用接入**按钮创建一个新的应用接入，即您要接入腾讯云IM通讯服务的App的名字，我们的测试应用名称叫做“RTMPRoom演示”，如下图所示：
![](https://mc.qcloudimg.com/static/img/96131ecccb09ef06e50aa0ac591b802d/yuntongxing1.png)

点击确定按钮，之后就可以在应用列表中看到刚刚添加的项目了，如下图所示：
![](https://mc.qcloudimg.com/static/img/168928a60c0b4c07a2ee2c318e0b1a62/yuntongxing2.png)

#### 配置独立模式
上图的列表中，右侧有一个**应用配置**按钮，点击这里进入下一步的配置工作，如下图所示。
![](https://mc.qcloudimg.com/static/img/3e9cd34ca195036e21cb487014cc2c81/yuntongxing3.png)




## 安装微信小程序开发工具

下载并安装最新版本的[微信开发者工具](https://mp.weixin.qq.com/debug/wxadoc/dev/devtools/download.html)，使用小程序绑定的微信号扫码登录开发者工具。

![微信开发者工具](https://mc.qcloudimg.com/static/img/4fd45bb5c74eed92b031fbebf8600bd2/1.png)

## 下载 Demo

访问 [小程序] (https://github.com/TencentVideoCloudMLVBDev/RTCRoomDemo)，获取小程序 Demo 和后台源码。

## 上传和部署代码

1. 打开第四步安装的微信开发者工具，点击【小程序项目】按钮。
2. 输入小程序 AppID，项目目录选择上一步下载下来的代码目录，点击确定创建小程序项目。
3. 再次点击【确定】进入开发者工具。

> **注意：**
>
> 目录请选择 `RTCRoomDemo` 根目录。包含有 `project.config.json`，请不要只选择 `wxlite` 目录！

![上传代码](https://mc.qcloudimg.com/static/img/fd7074730e5b37af8a4d86dc8125d120/xiaochengxustart.png)

4 . 打开 RTCRoomDemo 代码中 `server` 目录下的 `config.js` 文件，修改配置信息
需要替换的参数一览：
| 参数名| 作用 | 获取方案 |
|---------|---------|---------|
| live.appID | 腾讯云直播服务基于 appID 区分客户身份 | [DOC](https://cloud.tencent.com/document/product/454/7953#LVB_APPID) |
| live.bizid | 腾讯云直播服务基于 bizid 区分客户业务 | [DOC](https://cloud.tencent.com/document/product/454/7953#LVB_BIZID) |
| live.pushSecretKey | 腾讯云直播服务用于推流防盗链 | [DOC](https://cloud.tencent.com/document/product/454/7953#LVB_PUSH_SECRECT) |
| live.APIKey | 腾讯云直播服务的后台 REST API，采用 APIKey 进行安全保护 | [DOC](https://cloud.tencent.com/document/product/454/7953#LVB_API_SECRECT) |
| im.sdkAppID | 腾讯云通讯服务用 sdkAppID 区分 IM 客户身份 | [DOC](https://cloud.tencent.com/document/product/454/7953#IM_SDKAPPID) |
| im.accountType | 曾用于区分 APP 类型，现仅出于兼容性原因而保留 | [DOC](https://cloud.tencent.com/document/product/454/7953#IM_ACCTYPE) |
| im.administrator | RoomService 使用了 IM REST API 发送房间里的系统消息，而 IM REST API 接口需要您填写管理员名称。 |  [DOC](https://cloud.tencent.com/document/product/454/7953#IM_ADMIN)  |
| im.privateKey | RoomService 使用 privateKey 用于签发管理员（administrator）的 usersig，进而能够调用 IM REST API 发送房间里的系统消息。  |  [DOC](https://cloud.tencent.com/document/product/454/7953#IM_PRIKEY)  |
| im.publicKey | RoomService 使用 publicKey 用于确认终端用户的登录身份。 | [DOC](https://cloud.tencent.com/document/product/454/7953#IM_PRIKEY) |


config.js 说明 注意live参数和im参数：
```json
const CONF = {
  // 服务监听的端口，nginx反向代理配置时注意填写该端口
  port: '5757',

  // 不用关心
  rootPathname: '',

  // 微信小程序 App ID，若不支持微信小程序端, appId 字段可以不填
  appId: '',

  // 微信小程序 App Secret, 若不支持微信小程序端，appSecret 字段可以不填
  appSecret: '',

  // 是否使用腾讯云代理登录小程序,没有用到腾讯云代理,这里默认填false，若不知此后微信小城端，useQcloudLogin 字段可以不用关心。
  useQcloudLogin: false,

  /**
   * 需要开通云直播服务
   * 参考指引 @https://cloud.tencent.com/document/product/454/7953#LVB
   * 有介绍appID，bizid，APIKey 和 pushSecretKey的获取方法。
   */
  live: {
    /**
     *  云直播 appID, 是一个10~11位数字
     */
    appID: XXXXXXXXXX,

    /**
     *  云直播 bizid，是一个4~5位的数字
     */
    bizid: XXXX,

    /**
     *  云直播 推流防盗链key，是一个32个16进制字符组成的字符串
     */
    pushSecretKey: 'abcdef012345789abcdef012345789',

    /**
     *  云直播 API鉴权key,是一个32个16进制字符组成的字符串
     */
    APIKey: 'abcdef012345789abcdef012345789',

    // 云直播 推流地址有效期 单位秒 默认7天
    validTime: 3600 * 24 * 7
  },

  /**
   * 需要开通云通信服务
   * 参考指引 @https://cloud.tencent.com/document/product/454/7953#IM
   * 有介绍sdkAppID 和 accountType的获取方法。以及私钥文件的下载方法。
   */
  im: {
    /**
     *  云通信 sdkAppID,  是一个10~11位数字
     */
    sdkAppID: xxxxxxxxxxx,

    /**
     *  云通信 账号集成类型 accountType, 是一个5个数字字符组成的字符串
     */
    accountType: 'xxxxx',

    /*
    * 云通信 管理员账号，是一个字符串
    */ 
    administrator: 'administrator',

    /**
     *  云通信 私钥用于生成userSig，私钥文件内容，注意换行符转义 '\r\n'
     */
    privateKey: '-----BEGIN PRIVATE KEY-----\r\n' + 'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgr+XXXXXXXXXX\r\n' + 'Y5ukC7sUj5ep7r9TVxTrXXXXXXXXRANCAASuxr7AJGiXRqGpiO7pPr7jH1PXG/FY\r\n' + 'zbTbMHaWCqVm+XXXXXX+ZcHP93ss3OhgZKh8pq+g7X26dW5fQkOTFTmg\r\n' + '-----END PRIVATE KEY-----\r\n',

    /**
     * 云通信 公钥用于验证userSig，公钥文件内容，注意换行符转义 '\r\n'
     */
    publicKey: '-----BEGIN PUBLIC KEY-----\r\n' + 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAErsa+wCRol0ahqYju6T6+XXXXXXXX\r\n' + 'WM202zB2lgqlZvkBU59B/mXBz/d7LNzoYGSofKavoO19unVuXXXXXXXXXXXX\r\n' + '-----END PUBLIC KEY-----\r\n'
  },

  /**
   * MySQL 配置，用来存储 session 和用户信息
   * 若使用了腾讯云微信小程序解决方案
   * 开发环境下，MySQL 的初始密码为您的微信小程序 appid, 若不支持微信小程序端，mysql 配置参数不用关心
   */
  mysql: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    db: 'cAuth',
    pass: '',
    char: 'utf8mb4'
  },

  /**
  * 若不支持微信小程序端， cos 配置参数不用关心
  */
  cos: {
    /**
     * 区域
     * 华北：cn-north
     * 华东：cn-east
     * 华南：cn-south
     * 西南：cn-southwest
     * 新加坡：sg
     * @see https://www.qcloud.com/document/product/436/6224
     */
    region: 'cn-south',
    // Bucket 名称
    fileBucket: 'wximg',
    // 文件夹
    uploadFolder: ''
  },

  /**
   * 多人音视频房间相关参数
   */
  multi_room: {
    // 房间容量上限
    maxMembers: 4,

    // 心跳超时 单位秒
    heartBeatTimeout: 20,

    // 空闲房间超时 房间创建后一直没有人进入，超过给定时间将会被后台回收，单位秒
    maxIdleDuration: 30
  },

  /**
   * 双人音视频房间相关参数
   */
  double_room: {
    // 心跳超时 单位秒
    heartBeatTimeout: 20,

    // 空闲房间超时 房间创建后一直没有人进入，超过给定时间将会被后台回收，单位秒
    maxIdleDuration: 30
  },

  /**
   * 直播连麦房间相关参数
   */
  live_room: {
    // 房间容量上限
    maxMembers: 4,

    // 心跳超时 单位秒
    heartBeatTimeout: 20,

    // 空闲房间超时 房间创建后一直没有人进入，超过给定时间将会被后台回收，单位秒
    maxIdleDuration: 30,

    // 最大观众列表长度
    maxAudiencesLen: 30
  },

  /**
   * 辅助功能 后台日志文件获取相关 当前后台服务的访问域名。可以不用关心
   */
  selfHost: 'XXXXXXXXXXX',

  // 微信登录态有效期
  wxLoginExpires: 7200
}
```

5 . 点击界面右上角的【腾讯云】图标，在下拉的菜单栏中选择【上传测试代码】。

![上传按钮](https://mc.qcloudimg.com/static/img/8480bbc02b097bac0d511c334b731e12/5.png)

6 . 选择【模块上传】并勾选全部选项，然后勾选【部署后自动安装依赖】，点击【确定】开始上传代码。

![选择模块](https://mc.qcloudimg.com/static/img/d7ff3775c77a662e9c18807916ab8045/6.png)

![上传成功](https://mc.qcloudimg.com/static/img/a78431b42d0edf0bddae0b85ef00d40f/7.png)

7 . 上传代码完成之后，点击右上角的【详情】按钮，接着选择【腾讯云状态】即可看到腾讯云自动分配给你的开发环境域名，完整复制（包括 `https://`）开发环境 request 域名，然后在编辑器中打开 `wxlite/config.js` 文件，将复制的域名填入 `url` 中并保存，保存之后编辑器会自动编译小程序，左边的模拟器窗口即可实时显示出客户端的 Demo：

![查看开发域名](https://main.qcloudimg.com/raw/c5ed016e213cac0be7cb623dd0c96895.png)

8 . 在模拟器中编译运行点击多人音视频进入，在右侧的console里面可以看到登录成功的log表示配置成功。

![登录测试](https://main.qcloudimg.com/raw/ee916ccef75ca8a3821d0e0e5a76df21.png)

9 . 请使用手机进行测试，直接扫描开发者工具预览生成的二维码进入，<font color='red'> 这里部署的后台是开发测试环境，一定要开启调试: </font>

![开启调试](https://mc.qcloudimg.com/static/img/1abfe50750f669ca4e625ec3cdfbd411/xiaochengxutiaoshi.png)

<font color='red'> 注意：后台服务器部署的测试环境有效期为七天，如果还需要测试体验请重新部署后台。小程序访问域名有白名单限制，小程序开启调试就不会检查白名单，测试期间建议开启白名单，最后要发布的时候将域名配置到白名单里面，请参考常见问题里面如何部署正式环境？</font>

## 六、项目结构  
```
RTCRoomDemo
RTCRoomDemo
├── README.md
├── server               //后台代码目录，具体请参见服务端项目结构介绍
├── wxlite               //腾讯视频云小程序目录
├── ├── pages            //腾讯视频云小程序界面主目录
├── ├── ├── main         //腾讯视频云小程序主界面
├── ├── ├── liveroom     //腾讯视频云小程序直播体验室
├── ├── ├── ├────roomlist//腾讯视频云小程序直播体验室列表界面
├── ├── ├── ├────room    //腾讯视频云小程序直播体验室直播界面
├── ├── ├── livelinkroom //腾讯视频云小程序直播连麦
├── ├── ├── ├────room    //腾讯视频云小程序直播连麦界面
├── ├── ├── doubleroom   //腾讯视频云小程序双人音视频
├── ├── ├── ├────roomlist//腾讯视频云小程序双人音视频在线列表
├── ├── ├── ├────room    //腾讯视频云小程序双人音视频视频聊天界面
├── ├── ├── multiroom    //腾讯视频云小程序多人音视频
├── ├── ├── ├────roomlist//腾讯视频云小程序多人音视频在线列表
├── ├── ├── ├────room    //腾讯视频云小程序多人音视频视频聊天界面
├── ├── ├── play         //腾讯视频云小程序播放界面
├── ├── ├── push         //腾讯视频云小程序推流界面
├── ├── ├── rtpplay      //腾讯视频云小程序低延时播放界面
├── ├── ├── vodplay      //腾讯视频云小程序点播播放界面
├── ├── ├── components    //腾讯视频云小程序自定义组件
├── ├── ├── ├─── live-room    //腾讯视频云小程序<live-room>组件
├── ├── ├── ├─── ├───vertical1v3template    //腾讯视频云小程序<live-room>组件使用的界面模版
├── ├── ├── ├────rtc-room    //腾讯视频云小程序<rtc-room>组件
├── ├── ├── ├─── ├───gridtemplate    //腾讯视频云小程序<rtc-room>组件使用的界面模版
├── ├── ├── Resources    //腾讯视频云小程序资源目录
├── ├── lib              //小程序使用的通用库目录
├── ├── utils            //腾讯视频云小程序界工具库目录
├── ├── ├── rtcroom.js   //腾讯视频云小程序双人、多人音视频库文件
├── ├── ├── liveroom.js  //腾讯视频云小程序单向音视频库文件
└── └── config.js        //配置文件，主要配置后台服务器地址
```

## 常见问题 FAQ
##### 1. 运行出错如何排查？
- 请修改`wxlite/config.js`中的url，使用默认的官方demo后台：https://room.qcloud.com ，直接运行小程序
- 请重新解压下载的demo直接运行小程序，默认就是官方demo后台
- 请返回第二步检查开通的小程序类目是否正确，推拉流标签在小程序控制台是否开启
- 使用官方demo后台运行可以，请参考此文档再重新部署一遍
- 依然不行可以提工单或客服电话（400-9100-100）联系我们

##### 2. 运行小程序进入多人音视频看不到画面?
- 请确认使用手机来运行，微信开发者工具内部的模拟器目前还不支持直接运行
- 请确认小程序基础库版本 wx.getSystemInfo 可以查询到该信息，1.7.0 以上的基础库才支持音视频能力。
- 请确认小程序所属的类目，由于监管要求，并非所有类目的小程序都开发了音视频能力，已支持的类目请参考 [DOC](https://cloud.tencent.com/document/product/454/13037)。
- 如有更多需求，或希望深度合作，可以提工单或客服电话（400-9100-100）联系我们。

##### 3. live-pusher、live-player标签使用及错误码参考
- [live-pusher&错误码](https://mp.weixin.qq.com/debug/wxadoc/dev/component/live-pusher.html)
- [live-player&错误码](https://mp.weixin.qq.com/debug/wxadoc/dev/component/live-player.html)
- [livePusherContext](https://mp.weixin.qq.com/debug/wxadoc/dev/api/api-live-pusher.html)
- [livePlayerContext](https://mp.weixin.qq.com/debug/wxadoc/dev/api/api-live-player.html)

##### 4. 如果需要上线或者部署正式环境怎么办？
- 请申请域名并做备案
- 请将服务端代码部署到申请的服务器上
- 请将业务server域名、RoomService域名及IM域名配置到小程序控制台request合法域名里面，其中IM域名为：https://webim.tim.qq.com，RoomService域名为：https://room.qcloud.com

