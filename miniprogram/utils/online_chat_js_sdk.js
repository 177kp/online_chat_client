
var self = null;
function online_chat_js_sdk(config){
    //当前用户
    this.currentUser = {
        uid:"",
        name:"",
        head_img:""
    };
    if( typeof config.host == 'undefined' ){
        console.log('config.host未定义！');
        return;
    }
    if( typeof config.login_url == 'undefined' ){
        console.log('config.login_url未定义！');
        return;
    }
    //调试，true-开启调试，false关闭调试
    if( typeof config.debug == 'undefined' ){
        this.debug = true;
    }else{
        this.debug = config.debug;
    }
    //主机地址
    this.host = config.host;
    //登陆地址
    this.login_url = config.login_url;
    //websocket的访问token
    this.wesocket_access_token = '';
    //websocket服务的地址，该地址是由调用接口/index.php/online_chat/chat/getWebsocketAccessToken返回回来的
    this.ws_addr = '';
    //socket
    this.socket = '';
    //文本
    this.MSG_TYPE_TXT = 0;
    //图片
    this.MSG_TYPE_IMG = 1;
    //声音
    this.MSG_TYPE_SOUND = 2;
    //视频
    this.MSG_TYPE_VIDEO = 3;
    //富文本
    this.MSG_TYPE_RICH_TXT = 4;
    //文件
    this.MSG_TYPE_FILE = 5;
    //定时器
    this.timer = null;
    //websocket的打开连接的回调方法
    this.websocket_open_cb = null;
    //websocket的message的回调方法
    this.websocket_message_cb = null;
    //websocket的关闭连接的回调方法
    this.websocket_close_cb = null;
    //websocket的异常的回调方法
    this.websocket_error_cb = null;
    self=this;
}
//获取websocket访问的token
online_chat_js_sdk.prototype.getAccessToken = function(cb){
    //$.ajaxSettings.async = false;
    httpPost( this.host + '/index.php/online_chat/chat/getWebsocketAccessToken',{},function(data){
        self.debug && console.log(data);
        if( data.code == 200 ){
            self.currentUser.uid = data.data.userinfo.uid;
            self.currentUser.name = data.data.userinfo.name;
            self.currentUser.head_img = data.data.userinfo.head_img;
            self.wesocket_access_token = data.data.wesocket_access_token;
            self.ws_addr = data.data.ws_addr;
            if( typeof cb != 'undefined' ){
                cb();
            }
        }else{
            if( typeof data.data.isLogin != "undefined" ){
                window.location.href=self.login_url;
            }
        }
    });
    //$.ajaxSettings.async = true;
}
//连接websocketserver
online_chat_js_sdk.prototype.connect = function(){
    //如果断开连接了，重连socket
    if( self.timer == null ){
        self.timer = setInterval(function(){
            console.log(self.socket.readyState);
            if( self.socket.readyState != 1 ){
                self.getAccessToken(function(){
                    self.connect();
                });
            }
        },5000);
    }

    if( self.ws_addr == null || self.ws_addr == '' ){
        throw 'websocket的host地址不能为空！';
    }
    //console.log(self.ws_addr);
    self.socket = wx.connectSocket({
        url:self.ws_addr
    }); 
    wx.onSocketOpen(function(header){
    　　//当WebSocket创建成功时，触发onopen事件
        self.debug && console.log('websocket连接打开');
        if( self.websocket_open_cb != null ){
            self.websocket_open_cb();
        }
        //socket.send("hello"); //将消息发送到服务端
    });
    wx.onSocketClose(function(e){
    　　//当客户端收到服务端发送的关闭连接请求时，触发onclose事件
        self.debug && console.log('websocket连接关闭');
    　　if( self.websocket_close_cb != null ){
            self.websocket_close_cb();
        }
    });
    wx.onSocketError(function(e){
    　　//如果出现连接、处理、接收、发送数据失败的时候触发onerror事件
    　　if( self.websocket_error_cb != null ){
            self.websocket_error_cb();
        }
    });
    wx.onSocketMessage(function(res){
        self.debug && console.log("接收到消息：" + res.data);
        var data = JSON.parse(res.data);
        if( self.websocket_message_cb != null ){
            try{
                self.websocket_message_cb(data);
            }catch( e ){
                console.log(e);
            }
        }
    });
}
//加入一个聊天会话
online_chat_js_sdk.prototype.joinSession = function(chat_type,to_id,cb){
    httpGet(self.host+'/index.php/online_chat/session/joinSession',{chat_type,to_id},function(data){
        self.debug && console.log(data);
        cb(data);
    });
}
//获取所有聊天会话
online_chat_js_sdk.prototype.getSessions = function(cb){
    httpGet(self.host+'/index.php/online_chat/session/index',{},function(data){
        self.debug && console.log(data);
        cb(data);
    });
}
//获取所有联系人
online_chat_js_sdk.prototype.getContacts = function(cb){
    httpGet(self.host + '/index.php/online_chat/session/getContacts',{},function(data){
        self.debug && console.log(data);
        cb(data);
    });
}
//获取会话历史聊天记录
online_chat_js_sdk.prototype.getMessages = function(to_id,chat_type,cb){
    httpGet( self.host + '/index.php/online_chat/message/index',{to_id,chat_type},function(data){
        self.debug && console.log(data);
        cb(data);
    });
}
online_chat_js_sdk.prototype.on = function(name,cb){
    if( name == 'open' ){
        self.websocket_open_cb = cb;
    }else if( name == 'message' ){
        self.websocket_message_cb = cb;
    }else if( name == 'close' ){
        self.websocket_close_cb = cb;
    }else if( name == 'error' ){
        self.websocket_error_cb = cb;
    }else{
        throw 'name不正确！';
    }
}
//发送消息
online_chat_js_sdk.prototype.sendMessage = function(message){
    var msg = {
        chat_type:message.chat_type,
        to_id:message.to_id,
        access_token:self.wesocket_access_token,
        msg_type:message.msg_type,
        msg:message.msg
    }
    //console.log(msg);
    var msg = JSON.stringify(msg);
    self.debug && console.log("发送消息：" + msg);
    wx.sendSocketMessage({
        data:msg
    });
}
online_chat_js_sdk.prototype.formatTime = function(number, format) {
    var formateArr = ['Y', 'M', 'D', 'h', 'm', 's'];
    var returnArr = [];
    var date = new Date(number);
    returnArr.push(date.getFullYear());
    returnArr.push(formatNumber(date.getMonth() + 1));
    returnArr.push(formatNumber(date.getDate()));

    returnArr.push(formatNumber(date.getHours()));
    returnArr.push(formatNumber(date.getMinutes()));
    returnArr.push(formatNumber(date.getSeconds()));

    for (var i in returnArr) {
        format = format.replace(formateArr[i], returnArr[i]);
    }
    return format;
};
online_chat_js_sdk.prototype.messageFormatTime = function(number) {
    var date = new Date(number);
    var str;
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate()-1);
    var beforeYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate()-2);
    var monday = new Date(today);
    monday.setDate(today.getDate()-(today.getDay()?today.getDay()-1:6));
    //注意：date初始化默认是按本地时间初始的，但打印默认却是按GMT时间打印的，也就是说打印出的不是本地现在的时间
    //LocaleString的打印也有点问题，"0点"会被打印为"上午12点"
    if(date.getTime() > today.getTime()) {
        str = "";
    } else if(date.getTime() > yesterday.getTime()) {
        str = "昨天";
    } else if(date.getTime() > beforeYesterday.getTime() && false ) { //该行不要
        str = "前天";
    } else if(date.getTime() > monday.getTime() && false ) { //该行不要
        const week = {"0":"周日","1":"周一","2":"周二","3":"周三","4":"周四","5":"周五","6":"周六"}; 
        str = week[date.getDay()+""];
    } else {
        const hour = ["凌晨","早上","下午","晚上"];
        const h=date.getHours();
        if(h==12) str = "中午";
        else str = hour[parseInt(h/6)];
        str = this.formatTime(date.getTime(),"M月D ") + str;
    }
    str += this.formatTime(number,"h:m");
    return str;
};
online_chat_js_sdk.prototype.sessionFormatTime = function(number) {
    var date = new Date(number);
    var str;
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate()-1);
    var beforeYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate()-2);
    var monday = new Date(today);
    monday.setDate(today.getDate()-(today.getDay()?today.getDay()-1:6));
    //注意：date初始化默认是按本地时间初始的，但打印默认却是按GMT时间打印的，也就是说打印出的不是本地现在的时间
    //LocaleString的打印也有点问题，"0点"会被打印为"上午12点"
    //console.log( date.getTime() );
    if(date.getTime() > today.getTime() ) {
        return this.formatTime(number,"h:s");
    } else if(date.getTime() > yesterday.getTime()) {
        return "昨天";
    }else{
        return this.formatTime(number,'M-D');
    }
};
online_chat_js_sdk.prototype.uploadFile = function(file,to_id,chat_type) {
    var self  = this;
    wx.uploadFile({
        url: 'http://' + self.host + "/index.php/online_chat/file/upload",
        filePath:file,
        name:"file",
        header: getApp().globalData.header,
        success(res) {
            var data = res.data;
            self.debug && console.log(data);
            data = JSON.parse(data);
            if( data.code != 200 ){
                alert(data.msg);
                return;
            }
            if( data.data.msg_type ==self.MSG_TYPE_IMG ){
                data['msg_content'] = data.data.path;
            }else if( data.data.msg_type ==self.MSG_TYPE_SOUND ){
                data['msg_content'] = {
                    path:data.data.path,
                    duration:data.data.duration
                };
            }else if( data.data.msg_type ==self.MSG_TYPE_VIDEO ){
                data['msg_content'] = {
                    path:data.data.path,
                    duration:data.data.duration,
                    video_cover_img:data.data.video_cover_img
                };
            }else if( data.data.msg_type ==self.MSG_TYPE_FILE ){
                data['msg_content'] = {
                    path:data.data.path,
                    filename:data.data.filename,
                    filesize:data.data.filesize
                };
            }
            self.sendMessage({
                chat_type:chat_type,
                to_id:to_id,
                msg:data.msg_content,
                msg_type:data.data.msg_type
            });
        }
    });
};
online_chat_js_sdk.prototype.selectFile = function(onlineChat,type,to_id,chat_type){
    var fileId = 'upload-file-inut-' + parseInt(Math.random() * 10000000);
    if( type=="file" ){ //上传文件
        $('body').after('<input type="file" id="'+fileId+'" name="file" style="display:none">');
    }else if( type == 'take_a_picture' ){//拍照
        $('body').after('<input type="file" id="'+fileId+'" name="file" accept="image/*" capture="user" style="display:none">');
    }else if( type == 'take_a_video' ){//拍视频
        $('body').after('<input type="file" id="'+fileId+'" name="file" accept="video/*" capture="environment" style="display:none">');
    }else if( type == 'take_a_audio' ){//录音
        $('body').after('<input type="file" id="'+fileId+'" name="file" accept="audio/*" style="display:none" capture>');
        //$('input[name="audio"]').click();
    }else{
        alert('type不正确！');
        return;
    }
    $('#'+fileId).change(function(){
        onlineChat.uploadFile($('#'+fileId)[0].files[0],to_id,chat_type);
        //$('#upload-file-input-'+fileId).remove();
    });
    document.getElementById(fileId).click();
}
function httpPost(url,param,cb){
    //console.log( getApp().globalData.header );
    if( !/^(http\:\/\/|https\:\/\/)/.test(url) ){
        url = 'http://' + url;
    }
    wx.request({
        url: url,
        method:"post",
        data:param,
        header: getApp().globalData.header,
        success(res) {
            cb(res.data);
        }
    })
}
function httpGet(url,param,cb){
    //console.log( getApp().globalData.header );
    if( !/^(http\:\/\/|https\:\/\/)/.test(url) ){
        url = 'http://' + url;
    }
    wx.request({
        url: url,
        method:"get",
        data:param,
        header: getApp().globalData.header,
        success(res) {
            cb(res.data);
        }
    })
}
//数据转化  
function formatNumber(n) {
    n = n.toString()
    return n[1] ? n : '0' + n
}
module.exports = new online_chat_js_sdk({
  'host':'192.168.5.29',
  'port':2080,
  'login_url':''
});





