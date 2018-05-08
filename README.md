<style>
table td { 
    height: 35px; 
    text-align:center;
    vertical-align:middle; 
}
.markdown-text-box img {
    border: 0;
    max-width: 100%;
    height: auto;
    box-sizing: content-box;
    box-shadow: 0 0 0px #ccc;
    margin: 0px 0;
}    
.markdown-text-box table td, .markdown-text-box table th {
    padding: 8px 13px;
    border: 1px solid #d9d9d9;
    word-wrap: break-word;
    text-align: center;
}    
</style>

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

访问 [小程序](https://github.com/TencentVideoCloudMLVBDev/RTCRoomDemo)，获取小程序 Demo 和后台源码。

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

<table width="850px">
  <tr align="center">
	<th width="80px">参数名</th>
    <th width="570px">作用</th>
    <th width="120px">获取方案</th>
  </tr>
  <tr align="center">
    <td>live.appID</td>
    <td>腾讯云直播服务基于 appID 区分客户身份</td>
    <td><a href="https://cloud.tencent.com/document/product/454/7953#LVB_APPID">DOC</a></td>
  </tr>

<tr align="center">
    <td>live.bizid</td>
    <td>腾讯云直播服务基于 bizid 区分客户业务</td>
    <td><a href="https://cloud.tencent.com/document/product/454/7953#LVB_BIZID">DOC</a></td>
</tr>
<tr align="center">
    <td>live.pushSecretKey</td>
    <td>腾讯云直播服务用于推流防盗链</td>
    <td><a href="https://cloud.tencent.com/document/product/454/7953#LVB_PUSH_SECRECT">DOC</a></td>
  </tr>
<tr align="center">
    <td>live.APIKey</td>
    <td>腾讯云直播服务的后台 REST API，采用 APIKey 进行安全保护</td>
    <td><a href="https://cloud.tencent.com/document/product/454/7953#LVB_API_SECRECT">DOC</a></td>
  </tr>
<tr align="center">
    <td>im.sdkAppID</td>
    <td>腾讯云通讯服务用 sdkAppID 区分 IM 客户身份</td>
    <td><a href="(https://cloud.tencent.com/document/product/454/7953#IM_SDKAPPID">DOC</a></td>
  </tr>
<tr align="center">
    <td>im.accountType</td>
    <td>曾用于区分 APP 类型，现仅出于兼容性原因而保留</td>
    <td><a href="https://cloud.tencent.com/document/product/454/7953#IM_ACCTYPE">DOC</a></td>
  </tr>
<tr align="center">
    <td>im.administrator</td>
    <td>RTCRoomServer 使用了 IM REST API 发送房间里的系统消息，而 IM REST API 接口需要您填写管理员名称。</td>
    <td><a href="https://cloud.tencent.com/document/product/454/7953#IM_ADMIN">DOC</a></td>
  </tr>
<tr align="center">
    <td>im.privateKey</td>
    <td>RTCRoomServer 使用 privateKey 用于签发管理员（administrator）的 usersig，进而能够调用 IM REST API 发送房间里的系统消息。</td>
    <td><a href="https://cloud.tencent.com/document/product/454/7953#IM_PRIKEY">DOC</a></td>
  </tr>
<tr align="center">
    <td>im.publicKey</td>
    <td>RTCRoomServer RoomService 使用 publicKey 用于确认终端用户的登录身份。</td>
    <td><a href="https://cloud.tencent.com/document/product/454/7953#IM_PRIKEY">DOC</a></td>
  </tr>
</table>

5 . 点击界面右上角的【腾讯云】图标，在下拉的菜单栏中选择【上传测试代码】。

![上传按钮](https://mc.qcloudimg.com/static/img/8480bbc02b097bac0d511c334b731e12/5.png)

6 . 选择【模块上传】并勾选全部选项，然后勾选【部署后自动安装依赖】，点击【确定】开始上传代码。

![选择模块](https://mc.qcloudimg.com/static/img/d7ff3775c77a662e9c18807916ab8045/6.png)

![上传成功](https://mc.qcloudimg.com/static/img/a78431b42d0edf0bddae0b85ef00d40f/7.png)

7 . 上传代码完成之后，点击右上角的【详情】按钮，接着选择【腾讯云状态】即可看到腾讯云自动分配给你的开发环境域名，完整复制（包括 `https://`）开发环境 request 域名，然后在编辑器中打开 `wxlite/config.js` 文件，将复制的域名填入 `serverUrl` 和`roomServiceUrl`中并保存，保存之后编辑器会自动编译小程序，左边的模拟器窗口即可实时显示出客户端的 Demo：

![查看开发域名](https://main.qcloudimg.com/raw/c5ed016e213cac0be7cb623dd0c96895.png)

8 . 在模拟器中编译运行点击多人音视频进入，在右侧的console里面可以看到登录成功的log表示配置成功。

![登录测试](https://main.qcloudimg.com/raw/ee916ccef75ca8a3821d0e0e5a76df21.png)

9 . 请使用手机进行测试，直接扫描开发者工具预览生成的二维码进入，<font color='red'> 这里部署的后台是开发测试环境，一定要开启调试: </font>

![开启调试](https://mc.qcloudimg.com/static/img/1abfe50750f669ca4e625ec3cdfbd411/xiaochengxutiaoshi.png)

<font color='red'> 注意：后台服务器部署的测试环境有效期为七天，如果还需要测试体验请重新部署后台。小程序访问域名有白名单限制，小程序开启调试就不会检查白名单，测试期间建议开启白名单，最后要发布的时候将域名配置到白名单里面，请参考常见问题里面如何部署正式环境？</font>

## 六、项目结构  

```
RTCRoomDemo
├── README.md
├── server                       //后台代码目录，具体请参见服务端项目结构介绍
└── wxlite                       //腾讯视频云小程序目录
   ├── config.js                 //配置文件，主要配置后台服务器地址
   ├── lib                       //小程序使用的通用库目录
   ├── pages                     //腾讯视频云小程序界面主目录
   │      ├── Resources          //资源目录
   │      ├── components         //组件目录
   │      │      ├── live-room   //腾讯视频云小程序<live-room>组件
   │      │      │      └── vertical1v3template     //腾讯视频云小程序<live-room>组件使用的界面模版
   │      │      ├── rtc-room    //腾讯视频云小程序<rtc-room>组件
   │      │      │      └── gridtemplate            //腾讯视频云小程序<rtc-room>组件使用的界面模版
   │      │      ├── sketchpad
   │      │      └── webrtc-room //腾讯视频云小程序<webrtc-room>组件
   │      │          ├── 1l3rtemplate               //腾讯视频云小程序<webrtc-room>组件使用的界面模版
   │      │          ├── 1u3dtemplate               //腾讯视频云小程序<webrtc-room>组件使用的界面模版
   │      │          └── gridtemplate               //腾讯视频云小程序<webrtc-room>组件使用的界面模版
   │      ├── doubleroom         //腾讯视频云小程序双人音视频
   │      ├── livelinkroom       //腾讯视频云小程序直播连麦  
   │      ├── liveroom           //腾讯视频云小程序直播体验室
   │      ├── main               //腾讯视频云小程序主界面
   │      ├── multiroom          //腾讯视频云小程序多人音视频
   │      ├── play               //腾讯视频云小程序播放界面
   │      ├── push               //腾讯视频云小程序推流界面
   │      ├── rtplay             //腾讯视频云小程序低延时播放界面
   │      ├── vodplay            //腾讯视频云小程序点播播放界面
   │      └── webrtcroom         //腾讯视频云小程序webrtc互通体验室
   └── utils
       ├── liveroom.js           //腾讯视频云小程序单向音视频库文件
       ├── rtcroom.js            //腾讯视频云小程序双人、多人音视频库文件
       └── webrtcroom.js         //腾讯视频云小程序webrtc互通库文件
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

