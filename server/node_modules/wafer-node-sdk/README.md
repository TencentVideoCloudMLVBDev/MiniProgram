# Wafer 服务端 SDK - Node.js

## 介绍

Wafer 服务端 SDK 是腾讯云为微信小程序开发者提供的快速开发库，SDK 封装了以下功能供小程序开发者快速调用：

- 用户登录与验证
- 信道服务
- 图片上传
- 数据库
- 客服消息

开发者只需要根据文档对 SDK 进行初始化配置，就可以获得以上能力。你还可以直接到[腾讯云小程序控制台](https://console.qcloud.com/la)购买小程序解决方案，可以得到运行本示例所需的资源和服务，其中包括已部署好的相关程序、示例代码及自动下发的 SDK 配置文件 `/etc/qcloud/sdk.config`。

## 安装

```bash
npm install wafer-node-sdk --save
```

## 配置

```javascript
const configs = {
  appId: 'wx00dd00dd00dd00dd',
  appSecret: 'abcdefghijkl',
  useQcloudLogin: false,
  cos: {
    region: 'cn-south',
    fileBucket: 'test',
    uploadFolder: ''
  },
  serverHost: '1234567.qcloud.la',
  tunnelServerUrl: '1234567.ws.qcloud.la',
  tunnelSignatureKey: 'abcdefghijkl',
  qcloudAppId: '121000000',
  qcloudSecretId: 'ABCDEFG',
  qcloudSecretKey: 'abcdefghijkl',
  wxMessageToken: 'abcdefghijkl'
}
const qcloud = require('qcloud-weapp-server-sdk')(configs)
```

具体配置项说明请查看：[API 文档](/API.md)。

## API 文档

具体查看 [API 文档](/API.md)。

## 基本功能

#### 用户登录与验证

用户登录使用 `authorization` 接口：

```javascript
const { auth: { authorization } } = qcloud

// express
module.exports = (req, res) => {
  authorization(req).then(result => {
    // result : {
    //   loginState: 0  // 1表示登录成功，0表示登录失败
    //   userinfo: { // 用户信息.. }
    // }
  })
}
```

用户登录态校验使用 `validation` 接口：

```javascript
const { auth: { validation } } = qcloud

// express
module.exports = (req, res) => {
  validation(req).then(result => {
    // result : {
    //   loginState: 0  // 1表示登录成功，0表示登录失败
    //   userinfo: { // 用户信息.. }
    // }
  })
}
```

如果你使用 Koa 框架，则可以直接使用 SDK 导出的 `koaAuthorization` 和 `koaValidation` 中间件，登录信息将会被写进 `ctx.state.$wxInfo`：

```javascript
const { auth: { authorizationMiddleware, validationMiddleware } } = qcloud

// 颁发登录态
router.get('/login', authorizationMiddleware, ctx => {
  console.log(ctx.state.$wxInfo)
  // {
  //   loginState: 0  // 1表示登录成功，0表示登录失败
  //   userinfo: { // 用户信息.. }
  // }
})

// 校验登录态
router.get('/user', validationMiddleware, ctx => {
  console.log(ctx.state.$wxInfo)
  // {
  //   loginState: 0  // 1表示登录成功，0表示登录失败
  //   userinfo: { // 用户信息.. }
  // }
})
```

#### 信道服务

业务在一个路由上（如 `/tunnel`）提供信道服务，只需把该路由上的请求都交给 SDK 的信道服务处理即可。使用信道服务需要实现处理器，来获取处理信道的各种事件，具体可参考配套 Demo 中的 tunnel.js 的实现。

#### 图片上传

SDK 提供直接上传图片至腾讯云对象储存（COS）的接口，只需要将请求传入接口，即可自动上传文件到 COS 中，并返回数据：

```javascript
const { uploader } = qcloud

module.exports = async ctx => {
  await uploader(ctx.req).then(data => {
    console.log(data)
    // {
    //   imgUrl: 'http://test-121000000.cosgz.myqcloud.com/abcdef.jpg',
    //   size: 1024,
    //   mimeType: 'image/jpeg',
    //   name: 'abcdef.jpg'
    // }
  })
}
```

#### 数据库

SDK 还暴露出了内部使用的 MySQL 连接，由于 SDK 内部使用 [Knex.js](http://knexjs.org/) 连接数据库，SDK 暴露的 MySQL 实例就是 Knex.js 连接实例，具体使用方法可以查看 [Knex.js 文档](http://knexjs.org/)：

```javascript
const { mysql } = qcloud

mysql('db_name').select('*').where({ id: 1 })
// => { id:1, name: 'leo', age: 20 }
```

#### 客服消息

微信提供一个[客服消息](https://mp.weixin.qq.com/debug/wxadoc/dev/api/custommsg/callback_help.html)处理能力，你可以使用 SDK 提供的接口快速部署一个接受客服信息的 API：

```javascript
const { message: { checkSignature } } = require('../qcloud')

/**
 * 响应 GET 请求（响应微信配置时的签名检查请求）
 */
router.get('/message', ctx => {
  const { signature, timestamp, nonce, echostr } = ctx.query
  if (checkSignature(signature, timestamp, nonce)) ctx.body = echostr
  else ctx.body = 'ERR_WHEN_CHECK_SIGNATURE'
})

// post 请求用来接收消息
router.post('/message', (ctx, next) {
    // 检查签名，确认是微信发出的请求
    const { signature, timestamp, nonce } = ctx.query
    if (!checkSignature(signature, timestamp, nonce)) ctx.body = 'ERR_WHEN_CHECK_SIGNATURE'

    /**
     * 解析微信发送过来的请求体
     * 可查看微信文档：https://mp.weixin.qq.com/debug/wxadoc/dev/api/custommsg/receive.html#接收消息和事件
     */
    const body = ctx.request.body

    ctx.body = 'success'
})
```

## 示例 Demo

腾讯云还提供了完整的示例代码，点击[这里]()下载。
