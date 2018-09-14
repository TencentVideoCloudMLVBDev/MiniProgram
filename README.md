## Demo 体验
升级微信到最新版本，发现页卡 => 小程序 => 搜索“腾讯视频云”，即可打开小程序Demo：

<table>
<tr align="center">
<th width="200px">功能项</th>
<th width="200px">小程序组件</th>
<th width="250px">PC端体验页面</th>
<th width="250px">依赖的云服务</th>
<th width="700px">功能描述</th>
</tr>
<tr align="center">
<td>手机直播 </td>
<td><a href="https://cloud.tencent.com/document/product/454/15368">&lt;live-room&gt;</a></td>
<td>N/A</td>
<td>直播+云通讯</td>
<td>演示基于小程序的个人直播解决方案</td>
</tr>
<tr align="center">
<td>PC 直播</td>
<td><a href="https://cloud.tencent.com/document/product/454/15368">&lt;live-room&gt;</a></td>
<td><a href="http://img.qcloud.com/open/qcloud/video/act/liteavWeb/webexe/webexe.html">WebEXE</a></td>
<td>直播+云通讯</td>
<td>演示课堂直播和学生互动的相关功能（需要 PC 端配合）</td>
</tr>
<tr align="center">
<td>双人通话</td>
<td><a href="https://cloud.tencent.com/document/product/454/15364">&lt;rtc-room&gt;</a></td>
<td><a href="http://img.qcloud.com/open/qcloud/video/act/liteavWeb/webexe/webexe.html">WebEXE</a></td>
<td>直播+云通讯</td>
<td>演示双人视频通话功能，可用于在线客服</td>
</tr>
<tr align="center">
<td>多人通话</td>
<td><a href="https://cloud.tencent.com/document/product/454/15364">&lt;rtc-room&gt;</a></td>
<td>N/A</td>
<td>直播+云通讯</td>
<td>演示多人视频通话功能，可用于临时会议</td>
</tr>
<tr align="center">
<td>WebRTC</td>
<td><a href="https://cloud.tencent.com/document/product/454/16914">&lt;webrtc-room&gt;</a></td>
<td><a href="https://sxb.qcloud.com/miniApp/index.html">Chrome</a></td>
<td>实时音视频</td>
<td>演示小程序和 Chrome 浏览器的互通能力</td>
</tr>
<tr align="center">
<td>RTMP推流	</td>
<td><a href="https://cloud.tencent.com/document/product/454/12518">&lt;live-pusher&gt;</a></td>
<td>N/A</td>
<td>直播</td>
<td>演示基础的 RTMP 推流功能</td>
</tr>
<tr align="center">
<td>直播播放器</td>
<td><a href="https://cloud.tencent.com/document/product/454/12519">&lt;live-player&gt;</a></td>
<td>N/A</td>
<td>直播</td>
<td>演示基于 RTMP 和 FLV 协议的直播播放功能</td>
</tr>
</table>

![](https://github.com/TencentVideoCloudMLVBDev/MiniProgram/raw/master/image/xiaochengxu_entrance.png)

## 注册小程序并开通相关接口
打开 [微信公众平台](https://mp.weixin.qq.com) 注册并登录小程序，并在小程序管理后台的<font color='red'> “设置 - 接口设置” </font>中自助开通该组件权限，如下图所示：

![](https://github.com/TencentVideoCloudMLVBDev/MiniProgram/raw/master/image/weixinset.png)

> 注意：如果以上设置都正确，但小程序依然不能正常工作，可能是微信内部的缓存没更新，请删除小程序并重启微信后，再进行尝试。

## 安装微信小程序开发工具

下载并安装最新版本的[微信开发者工具](https://mp.weixin.qq.com/debug/wxadoc/dev/devtools/download.html)，使用小程序绑定的微信号扫码登录开发者工具。

<img style="border:0; max-width:100%; height:auto; box-sizing:content-box; box-shadow: 0px 0px 0px #ccc; margin: 0px 0px 0px 0px;" src="https://github.com/TencentVideoCloudMLVBDev/MiniProgram/raw/master/image/wx_dev_tool.png" />


## 获取Demo源码并调试

- step1: 访问 [SDK + Demo](https://cloud.tencent.com/document/product/454/7873#XiaoChengXu)，获取小程序 Demo 源码。

- step2: 打开安装的微信开发者工具，点击【小程序项目】按钮。

- step3: 输入小程序 AppID，项目目录选择上一步下载下来的代码目录（ **注意：** 目录请选择**根目录**，根目录包含有 `project.config.json`文件，请不要只选择 `wxlite` 目录！），点击确定创建小程序项目。

- step4: 再次点击【确定】进入开发者工具。

- step5: 请使用手机进行测试，直接扫描开发者工具预览生成的二维码进入。

- step6: <font color='red'>开启调试模式</font>，体验和调试内部功能。开启调试可以跳过把这些域名加入小程序白名单的工作。

<img style="border:0; max-width:100%; height:auto; box-sizing:content-box; box-shadow: 0px 0px 0px #ccc; margin: 0px 0px 0px 0px;" src="https://github.com/TencentVideoCloudMLVBDev/MiniProgram/raw/master/image/wx_open_debug.png" />

## Demo访问的测试地址
Demo小程序会访问如下表格中的测试服务器地址，这些服务器使用的云服务是我们为大家提供的一个体验账号，平时很多客户都会在上面做测试。如果您希望使用自己的后台服务器，以免被其他客户打扰，请关注文档后一节内容：

- **&lt;live-room&gt; 和 &lt;rtc-room&gt; 相关demo需要访问如下地址：**

<table>
<tr align="center">
<th width="500px">URL</th>
<th width="500px">对应的服务器地址</th>
<th width="700px">服务器的功能描述</th>
</tr>
<tr align="center">
<td>https://webim.tim.qq.com</td>
<td>IM云通讯后台服务地址</td>
<td>用于支持小程序里面的一些消息通讯功能</td>
</tr>
<tr align="center">
<td>https://room.qcloud.com</td>
<td>RoomService后台服务地址</td>
<td>RoomService 是用于支撑<a href="https://cloud.tencent.com/document/product/454/15364">&lt;rtc-room&gt;</a> （视频通话）和 <a href="https://cloud.tencent.com/document/product/454/15368">&lt;live-room&gt;</a> （直播连麦）的房间管理逻辑</td>
</tr>
</table>

- **&lt;webrtc-room&gt; 相关demo需要访问如下地址：**

<table>
<tr align="center">
<th width="500px">URL</th>
<th width="500px">对应的服务器地址</th>
<th width="700px">服务器的功能描述</th>
</tr>
<tr align="center">
<td>https://webim.tim.qq.com</td>
<td>IM云通讯后台服务地址</td>
<td>用于支持小程序里面的一些消息通讯功能</td>
</tr>
<tr align="center">
<td>https://official.opensso.tencent-cloud.com/v4/openim/jsonvideoapp</td>
<td>WebRTC测试后台</td>
<td>用于请求进入<a href="https://cloud.tencent.com/document/product/454/16914">&lt;webrtc-room&gt;</a> 所需的 userSig 和 privateMapKey</td>
</tr>
<tr align="center">
<td>https://xzb.qcloud.com/webrtc/weapp/webrtc_room</td>
<td>WebRTC房间列表后台</td>
<td>一个简单的房间列表功能，方便Demo的测试和使用</td>
</tr>
</table>

## 搭建自己的账号和后台服务器
这部分我们将介绍如何将Demo默认的测试用服务器地址，换成您自己的服务器，这样一来，您就可以使用自己的腾讯云账号实现上述功能，同时也便于您进行二次开发。


#### 1. 搭建 &lt;webrtc-room&gt; 的服务器

##### 1.1 这个服务器能做什么？

- 点击demo里的互动课堂 **&lt;webrtc-room&gt;** 功能，您会看到一个房间列表，这个房间列表是怎么实现的呢？

- 在看到视频房间列表以后，如果你要创建一个视频房间，或者进入一个其他人建好的视频房间，就需要为 [&lt;webrtc-room&gt;](https://cloud.tencent.com/document/product/454/16914) 所对应的几个属性（`sdkAppID`、`userID`、`userSig`、`roomID` 和 `privateMapKey`）传递合法的参数值，这几个参数值怎么获取呢？

##### 1.2 这个服务器要怎么搭建？

- 下载 [webrtc_server](https://github.com/TencentVideoCloudMLVBDev/webrtc_server_java) ，这是一份 java 版本的实现，根据 README.md 中的说明就可以了解怎么使用这份源码。

##### 1.3 服务器建好了我怎么用？

-  [小程序](https://github.com/TencentVideoCloudMLVBDev/MiniProgram) 源码中，将 `wxlite/config.js` 文件中的 `webrtcServerUrl` 修改成：
```
https://您自己的域名/webrtc/weapp/webrtc_room
```

- 小程序实现 WebRTC 能力肯定是为了跟 Chrome 浏览器进行视频通话，浏览器端的源代码可以点击 [Chrome(src)](https://github.com/TencentVideoCloudMLVBDev/webrtc_pc) 下载到，将 `component/WebRTCRoom.js` 文件中的`serverDomain`修改成：
```
https://您自己的域名/webrtc/weapp/webrtc_room
```

#### 2. 搭建 &lt;live-room&gt; 和 &lt;rtc-room&gt; 的服务器

##### 2.1 这个服务器能做什么？
-  [&lt;live-room&gt;](https://cloud.tencent.com/document/product/454/15368) （用于直播连麦）和 [&lt;rtc-room&gt;](https://cloud.tencent.com/document/product/454/15364) （用于视频通话）都是基于腾讯云 LVB 和 IM 两个基础服务实现的扩展功能，需要一个叫做 RoomService 的后台组件配合才能运行。

##### 2.2 这个服务器要怎么搭建？
- 下载 [RoomService](https://github.com/TencentVideoCloudMLVBDev/rtcroom_server_java) 的 java 版本源代码，根据 README.md 中的说明就可以了解怎么使用这份源码。

##### 2.3 服务器建好了我怎么用？
- [小程序](https://github.com/TencentVideoCloudMLVBDev/MiniProgram) 源码中，将 `wxlite/config.js` 文件中的 `serverUrl`和 `roomServiceUrl` 修改成：
```
https://您自己的域名/roomservice/
```

- 小程序如果使用 &lt;live-room&gt; 和 &lt;rtc-room&gt; 两个标签，在 PC 端就不能用 Chrome 浏览器配对了，需要改用 [WebEXE](https://cloud.tencent.com/document/product/454/17004) 混合解决方案。将 [GitHub(WebEXE)](https://github.com/TencentVideoCloudMLVBDev/webexe_web) 源码中 liveroom.html、double.html文件中的`RoomServerDomain`修改成:
```
https://您自己的域名/roomservice/
```

#### 3. Wafer 零成本服务器部署方案 （Node.js）

如果您是一位资深的 Web 前端工程师，暂时找不到合适的服务器，但又想快速拥有自己的调试后台，可以使用腾讯云的 Wafer 功能进行零成本的一键部署方案（Wafer 只支持 Node.js 语言的后台代码），您需要你做的只是：
- step1: 下载 [小程序](https://github.com/TencentVideoCloudMLVBDev/MiniProgram) 源码。

- step2: 根据[一键部署指引](https://github.com/TencentVideoCloudMLVBDev/RTCRoomDemo/blob/master/doc/%E4%B8%80%E9%94%AE%E9%83%A8%E7%BD%B2_NodeJS.md)完成部署。

- step3: 将 [GitHub(WebEXE)](https://github.com/TencentVideoCloudMLVBDev/webexe_web) 源码中 liveroom.html、double.html文件中的`RoomServerDomain`修改成:
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
* RoomService服务端(Java)
	- [项目结构](https://github.com/TencentVideoCloudMLVBDev/roomservice_java/blob/master/doc/codeStructure.md) - 服务端项目结构及简介
	- [协议文档](https://github.com/TencentVideoCloudMLVBDev/roomservice_java/blob/master/doc/protocol.md) - 后台协议文档
* RoomService服务端(NodeJS)
	- [项目结构](https://github.com/TencentVideoCloudMLVBDev/MiniProgram/blob/master/doc/server%E9%A1%B9%E7%9B%AE%E7%BB%93%E6%9E%84_NodeJS.md) - 服务端项目结构及简介
	- [协议文档](https://github.com/TencentVideoCloudMLVBDev/MiniProgram/blob/master/doc/server%E5%8D%8F%E8%AE%AE%E6%96%87%E6%A1%A3_NodeJS.md) - 后台协议文档

