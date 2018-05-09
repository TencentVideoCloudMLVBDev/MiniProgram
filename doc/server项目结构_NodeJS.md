## 项目结构
```
server
├── README.md                            //后台部署说明
├── account
│   ├── login.js                         //登录最后处理
│   └── logout.js                        //登出最后处理
├── app.js                               //服务器端 的主入口文件
├── config.js                            //配置文件，需要修改
├── controller
│   ├── add_audience.js                  //增加观众接口
│   ├── add_pusher.js                    //增加pusher接口
│   ├── create_room.js                   //建房接口
│   ├── delete_audience.js               //删除观众接口
│   ├── delete_pusher.js                 //删除pusher接口
│   ├── destroy_room.js                  //销毁房间接口
│   ├── get_audiences.js                 //获取观众列表接口
│   ├── get_custom_info.js               //获取直播房间自定义信息接口
│   ├── get_push_url.js                  //获取推流地址接口
│   ├── get_pushers.js                   //获取推流者列表接口
│   ├── get_room_list.js                 //获取房间列表接口
│   ├── merge_stream.js                  //混流接口
│   ├── pusher_heartbeat.js              //推流者心跳接口
│   └── set_custom_field.js              //设置直播房间自定义信息接口
├── log.js                               //log实现
├── log_config.js                        //log配置信息
├── logic
│   ├── auth.js                          //权限验证
│   ├── do_request.js                    //请求处理
│   ├── im_mgr.js                        //云通信相关逻辑
│   ├── live_util.js                     //通用逻辑
│   ├── room_list.js                     //房间列表
│   └── room_mgr.js                      //房间管理
├── middlewares
│   ├── bodyparser.js                    //包体解析
│   └── response.js                      //回包
├── routes
│   └── index.js                         //路由文件
└── utils
    ├── get_login_info.js                //获取登录信息
    ├── get_test_pushurl.js              //获取一对推流播放地址
    └── get_test_rtmpaccurl.js           //获取测试低延时播放地址
```

`app.js` 是 服务器端 的主入口文件，使用 Koa 框架，在 `app.js` 创建一个 Koa 实例并响应请求。

`routes/index.js` 是 服务器端 的路由定义文件。

`controller` 是服务器端提供的业务逻辑入口，双人、多人、直播房间都通过这个目录统一转发

`logic` 是具体的逻辑实现目录，实现了认证、云通信、房间列表管理。

`node_modules` 是依赖的第三方模块目录

`utils` 存放 服务器端 辅助接口的目录，`index.js` 不需要修改，他会动态的将 `utils` 文件夹下的目录结构映射成 modules 的 Object。

`log.js` 后台日志模块，主要记录请求响应和错误两大类日志。请求响应日志按小时存储在`logs/response/`目录下，错误日志按小时存储在`logs/error/`目录下。最多存储7天日志。以上默认配置可以通过修改`log_config.js`来调整。

log4js v2 日志配置(若是2.0以下版本请用v1 的配置具体见log_config.js文件)：

```javascript
{
  appenders:
  {
    //错误日志
    errorLogger:{
      type: "dateFile",                   //日志类型
      filename: errorLogPath,             //日志输出位置
      alwaysIncludePattern: true,         //是否总是有后缀名
      pattern: "-yyyy-MM-dd-hh.log",      //后缀，每小时创建一个新的日志文件
      daysToKeep: 7                       //自定义属性，错误日志的根目录
    },
    //响应日志
    resLogger:{
      type: "dateFile",
      filename: responseLogPath,
      alwaysIncludePattern: true,
      pattern: "-yyyy-MM-dd-hh.log",
      daysToKeep: 7
    },
    //控制台输出
    consoleLogger:{
      type: "console"
    }
  },
  categories:                                   //设置logger名称对应的的日志等级
  {
    default:{
      appenders: ['consoleLogger'],
      level:"info"
    },
    errorLogger:{
      appenders:["errorLogger"],
      level:"error"
    },

    resLogger:{
      appenders:["resLogger"],
      level:"info"
    }
  }
}
```
