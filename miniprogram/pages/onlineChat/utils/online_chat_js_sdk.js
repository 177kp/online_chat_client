
var self = null;
//在线聊天的js sdk
function online_chat_js_sdk(config){
    //online_chat_js_sdk的实例引用
    self=this;
    //当前用户
    this.userinfo = {
        uid:"",
        name:"",
        head_img:""
    };
    //提示消息方法
    this.alertMsg = function(msg){
        console.log(msg);
    };
    //主机地址
    if( typeof config.httpApiHost == 'undefined' ){
        this.alertMsg('config.httpApiHost未定义！');
        throw 'config.httpApiHost未定义！';
    }
    this.httpApiHost = config.httpApiHost;
    //文件地址
    if( typeof config.fileHost == 'undefined' ){
        this.alertMsg('config.fileHost未定义！');
        throw 'config.fileHost未定义！';
    }
    this.fileHost = config.fileHost;
    //调试，true-开启调试，false关闭调试
    if( typeof config.debug == 'undefined' ){
        this.debug = true;
    }else{
        this.debug = config.debug;
    }
    
    //websocket的访问token
    this.wesocket_access_token = '';
    //websocket服务的地址，该地址是由调用接口/index.php/online_chat/chat/getWebsocketAccessToken返回的
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
    //所有聊天会话
    this.sessions = [];
    //当前聊天会话
    this.session = [];
    //是否已获取sessions
    this.hasGetsessions = false;
    //联系人
    this.contacts = [];
    //当前session在sessions里的索引
    this.sessionIndex = null;
    //http的api
    this.httpApi = new httpApi();
    //在线聊天的助手方法（工具方法）
    this.helper = new helper();
    //socket的客户端
    this.socketClient = new socketClient();
    //订阅发布模式中订阅者
    this.subscriber = new subscriber();
    //this.httpApi.getSessions();
    //this.httpApi.getContacts();
}
online_chat_js_sdk.prototype = {
    constructor:online_chat_js_sdk,
    //开始
    start:function start(){
        //获取访问websocket服务的token
        self.httpApi.getAccessToken(function(){
            //连接websocket服务
            self.socketClient.connect();
        });
    },
    //加入一个聊天会话
    joinSession:function joinSession(contactIndex,cb){
        for( var i=0;i<self.sessions.length;i++ ){
            if( self.contacts[contactIndex].chat_type == self.sessions[i].chat_type &&
                self.contacts[contactIndex].to_id == self.sessions[i].to_id ){
                    var session = self.sessions.splice(i, 1)[0]; 
                    self.sessions.unshift(session);
                    this.session = self.sessions[0];
                    this.sessionIndex = 0;
                    typeof cb == 'function' && cb(this.session);
                    return;
                }
        }
        self.sessions.unshift({
            chat_type: self.contacts[contactIndex].chat_type,
            head_img:self.contacts[contactIndex].head_img,
            lastMessage:null,
            messages: [],
            name: self.contacts[contactIndex].name,
            to_id: self.contacts[contactIndex].to_id,
            uid: self.userinfo.uid
        });
        this.session = self.sessions[0];
        this.sessionIndex = 0;
        var chat_type = self.contacts[contactIndex].chat_type;
        var to_id = self.contacts[contactIndex].to_id;
        this.httpApi.joinSession(chat_type,to_id);
        typeof cb == 'function' && cb(this.session);
    },
    //选择会话
    selectSession:function selectSession(key){
        self.sessionIndex = key;
        vm.sessionIndex = key;
        self.session = self.sessions[key];
        if( typeof self.session.hasGetMessage =='undefined' ){
            self.sessions[key]['hasGetMessage'] = '1';
        }else{
            return;
        }
        onlineChat.httpApi.getMessages(self.session['to_id'],self.session['chat_type']);
    },
    //移动端加载聊天页面
    beforeLoadChatPage:function beforeLoadChatPage(session){
        if( self.hasGetsessions == true ){
            onlineChat.session = session;
            onlineChat.httpApi.getMessages(session['to_id'],session['chat_type']);
            return;
        }
        //直接进入聊天页面
        var count = 0;
        self.userinfo.head_img = session.head_img;
        self.userinfo.uid = session.uid;
        self.userinfo.name = session.name;
        var timer = setInterval(function(){
            if( count>100 ){
                clearInterval(timer);
                return;
            }
            if( self.hasGetsessions == true ){
                for( var i=0;i<self.sessions.length;i++ ){
                    if( self.sessions[i].chat_type == session.chat_type && self.sessions[i].to_id == session.to_id ){
                        self.session = self.sessions[i];
                    }
                }
                onlineChat.httpApi.getMessages(session['to_id'],session['chat_type']);
                clearInterval(timer);
            };
            count++;
        },50);
        
    }
};

//在线聊天socket，有发送消息，连接socket，重连socket，
function socketClient(){
    //socket
    this.socket = null;
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
}
socketClient.prototype = {
    constructor:socketClient,
    //连接websocket server
    connect:function connect(){
        var that = this;
        if( self.ws_addr == null || self.ws_addr == '' ){
            throw 'websocket的host地址不能为空！';
        }
        console.log(self.ws_addr);
        this.socket = wx.connectSocket({
          url:self.ws_addr
        }); 
        this.timingCheckConnect();
        wx.onSocketOpen(function(header){
        　　//当WebSocket创建成功时，触发onopen事件
            self.debug && console.log('websocket连接打开');
            if( that.websocket_open_cb != null ){
              that.websocket_open_cb();
            }
            //socket.send("hello"); //将消息发送到服务端
        });
        wx.onSocketClose(function(e){
        　　//当客户端收到服务端发送的关闭连接请求时，触发onclose事件
            self.debug && console.log('websocket连接关闭');
        　　if( that.websocket_close_cb != null ){
              that.websocket_close_cb();
            }
        });
        wx.onSocketError(function(e){
        　　//如果出现连接、处理、接收、发送数据失败的时候触发onerror事件
        　　if( that.websocket_error_cb != null ){
              that.websocket_error_cb();
            }
        });
        wx.onSocketMessage(function(res){
          self.debug && console.log("接收到消息：" + res.data);
          var data = JSON.parse(res.data);
          //处理消息
          self.subscriber.handleMessage(data);
          if( self.websocket_message_cb != null ){
              try{
                  that.websocket_message_cb(data);
              }catch( e ){
                  console.log(e);
              }
          }
      });
    },
    //检查连接的状态，如果状态为不在线，则重连
    timingCheckConnect:function timingCheckConnect(){
        var that = this;
        if( this.timer == null ){
            this.timer = setInterval(function(){
                if( that.socket.readyState != 1 ){
                    self.httpApi.getAccessToken(function(){
                        clearInterval(that.timer);
                        that.connect();
                    });
                }
            },5000);
        }
    },
    //用户自定义socket事件回调
    on:function on(name,cb){
        if( name == 'open' ){
            this.websocket_open_cb = cb;
        }else if( name == 'message' ){
            this.websocket_message_cb = cb;
        }else if( name == 'close' ){
            this.websocket_close_cb = cb;
        }else if( name == 'error' ){
            this.websocket_error_cb = cb;
        }else{
            throw 'name不正确！';
        }
    },
    //发送消息
    sendMessage:function sendMessage(message){
        if( typeof message.chat_type == 'undefined' ){
            message.chat_type = self.session.chat_type;
        }
        if( typeof message.to_id == 'undefined' ){
            message.to_id = self.session.to_id;
        }
        var msg = {
            chat_type:message.chat_type,
            to_id:message.to_id,
            access_token:self.wesocket_access_token,
            msg_type:message.msg_type,
            msg:message.msg
        }
        //console.log(msg);
        msg = JSON.stringify(msg);
        self.debug && console.log("发送消息：" + msg);
        wx.sendSocketMessage({
          data:msg
        });
    }
}
//订阅发布模式中的订阅者
function subscriber(){

}
subscriber.prototype = {
    constructor:subscriber,
    //处理消息
    handleMessage:function handleMessage(message){
        if( message.topic == 'online' ){
            this.onlineTopic(message.msg);
        }else if( message.topic == 'offline' ){
            this.offlineTopic(message.msg);
        }else if( message.topic == 'message' ){
            this.messageTopic(message.msg);
        }
    },
    //上线
    onlineTopic:function onlineTopic(msg){
        for( var i=0;i<self.sessions.length;i++ ){
            if( self.sessions[i].to_id == msg.uid ){
                self.sessions[i].online = 1;
            }
        }
    },
    //下线
    offlineTopic:function offlineTopic(msg){
        for( var i=0;i<self.sessions.length;i++ ){
            if( self.sessions[i].to_id == msg.uid ){
                self.sessions[i].online = 0;
            }
        }
    },
    //消息
    messageTopic:function messageTopic(msg){
        var exist = 0;
        for( var i=0;i<self.sessions.length;i++ ){
            
            if( self.sessions[i].chat_type != msg.chat_type ){
                continue;
            }
            //
            if( msg.chat_type == 0 ){
                if( 
                    ( msg.uid == self.sessions[i].uid && msg.to_id == self.sessions[i].to_id )
                    || (msg.uid == self.sessions[i].to_id && msg.to_id == self.sessions[i].uid )
                ){
                    self.sessions[i].messages.push(msg);
                    self.sessions[i].lastMessage = msg;
                    exist = 1;
                    break;
                }
            }else if( msg.chat_type == 1 ){
                if( msg.to_id == self.sessions[i].to_id ){
                    self.sessions[i].messages.push(msg);
                    self.sessions[i].lastMessage = msg;
                    exist = 1;
                    break;
                }
            }
            if( self.sessions[i].chat_type == msg.chat_type && (self.sessions[i].to_id == self.userinfo.uid) ){
                self.sessions[i].messages.push(msg);
                self.sessions[i].lastMessage = msg;
                exist = 1;
                break;
            }
        }
        if( exist == 1 ){
            var session = self.sessions.splice(i,1)[0];
        }else{
            var session = {
                chat_type: msg.chat_type,
                head_img:msg.head_img,
                lastMessage:msg,
                messages: [msg],
                name: msg.name,
                to_id:msg.uid,
                uid: msg.to_id,
                online:1
            };
            self.sessions.push(session)
            session = self.sessions.pop();
        }
        session.newMessage = true;
        getApp().globalData.onlineChat.newMessage = true;
        self.sessions.unshift(session);
    }
}
//在线聊天http的api
function httpApi(){
    
}
httpApi.prototype = {
    constructor:httpApi,
    //登陆
    wxMiniProgramLogin:function wxMiniProgramLogin(code,nickName,avatarUrl,cb){
      wx.request({
        url: self.httpApiHost+'/index.php/online_chat/chat/wxMiniProgramLogin', //仅为示例，并非真实的接口地址
        method:"get",
        data: {
          code: code,
          name:nickName,
          head_img:avatarUrl
        },
        header: {
          'content-type': 'application/json' // 默认值
        },
        success(data) {
          //console.log(data);
          if( data.data.code == 200 ){
            wx.setStorageSync("token", data.data.data.PHPSESSID);
            cb();
          }else{
            console.log('login failed');
          }
        }
      });
    },
    //获取websocket访问的token
    getAccessToken:function getAccessToken(cb){
      //$.ajaxSettings.async = false;
      this.httpGet( self.httpApiHost + '/index.php/online_chat/chat/getWebsocketAccessToken',function(data){
          self.debug && console.log(data);
          if( data.code == 200 ){
              self.userinfo.uid = data.data.userinfo.uid;
              self.userinfo.name = data.data.userinfo.name;
              self.userinfo.head_img = data.data.userinfo.head_img;
              self.wesocket_access_token = data.data.wesocket_access_token;
              self.ws_addr = data.data.ws_addr;
              if( typeof cb != 'undefined' ){
                  cb();
              }
          }else{
              if( typeof data.data.isLogin != "undefined" ){
                  console.log('not login');
              }
          }
      });
      //$.ajaxSettings.async = true;
  },
    //加入一个聊天会话
    joinSession:function joinSession(chat_type,to_id){
        this.httpGet(self.httpApiHost+'/index.php/online_chat/session/joinSession',{chat_type:chat_type,to_id:to_id},function(data){
            self.debug && console.log(data);
            if( chat_type == 1 ){
                onlineChat.httpApi.getMessages(to_id,chat_type);
            }
        });
    },
    //获取所有聊天会话
    getSessions:function getSessions(cb){
        this.httpGet(self.httpApiHost+'/index.php/online_chat/session/index',function(data){
            self.debug && console.log(data);
            self.sessions = data.data;
            self.hasGetsessions = true;
            if( typeof cb == 'function' ){
                cb(data);
            }
        });
    },
    //获取所有联系人
    getContacts:function getContacts(cb){
        this.httpGet(self.httpApiHost+'/index.php/online_chat/session/getContacts',function(data){
            self.debug && console.log(data);
            self.contacts = data.data;
            if( typeof cb == 'function' ){
                cb(data);
            }
        });
    },
    //获取会话历史聊天记录
    getMessages:function getMessages(to_id,chat_type,cb){
        this.httpGet(self.httpApiHost+ '/index.php/online_chat/message/index',{to_id:to_id,chat_type:chat_type},function(data){
            self.debug && console.log(data);
            data = data.data;
            self.session.messages = data;
            cb(data);
        });
    },
    //上传文件
    uploadFile:function uploadFile(file,to_id,chat_type) {
      wx.uploadFile({
          url:  self.httpApiHost + "/index.php/online_chat/file/upload",
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
              self.socketClient.sendMessage({
                  chat_type:chat_type,
                  to_id:to_id,
                  msg:data.msg_content,
                  msg_type:data.data.msg_type
              });
          }
      });
    },
    httpGet:function httpGet(url,data,cb){
        if( typeof data == 'function' && typeof cb == 'undefined' ){
            cb = data;
            data = {};
        }
        wx.request({
          url:url, 
          method:"get",
          data: data,
          header:{
            'content-type':'application/x-www-form-urlencoded',
            'token': wx.getStorageSync("token")
          },
          success(data) {
              cb(data.data);
          }
        });
    }
}
//在线聊天的工具方法
function helper(){

}
helper.prototype = {
    constructor:httpApi,
    //获取在线头像或者离线头像（灰色的）
    getHeadImg:function getHeadImg(head_img,online){
        if( head_img == null ){
            return;
        }
        if( online == '1' ){
            return head_img;
        }else{
            var arr = head_img.split('.');
            var ext = arr.pop();
            arr.push('gray');
            arr.push(ext);
            return arr.join('.');
        }
    },
    //格式化文件大小
    formatFilesize:function formatFilesize(filesize){
        if( filesize < 1024*1024 ){
            return (filesize / 1024).toFixed(2).toString() + 'K';
        }else{
            return (filesize / 1024 / 1024).toFixed(2).toString() + 'M';
        }
    },
    //获取文件下载地址
    getFileDownloadUrl:function getFileDownloadUrl(path,filename){
        return self.httpApiHost + '/index.php/online_chat/file/download?path='+path+'&filename='+filename;
    },
    //格式化时间
    formatTime:function formatTime(number, format) {
        var formateArr = ['Y', 'M', 'D', 'h', 'm', 's'];
        var returnArr = [];
        var date = new Date(number);
        returnArr.push(date.getFullYear());
        returnArr.push(this.formatNumber(date.getMonth() + 1));
        returnArr.push(this.formatNumber(date.getDate()));

        returnArr.push(this.formatNumber(date.getHours()));
        returnArr.push(this.formatNumber(date.getMinutes()));
        returnArr.push(this.formatNumber(date.getSeconds()));

        for (var i in returnArr) {
            format = format.replace(formateArr[i], returnArr[i]);
        }
        return format;
    },
    //格式化消息的时间
    messageFormatTime:function messageFormatTime(number) {
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
            var week = {"0":"周日","1":"周一","2":"周二","3":"周三","4":"周四","5":"周五","6":"周六"}; 
            str = week[date.getDay()+""];
        } else {
            var hour = ["凌晨","早上","下午","晚上"];
            var h=date.getHours();
            if(h==12) str = "中午";
            else str = hour[parseInt(h/6)];
            str = this.formatTime(date.getTime(),"M月D ") + str;
        }
        str += this.formatTime(number,"h:m");
        return str;
    },
    //格式化session的时间
    sessionFormatTime: function sessionFormatTime(number) {
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
            return this.formatTime(number,"h:m");
        } else if(date.getTime() > yesterday.getTime()) {
            return "昨天";
        }else{
            return this.formatTime(number,'M-D');
        }
    },
    //数据转化  
    formatNumber: function formatNumber(n) {
        n = n.toString()
        return n[1] ? n : '0' + n
    }
}

//数据转化  
function formatNumber(n) {
    n = n.toString()
    return n[1] ? n : '0' + n
}

module.exports = new online_chat_js_sdk({
  'httpApiHost':'https://chat.blogts.com',
  'fileHost':'https://chat.blogts.com', //表情图片会用到
  'debug':true
});