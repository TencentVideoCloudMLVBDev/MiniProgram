// pages/sketchpad.js
// 由于 currentBoard backgroundPic 需要在页面上使用 因此需要用setData
// 其余data中的数据 均未与页面同步
let tools = require('tools.js');
const ImgLoader = require('img-loader.js');
const FileCache = require('FileCache.js');
Component({
	properties: {
		addData: {
			type: Object,
			observer: function(newVal, oldVal) {
				if (oldVal) {
					console.log('addData: ', newVal);
					this.addData(newVal);
				}
			}
		}, // 添加data
		user: {
			type: String,
			value: 'temp'
		}, // 用户名
		canDraw: {
			type: Boolean,
			value: false
		}, // 能否画画
		height: {
			type: Number,
			value: 211,
			observer: function(newVal, oldVal) {
				this.setData({height: newVal});
				this.data.needDraw = true;
			}
		}, // 显示高度
		width: {
			type: Number,
			value: 375,
			observer: function(newVal, oldVal) {
				this.setData({width: newVal});
				this.data.needDraw = true;
			}
		}, // 显示宽度
		horizontal: {
			type: Boolean,
			value: true,
			observer: function(newVal, oldVal) {
				this.setData({horizontal: newVal});
				this.data.needDraw = true;
			}
		} // 是否水平
	},
	data: {
		width: 375,
		height: 211,
		ctx: {}, // ctx
		drawInterval: 0, // 画画计时器
		sendInterval: 0, // 发消息计时器
		sendData: [], // 要发送的消息
		needDraw: true, // 是否需要重绘
		data: {}, // 全部数据
		userData: {}, // 用户维度的数据
		backgroundPic: {}, // 背景图
		backgroundColor: '#ffffff',
		currentBoard: '#DEFAULT', // 当前画板
		boardList: ['#DEFAULT'], // 画板列表
		seq: 0, // seq
		color: 4278190335, // 默认颜色
		thin: 100, // 默认画笔宽度
		horizontal: true
	},
	ready: function() {
		this.init();
		this.imgLoader = new ImgLoader(this);
		// this.fileCache = new FileCache();
	},

	detached() {
		clearInterval(this.data.sendInterval);
		clearInterval(this.data.drawInterval);
	},

	methods: {
		addData: function(data) {
			if (!data.value) {
				return;
			}
			let user = data.value.operator;
			let actions = data.value.actions;
			let boardId = data.value.boardId;

			if (!this.data.userData[boardId]) {
				this.initBoard(boardId);
			}
			if (!this.data.userData[boardId][user]) {
				this.data.userData[boardId][user] = [];
			}
			let length = this.data.userData[boardId][user].length;
			actions.forEach((action) => {
				action.color && (action.color = tools.dealColor(action.color));
				if (action.action == 1) {
					let line = new tools.Line(user, action);
					line.show = true;
					this.data.userData[boardId][user].push(line);
					this.data.data[boardId].push(line);
					length++;
				} else if (action.action == 2 || action.action == 3) {
					if (length == 0) {
						return;
					}
					let line = this.data.userData[boardId][user][length - 1];
					line.lines.push({x: action.x, y: action.y, seq: action.seq});
					line.setBorder(action.x, action.y);
					if (action.action == 3) {
						line.endSeq = action.seq;
					}
				} else if (action.action == 8) {
					if (!action.lines)
						return;
					action.lines.forEach((line) => {
						if (!this.data.userData[boardId][line.uid])
							return;
						for (var i = 0; i < this.data.userData[boardId][line.uid].length; i++) {
							var item = this.data.userData[boardId][line.uid][i];
							if (item.type == 'line' && item.startSeq == line.seq) {
								item.show = action.display
									? true
									: false;
							} else if (item.type == 'graph' && item.startPoint.seq == line.seq) {
								item.show = action.display
									? true
									: false;
							}
						}
					});
				} else if (action.action == 10 || action.action == 11 || action.action == 12) {
					let list = {
						10: 'line',
						11: 'oval',
						12: 'rect'
					};
					action.graph = list[action.action];
					action.beginPoint.x = action.beginPoint.x;
					action.endPoint.x = action.endPoint.x;
					action.beginPoint.y = action.beginPoint.y;
					action.endPoint.y = action.endPoint.y;
					action.solid = action.fillRect
						? true
						: false;
					action.show = true;
					var graph = new tools.Graph(user, action);

					this.data.userData[boardId][user].push(graph);
					this.data.data[boardId].push(graph);
					length++;
				} else if (action.action == 101) {
					this.clear();
				} else if (action.action == 201) {
					this.setBackgroundPic(boardId, action.url);
				} else if (action.action == 202) {
					this.cancelBackgroundPic(boardId);
				} else if (action.action == 401) {
					let toBoardId = action.toBoardId;
					if (!this.data.data[toBoardId]) {
						this.initBoard(toBoardId);
					}
					action.deleteBoards.forEach((deleteBoardId) => {
						this.removeBoard(deleteBoardId);
					})
					this.setData({currentBoard: boardId})
				}
			});
			this.data.needDraw = true;
		},
		addHistory: function() {}, // 这版暂无历史消息
		setBackgroundPic: function(boardId, url) {
			let self = this;
			let temp = Object.assign({}, this.data.backgroundPic);
			temp[boardId].url = url;
			temp[boardId].show = true;
			if (this.data.currentBoard == boardId) {
				// wx.showLoading({title: '图片加载中'}); // 因为提示在整体UI的中心，randewang 建议屏蔽不要提示
			}
			// this.fileCache.load(url, function (res) {
			// 	if (res.code) {
			// 		console.error('图片加载失败:', res.errMsg);
			// 		return;
			// 	}
			// 	console.log('图片加载完成', res.tmpFilePath);
			// 	temp[boardId].url = res.tmpFilePath;
			// 	self.setData({backgroundPic: temp});
			// })
			this.imgLoader.load(url, (err, data) => {
				console.log('图片加载完成', err, data.src)
				if (!err)
					self.setData({backgroundPic: temp});
				}
			);
			wx.hideLoading();
			this.data.needDraw = true;
		},
		cancelBackgroundPic: function(boardId) {
			let temp = Object.assign({}, this.data.backgroundPic);
			temp[boardId].show = false;
			this.setData({backgroundPic: temp});
			this.data.needDraw = true;
		},
		initBoard: function(boardId) {
			this.data.userData[boardId] = {};
			this.data.userData[boardId][this.properties.user] = [];
			this.data.data[boardId] = [];
			let temp = Object.assign({}, this.data.backgroundPic);
			temp[boardId] = {
				url: '',
				user: this.properties.user,
				show: true
			};
			this.setData({backgroundPic: temp});
			this.data.boardList.push(boardId);
		},
		removeBoard: function(boardId) {
			delete this.data.userData[boardId];
			delete this.data.data[boardId];
			if (this.data.boardList.indexOf(boardId) > -1) {
				this.data.boardList.splice(this.data.boardList.indexOf(boardId), 1);
			}
		},
		getEventLocation: function(event) {
			let result = {
				x: 0,
				y: 0
			}
			result.x = event.changedTouches[0]['x'];
			result.y = event.changedTouches[0]['y'];
			// 要转一下x y
			result.x = parseInt(result.x / this.data.width * 10000);
			// 16:9
			result.y = parseInt(result.y / this.data.height * 10000);
			return result;
		},
		draw: function() {
			// 先清空画板
			// this.data.ctx.clearRect(0, 0, this.data.width, this.data.height);
			if (this.data.backgroundPic[this.data.currentBoard].url && this.data.backgroundPic[this.data.currentBoard].show) {
				// 这里canvas就不画背景了
				this.data.ctx.draw();
			} else {
				this.data.ctx.setFillStyle(this.data.backgroundColor);
				this.data.ctx.fillRect(0, 0, this.data.width, this.data.height);
				this.data.ctx.draw();
			}
			// 遍历data
			this.data.data[this.data.currentBoard].forEach((item) => {
				if (item.type == 'line' && item.show) {
					// 画的时候 要反转 xy
					let oldx = this.data.horizontal
						? item.lines[0].x / 10000 * this.data.width
						: ((10000 - item.lines[0].x) / 10000 * this.data.width);
					let oldy = item.lines[0].y / 10000 * this.data.height;

					item.lines.forEach((lineItem) => {
						// 按照上次的位置和这次的位置画线
						this.data.ctx.beginPath();
						if (!this.data.horizontal) {
							this.data.ctx.moveTo(oldy, oldx);
						} else {
							this.data.ctx.moveTo(oldx, oldy);
						}
						let tempx = this.data.horizontal
							? lineItem.x / 10000 * this.data.width
							: ((10000 - lineItem.x) / 10000 * this.data.width);
						let tempy = lineItem.y / 10000 * this.data.height;
						if (!this.data.horizontal) {
							this.data.ctx.lineTo(tempy, tempx);
						} else {
							this.data.ctx.lineTo(tempx, tempy);
						}
						this.data.ctx.setStrokeStyle(item.color);
						let thin = this.data.horizontal
							? item.thin / 10000 * this.data.height
							: item.thin / 10000 * this.data.width;
						this.data.ctx.setLineWidth(thin);
						this.data.ctx.setLineCap("round");
						this.data.ctx.stroke();
						// 更新参数
						oldx = tempx;
						oldy = tempy;
					});
				} else if (item.type == 'graph' && item.show) {
					let startX = this.data.horizontal
						? item.startPoint.x / 10000 * this.data.width
						: ((10000 - item.startPoint.x) / 10000 * this.data.width);
					let startY = item.startPoint.y / 10000 * this.data.height;

					let endX = this.data.horizontal
						? item.endPoint.x / 10000 * this.data.width
						: ((10000 - item.endPoint.x) / 10000 * this.data.width);
					let endY = item.endPoint.y / 10000 * this.data.height;

					if (item.graph == 'line') { // 画直线
						this.data.ctx.beginPath();
						if (!this.data.horizontal) {
							this.data.ctx.moveTo(startY, startX);
							this.data.ctx.lineTo(endY, endX);
						} else {
							this.data.ctx.moveTo(startX, startY);
							this.data.ctx.lineTo(endX, endY);
						}
						this.data.ctx.setStrokeStyle(item.color);
						let thin = this.data.horizontal
							? item.thin / 10000 * this.data.height
							: item.thin / 10000 * this.data.width;
						this.data.ctx.setLineWidth(thin);
						this.data.ctx.setLineCap("round");
						this.data.ctx.stroke();
					} else if (item.graph == 'rect') {
						let x = startX > endX
							? endX
							: startX;
						let y = startY > endY
							? endY
							: startY;
						let diffX = startX + endX - x * 2;
						let diffY = startY + endY - y * 2;
						this.data.ctx.setStrokeStyle(item.color);
						let thin = this.data.horizontal
							? item.thin / 10000 * this.data.height
							: item.thin / 10000 * this.data.width;
						this.data.ctx.setLineWidth(thin);
						console.log('画矩形');
						if (item.solid) {
							console.log('实心');
							this.data.ctx.setFillStyle(item.color);
							if (!this.data.horizontal) {
								this.data.ctx.fillRect(y, x, diffY, diffX);
							} else {
								this.data.ctx.fillRect(x, y, diffX, diffY);
							}
						} else {
							console.log('空心');
							if (!this.data.horizontal) {
								this.data.ctx.strokeRect(y, x, diffY, diffX);
							} else {
								this.data.ctx.strokeRect(x, y, diffX, diffY);
							}
						}
					} else if (item.graph == 'circle' || item.graph == 'oval') {
						let x = (startX + endX) / 2;
						let y = (startY + endY) / 2;
						let a = Math.abs(startX - endX) / 2;
						let b = Math.abs(startY - endY) / 2;
						this.data.ctx.setStrokeStyle(item.color);
						let thin = this.data.horizontal
							? item.thin / 10000 * this.data.height
							: item.thin / 10000 * this.data.width;
						this.data.ctx.setLineWidth(thin);
						if (!this.data.horizontal) {
							this.drawEllipse2(this.data.ctx, y, x, b, a, item.solid, item.color);
						} else {
							this.drawEllipse2(this.data.ctx, x, y, a, b, item.solid, item.color);
						}
						this.data.ctx.stroke();
					}
				}
			});
			this.data.ctx.draw(true);
		},
		drawEllipse: function(context, x, y, a, b, fill, color) {
			context.save();
			let r = (a > b)
				? a
				: b;
			let ratioX = a / r;
			let ratioY = b / r;
			context.beginPath();
			context.scale(ratioX, ratioY);
			context.arc(x / ratioX, y / ratioY, r, 0, 2 * Math.PI, false);
			context.closePath();
			if (fill) {
				context.fillStyle = color;
				context.fill();
			}
			context.restore();
		},
		drawEllipse2: function(context, x, y, a, b, fill, color) {
			var step = (a > b)
				? 1 / a
				: 1 / b;
			context.beginPath();
			context.moveTo(x + a, y);
			for (var i = 0; i < 2 * Math.PI; i += step) {
				context.lineTo(x + a * Math.cos(i), y + b * Math.sin(i));
			}
			context.closePath();
			if (fill) {
				context.fillStyle = color;
				context.fill();
			}
		},
		start: function(e) {
			console.log('-----START', this.properties.canDraw);
			if (!this.properties.canDraw) {
				return;
			}
			let {x, y} = this.getEventLocation(e);
			let line = new tools.Line(this.properties.user, {
				color: this.data.color,
				thin: this.data.thin,
				x: x,
				y: y,
				show: true,
				seq: this.getSeq()
			})
			this.data.userData[this.data.currentBoard][this.properties.user].push(line);
			this.data.data[this.data.currentBoard].push(line);
			this.data.sendData.push({
				"action": 1,
				"color": tools.formatColor(this.data.color),
				"scale": 100,
				"thin": this.data.thin,
				"time": parseInt(+ new Date() / 1000),
				"seq": line.seq,
				"x": this.data.horizontal
					? x
					: y,
				"y": this.data.horizontal
					? y
					: x
			});
		},
		move: function(e) {
			if (!this.properties.canDraw) {
				return;
			}
			let {x, y} = this.getEventLocation(e);
			let length = this.data.userData[this.data.currentBoard][this.properties.user].length;
			let line = this.data.userData[this.data.currentBoard][this.properties.user][length - 1];
			let lastPoint = line.lines[line.lines.length - 1];

			this.data.ctx.beginPath();
			this.data.ctx.moveTo(lastPoint.x / 10000 * this.data.width, lastPoint.y / 10000 * this.data.height);
			this.data.ctx.lineTo(x / 10000 * this.data.width, y / 10000 * this.data.height);
			this.data.ctx.setStrokeStyle(this.data.color);
			let thin = this.data.horizontal
				? this.data.thin / 10000 * this.data.height
				: this.data.thin / 10000 * this.data.width;
			this.data.ctx.setLineWidth(thin);
			this.data.ctx.setLineCap('round');
			this.data.ctx.stroke();

			this.data.ctx.draw(true);

			line.setBorder(x, y);
			let seq = this.getSeq();
			line.lines.push({x: x, y: y, seq: seq});
			this.data.sendData.push({
				"action": 2,
				"seq": seq,
				"x": this.data.horizontal
					? x
					: y,
				"y": this.data.horizontal
					? y
					: x
			});
		},
		end: function(e) {
			if (!this.properties.canDraw) {
				return;
			}
			let {x, y} = this.getEventLocation(e);
			let length = this.data.userData[this.data.currentBoard][this.properties.user].length;
			let line = this.data.userData[this.data.currentBoard][this.properties.user][length - 1];
			line.setBorder(x, y);
			let seq = this.getSeq();
			line.lines.push({x: x, y: y, seq: seq});
			this.data.sendData.push({
				"action": 3,
				"seq": seq,
				"x": this.data.horizontal
					? x
					: y,
				"y": this.data.horizontal
					? y
					: x
			});
		},
		clear: function() {
			this.data.data[this.data.currentBoard] = [];
			this.data.userData[this.data.currentBoard] = {};
			this.data.userData[this.data.currentBoard][this.properties.user] = [];
			let temp = Object.assign({}, this.data.backgroundPic);
			temp[this.data.currentBoard] = {
				url: '',
				user: '',
				show: true
			};
			this.setData({backgroundPic: temp});
			this.data.color = tools.dealColor(4278190335);
			this.data.thin = 100;
			this.needDraw = true;
		},
		init: function() {
			// 修改color
			this.data.color = tools.dealColor(this.data.color);
			this.data.data[this.data.currentBoard] = [];
			this.data.userData[this.data.currentBoard] = {};
			this.data.userData[this.data.currentBoard][this.properties.user] = [];
			let temp = Object.assign({}, this.data.backgroundPic);
			temp[this.data.currentBoard] = {
				url: '',
				user: '',
				show: true
			};
			this.setData({backgroundPic: temp})
			this.data.ctx = wx.createCanvasContext('sketchpad', this);
			// 计时器
			this.data.drawInterval = setInterval(() => {
				console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
				if (this.data.needDraw) {
					this.draw();
					this.data.needDraw = false;
				}
			}, 50);

			this.data.sendInterval = setInterval(() => {
				if (this.data.sendData.length > 0) {
					this.triggerEvent('send', this.data.sendData, {});
					this.setData({sendData: []});
				}
			}, 200);

		},
		getSeq: function() {
			let time = parseInt(+ new Date() / 1000, 10);
			return time * Math.pow(2, 15) + (this.data.seq++);
		}
	}
})
