// pages/contact/contact.js
var onlineChat = require('../../utils/online_chat_js_sdk.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    contacts:[],
    fileHost:getApp().globalData.fileHost
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var app = getApp();
    var that = this;
    var timer = setInterval(function(){
      if( app.globalData.contacts !== null ){
        that.setData({
          contacts:app.globalData.contacts
        });
        clearInterval(timer);
        //console.log(app.globalData.contacts);
      }
    },100);
  },
  joinSession(res){
    var chat_type = res.currentTarget.dataset.chatType;
    var to_id = res.currentTarget.dataset.toId;
    var app = getApp();
    var that = this;
    var sessions = app.globalData.sessions;
    var contacts = app.globalData.contacts;
    for( var i=0;i<contacts.length;i++ ){
      if( contacts[i].to_id==to_id && contacts[i].chat_type == chat_type ){
        var contact = contacts[i];
        break;
      }
    }
    for (var i = 0; i < sessions.length; i++) {
        if (contact.chat_type == sessions[i].chat_type &&
            contact.to_id == sessions[i].to_id) {
            var session = app.globalData.sessions.splice(i, 1)[0];
            app.globalData.sessions.unshift(session);
            wx.navigateTo({
              url: '/pages/chat/chat?to_id='+session.to_id+'&chat_type='+session.chat_type　　// 页面 B
            });
            return;
        }
    }
    app.globalData.sessions.unshift({
        chat_type: contact.chat_type,
        head_img: contact.head_img,
        lastMessage: null,
        messages: [],
        name: contact.name,
        to_id: contact.to_id,
        uid: app.globalData.currentUser.uid
    });
    session = sessions[0];
    wx.navigateTo({
      url: '/pages/chat/chat?to_id='+session.to_id+'&chat_type='+session.chat_type　　// 页面 B
    });
    onlineChat.joinSession(contact.chat_type,contact.to_id,function(data){

    });

  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})