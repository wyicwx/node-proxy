var http = require('http'),
	url = require('url'),
	util = require('util'),
    fs   = require('fs'),
    ruleList = require('./switch.rule'),
    iplist    = [],
    REG_FILE_TYPE = /\.(html|htm|css|js)$/,
    types = {
      css : 'text/css',
      js : 'text/javascript',
      htm : 'text/html',
      html : 'text/html'
    },
    config = require("./config.js");

function sendBuffer() {
	this.buffer;
	this.size;
	this._getChunkSize = 0;
}

sendBuffer.prototype.addChunk = function(chunk) {
	if(!this.buffer) {
		this.buffer = chunk;
	} else {
		var oldBuffer = this.buffer;
		this.buffer = new Buffer(oldBuffer.length + chunk.length);
		oldBuffer.copy(this.buffer);
		chunk.copy(this.buffer, oldBuffer.length);
	}
	this.size = this.buffer.length;
	return this;
}

sendBuffer.prototype.getChunk = function(byteSize) {
	// console.log("currentChunkSize:"+this._getChunkSize);
	// console.log("BufferSize:"+this.size);
	if(this._getChunkSize+byteSize >= this.size) {
		if(this._getChunkSize == this.size) {
			return false;
		}
		var buffer = this.buffer.slice(this._getChunkSize, this.size);
		this._getChunkSize = this.size;
		return buffer;
	}
	var buffer = this.buffer.slice(this._getChunkSize, this._getChunkSize+byteSize);
	this._getChunkSize = this._getChunkSize+byteSize;
	return buffer;
}



function reply(request, response) {
	var options = url.parse(request.url),
		wgetObj, dataBuffers, interval, buffer;

    options.method = request.method;
    options.headers = request.headers;
    if(options.method.toLowerCase == "get") {
		if(config.focusRefresh) {
			options.headers['If-Modified-Since'] = 'Thu, 16 Aug 1970 00:00:00 GMT';
			options.headers['Cache-Control'] = 'max-age=0';
	    }
	}
    options.port = 80;

	wgetObj = http.request(options, function(res) {

		response.writeHead(res.statusCode, res.headers);

		res.on('data', function(chunk) {
			if(config.slowLoad) {
				
				if(!dataBuffers) {
					dataBuffers = new sendBuffer();
				}
				dataBuffers.addChunk(chunk);

			} else {
				response.write(chunk, 'binary');
			}
		});
		res.on('end', function() {

			if(config.slowLoad) {
				
				interval = setInterval(function() {
					if(!dataBuffers) {
						response.end();
						return false;
					}
					var chunk = dataBuffers.getChunk(config.slowBlockByte);
					if(!chunk) {
						clearInterval(interval);
						response.end();
						return;
					}
					response.write(chunk);
				}, config.slowTimeInterval);

				// setTimeout(function() {
				// 	response.end();
				// }, 2000);
			} else {
				response.end();
			}
			
		});

	});

	request.on('data', function(data) {
		if(buffer) {
			buffer += data;
		} else {
			buffer = data;
		}
	});

	request.on('end',function(data) {
		wgetObj.write(buffer||'');
		wgetObj.end();
	})
	
	wgetObj.on('error', function (e) {
      console.log(e);
      return;
    });

    
}

function getResponse(response) {
	var headers = {
	      'Cache-Control' : 'max-age=0, must-revalidate',
	      'Content-Type' : 'text/plain'
	    };
	return headers;
}


http.createServer(function (request, response) {
	var path, requestType, headers;

	path = url.parse(request.url).path.split("?")[0];
	requestType = path.match(REG_FILE_TYPE);
	if(!requestType) {		//只替换静态文件
		reply(request, response);
	} else {
		for(var i in ruleList) {
			if(path.match(i)) {
				
				headers = getResponse();
				var t = ruleList[i].split('.');
				t = t[t.length-1];
				headers['Content-Type'] = types[t];

				response.writeHead(200, headers);
				try {
    				var fileSteam = fs.readFileSync(ruleList[i]);
    			} catch(e) {
    				console.log(e);
    				return;
    			}
 				console.log("SUCCESS: replace "+i);
    			response.write(fileSteam);
    			response.end();
    			return;
			}
		}
		reply(request, response);
    }

}).listen(8080);


if(config.slowLoad) {
	console.log("slow mode");
}
if(config.focusRefresh) {
	console.log("focusRefresh");
}
