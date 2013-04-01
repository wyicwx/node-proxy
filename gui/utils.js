(function(window, toolkit) {
	var utils = toolkit.utils = {};

	utils.escapeHTML = function (str) {                                          
        return(                                                                    
            str.replace(/&/g,'&').                                            
                replace(/>/g,'>').                                              
                replace(/</g,'<').                                              
                replace(/'/g,"'")                                            
        );                                                                        
    };  

	/**
	 * 事件管理器，可以继承，listen注册方法，trigger触发方法
	 * @name Base.EventEmitter
	 * @constructor
	 */
	utils.EventEmitter = function() {
		this.stack = {};
	};

	utils.EventEmitter.prototype = {
		/**
		 * 注册事件
		 * @param  {String} key       事件名
		 * @param  {Function} fnProcess 事件处理函数
		 * @return {Object}           链式
		 */
		listen: function(key, fnProcess) {
			var ret;

			ret = this.stack[key];
			if (!ret) {
				ret = this.stack[key] = [];
			}
			ret.push(fnProcess);
			return this;
		},
		on: function() {
			this.listen.apply(this, Array.prototype.slice.call(arguments, 0));
		},
		/**
		 * 触发器
		 * @param  {String} key 事件名称
		 * @return {Object}     链式
		 */
		trigger: function(key) {
			var args = Array.prototype.slice.call(arguments, 1),
				ret;

			ret = this.stack[key];
			if (ret) {
				for(var i in ret) {
					ret[i].apply(null, args);
				};
			};

			return this;
		},
		/**
		 * 删除监听事件，没有传入监听事件就删除整个监听事件
		 * @param  {String} key       监听事件名称
		 * @param  {Function} fnProcess 监听事件
		 */
		remove: function(key, fnProcess) {
			var Self = this;
			if(Self.stack[key]) {
				if(fnProcess) {
					utils.each(Self.stack[key], function(a, b) {
						if(a == fnProcess) {
							Self.stack[key].splice(b, 1);
							return utils.each.BREAK;
						}
					})
				} else {
					delete Self.stack[key];
				}
			}
		}
	};


	/**
	 * 科里化
	 * @param  {Function} fn fn
	 * @return {Function}      
	 */
	utils.currying = function(fn) {
		var currying = arguments.callee;
		return function() {
			var args = Array.prototype.slice.call(arguments, 0);
			if(args.length >= fn.length) {
				return fn.apply(this, args);
			} else {
				return function() {
					var _args = args.concat(Array.prototype.slice.call(arguments, 0));
					return currying(fn).apply(this, _args);
				};
			}
		}
	};

	/**
	 * empty function
	 * @return {[type]} [description]
	 */
	utils.emFn = function() {};

})(window, window.toolkit || (window.toolkit = {}));