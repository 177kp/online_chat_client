(function(){
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
        if( typeof config.alertMsg == 'function' ){
            this.alertMsg = config.alertMsg;
        }else{
            this.alertMsg = function(msg){
                alert(msg);
            };
        }
        //主机地址
        if( typeof config.httpApiHost == 'undefined' ){
            this.alertMsg('config.httpApiHost未定义！');
            throw 'config.httpApiHost未定义！';
        }
        this.httpApiHost = config.httpApiHost;

        //未登陆跳转的地址
        if( typeof config.noLoginJumpUrl == 'undefined' ){
            this.noLoginJumpUrl = 'index.html';
        }else{
            this.noLoginJumpUrl = config.noLoginJumpUrl;
        }
        //调试，true-开启调试，false关闭调试
        if( typeof config.debug == 'undefined' ){
            this.debug = true;
        }else{
            this.debug = config.debug;
        }
        //是否是临时聊天会话
        if( typeof config.is_tmp == 'undefined' ){
            this.is_tmp = 0;
        }else{
            this.is_tmp = config.is_tmp;
        }
        //会话列表滚动到顶部方法
        if( typeof config.sle_scroll_top == 'function' ){
            this.sle_scroll_top = config.sle_scroll_top;
        }else{
            this.sle_scroll_top = function(){

            };
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

        //普通聊天
        this.CHAT_TYPE_CHAT = 0;
        //普通聊天
        this.CHAT_TYPE_GROUP_CHAT = 1;
        //客服
        this.CHAT_TYPE_CUSTOMER = 2;
        //咨询
        this.CHAT_TYPE_CONSULT = 3;

        //普通聊天
        this.chat = {
            //所有聊天会话
            sessions:[],
            //当前聊天会话
            session:[],
            //是否已获取sessions
            hasGetsessions:false,
            //联系人
            contacts:[],
            //当前session在sessions里的索引
            sessionIndex:null
        };

        //客服
        this.customer = {
            //所有聊天会话
            sessions:[],
            //当前聊天会话
            session:[],
            //是否已获取sessions
            hasGetsessions:false,
            //联系人
            contacts:[],
            //当前session在sessions里的索引
            sessionIndex:null
        };

        //咨询
        this.consult = {
            //所有聊天会话
            sessions:[],
            //当前聊天会话
            session:[],
            //是否已获取sessions
            hasGetsessions:false,
            //联系人
            contacts:[],
            //当前session在sessions里的索引
            sessionIndex:null
        };

        //普通聊天
        this.chat = {
            //所有聊天会话
            sessions:[],
            //当前聊天会话
            session:[],
            //是否已获取sessions
            hasGetsessions:false,
            //联系人
            contacts:[],
            //当前session在sessions里的索引
            sessionIndex:null
        };

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
        //开始临时会话
        startTmp:function startTmp(){
            //获取访问websocket服务的token
            self.httpApi.getTmpAccessToken(function(data){
                //连接websocket服务
                self.socketClient.connect();
            });
        },
        //获取一个聊天类型的storage
        getChatStorage:function getChatStorage(chat_type){
            if( chat_type == self.CHAT_TYPE_CHAT || chat_type == self.CHAT_TYPE_GROUP_CHAT ){
                var chatStorage = self.chat;
            }else if( chat_type == self.CHAT_TYPE_CUSTOMER ){
                var chatStorage = self.customer;
            }else if( chat_type == self.CHAT_TYPE_CONSULT ){
                var chatStorage = self.consult;
            }
            return chatStorage;
        },
        //加入一个聊天会话
        joinSession:function joinSession(contactIndex,chat_type,cb){
            var chatStorage = this.getChatStorage(chat_type);
            for( var i=0;i<chatStorage.sessions.length;i++ ){
                if( chatStorage.contacts[contactIndex].chat_type == chatStorage.sessions[i].chat_type &&
                    chatStorage.contacts[contactIndex].to_id == chatStorage.sessions[i].to_id ){
                        var session = chatStorage.sessions.splice(i, 1)[0]; 
                        chatStorage.sessions.unshift(session);
                        chatStorage.session = chatStorage.sessions[0];
                        chatStorage.sessionIndex = 0;
                        typeof cb == 'function' && cb(chatStorage.session);
                        return;
                    }
            }
            chatStorage.sessions.unshift({
                chat_type: chatStorage.contacts[contactIndex].chat_type,
                head_img:chatStorage.contacts[contactIndex].head_img,
                lastMessage:null,
                messages: [],
                name: chatStorage.contacts[contactIndex].name,
                to_id: chatStorage.contacts[contactIndex].to_id,
                uid: self.userinfo.uid,
                online:0
            });
            chatStorage.session = chatStorage.sessions[0];
            chatStorage.sessionIndex = 0;
            var chat_type = chatStorage.contacts[contactIndex].chat_type;
            var to_id = chatStorage.contacts[contactIndex].to_id;
            this.httpApi.joinSession(chat_type,to_id,function(){

            });
            typeof cb == 'function' && cb(chatStorage.session);
        },
        //选择会话
        selectSession:function selectSession(key,chat_type){
            var chatStorage = this.getChatStorage(chat_type);
            chatStorage.sessionIndex = key;
            chatStorage.session = chatStorage.sessions[key];
            console.log( chatStorage.session.hasGetMessage );
            if( typeof chatStorage.session.hasGetMessage =='undefined' ){
                chatStorage.session['hasGetMessage'] = true;
            }else{
                return;
            }
            onlineChat.httpApi.getMessages(chatStorage.session['to_id'],chatStorage.session['chat_type']);
        },
        //移动端加载聊天页面
        beforeLoadChatPage:function beforeLoadChatPage(session,chat_type){
            var chatStorage = this.getChatStorage(chat_type);
            if( chatStorage.hasGetsessions == true ){
                chatStorage.session = session;
                if( typeof chatStorage.session.hasGetMessage =='undefined' ){
                    chatStorage.session['hasGetMessage'] = true;
                    onlineChat.httpApi.getMessages(session['to_id'],session['chat_type']);
                }
                if( chat_type == self.CHAT_TYPE_CONSULT ){
                    self.httpApi.getConsultTime();
                }
                return;
            }
            //直接进入聊天页面
            var count = 0;
            self.userinfo.head_img = chatStorage.session.head_img;
            self.userinfo.uid = chatStorage.session.uid;
            self.userinfo.name = chatStorage.session.name;
            var timer = setInterval(function(){
                if( count>100 ){
                    clearInterval(timer);
                    return;
                }
                if( chatStorage.hasGetsessions == true ){
                    for( var i=0;i<chatStorage.sessions.length;i++ ){
                        if( chatStorage.sessions[i].chat_type == session.chat_type && chatStorage.sessions[i].to_id == session.to_id ){
                            chatStorage.session = chatStorage.sessions[i];
                        }
                    }
                    self.httpApi.getMessages(chatStorage.session['to_id'],chatStorage.session['chat_type']);
                    if( chat_type == self.CHAT_TYPE_CONSULT ){
                        self.httpApi.getConsultTime();
                    }
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
            //console.log(self.ws_addr);
            this.socket = new WebSocket(self.ws_addr);
            this.timingCheckConnect();
            this.socket.onopen = function(){
            　　//当WebSocket创建成功时，触发onopen事件
                self.debug && console.log('websocket连接打开');
                if( that.websocket_open_cb != null ){
                    that.websocket_open_cb();
                }
                //socket.send("hello"); //将消息发送到服务端
            }
            this.socket.onclose = function(e){
            　　//当客户端收到服务端发送的关闭连接请求时，触发onclose事件
                self.debug && console.log('websocket连接关闭');
            　　if( that.websocket_close_cb != null ){
                    that.websocket_close_cb();
                }
            }
            this.socket.onerror = function(e){
            　　//如果出现连接、处理、接收、发送数据失败的时候触发onerror事件
            　　if( that.websocket_error_cb != null ){
                    that.websocket_error_cb();
                }
            }
            this.socket.onmessage = function(socket){
                self.debug && console.log("接收到消息：" + socket.data);
                data = $.parseJSON(socket.data);
                //处理消息
                self.subscriber.handleMessage(data);
                //回调用户自定义处理消息方法
                if( that.websocket_message_cb != null ){
                    that.websocket_message_cb(data);
                }
            }
        },
        //检查连接的状态，如果状态为不在线，则重连
        timingCheckConnect:function timingCheckConnect(){
            var that = this;
            if( this.timer == null ){
                this.timer = setInterval(function(){
                    if( that.socket.readyState != 1 ){
                        if( self.is_tmp == 0 ){
                            self.httpApi.getAccessToken(function(){
                                clearInterval(that.timer);
                                that.connect();
                            });
                        }else{
                            self.httpApi.getTmpAccessToken(function(){
                                clearInterval(that.timer);
                                that.connect();
                            });
                        }
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
                throw 'message.chat is undefined!';
            }
            if( typeof message.to_id == 'undefined' ){
                var chatStorage = self.getChatStorage(message.chat_type);
                message.to_id = chatStorage.session.to_id;
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
            this.socket.send(msg); 
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
            }else if( message.topic == 'wait_customer_join' ){
                this.waitCustomerJoinTopic(message.msg);
            }else if( message.topic == 'customer_join' ){
                this.customerJoinTopic(message.msg);
            }else if( message.topic == 'cusomter_new_user' ){
                this.customerNewUserTopic(message.msg);
            }else if( message.topic == 'consult_not_start' ){
                this.consultNotStart(message.msg);
            }else if( message.topic == 'consult_time' ){
                this.consultTime(message.msg);
            }
        },
        //上线
        onlineTopic:function onlineTopic(msg){
            if( msg.tmp == 0 ){
                for( var i=0;i<self.chat.sessions.length;i++ ){
                    if( self.chat.sessions[i].to_id == msg.uid ){
                        self.chat.sessions[i].online = 1;
                        $("audio")[0].play();
                    }
                }
                for( var i=0;i<self.consult.sessions.length;i++ ){
                    if( self.consult.sessions[i].to_id == msg.uid ){
                        self.consult.sessions[i].online = 1;
                        $("audio")[0].play();
                    }
                }
            }else if( msg.tmp == 1 ){
                for( var i=0;i<self.customer.sessions.length;i++ ){
                    if( self.customer.sessions[i].to_id == msg.uid ){
                        self.customer.sessions[i].online = 1;
                        $("audio")[0].play();
                    }
                }
            }
            
        },
        //下线
        offlineTopic:function offlineTopic(msg){
            if( msg.tmp == 0 ){
                for( var i=0;i<self.chat.sessions.length;i++ ){
                    if( self.chat.sessions[i].to_id == msg.uid ){
                        self.chat.sessions[i].online = 0;
                    }
                }
                for( var i=0;i<self.consult.sessions.length;i++ ){
                    if( self.consult.sessions[i].to_id == msg.uid ){
                        self.consult.sessions[i].online = 0;
                    }
                }
            }else if( msg.tmp == 1 ){
                for( var i=0;i<self.customer.sessions.length;i++ ){
                    if( self.customer.sessions[i].to_id == msg.uid ){
                        self.customer.sessions[i].online = 0;
                    }
                }
                for( var i=0;i<self.customer.contacts.length;i++ ){
                    if( self.customer.contacts[i].to_id == msg.uid ){
                        self.customer.contacts.splice(i,1);
                    }
                }
            }
        },
        //消息
        messageTopic:function messageTopic(msg){
            var chatStorage = self.getChatStorage(msg.chat_type);
            var exist = 0;
            for( var i=0;i<chatStorage.sessions.length;i++ ){
                if( chatStorage.sessions[i].chat_type != msg.chat_type ){
                    continue;
                }
                //
                if( msg.chat_type == onlineChat.CHAT_TYPE_CHAT || msg.chat_type == onlineChat.CHAT_TYPE_CUSTOMER || msg.chat_type == onlineChat.CHAT_TYPE_CONSULT ){
                    if( 
                        ( msg.uid == chatStorage.sessions[i].uid && msg.to_id == chatStorage.sessions[i].to_id )
                        || (msg.uid == chatStorage.sessions[i].to_id && msg.to_id == chatStorage.sessions[i].uid )
                    ){
                        Vue.set(chatStorage.sessions[i].messages,chatStorage.sessions[i].messages.length,msg);
                        chatStorage.sessions[i].lastMessage = msg;
                        exist = 1;
                        break;
                    }
                }else if( msg.chat_type == onlineChat.CHAT_TYPE_GROUP_CHAT ){
                    if( msg.to_id == chatStorage.sessions[i].to_id ){
                        Vue.set(chatStorage.sessions[i].messages,chatStorage.sessions[i].messages.length,msg);
                        chatStorage.sessions[i].lastMessage = msg;
                        exist = 1;
                        break;
                    }
                }
                if( chatStorage.sessions[i].chat_type == msg.chat_type && (chatStorage.sessions[i].to_id == self.userinfo.uid) ){
                    Vue.set(chatStorage.sessions[i].messages,chatStorage.sessions[i].messages.length,msg);
                    chatStorage.sessions[i].lastMessage = msg;
                    exist = 1;
                    break;
                }
            }
            if( exist == 1 ){
                if( i > 0 ){
                    var session = chatStorage.sessions.splice(i,1)[0];
                    chatStorage.sessions.unshift(session);
                    if( i == chatStorage.sessionIndex ){
                        chatStorage.sessionIndex = 0;
                        self.sle_scroll_top();
                    }else if( i > chatStorage.sessionIndex ){
                        chatStorage.sessionIndex++;
                    }
                    
                }
            }else{
                var session = {
                    chat_type: msg.chat_type,
                    head_img:msg.head_img,
                    lastMessage:msg,
                    messages: [msg],
                    name: msg.name,
                    to_id:msg.uid,
                    uid: msg.to_id,
                    online:1,
                    hasGetMessage:true
                };
                Vue.set( chatStorage.sessions,chatStorage.sessions.length,session );
                session = chatStorage.sessions.pop();
                chatStorage.sessions.unshift(session);
            }
        },
        //有新的用户等待咨询客服
        waitCustomerJoinTopic:function waitCustomerJoinTopic(msg){
            var contact = {
                chat_type: 2,
                head_img: "",
                name: "",
                to_id: msg.uid
            };
            Vue.set( self.customer.contacts,self.customer.contacts.length,contact);
        },
        //客户已接入
        customerJoinTopic: function customerJoinTopic(msg){
            //客户收到的情况，这段代码有用
            for( var i=0;i<self.customer.contacts.length;i++ ){
                if( self.customer.contacts[i].to_id == msg.uid ){
                    self.customer.contacts.splice(i,1);
                }
            }
            //用户收到的情况，这段代码有用
            if( typeof self.customer.session.uid != 'undefined' && self.customer.session.uid == msg.to_id ){
                self.customer.session.to_id = msg.uid;
                Vue.set(self.customer.session.messages,self.customer.session.messages.length,msg);
            }

        },
        //新用户加入的欢迎消息
        customerNewUserTopic: function customerNewUserTopic(msg){
            Vue.set(self.customer.session.messages,self.customer.session.messages.length,msg);
        },
        //未开启咨询的消息
        consultNotStart:function consultNotStart(msg){
            Vue.set(self.consult.session.messages,self.consult.session.messages.length,msg);
        },
        //计时消息
        consultTime:function consultTime(msg){
            for( var i=0;i<self.consult.sessions.length;i++ ){
                if( typeof self.consult.sessions[i].consult_time != 'undefined' &&  typeof self.consult.sessions[i].consult_time.id != 'undefined' ){
                    if( msg.consult_time.id == self.consult.sessions[i].consult_time.id ){
                        if( msg.status == 3 ){
                            Vue.set(self.consult.sessions[i],'consult_time',[]);
                        }else{
                            Vue.set(self.consult.sessions[i],'consult_time',msg.consult_time);
                        }
                        
                    }
                }
            }
        }
    }
    //在线聊天http的api
    function httpApi(){
        
    }
    httpApi.prototype = {
        constructor:httpApi,
        //登陆
        doLogin:function doLogin(data,cb){
            $.ajax({
                url: self.httpApiHost + "/index.php/online_chat/chat/doLogin",
                type: "POST",
                data: data,
                success:function(data){
                    data = $.parseJSON(data);
                    sessionStorage.setItem('online_chat_phpsessid',data.data.PHPSESSID);
                    cb(data);
                }
            });
        },
        //获取websocket访问的token
        getAccessToken:function getAccessToken(cb){
            //$.ajaxSettings.async = false;
            this.httpGet( self.httpApiHost + '/index.php/online_chat/chat/getWebsocketAccessToken',function(data){
                self.debug && console.log(data);
                data = $.parseJSON(data);
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
                        window.location.href=self.noLoginJumpUrl;
                    }
                }
            });
            //$.ajaxSettings.async = true;
        },
        //获取临时websocket访问的token
        getTmpAccessToken:function getTmpAccessToken(cb){
            //$.ajaxSettings.async = false;
            this.httpGet( self.httpApiHost + '/index.php/online_chat/chat/getTmpWebsocketAccessToken',function(data){
                self.debug && console.log(data);
                data = $.parseJSON(data);
                if( data.code == 200 ){
                    self.userinfo.uid = data.data.userinfo.uid;
                    self.userinfo.name = data.data.userinfo.name;
                    self.userinfo.head_img = data.data.userinfo.head_img;
                    self.wesocket_access_token = data.data.wesocket_access_token;
                    self.ws_addr = data.data.ws_addr;
                    if( data.data.to_id == '' ){
                        var to_id = 0;
                    }else{
                        var to_id = data.data.to_id;
                    }
                    var session = {
                        uid:data.data.userinfo.uid,
                        head_img:'',
                        name:'',
                        lastMessage:null,
                        last_time:0,
                        messages:[],
                        online:data.data.online,
                        to_id:to_id,
                        chat_type:onlineChat.CHAT_TYPE_CUSTOMER
                    };
                    Vue.set(self.customer.sessions,0,session);
                    self.customer.sessionIndex = 0;
                    self.customer.session = self.customer.sessions[0];
                    self.httpApi.getMessages(data.data.userinfo.uid,self.CHAT_TYPE_CUSTOMER);
                    if( typeof cb != 'undefined' ){
                        cb();
                    }
                }
            });
            //$.ajaxSettings.async = true;
        },
        //加入一个聊天会话
        joinSession:function joinSession(chat_type,to_id){
            this.httpGet(self.httpApiHost+'/index.php/online_chat/session/joinSession',{chat_type:chat_type,to_id:to_id},function(data){
                data = $.parseJSON(data);
                self.debug && console.log(data);
                var chatStorage = self.getChatStorage(chat_type);
                for( var i=0;i<chatStorage.sessions.length;i++ ){
                    if( chatStorage.sessions[i].to_id == to_id && chatStorage.sessions[i].chat_type == chat_type ){
                        if( chat_type != self.CHAT_TYPE_GROUP_CHAT){
                            chatStorage.sessions[i].online = data.data.online;
                            break;
                        }else{
                            chatStorage.sessions[i].online = 1;
                            break;
                        }
                    }
                }
                if( chat_type == self.CHAT_TYPE_GROUP_CHAT || chat_type == self.CHAT_TYPE_CUSTOMER ){
                    onlineChat.httpApi.getMessages(to_id,chat_type);
                }
            });
        },
        //获取所有聊天会话
        getSessions:function getSessions(chat_type,cb){
            var chatStorage = self.getChatStorage(chat_type);
            if( chat_type == self.CHAT_TYPE_CONSULT ){
                var url = self.httpApiHost+'/index.php/online_chat/session/index?user_type=2';
            }else{
                var url = self.httpApiHost+'/index.php/online_chat/session/index';
            }
            this.httpGet(url,function(data){
                data = $.parseJSON(data);
                self.debug && console.log(data);
                for( var i=0;i<data.data.length;i++ ){
                    Vue.set(chatStorage.sessions,i,data.data[i]);
                }
                chatStorage.hasGetsessions = true;
                if( typeof cb == 'function' ){
                    cb(data);
                }
            });
        },
        //获取所有联系人
        getContacts:function getContacts(chat_type,cb){
            var chatStorage = self.getChatStorage(chat_type);
            this.httpGet(self.httpApiHost+'/index.php/online_chat/session/getContacts',function(data){
                data = $.parseJSON(data);
                self.debug && console.log(data);
                for( var i=0;i<data.data.length;i++ ){
                    Vue.set(chatStorage.contacts,i,data.data[i]);
                }
                if( typeof cb == 'function' ){
                    cb(data);
                }
            });
        },
        //获取会话历史聊天记录
        getMessages:function getMessages(to_id,chat_type){
            var chatStorage = self.getChatStorage(chat_type);
            this.httpGet(self.httpApiHost+ '/index.php/online_chat/message/index',{to_id:to_id,chat_type:chat_type},function(data){
                data = $.parseJSON(data);
                self.debug && console.log(data);
                data = data.data;
                for( var i=0;i<data.length;i++ ){
                    Vue.set(chatStorage.session.messages,chatStorage.session.messages.length,data[i]);
                }
            });
        },
        //获取咨询师
        getConsults:function getConsults(){
            this.httpGet(self.httpApiHost+ '/index.php/online_chat/session/getConsults',function(data){
                data = $.parseJSON(data);
                self.debug && console.log(data);
                data = data.data;
                for( var i=0;i<data.length;i++ ){
                    Vue.set(onlineChat.consult.contacts,onlineChat.consult.contacts.length,data[i]);
                }
            });
        },
        //获取咨询时长
        getConsultTime:function getConsultTime(){
            $.get('/index.php/online_chat/consult_time/getConsultTime?to_id='+self.consult.session['to_id'],function(data){
                data = $.parseJSON(data);
                self.debug && console.log(data);
                data = data.data;
                Vue.set(self.consult.session,'showFreeButton',0);
                Vue.set(self.consult.session,'consult_time',data.consult_time);
                Vue.set(self.consult.session,'freeConsult',data.freeConsult);
                if( typeof self.consult.session.consult_time.status == 'undefined' || self.consult.session.consult_time.status == 3 ){
                    if( self.consult.session.freeConsult == 1 ){ //显示免费咨询按钮
                        Vue.set(self.consult.session,'showFreeButton',1);
                    }
                }
            });
        },
        //购买时长
        addConsult:function addConsult(){
            if( typeof self.consult.session.chat_type == 'undefined' ){
                alert('请选择聊天！');
                return;
            }
            this.httpPost(self.httpApiHost+ '/index.php/online_chat/consult_time/addConsult',{to_id:self.consult.session.to_id},function(data){
                data = $.parseJSON(data);
                self.debug && console.log(data);
                data = data.data;
                Vue.set(self.consult.session,'consult_time',data.consult_time);
            });
        },
        //添加免费咨询时长
        addFreeConsult:function addFreeConsult(){
            if( typeof self.consult.session.chat_type == 'undefined' ){
                alert('请选择聊天！');
                return;
            }
            this.httpPost(self.httpApiHost+ '/index.php/online_chat/consult_time/addFreeConsult',{to_id:self.consult.session.to_id},function(data){
                data = $.parseJSON(data);
                self.debug && console.log(data);
                data = data.data;
                Vue.set(self.consult.session,'showFreeButton',0);
                Vue.set(self.consult.session,'consult_time',data.consult_time);
            });
        },
        //延时咨询
        delayedDuration:function delayedDuration(){
            delayed_duration = 1800;
            this.httpPost(self.httpApiHost+ '/index.php/online_chat/consult_time/delayedDuration',{consult_time_id:onlineChat.consult.session.consult_time.id,delayed_duration:delayed_duration},function(data){
                data = $.parseJSON(data);
                self.debug && console.log(data);
                if( data.code == 200 ){
                    self.consult.session.consult_time.duration_count += delayed_duration;
                }
            });
        },
        //开始咨询
        startConsult:function startConsult(){
            if( typeof self.consult.session.chat_type == 'undefined' ){
                alert('请选择聊天！');
                return;
            }
            if( typeof self.consult.session.consult_time == 'undefined' ){
                console.log('session[consult_time]不存在！');
                return;
            }
            if( typeof self.consult.session.consult_time.id == 'undefined' ){
                console.log('session[consult_time][consult_time_id]不存在！');
                return;
            }
            this.httpPost(self.httpApiHost+ '/index.php/online_chat/consult_time/startConsult',{consult_time_id:onlineChat.consult.session.consult_time.id},function(data){
                data = $.parseJSON(data);
                self.debug && console.log(data);
                if( data.code == 200 ){
                    self.consult.session.consult_time.status = 1;
                }else{
                    alert(data.msg);
                }
            });
        },
        //暂停咨询
        suspendConsult:function suspendConsult(){
            if( typeof self.consult.session.chat_type == 'undefined' ){
                alert('请选择聊天！');
                return;
            }
            this.httpPost(self.httpApiHost+ '/index.php/online_chat/consult_time/suspendConsult',{consult_time_id:onlineChat.consult.session.consult_time.id},function(data){
                data = $.parseJSON(data);
                self.debug && console.log(data);
                if( data.code == 200 ){
                    self.consult.session.consult_time.status = 2;
                }else{
                    self.consult.session.consult_time.status = 2;
                    alert(data.msg);
                }
            });
        },
        //上传文件
        uploadFile:function uploadFile(param) {
            
            if( typeof param.chat_type == 'undefined' ){
                throw 'param.chat_type is undefined!';
            }
            if( typeof param.to_id == 'undefined' ){
                var chatStorage = self.getChatStorage(param.chat_type);
                param.to_id = chatStorage.session.to_id;
            }
            var myform = new FormData();
            myform.append('file',param.file);
            $.ajax({
                url: self.httpApiHost + "/index.php/online_chat/file/upload",
                type: "POST",
                data: myform,
                headers:{
                    token:sessionStorage.getItem('online_chat_phpsessid') == null ? '' : sessionStorage.getItem('online_chat_phpsessid')
                },
                contentType: false,
                processData: false,
                success: function (data) {
                    self.debug && console.log(data);
                    data = $.parseJSON(data);
                    if( data.code != 200 ){
                        self.alertMsg(data.msg);
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
                        chat_type:param.chat_type,
                        to_id:param.to_id,
                        msg:data.msg_content,
                        msg_type:data.data.msg_type
                    });
                },
                error:function(data){
                    console.log(data)
                }
            });
        },
        httpGet:function httpGet(url,data,cb){
            if( typeof data == 'function' && typeof cb == 'undefined' ){
                cb = data;
                data = {};
            }
            var token = sessionStorage.getItem('online_chat_phpsessid');
            if( token == null ){
                token = '';
            }
            $.ajax({
                type:'GET',
                url:url,
                data:data,
                headers:{
                    token:token,
                },
                success:function(data){
                    cb(data);
                }
            });
        },
        httpPost:function httpGet(url,data,cb){
            if( typeof data == 'function' && typeof cb == 'undefined' ){
                cb = data;
                data = {};
            }
            var token = sessionStorage.getItem('online_chat_phpsessid');
            if( token == null ){
                token = '';
            }
            $.ajax({
                type:'POST',
                url:url,
                data:data,
                headers:{
                    token:token,
                },
                success:function(data){
                    cb(data);
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
        },
        timeToStr:function(sec){
            $hour = parseInt ( (sec / 3600) );
            $min = parseInt( (sec % 3600 ) / 60  );
            $sec = sec % 3600 % 60;
            if( $hour < 10 ){
                $hour = '0' + $hour;
            }else{
                $hour = $hour.toString();
            }
            if( $min < 10 ){
                $min = '0' + $min;
            }else{
                $min = $min.toString();
            }
            if( $sec < 10 ){
                $sec = '0' + $sec;
            }else{
                $sec = $sec.toString();
            }
            //console.log( $hour + ':' + $min + ':' + $sec );
            return $hour + ':' + $min + ':' + $sec;
        }
    }
    
    //数据转化  
    function formatNumber(n) {
        n = n.toString()
        return n[1] ? n : '0' + n
    }
    
    window.online_chat_js_sdk = online_chat_js_sdk;
})();