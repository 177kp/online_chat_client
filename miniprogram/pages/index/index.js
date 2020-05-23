//index.js
//获取应用实例
const app = getApp()
var onlineChat = require('../../utils/online_chat_js_sdk.js');
Page({
  data: {
    sessions:[],
    fileHost:getApp().globalData.fileHost
  },
  test:function(){
    console.log(1);
  },
  onLoad: function () {
    var app = getApp();
    var that = this;
    var timer = setInterval(function(){
      if( that.data.sessions.length != app.globalData.sessions.length || app.globalData.newMessage == true ){
        for( var i=0;i<app.globalData.sessions.length;i++ ){
          if( app.globalData.sessions[i].lastMessage != null &&   typeof app.globalData.sessions[i].lastMessage.ctime != 'undefined' && typeof app.globalData.sessions[i].lastMessage.ctimeFormat == 'undefined' ){
            app.globalData.sessions[i].lastMessage.ctimeFormat = onlineChat.sessionFormatTime(app.globalData.sessions[i].lastMessage.ctime*1000);
          }
        }
        that.setData({
          sessions:app.globalData.sessions
        });
        app.globalData.newMessage = false;
      }
    },100);
  }
})
