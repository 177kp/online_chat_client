//index.js
//获取应用实例
const app = getApp()
var onlineChat = require('../../utils/online_chat_js_sdk.js');
Page({
  data: {
    sessions:[],
    fileHost:getApp().globalData.fileHost
  },
  onLoad: function () {
    var app = getApp();
    var that = this;
    var timer = setInterval(function(){
      if( that.data.sessions.length != onlineChat.sessions.length || app.globalData.newMessage == true ){
        for( var i=0;i<onlineChat.sessions.length;i++ ){
          if( onlineChat.sessions[i].lastMessage != null &&   typeof onlineChat.sessions[i].lastMessage.ctime != 'undefined' && typeof onlineChat.sessions[i].lastMessage.ctimeFormat == 'undefined' ){
            onlineChat.sessions[i].lastMessage.ctimeFormat = onlineChat.helper.sessionFormatTime(onlineChat.sessions[i].lastMessage.ctime*1000);
          }
        }
        that.setData({
          sessions:onlineChat.sessions
        });
        app.globalData.newMessage = false;
      }
    },500);
  }
})
