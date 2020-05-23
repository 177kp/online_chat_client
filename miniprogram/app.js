//app.js
var onlineChat = require( 'utils/online_chat_js_sdk.js' );
//console.log(onlineChat);
App({
  onLaunch: function () {
    wx.getUserInfo({
      success: res => {
        //console.log(res);
        var userinfo = JSON.parse(res.rawData);
        //console.log(userinfo);
        this.doLogin(userinfo);
      }
    })
  },
  doLogin( userinfo ){
    var that = this;
    wx.login({
      success: loginRes => {
        wx.request({
          url: that.globalData.fileHost+'/index.php/online_chat/chat/wxMiniProgramLogin', //仅为示例，并非真实的接口地址
          method:"get",
          data: {
            code: loginRes.code,
            name:userinfo.nickName,
            head_img:userinfo.avatarUrl
          },
          header: {
            'content-type': 'application/json' // 默认值
          },
          success(data) {
            //console.log(data.cookies[0].split(';')[0]);
            wx.setStorageSync("token", data.cookies[0].split(';')[0])
            onlineChat.getAccessToken(function () {
              console.log(onlineChat.currentUser );
              wx.setStorageSync("currentUser",onlineChat.currentUser);
              //连接websocket服务
              onlineChat.connect();
            });
            that.getSessions();
            that.getContacts();
            onlineChat.on('message',function(data){
              that.onMessage(data);
            });
          }
        })
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
  },
  getSessions(){
    var that = this;
    onlineChat.getSessions(function(data){
      that.globalData.sessions = data.data;
    });
  },
  joinSession(){
    onlineChat.joinSession(1,2,function(data){
    });
  },
  getContacts(){
    var that = this;
    onlineChat.getContacts( function (data) {
      that.globalData.contacts = data.data;
    });
  },
  getMessages(){
    onlineChat.getMessages(1, 2, function (data) {
    });
  },
  onMessage(data){
    var msg = data.msg;
    var topic = data.topic;
    if( topic == 'online' ){
      for( var i=0;i<this.globalData.sessions.length;i++ ){
        if( this.globalData.sessions[i].to_id == msg.uid ){
            this.globalData.sessions[i].online = 1;
        }
      }
      this.globalData.newMessage = true;
      return;
    }else if( topic == 'offline' ){
      for( var i=0;i<this.globalData.sessions.length;i++ ){
          if( this.globalData.sessions[i].to_id == msg.uid ){
              this.globalData.sessions[i].online = 0;
          }
      }
      this.globalData.newMessage = true;
      return;
    }else if( topic == 'message' ){
      var exist = 0;
      for (var i = 0; i < this.globalData.sessions.length; i++) {
          if (this.globalData.sessions[i].chat_type != msg.chat_type) {
              continue;
          }
          //
          if (msg.chat_type == 0) {
              if (
                  (msg.uid == this.globalData.sessions[i].uid && msg.to_id == this.globalData.sessions[i].to_id) ||
                  (msg.uid == this.globalData.sessions[i].to_id && msg.to_id == this.globalData.sessions[i].uid)
              ) {
                  this.globalData.sessions[i].lastMessage = msg;
                  this.globalData.sessions[i].messages.push(msg);
                  exist = 1;
                  break;
              }
          } else if (msg.chat_type == 1) {
              if (msg.to_id == this.globalData.sessions[i].to_id) {
                  this.globalData.sessions[i].lastMessage = msg;
                  this.globalData.sessions[i].messages.push(msg);
                  exist = 1;
                  break;
              }
          }
      }
      //console.log(msg);
      if (exist == 1) {
          var session = this.globalData.sessions.splice(i, 1)[0];
      } else {
          var session = {
              chat_type: msg.chat_type,
              head_img: msg.head_img,
              lastMessage: msg,
              messages: [msg],
              name: msg.name,
              to_id: msg.uid,
              uid: msg.to_id
          };
      }
      //console.log(session);
      session.newMessage =  true;
      this.globalData.sessions.unshift(session);
      this.globalData.newMessage = true;
    }
  },
  globalData: {
    userInfo: null,
    sessions:[],
    contacts:null,
    newMessage:false,
    fileHost:'http://192.168.5.29',
    header:{
      'content-type':'application/x-www-form-urlencoded',
      'cookie': wx.getStorageSync("token")
    },
    currentUser: wx.getStorageSync('currentUser')
  }
})