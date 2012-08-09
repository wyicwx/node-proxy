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


function reply(request, response) {
	var options = url.parse(request.url),
		wgetObj;

    options.method = request.method;
    options.headers = request.headers;
    options.port = 80;

	wgetObj = http.request(options, function(res) {
		response.writeHead(res.statusCode, res.headers);
		res.on('data', function(chunk) {
			if(config.slowLoad) {
				setTimeout(function() {
					response.write(chunk, 'binary');
				}, config.slowTime);
			} else {
				response.write(chunk, 'binary');
			}
			
		});
		res.on('end', function() {
			if(config.slowLoad) {
				setTimeout(function() {
					response.end();
				}, config.slowTime);
			} else {
				response.end();
			}
			
		});
	})

	wgetObj.on('error', function (e) {
      console.log(e);
    });
    wgetObj.end();
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
