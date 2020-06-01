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
      if( onlineChat.contacts !== null ){
        that.setData({
          contacts:onlineChat.contacts
        });
        clearInterval(timer);
        //console.log(app.globalData.contacts);
      }
    },100);
  },
  joinSession(res){
    var chat_type = res.currentTarget.dataset.chatType;
    var to_id = res.currentTarget.dataset.toId;
    var sessions = onlineChat.sessions;
    var contacts = onlineChat.contacts;
    for( var i=0;i<contacts.length;i++ ){
      if( contacts[i].to_id==to_id && contacts[i].chat_type == chat_type ){
        var contact = contacts[i];
        break;
      }
    }
    onlineChat.joinSession(i,function(session){
      wx.navigateTo({
        url: '/pages/chat/chat?to_id='+session.to_id+'&chat_type='+session.chat_type　　// 页面 B
      });
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