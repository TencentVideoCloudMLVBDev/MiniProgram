## 体验

![](https://mc.qcloudimg.com/static/img/9851dba2c86161bc9e14a08b5b82dfd2/image.png)

> 打开微信，在小程序中搜索 “腾讯视频云”或者扫描上面的二维码，即可体验我们的官方 DEMO。

## 注册小程序并开通类目与推拉流标签【重要】
打开 [微信公众平台](https://mp.weixin.qq.com) 注册并登录小程序，出于政策和合规的考虑，微信暂时没有放开所有小程序对 &lt;live-pusher&gt; 和 &lt;live-player&gt; 标签的支持：

- 个人账号和企业账号的小程序暂时只开放如下表格中的类目：

<table>
<tr align="center">
<th width="200px">主类目</th>
<th width="700px">子类目</th>
</tr>
<tr align="center">
<td>【社交】</td>
<td>直播</td>
</tr>
<tr align="center">
<td>【教育】</td>
<td>在线教育</td>
</tr>
<tr align="center">
<td>【医疗】</td>
<td>互联网医院，公立医院</td>
</tr>
<tr align="center">
<td>【政务民生】</td>
<td>所有二级类目</td>
</tr>
<tr align="center">
<td>【金融】</td>
<td>基金、信托、保险、银行、证券/期货、非金融机构自营小额贷款、征信业务、消费金融</td>
</tr>
</table>

- 符合类目要求的小程序，需要在小程序管理后台的<font color='red'> “设置 - 接口设置” </font>中自助开通该组件权限，如下图所示：

![](https://mc.qcloudimg.com/static/img/a34df5e3e86c9b0fcdfba86f8576e06a/weixinset.png)

注意：如果以上设置都正确，但小程序依然不能正常工作，可能是微信内部的缓存没更新，请删除小程序并重启微信后，再进行尝试。

## 安装微信小程序开发工具

下载并安装最新版本的[微信开发者工具](https://mp.weixin.qq.com/debug/wxadoc/dev/devtools/download.html)，使用小程序绑定的微信号扫码登录开发者工具。

![根目录](https://mc.qcloudimg.com/static/img/4fd45bb5c74eed92b031fbebf8600bd2/1.png)

## 下载 Demo

访问 [GitBub地址](https://github.com/TencentVideoCloudMLVBDev/MiniProgram)，获取小程序 Demo源码。

## 本地调试小程序代码

1.打开安装的微信开发者工具，点击【小程序项目】按钮。
2.输入小程序 AppID，项目目录选择上一步下载下来的代码目录，点击确定创建小程序项目。
3.再次点击【确定】进入开发者工具。

> **注意：** 目录请选择根目录！
> ![微信开发者工具](https://main.qcloudimg.com/raw/6932cf9611cbe3acb4e0ad212785e610.png)

![上传代码](https://mc.qcloudimg.com/static/img/fd7074730e5b37af8a4d86dc8125d120/xiaochengxustart.png)

4.请使用手机进行测试，直接扫描开发者工具预览生成的二维码进入，<font color='red'> 如果只是想运行起来看看效果，可以直接使用我们提供的后台。小程序控制台没有配置域名白名单，一定要开启调试: </font>

![开启调试](https://mc.qcloudimg.com/static/img/1abfe50750f669ca4e625ec3cdfbd411/xiaochengxutiaoshi.png)

至此，您已经可以在本地修改调试小程序代码了。<font color='red'> 如果您需要上线，则需要部署自己的后台环境，请参考后台自行部署。</font>

## 后台自行部署

小程序里用到了两个后台，您可以根据需要选择其中的一个或者两个后台来部署。

1. WebRTCRoomServer : 提供**webrtc互通**的房间列表管理和**webrtc-room**标签几个所需参数。
2. RTCRoomServer : 提供**直播体验室** 和 **双人/多人音视频** 的房间列表管理、**live-room**（直播连麦）和 **rtc-room**（视频通话）标签的后台组件。

### WebRTCRoomServer 

实现了一个简单的房间列表功能，同时包含**webrtc-room**标签几个所需参数的生成代码

1.后台自行部署

下载 [WebRTCRoomServer java后台源码](https://github.com/TencentVideoCloudMLVBDev/webrtc_server_java)，根据README.md中的指引部署后台服务。

2.小程序部署

下载 [小程序](https://github.com/TencentVideoCloudMLVBDev/MiniProgram) 源码，将wxlite/config.js文件中的`webrtcServerUrl`修改成：
```
https://您自己的域名/webrtc/weapp/webrtc_room
```

### RTCRoomServer 

是 **live-room**（直播连麦）和 **rtc-room**（视频通话）的后台组件，源码下载后可部署于自己的业务服务器上。

1.后台自行部署

RTCRoomServer同时提供了java版本和nodejs版本，您可以选择一种语言版本来部署。

- 下载 [RTCRoomServer java后台源码](https://github.com/TencentVideoCloudMLVBDev/rtcroom_server_java)，根据README.md中的指引部署后台服务。

- 下载 [小程序](https://github.com/TencentVideoCloudMLVBDev/MiniProgram) 源码，根据[一键部署指引](https://github.com/TencentVideoCloudMLVBDev/RTCRoomDemo/blob/master/doc/%E4%B8%80%E9%94%AE%E9%83%A8%E7%BD%B2_NodeJS.md)完成部署。

2.小程序部署

下载 [小程序](https://github.com/TencentVideoCloudMLVBDev/MiniProgram) 源码，将wxlite/config.js文件中的`serverUrl`和 `roomServiceUrl`修改成:
```
https://您自己的域名/roomservice/
```

## 开发者资源
* 小程序
	- [项目结构](https://github.com/TencentVideoCloudMLVBDev/MiniProgram/blob/master/doc/%E5%B0%8F%E7%A8%8B%E5%BA%8F%E9%A1%B9%E7%9B%AE%E7%BB%93%E6%9E%84.md) - 小程序项目结构
	- [rtc-room标签](https://cloud.tencent.com/document/product/454/15364) - 用于双人、多人会话场景
	- [live-room标签](https://cloud.tencent.com/document/product/454/15368) - 用于单向音视频及连麦场景
	- [webrtc-room标签](https://cloud.tencent.com/document/product/454/16914) - 用于单向音视频场景
	- 原生标签使用
		- [live-pusher标签](https://cloud.tencent.com/document/product/454/12518) - 微信原生live-pusher标签使用文档
		- [live-player标签](https://cloud.tencent.com/document/product/454/12519) - 微信原生live-player标签使用文档
	- [常见问题](https://cloud.tencent.com/document/product/454/13037?!preview&lang=cn) - 小程序视频标签使用过程中常见问题
* 企业端
	- [WebExe](https://cloud.tencent.com/document/product/454/17004) - 小程序与Windows WebExe互通方案
	- [WebRTC](https://cloud.tencent.com/document/product/454/17005) - 小程序与Chrome WebRTC互通方案
* WebRTC服务端(Java)
	- [项目结构](https://github.com/TencentVideoCloudMLVBDev/webrtc_server_java/blob/master/doc/protocol.md) - 服务端项目结构及简介
	- [协议文档](https://github.com/TencentVideoCloudMLVBDev/webrtc_server_java/blob/master/doc/codeStructure.md) - 后台协议文档
* RTCRoom服务端(Java)
	- [项目结构](https://github.com/TencentVideoCloudMLVBDev/rtcroom_server_java/blob/master/doc/codeStructure.md) - 服务端项目结构及简介
	- [协议文档](https://github.com/TencentVideoCloudMLVBDev/rtcroom_server_java/blob/master/doc/protocol.md) - 后台协议文档
* RTCRoom服务端(NodeJS)
	- [项目结构](https://github.com/TencentVideoCloudMLVBDev/MiniProgram/blob/master/doc/server%E9%A1%B9%E7%9B%AE%E7%BB%93%E6%9E%84_NodeJS.md) - 服务端项目结构及简介
	- [协议文档](https://github.com/TencentVideoCloudMLVBDev/MiniProgram/blob/master/doc/server%E5%8D%8F%E8%AE%AE%E6%96%87%E6%A1%A3_NodeJS.md) - 后台协议文档
