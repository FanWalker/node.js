"use strict";
const msg = document.getElementById('message');
var app = angular.module('webchat', []);

app.controller('myCtrl', function($scope) {
    $scope.data = []; //接收-消息队列
    $scope.name = '';
    $scope.content = '';
    $scope.personnum = 0;
    $scope.personlist = [];
    $scope.flag = false;

    const socket_url = 'http://localhost';
    var pl = angular.element(document.getElementById('person_list'));
    var socket = io(socket_url);

    socket.on('news', function(data){
        ($scope.data).push(data);
        $scope.$apply();
        msg.scrollTop = msg.scrollHeight;
    });

    socket.on('history', function(data){
        for(let x in data){
            ($scope.data).push(data[x]);
        }
        ($scope.data).push({content:'----------以上是历史消息-----------'});
        $scope.$apply();
        msg.scrollTop = msg.scrollHeight;
    });

    socket.on('loginsucess',function () {
        document.getElementById('loginWrapper').style.display = 'none';//隐藏遮罩层显聊天界面
        document.getElementById('text').focus();//让消息输入框获得焦点
    });


    socket.on('updatePerson', function(data){
        $scope.personlist = data;
        $scope.$apply();
    });

    $scope.checkName = function () {
    if($scope.name!==''){
        if($scope.personlist.length!==0){
            if($scope.personlist.indexOf($scope.name)>-1) {
                document.getElementById("info").textContent = "该昵称已被占用，请重新输入";
            }
            else{
                socket.emit('setUserName',$scope.name);
            }
        }
        else{
            socket.emit('setUserName', $scope.name);
        }
    }
    else{
        document.getElementById('name').focus();
    }
};


    $scope.sendMsg = function(data){
        var date = new Date();
        data = $scope.content;
        /*if (!$scope.flag){
            $scope.flag = true;
            socket.emit('setUserName', $scope.name);
        }*/
        if ($scope.content!='')
            socket.emit('sendMsg', data);
        $scope.content='';
    };

    $scope.enter = function(e){
        var keycode = window.event?e.keyCode:e.which;
        if(keycode==13){
            $scope.sendMsg();
        }
    };

    $scope.retract = function () {
        pl.removeClass('flipInX');
        pl.addClass('flipOutX');
    };

    $scope.spread = function () {
        pl.removeClass('flipOutX');
        pl.css({display:"block"});
        pl.addClass('flipInX');
    };
});
