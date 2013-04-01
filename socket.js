var io = require('socket.io'),
	fs = require('fs'),
	config = global.nodeProxy.config,
	utils = require('./utils.js'),
	socket;

function Socket(server) {
	this._socket = io.listen(server);
	this.sockets = this._socket.sockets;
	this._init();
}

Socket.prototype._init = function() {
	this.sockets.on('connection', function (socket) {
		// socket.emit('init_config', config);
		// socket.emit('init_list', global.nodeProxy.list);
	});
	// this.sockets.on('', function(socket) {
	// 	socket
	// });
	// this.sockets.on('get_list', function(socket) {
	// 	socket.emit('get_list', global.nodeProxy.list);
	// });
	
	//bing eventlistener;
	this._bindEvent();
}

Socket.prototype._bindEvent = function() {
	var self = this;
	this.sockets.on('connection', function (socket) {
		for(var i in self._events) {
			socket.on(i, self._events[i](self));
		}
	});
}

Socket.prototype._events = {
	"get_config": function(self) {
		return function() {
			console.log(11111111111111111111111111);
			self.sockets.emit('get_config', config);
		}
	},
	"get_list": function(self) {
		return function() {
			self.sockets.emit('get_list', global.nodeProxy.list);
		}
	},
	"config" : function(self) {
		return function(data) {
			for(var i in data) {
				if(i in config) {
					config[i] = data[i];
				}
			};
			fs.writeFileSync('./config.js', 'module.exports = '+JSON.stringify(config, null, 4));
		}
	},
	"list" : function(self, socket) {
		return function(data) {
			global.nodeProxy.list = data;
			global.nodeProxy.replaceList = utils.dealList(data);
			fs.writeFileSync('./list.js', 'module.exports = '+JSON.stringify(data, null, 4));
			self.sockets.emit('list_save_feedback', global.nodeProxy.list);
		}
	}
}

module.exports = function(server) {
	if(!socket) {
		socket = new Socket(server);
	}
	return socket;
}