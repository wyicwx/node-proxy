(function() {
	function RealTimeList() {
		this.data = {};
		this.dom = {};
		this.rule = {};
		// id of list's item be checked, default and none is null;
		this.currentSelected = null;
		this._init();
	}
	
	RealTimeList.prototype = {
		constructor: RealTimeList,
		_init: function() {
			var self = this;

			this.socket = io.connect('http://localhost:8082');
			this.socket.on('connect', function(socket) {
				self.socket.on('init_list',function(data) {
					self.rule = data;
				});
				self._captureDom();
				self._eventInit();
			});
			
		},
		_captureDom: function() {
			this.dom['list'] = $('#list');
			this.dom['tips'] = $('.tooltip');
		},
		_eventInit: function() {
			if(this._eventinited) return;

			var eventListeners = this._event.socket_listener(this);
			for(var i in eventListeners) {
				this.socket.on(i, eventListeners[i]);
			};

			eventListeners = this._event.dom_live_click(this);
			for(var i in eventListeners) {
				$(document).on('click', i, eventListeners[i]);
			};

			this._eventinited = true;
		},
		_event: {
			socket_listener: function(self) {
				return {
					// callback function of http request send status
					'realtime_send': function(datas) {
						// flag to http status
						datas['data']['http_status'] = 'sending';
						// receive data form socket server and store to this.data (index by data.id)
						self.data[datas['id']] = datas['data'];
						// creat dom element
						self.updateItem(datas['id']);
					},
					// http request be replaced by local file
					'realtime_replaced': function(datas) {
						var data = self.data[datas['id']];
						// flag to replaced
						data['http_status'] = 'replaced';
						self.updateItem(datas['id']);
					},
					// http request pend status
					'realtime_pend': function(datas) {
						var data = self.data[datas['id']];
						// flag to pend
						data['http_status'] = 'pending';
						self.updateItem(datas['id']);
					},
					// 
					'realtime_error': function(datas) {
						var data = self.data[datas['id']];
						// flag to error
						data['http_status'] = 'error';
						self.updateItem(datas['id'], datas['statusCode']);
					},
					// http request final status
					'realtime_final': function(datas) {
						var data = self.data[datas['id']];
						// flag to final
						data['http_status'] = 'final';
						self.updateItem(datas['id'], datas['statusCode']);
					}
				};
			},
			dom_live_click: function(self) {
				return {
					'#list li': function(event) {
						var _this = $(this);
						$('#side').removeClass('selected');
						if(_this.hasClass('checked')) {
							_this.removeClass('checked');
							self.currentSelected = _this.attr('lid');
							self.dom['tips'].hide();
						} else {	
							$('.checked').removeClass('checked');
							_this.addClass('checked');
							setTimeout(function() {							
								$('#side').addClass('selected');
							}, 200);
							// self.dom['tips'].show().css('top', event.currentTarget.offsetTop + event.currentTarget.clientHeight);
							self.currentSelected = null;
						}
					}
				};
			}
		},
		// update dom element by this.data['id]'
		updateItem: function(id, /* enable by error&final status */ statusCode) {
			/* data:
				{
					host: "www.renren.com"
					hostname: "www.renren.com"
					href: "http://www.renren.com/744125085"
					http_status: "sending"
					path: "/744125085"
					pathname: "/744125085"
					protocol: "http:"
					slashes: true
				}
			 */
			var data = this.data[id];
			if(data.dom) {
				var dom = data.dom;
				//update data.dom
				switch(data['http_status']) {
					case 'pending':
						dom.find('.status').html('pengding');
					break;

					case 'replaced':
						dom.addClass('success');	
						dom.find('.status').html('replaced');
					break;

					case 'final':
						dom.find('.status').html(statusCode);
					break;

					case 'error':
						dom.addClass('.error');
						dom.find('.status').html(statusCode);
					break;
				}
			} else {
				var dom = $('<li lid='+id+'>'),
					span;
				
				span = $('<span class="url">');
				span.html(data.href);
				dom.append(span);

				span = $('<span class="separation">|</span>');
				dom.append(span);

				span = $('<span class="status">');
				span.html('sending');
				dom.append(span);

				this.dom['list'].append(dom);
				//store dom element to data.dom
				data.dom = dom;
			}
		}
	}

	new RealTimeList();
})(window);