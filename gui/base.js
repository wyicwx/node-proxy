// page
(function(window, toolkit) {
	var page = toolkit.page = {
		_parent: toolkit
	};

	page.container = {};
	// 
	function Navigation() {
		this._selected;
		this._parent = page;
		this._DOMs = page.container;
		// store the callback, trigger when label selected
		this._eventEmitter = new toolkit.utils.EventEmitter();
		this._init();
	};
	Navigation.prototype = {
		_init: function() {
			this._bindEvent();
		},
		register: function(name, showName, noTitle) {
			if(this._DOMs[name]) {
				return false;
			}
			var DOM = {};

			DOM['navigation'] = $("<li id='"+name+"'><button>"+showName+"</button></li>");
			if(!noTitle) {
				DOM['page'] = $('<div><header class="ui-page-header"><h1>'+showName+'</h1></header><div class="page"></div></div>');
			} else {
				DOM['page'] = $('<div></div>');
			}
			$('.j-menu').append(DOM['navigation']);
			$('.j-container').append(DOM['page']);

			this._DOMs[name] = DOM;
			if(!this._selected) {
				this._selected = name;
				DOM['navigation'].addClass('selected');
				DOM['page'].addClass('selected');
			};
			if(!noTitle) {
				return DOM['page'].find('.page');
			} else {
				return DOM['page'];
			}
		},
		select: function(select, callback) {
			if(select == this._selected || !(select in this._DOMs)) {
				callback && callback(false);
				return false;
			}
			var DOM = this._DOMs[this._selected],	
				selectedDOM = this._DOMs[select];

			DOM['navigation'].removeClass('selected');
			DOM['page'].removeClass('selected');
			// setTimeout(function() {
			// 	DOM['page'].attr('hidden', 'hidden');
			// }, 200);

			// selectedDOM['page'].attr('hidden', '');
			selectedDOM['page'].removeProp('hidden');
			selectedDOM['navigation'].addClass('selected');
			selectedDOM['page'].addClass('selected');

			this._selected = select;
			this._eventEmitter.trigger('selected', select);
			callback && callback(true);
			
			window.scrollTo(0,0);
			return true;
		},
		onSelect: function(callback) {
			this._eventEmitter.on('selected', callback);
			return true;
		},
		_bindEvent: function() {
			var self = this;
			$(document).on('click', '.j-menu>li', function() {
				self.select($(this).attr('id'));
			});
		}
	};

	page.navigation = new Navigation();

	function SideBar() {
		this._current = null;
		this._originDOM;
		this._DOM = {};
		this._map = {};
		this._init();
	};

	SideBar.prototype = {
		_init: function() {
			this._captureDOM();
			this._bindEvent();
		},
		_captureDOM: function() {
			this._originDOM = $('.sideBar');
		},
		register: function(name, html, callback) {
			var DOM = this._originDOM.clone();

			DOM.html(html);
			DOM.attr('id', 'side-'+name);
			this._DOM[name] = DOM;
			// store the curried callback function
			this._map[name] = toolkit.utils.currying(callback || toolkit.utils.emFn, DOM);
			$(document.body).append(DOM);
			return DOM;
		},
		reset: function() {
			this._destory();
		},
		_destory: function() {
			for(var i in this._DOM) {
				this._DOM[i].remove();
			};
			this._DOM = {};
			this._map = {};
			return true;
		},
		_bindEvent: function() {
			var self = this;
			page.navigation.onSelect(function() {
				self.hide();
			});
		},
		show: function(name) {
			if(name == this._current || !this._map[name]) {
				return false;
			}
			var args = Array.prototype.slice.call(arguments, 1);
			this._toggle(name);
			this._map[name](args);
			return true;
		},
		_toggle: function(name) {
			var self = this;
			this._DOM[this._current] && this._DOM[this._current].removeClass('selected');
			setTimeout(function() {
				self._DOM[name] && self._DOM[name].addClass('selected');
			}, 200);
			this._current = name || null;
		},
		toggle: function(name) {
			if(name == this._current) {
				this.hide();
			} else {
				this.show(name);
			}
		},
		hide: function() {
			if(this._current) {
				this._toggle();
			}
		}
	};

	page.sideBar = new SideBar();

	function Dialog() {
		this._currentShow;
		this._DOMs = {};
		this._bg;
		this._originDOMHtml = '<div class="ui-dialog"></div>';
	}

	Dialog.prototype = {
		_createDialogBg: function() {
			if(!this._bg) {
				this._bg = $('<div class="ui-dialog-bg"></div>');
				$(document.body).append(this._bg);
			}
			return true;
		},
		show: function(name) {
			if(!(name in this._DOMs)) {
				return false;
			} else {
				if(this._currentShow == name) return true;
				if(this._currentShow) {
					this._DOMs[this._currentShow].hide();
				}
				this._DOMs[name].show();
				this._bg.show();
				return this._DOMs[name];
			}
		},
		hide: function(name) {
			if(name) {
				if(name in this._DOMs) {
					this._DOMs[name].hide();
					this._bg.hide();
					return true;
				} else {
					return false;
				}
			} else if(this._currentShow) {
					this._DOMs[this._currentShow].hide();
					this._bg.hide();
			} else {
				return false;
			}

		},
		register: function(name, html) {
			if(!this._DOMs[name]) {
				if(!this._bg) {
					this._createDialogBg();
				};
				this._DOMs[name] = $(this._originDOMHtml);
				$(this._bg).append(this._DOMs[name]);
			};
			this._DOMs[name].html(html);
			return this._DOMs[name];
		}
	}

	page.dialog = new Dialog();

})(window, window.toolkit || (window.toolkit = {}));

// socket module
(function(window, toolkit) {
	function Socket() {
		this._status = 'disconnected';
		this._socket;
		this._eventsFlag = {};
		this._eventEmitter = new toolkit.utils.EventEmitter();
		this._init();
	};

	Socket.prototype = {
		_init: function() {
			var self = this;
			if(window.io) {
				this._socket = io.connect('http://localhost:'+toolkit.config.port);
				this.on('connect', function() {
					self._status = 'connected';
				});
				this.on('disconnect', function() {
					self._status = 'disconnected';
				});
			} else {
				setTimeout(function() {
					self._eventEmitter.trigger('disconnect');
				}, 0);
			}
		},
		on: function(key, callback) {
			var self = this;
			this._eventEmitter.listen(key, callback);
			if(!(key in this._eventsFlag)) {
				this._eventsFlag[key] = true;
				self._socketOn(key);
			};
		},
		emit: function(key, data) {
			this._socket.emit(key, data);
			return true;
		},
		_socketOn: function(key) {
			var self = this;
			if(this._socket) {
				this._socket.on(key, function(data) {
					self._eventEmitter.trigger(key, data);
				});
			} else {
				this._eventEmitter.trigger('disconnect');
			}
		},
		isRuning: function() {
			return this._status == 'connected';
		},
		getStatus: function() {
			return this._status;
		}
		// reset: function() {
		// 	this._events = {};
		// }
	};

	toolkit.socket = new Socket();
})(window, window.toolkit);

// rule
(function(window, toolkit) {
	
})(window, window.toolkit);