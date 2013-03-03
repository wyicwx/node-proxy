var http = require('http'),
    config = require('./config.js'),
    list = require('./list.js'),
    utils = require('./utils.js'),
    index = 0;

global.nodeProxy = {
    config : config,
    list : list,
    replaceList : utils.dealList(list)
};

var proxy = require('./proxy.js');

var server = http.createServer(function (request, response) {
    request.proxyIndex = index++;
    if(request.headers.host.search('127.0.0.1') != -1) {
        return response.end();
    }
    var result = proxy.getReplaceFile(request);     //请求是否在替换list内
    if(result) {
        proxy.replaceFile(result, response);
    } else {
        proxy.reply(request, response);    //发起http请求并返回给本机
    }
}).listen(config.port);

global.nodeProxy.socket = require('./socket.js')(server);
// global.nodeProxy.socket.set('log level', 1); 