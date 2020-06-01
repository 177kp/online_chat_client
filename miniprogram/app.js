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
        onlineChat.httpApi.wxMiniProgramLogin(loginRes.code,userinfo.nickname,userinfo.avatarUrl,function(){
          onlineChat.httpApi.getAccessToken(function(){
            onlineChat.httpApi.getSessions();
            onlineChat.httpApi.getContacts();
            onlineChat.socketClient.connect();
          });
        });
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
  globalData: {
    userInfo: null,
    sessions:[],
    contacts:null,
    newMessage:false,
    fileHost:'',
    header:{
      'content-type':'application/x-www-form-urlencoded',
      'cookie': wx.getStorageSync("token")
    },
    currentUser: wx.getStorageSync('currentUser')
  }
})