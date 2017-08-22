这篇文章主要是记录在学习nodejs爬虫时学到的知识。


### 一、superagent ###

superagent是一款极好用的轻量级的更为优化的ajax API同时是nodejs模块，它专注于处理服务端/客户端的http请求，让你处理get,post,put,delete,head请求时更轻松。虽然有内置的http等模块进行请求的处理，但superagent更简单。来看看它们之间的对比：
<!-- more -->
    var request = require('superagent');
    var http = require('http');
    var queryString = require('queryString');

使用superagent：

    request
    	.post('/api/pet')
    	.send({ name: 'Manny', species: 'cat' })
    	.set('X-API-Key', 'foobar')
    	.set('Accept', 'application/json')
    	.end(function(err, res){
    		if (res.ok) {
    			alert('yay got ' + JSON.stringify(res.body));
    		} else {
    			alert('Oh no! error ' + res.text);
    		}
    	});

使用http：

    var postData = queryString.stringify({name: 'Manny', species:'cat'});
    var options = {
    	path: '/api/pet',
    	method: 'POST',
    	headers: {
    		'X-API-Key': 'foobar',
    		'Accept': 'application/json'
    			}
    	};

    var req = http.request(options, function (res) {
    	res.on('data', function (chunk) {
    		console.log(chunk);
    	});
    });

    req.on('error', function (err) {
    	console.log(err);
    });
    req.write(postData);
    req.end();

从对比中可以发现superagent是链式操作的，用起来比http更方便，代码更容易读懂。更详细的使用请参考superagent官方文档：[https://visionmedia.github.io/superagent/](https://visionmedia.github.io/superagent/ "superagent")，中文使用文档：[https://cnodejs.org/topic/5378720ed6e2d16149fa16bd](https://cnodejs.org/topic/5378720ed6e2d16149fa16bd "superagent中文使用文档")

### 二、cheerio ###

通过cheerio.load()方法获得一个实现了jQuery接口的变量，比如：

    var cheerio = require('cheerio'),
	//习惯性地将它命名为 `$`
    $ = cheerio.load('<h2 class="title">Hello world</h2>');
    
    $('h2.title').text('Hello there!');
    $('h2').addClass('welcome');

load()方法的参数可以是html里面的内容，也可以是整个html，调用完这个方法后你就可以利用 $ 使用 jquery 的语法了，官方文档：[https://github.com/cheeriojs/cheerio](https://github.com/cheeriojs/cheerio "cheerio") 。

### 三、eventproxy ###


使用eventproxy来控制并发。假设你要并发异步获取两三个地址的数据，并且要在获取到数据之后，对这些数据一起进行利用的话，常规的写法是自己维护一个计数器。

先定义一个 var count = 0，然后每次抓取成功以后，就 count++。如果你是要抓取三个源的数据，由于你根本不知道这些异步操作到底谁先完成，那么每次当抓取成功的时候，就判断一下 count === 3。当值为真时，使用另一个函数继续完成操作。

而 eventproxy 就起到了这个计数器的作用，它来帮你管理到底这些异步操作是否完成，完成之后，它会自动调用你提供的处理函数，并将抓取到的数据当参数传过来。

一般我们写的计数器：

    (function () {
      var count = 0;
      var result = {};
    
      $.get('http://data1_source', function (data) {
    	result.data1 = data;
    	count++;
    	handle();
    	});
      $.get('http://data2_source', function (data) {
    	result.data2 = data;
    	count++;
    	handle();
    	});
      $.get('http://data3_source', function (data) {
    	result.data3 = data;
    	count++;
    	handle();
    	});
    
      function handle() {
    	if (count === 3) {
      		var html = fuck(result.data1, result.data2, result.data3);
      		render(html);
    		}
      	}
    })();

使用eventproxy：

    var ep = new eventproxy();
    ep.all('data1_event', 'data2_event', 'data3_event', function (data1, data2, data3) {
      var html = fuck(data1, data2, data3);
      render(html);
    });
    
    $.get('http://data1_source', function (data) {
      ep.emit('data1_event', data);
      });
    
    $.get('http://data2_source', function (data) {
      ep.emit('data2_event', data);
      });
    
    $.get('http://data3_source', function (data) {
      ep.emit('data3_event', data);
      });


ep.all('data1_event', 'data2_event', 'data3_event', function (data1, data2, data3) {});

这一句，监听了三个事件，分别是 data1_event, data2_event, data3_event，每次当一个源的数据抓取完成时，就通过 ep.emit() 来告诉 ep 自己，某某事件已经完成了。

当三个事件未同时完成时，ep.emit() 调用之后不会做任何事；当三个事件都完成的时候，就会调用末尾的那个回调函数，来对它们进行统一处理。

### 四、async ###

使用 async 控制异步并发数量，在这个爬虫中要获取4000个URL，一个网站很容易被单IP的巨量 URL 请求攻击到崩溃，别的网站也有可能会因为你发出的并发连接数太多而当你是在恶意请求，把你的 IP 封掉，所以这里使用async 控制异步并发数量，下面展示async使用示例：

    var async = require("async");
    
    // 并发连接数的计数器
    var concurrencyCount = 0;
    var fetchUrl = function (url, callback) {
      // delay 的值在 2000 以内，是个随机的整数
      var delay = parseInt((Math.random() * 10000000) % 2000, 10);
      concurrencyCount++;
      console.log('现在的并发数是', concurrencyCount, '，正在抓取的是', url, '，耗时' + delay + '毫秒');
      setTimeout(function () {
    	concurrencyCount--;
    	callback(null, url + ' html content');
      }, delay);
    };
    
	//伪造一组链接
    var urls = [];
    for(var i = 0; i < 30; i++) {
      urls.push('http://datasource_' + i);
    }
    
    async.mapLimit(urls, 5, function (url, callback) {
      fetchUrl(url, callback);
    }, function (err, result) {
      console.log('final:');
      console.log(result);
    });


### 五、事件轮询机制 ###

我们来看一组代码

    var http = require("http");
    
    function onRequest(request, response) {
      console.log("Request received.");
      response.writeHead(200, {"Content-Type": "text/plain"});
      response.write("Hello World");
      response.end();
    }
    
    http.createServer(onRequest).listen(8888);
    
    console.log("Server has started.");

类似于上面的代码：

    var http = require("http");
    
    http.createServer(function(request, response) {
      response.writeHead(200, {"Content-Type": "text/plain"});
      response.write("Hello World");
      response.end();
    }).listen(8888);

Node.js的事件循环是靠一个单线程不断地查询队列中是否有事件，当它读取到一个事件时，将调用与这个事件关联的javascript函数，如果这个函数是执行一个IO操作，比如侦听一下8888端口是否有Scoket链接，Node.js会启动这个IO操作，但是不会等待IO操作结束，而是继续到队列中查看是否有下一个事件，如果有，就处理这个事件。

下面关键来了，花开两朵，各表一枝，那么最好还是要会合的，nodejs如何知道启动的IO操作是否执行，执行的结果如何呢？比如发现我们浏览器访问8888端口，这时IO操作侦听到一个请求，那么下一步应该执行上面的onRequest了，但是Nodejs管理的CPU正在做其他事情啊。

这里，IO操作结束后会自己将一个执行原始回调函数的引用加入到事件队列中，也就是onRequest这个函数加入到事件队列中，NodeJS因为一直在轮询这个事件队列，会发现这个事件，执行事件的函数onRequest，完成用户的处理。

我们前后两个代码，一个是将函数体代码写入http，另外一个是用onRequest替代这部分代码，这个onRequest很重要，可以作为一个事件放入事件队列中，而函数体这段代码是无法放入事件队列中的，而且无法被另外一个函数调用。



### 参考文章： ###

《好用的 HTTP模块SuperAgent》：[http://www.jianshu.com/p/98b854322260](http://www.jianshu.com/p/98b854322260 "好用的 HTTP模块SuperAgent")

《使用 eventproxy 控制并发》：[https://github.com/alsotang/node-lessons/tree/master/lesson4](https://github.com/alsotang/node-lessons/tree/master/lesson4 "《使用 eventproxy 控制并发》")

《使用 async 控制并发》：[https://github.com/alsotang/node-lessons/tree/master/lesson5](https://github.com/alsotang/node-lessons/tree/master/lesson5 "《使用 async 控制并发》")

《NodeJs入门之事件驱动》：[http://www.jdon.com/idea/nodejs/tutorial.html](http://www.jdon.com/idea/nodejs/tutorial.html "NodeJs入门之事件驱动")


### 此爬虫学习来源:[【nodeJS爬虫】前端爬虫系列](https://github.com/chokcoco/cnblogsArticle/issues/7)

