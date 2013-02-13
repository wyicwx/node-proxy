#这是一个简易的代理工具
可以实现:

1、替换通过代理的请求所返回的数据或文件

2、模拟慢速加载

3、强制浏览器不使用缓存


#####依赖：
[mime](https://github.com/broofa/node-mime)

#####配置：
config = {<br>
　　'port': 8082,<br>
　　'focusRefresh': true,<br>
　　'slowLoad': true,<br>
　　'slowBlockByte': 1*1024,<br>
　　'slowTimeInterval': 100<br>
}

port 代理端口

focusRefresh 强制刷新开关

slowLoad 慢速模式开关

slowBlockByte 发送字节数

slowTimeInterval 发送间隔
