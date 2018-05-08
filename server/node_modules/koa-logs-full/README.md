koa-logs-full[![Build Status](https://travis-ci.org/purplebamboo/koa-logs-full.svg?branch=master)](https://travis-ci.org/purplebamboo/koa-logs-full)
=================

为什么要再造个轮子？
====

nodejs是单进程单线程模型，跟php，ruby这些不同，nodejs所有的请求都会是同一个线程处理。于是会发生这种情况，第一个请求执行了一半的时候，下一个请求已经过来了。如果我们使用传统的打日志的方法。可能a请求打了一半的日志。这时候b请求也开始打日志了。这样直接导致了日志发生了串行，混在了一起。不能清晰的看出区别。

解决方案也很简单，针对koa的每个请求的context，维护一个局部的cache，写日志的时候不要直接写，而是先存起来，等请求结束的时候再一次性输出。这样就不会有串行的问题。

处理了那些内容？
====

* 默认记录了基本的请求信息。包括请求参数，状态，以及一次请求时间。参考了[logger](https://github.com/koajs/logger)
* 默认监听错误，在出错时，自动打出错误日志。
* 在日志目录下会按照`环境名+日期+.log`的格式维护对应的日志文件。
* 支持个性化的日志内容样式定制，使用[chalk](https://github.com/sindresorhus/chalk)实现
* 支持c风格的print格式化输出，使用[printf](https://github.com/wdavidw/node-printf)

## Installation

```
npm install koa-logs-full --save
```

## Test

```
npm test
```


## example

```js
var logRecord = require('koa-logs-full');
var app = koa();

//最好放在顶部，在其他中间件之前调用
app.use(logRecord(app,{
  logdir: path.join(__dirname, 'logs')
}));

//使用时：

app.use(function*(next){
  //任何能够拿到context的地方都可以使用
  this.logger.log("我是要输出的文本");
  //也可以使用error,warn,info.在终端输出的颜色会不同
})


```

支持下面这些参数：

* logdir 日志目录
* env 环境类型，默认为development。程序会自动在日志目录下以`环境名+日期+.log`打出日志。只有development的时候会输出日志到终端。
* exportGlobalLogger 是否暴露logger对象到全局。默认为true。这样可以在任何地方调用logger.log等方法。
* skipStatic是否跳过静态资源的记录。默认为true不记录静态资源的请求。

## 注意事项

* 对于挂在context上的logger会使用一种异步的日志输出，就是会先把日志内容存到内存里，等一个请求结束再全部输出。这样才可以解决多个请求之间串行的问题。而全局的logger是一种实时的日志写。会立刻写到文件，应该说跟每个请求单独有关的日志都不要使用全局logger来打日志。

* 尽量将日志中间件放在最前面。这样才能更准确的统计时间，记录错误。当然对于请求参数的解析这种中间件，比如co-body，应该放到日志中间件之前。这样日志中间件才会正确的打出body参数。

## 个性化定制日志格式

1.可以使用c语言风格的格式化输出：
```
this.logger.log("%s测试",'1');

```

更多格式请参考[printf](https://github.com/wdavidw/node-printf)

2.还可以使用一种类模板标记语言来对一段日志文字，加上一些简单的样式。

比如对一段文字使用红色输出：

```js
this.logger.log("{{#red}}我会变成红色的{{/red}}");
```
支持的样式如下：

### Modifiers

- `reset`
- `bold`
- `dim`
- `italic` *(not widely supported)*
- `underline`
- `inverse`
- `hidden`
- `strikethrough` *(not widely supported)*

### Colors

- `black`
- `red`
- `green`
- `yellow`
- `blue` *(on Windows the bright version is used as normal blue is illegible)*
- `magenta`
- `cyan`
- `white`
- `gray`

### Background colors

- `bgBlack`
- `bgRed`
- `bgGreen`
- `bgYellow`
- `bgBlue`
- `bgMagenta`
- `bgCyan`
- `bgWhite`