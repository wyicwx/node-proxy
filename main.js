var express = require('express'),
    http = require('http'),
    fs = require('fs'),
    config = require('./config.js'),
    list = require('./list.js'),
    utils = require('./utils.js'),
    app = express(),
    server = require('http').Server(app),
    index = 0;

global.nodeProxy = {
    config : config,
    list : list,
    replaceList : utils.dealList(list)
};

var proxy = require('./proxy.js');

app.use(express.static(__dirname + '/gui'));
app.get('/gui', function(request, response, next) {
    var page = fs.readFileSync(__dirname + "/gui/page.html");
    return response.end(page);
});

app.all('*', function(request, response) {
    request.proxyIndex = index++;
    if(request.headers.host.search('127.0.0.1') != -1) {
        console.log(request);
        return response.end();
    }
    var result = proxy.getReplaceFile(request, response);     //请求是否在替换list内
    if(result) {
        proxy.replaceFile(request, response, result);
    } else {
        proxy.reply(request, response);    //发起http请求并返回给本机
    }
});

global.nodeProxy.socket = require('./socket.js')(server, false);

server.listen(config.port);