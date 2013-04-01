(function(window, toolkit) {
	toolkit.module = {};
})(window, window.toolkit);

// Rule
(function(window, toolkit) {
	function Rule() {
		this._rule;
		this._eventEmitter = new toolkit.utils.EventEmitter();
		this._init();
	};

	Rule.prototype = {
		_init: function() {
			var self = this;
			toolkit.socket.on('get_list', function(data) {
				self._rule = data;
				self._eventEmitter.trigger('getRule', data);
			})
			toolkit.socket.emit('get_list');
			toolkit.socket.on('list_save_feedback', function(data) {
				self._rule = data;
				self._eventEmitter.trigger('ruleChange', data);
			});
		},
		getRule: function(fn) {
			if(this._rule) {
				fn(this._rule);
			} else {
				this._eventEmitter.listen('getRule', function(data) {
					fn(data);
				});
			}
		},
		setRule: function(match, respond, enabled) {
			if(enabled != false) {
				enabled = true;
			}
			if(match in this._rule) {
				if(respond != '') {
					this._rule[match].respond = respond;
				}
				this._rule[match].enabled = enabled;
			} else {
				this._rule[match] = {
					enabled: enabled,
					respond: respond,
					match: match
				}
			}
			this._sendRule();
			// notify all when rule changed 
			// this._eventEmitter.trigger('ruleChange', this._rule);
		},
		getRespondByMatch: function(match) {
			return this._rule[match];
		},
		// handle rule change
		onRuleChange: function(fn) {
			this._eventEmitter.listen('ruleChange', fn);
		},
		deleteRule: function(match) {
			if(match in this._rule) {
				delete this._rule[match];
				this._sendRule();
			}
		},
		_sendRule: function() {
			var rule = {};
			for(var i in this._rule) {
				rule[i] = {
					enabled: this._rule[i].enabled,
					respond: this._rule[i].respond
				}
			}
			toolkit.socket.emit('list', rule);
		}
	};

	toolkit.module.rule = new Rule();
})(window, window.toolkit);

// HttpList
(function(window, toolkit) {
	function HttpList() {
		this._page;
		this._item = {};
		this._sideBar;
		this._currentSelected = null;
		this._init();
	};

	HttpList.prototype = {
		_init: function() {
			var self = this;
			// set navigation item to httplist
			this._page = toolkit.page.navigation.register('httpList', '实时http列表');
			// init page html content
			this._page.html('loading...');
			// to register socket event of http's list
			this._initSocketEvent();
			// register to sidebar
			// this._initSideBar();	//todo 
			// bind event to dom
			this._initEvent();

			toolkit.page.navigation.onSelect(function() {
				self._currentSelected = null;
			})
		},
		_initSocketEvent: function() {
			var events = this._socketEvents();

			for(var i in events) {
				toolkit.socket.on(i, events[i]);
			}
		},
		_initEvent: function() {
			var events = this._events();

			for(var i in events) {
				$(this._page).on('click', '#list '+i, events[i]);
			}
		},
		_initSideBar: function() {
			var self = this,
				html = '<div>test</div>';
			this._sideBar = toolkit.page.sideBar.register('httpList', html, function(DOM) {
				self._updateSideBar();
			});
		},
		_updateSideBar: function() {
			var id = this._currentSelected,
				data = this._item[id];
		},
		_socketEvents: function() {
			var self = this;
			return {
				'connect': function() {
					self._page.html('<ul id="list"></ul>');
					self._page._ul = self._page.find('ul');
				},
				'disconnect': function() {
					self._page.html('服务器连接失败，http列表不可用.');
				},
				/**
				 * datas
				 * {
				 * 		id: 1,
				 * 		data: {}
				 * }
				 */
				'realtime_send': function(datas) {
					var item = self._item[datas['id']] = {};
					// flag to http status
					item['status'] = 'sending';
					// receive data form socket server and store to this.data (index by data.id)
					item['data'] = datas['data'];
					self._updateItem(datas['id']);
				},
				'realtime_pend': function(datas) {
					var item = self._item[datas['id']];

					item['status'] = 'pending';
					self._updateItem(datas['id']);
				},
				'realtime_replaced': function(datas) {
					var item = self._item[datas['id']];
					// flag to pend
					item.data['match'] = datas['match'];
					item['status'] = 'replaced';
					self._updateItem(datas['id']);
				},
				'realtime_error': function(datas) {
					var item = self._item[datas['id']];
					// flag to error
					item['status'] = 'error';
					item['statusCode'] = datas['statusCode'];
					self._updateItem(datas['id']);
				},
				'realtime_final': function(datas) {
					var item = self._item[datas['id']];
					// flag to final
					item['status'] = 'final';
					item['statusCode'] = datas['statusCode'];
					self._updateItem(datas['id']);
				}
			}
		},
		_events: function() {
			var self = this;
			return {
				'li': function() {
					var id = $(this).attr('lid');
					self._select(id);
				}
			}
		},
		// update dom element by this._['id]'
		_updateItem: function(id) {
			/* {
					status: seding,
					data:
					{
						host: "www.renren.com"
						hostname: "www.renren.com"
						href: "http://www.renren.com/744125085"
						http_status: "sending"
						path: "/744125085"
						pathname: "/744125085"
						protocol: "http:"
						slashes: true
					},
					statusCode: 404,
					dom: Element
				}
			 */
			var item = this._item[id];
			if(item.dom) {
				var dom = item.dom;
				//update data.dom
				switch(item['status']) {
					case 'pending':
						dom.find('.status').html('pending');
					break;
					case 'final':
						dom.find('.status').html(item.statusCode);
					break;

					case 'replaced':
					// debugger;
						dom.addClass('success');	
						dom.find('.status').html('replaced');
					break;

					case 'error':
						dom.addClass('.error');
						dom.find('.status').html(item.statusCode);
					break;
				};

				this._updateSideBar();1
			} else {
				var dom = $('<li lid='+id+'>'),
					data = item.data,
					span;
				
				span = $('<span class="url">');
				span.html(data.href);
				dom.append(span);

				span = $('<span class="separation">|</span>');
				dom.append(span);

				span = $('<span class="status">');
				span.html('sending');
				dom.append(span);

				this._page._ul.append(dom);
				//store dom element to data.dom
				item.dom = dom;
			}
		},
		_select: function(id) {
			var match = this._item[id].data.match;
			if(match) {
				var respond = toolkit.module['rule'].getRespondByMatch(match) || '';
				toolkit.module['autoResponder'].createRuleDialog(match, respond['respond']);
			} else {
				toolkit.module['autoResponder'].createRuleDialog(this._item[id].data.href);
			}
			// blow todo 

			// if(this._currentSelected == id) {
			// 	this._currentSelected = null;
			// 	// toolkit.page.sideBar.hide('httpList'); todo
			// } else {
			// 	this._currentSelected = id;
			// 	// toolkit.page.sideBar.show('httpList'); todo

			// }
		}

	};

	toolkit.module['httpList'] = new HttpList();
})(window, window.toolkit);

// AutoResponder
(function(window, toolkit) {
	function AutoResponder() {
		this._page;
		this._init();
	};

	AutoResponder.prototype = {
		_init: function() {
			var self = this;
			this._page = toolkit.page.navigation.register('autoResponder', 'AutoResponder');
			this._page.html(this._html);
			this._page._ul = this._page.find('ul');
			toolkit.module.rule.getRule(function(data) {
				self._renderUL(data);
			});
			this._bindEvent();
			toolkit.module.rule.onRuleChange(function(data) {
				self._renderUL(data);
			});
		},
		_html: '\
			<div class="ui-responder-list">\
				<a href="javascript:void(0);" class="create j-rule-create">create</a>\
				<ul>\
				</ul>\
			</div>\
		',
		_li: function(data) {
			var template = '<li '+(data.enabled ? "" : "class='disable'")+'>\
				<div>\
					match    ：<a href="javascript:void(0)">'+data.match+'</a>\
					<label class="j-rule-check checkbox '+(data.enabled ? 'enable' : '')+'"><input type="checkbox" '+(data.enabled ? 'checked="checked"' : '')+'><span class="enable">已启用</span><span class="disable">启用</span></label>\
					<button class="ui-trash j-rule-delete" title="删除这条规则"><span class="lid">11</span><span class="can"></span></button>\
				</div>\
				<div>\
					respond：<div class="respond"><span>'+data.respond+'</span><input value="'+data.respond+'"></div>\
				</div>\
			</li>';

			return template;
		},
		_renderUL: function(data) {
			this._page._ul.empty();
			for(var i in data) {
				data[i]['match'] = i;
				var tmp = $(this._li(data[i]));
				tmp.attr('match', i);
				this._page._ul.append(tmp);
			}
		},
		_bindEvent: function() {
			var events = this._events();
			for(var i in events) {
				for(var j in events[i]) {
					$(this._page).on(i, j,events[i][j]);
				}
			}
		},
		_events: function() {
			var self = this;
			return {
				'click': {
					'.j-rule-delete': function(event) {
						self._deleteRule(event);
					},
					'.j-rule-create': function(event) {
						self._showCreateDialog();
					}
				},
				'change': {
					'.respond input': function(event) {
						self._editRule(event);
					},
					'.j-rule-check': function(event) {
						self._toggleRule(event);
					}
				},
				'keydown': {
					'.respond input': function(event) {
						if(event.keyCode == 13) {
							$(this).trigger('blur');
						}
					}
				}
			};
		},
		_getInfo: function(el) {
			var parent = $(el).parent();
			var match = parent.attr('match');
			
			while(match == undefined) {
				parent = parent.parent();
				match = parent.attr('match');
				if(parent[0] == document.body) {
					return false;
				}
			};
			return {
				target: $(el),
				match: match,
				root: parent
			};
		},
		_editRule: function(event) {
			var info = this._getInfo(event.target);
			if(!info) return false;
			var value = info.target.val();
			if(value != '') {
				info.root.find('.respond span').html(value);
				toolkit.module.rule.setRule(info.match, value);
			}
		},
		_deleteRule: function(event) {
			var sure = confirm('确定删除？');
			if(sure) {
				var info  = this._getInfo(event.target);
				info.root.remove();
				toolkit.module.rule.deleteRule(info.match);
			}
		},
		_toggleRule: function(event) {
			var info = this._getInfo(event.target);
			var checked = info.target[0].checked;
			if(checked) {
				info.target.parent().addClass('enable');
				info.target.parent().parent().parent().removeClass('disable');
			} else {
				info.target.parent().removeClass('enable');
				info.target.parent().parent().parent().addClass('disable');
			}
			toolkit.module.rule.setRule(info.match, '', checked);
		},
		_showCreateDialog: function(match, respond) {
			var dialog = toolkit.page.dialog,	
				page = dialog.show('autoResponder-create');
			if(!page) {
				page = dialog.register('autoResponder-create', '<h1 class="p10 f16">create rule</h1>\
														<div class="pl10 pr10 txtr"><label>match：</label><input class="j-autoresponder-create-match" type="text" style="width: 260px;"/></div>\
														<div class="pl10 pr10 txtr"><label>respond：</label><input class="j-autoresponder-create-respond" type="text" style="width: 260px;"/></div>\
														<div class="p10 txtr"><button class="ml10 pl10 pr10 j-autoresponder-create-cancel">cancel</button><button class="ml10 pl10 pr10 j-autoresponder-create-ok">ok</button></div>');
				page.find('.j-autoresponder-create-cancel').click(function() {
					dialog.hide('autoResponder-create');
				});
				page.find('.j-autoresponder-create-ok').click(function() {
					var match = page.find('.j-autoresponder-create-match').val(),
						respond = page.find('.j-autoresponder-create-respond').val();

					if(match && respond) {
						toolkit.module.rule.setRule(match, respond);
						dialog.hide('autoResponder-create');
					}
				});
				dialog.show('autoResponder-create');
			}
			page.find('.j-autoresponder-create-match').val(match || '');
			page.find('.j-autoresponder-create-respond').val(respond || '');
		},
		createRuleDialog: function(match, respond) {
			this._showCreateDialog(match, respond);
		}
	};

	toolkit.module['autoResponder'] = new AutoResponder();
})(window, window.toolkit);

// other 
(function(window, toolkit) {
	function Other() {
		this.page;
		this._init();
	}

	Other.prototype = {
		_init: function() {
			var self = this,
				initData;
			this._page = toolkit.page.navigation.register('other', '其他');
			toolkit.socket.on('get_config', function(data) {
				initData = data;
				toolkit.config = data;
				self._page.html(self._html(initData));
				self._bindEvent();
			});
			toolkit.socket.emit('get_config');
		},
		_html: function(data) {
			return '\
				<section>\
					<h3>AutoResponder</h3>\
					<label><input class="j-other-input" lid="slowLoad" type="checkbox" '+(data.slowLoad ? "checked" : "")+'>慢速模拟</label>\
					<label><input class="j-other-input" lid="focusRefresh" type="checkbox" '+(data.focusRefresh ? "checked" : "")+'>无缓存</label>\
					<div class="j-other-slowLoad-setting" '+(data.slowLoad ? "" : "style='display:none;'")+'">\
						<label>间隔发送字节：<input class="j-other-slowLoad-byte" type="text" data="'+data.slowBlockByte+'" value="'+data.slowBlockByte+'" style="height: 20px;min-height: 0px;padding: 4px;width: 80px;"/>字节</label>&nbsp;&nbsp;\
						<label>时间间隔：<input class="j-other-slowLoad-interval" type="text" data="'+data.slowTimeInterval+'" value="'+data.slowTimeInterval+'" style="height: 20px;min-height: 0px;padding: 4px;width: 80px;"/>毫秒</label>\
					</div>\
				</section>\
			'
		},
		_bindEvent: function() {
			var events = this._events();
			for(var i in events) {
				for(var j in events[i]) {
					$(this._page).on(i, j,events[i][j]);
				}
			}
		},
		_events: function() {
			var self = this;
			return {
				'change': {
					'.j-other-input': function(event) {
						var target = event.target,
							id = target.getAttribute('lid'),
							checked = target.checked,
							data = {};

						data[id] = checked;
						if(id == 'slowLoad') {
							if(checked) {
								$('.j-other-slowLoad-setting').show();
							} else {
								$('.j-other-slowLoad-setting').hide();
							}
						}
						toolkit.socket.emit('config', data);
					}
				},
				'blur': {
					'.j-other-slowLoad-byte': function(event) {
						var target = event.target,
							originValue = target.getAttribute('data'),
							value = target.value;

						if(originValue == value) return false;
						value = parseInt(value);
						if(!value) {
							target.value = originValue;
						} else {
							target.setAttribute('data', value);
							target.value = value;
							toolkit.socket.emit('config', {'slowBlockByte': value});
						}
					},
					'.j-other-slowLoad-interval': function(event) {
						var target = event.target,
							originValue = target.getAttribute('data'),
							value = target.value;

						if(originValue == value) return false;
						value = parseInt(value);
						if(!value) {
							target.value = originValue;
						} else {
							target.setAttribute('data', value);
							target.value = value;
							toolkit.socket.emit('config', {'slowTimeInterval': value});
						}
					}
				}
			}
		}
	}

	toolkit.module.other = new Other();
})(window, window.toolkit);

// // test
// (function(window, toolkit) {
// 	toolkit.page.dialog.register('test', 'test');
// 	toolkit.page.dialog.show('test');
// })(window, window.toolkit);