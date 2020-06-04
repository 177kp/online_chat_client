//app.js
var onlineChat = require( 'pages/onlineChat/utils/online_chat_js_sdk.js' );
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
        //console.log(userinfo);
        onlineChat.httpApi.wxMiniProgramLogin(loginRes.code,userinfo.nickName,userinfo.avatarUrl,function(){
          onlineChat.httpApi.getAccessToken(function(){
            onlineChat.httpApi.getSessions();
            onlineChat.httpApi.getContacts();
            onlineChat.socketClient.connect();
          });
        });
      }
    })
  },
  joinSession(){
    onlineChat.joinSession(1,2,function(data){
    });
  },
  globalData: {
    onlineChat:{
      newMessage:false
    }
  }
})