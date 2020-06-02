// pages/chat/chat.js
var onlineChat = require('../../utils/online_chat_js_sdk.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    faceImgs:[],
    faceContainerShow:false,
    fileContainerShow:false,
    editorCtx:null,
    sendBtnShow:false,
    session:null,
    currentUser:null,
    scrollTop:100000,
    chatMessageBottom:'108rpx',
    chatInputModel:'txt',
    recording:false,
    videoSrc:''
  },
  showFace(event){
    this.setData({
      faceContainerShow:true,
      fileContainerShow:false,
      chatInputModel:'txt'
    });
    this.textContentHeightChange();
  },
  showFile(event){
    this.setData({
      faceContainerShow:false,
      fileContainerShow:true,
      chatInputModel:'txt'
    });
    this.textContentHeightChange();
  },
  hideFaceFile(event){
    this.setData({
      faceContainerShow:false,
      fileContainerShow:false
    });
    this.textContentHeightChange();
  },
  onEditorReady() {
    const that = this;
    wx.createSelectorQuery().select('#wx-editor').context(function (res) {
      that.editorCtx = res.context
    }).exec()
  },
  onEditorChange(){
    var that = this;
    this.editorCtx.getContents({success:function(res){
      //console.log( res.html.indexOf('<img') );
      if( res.text.replace("\n",'') != '' || res.html.indexOf('<img') > -1 ){
        that.setData({
          sendBtnShow:true
        });
      }else{
        that.setData({
          sendBtnShow:false
        });
      }
    }});
    this.textContentHeightChange();
  },
  blur() {
    this.editorCtx.blur()
  },
  insertFaceImg:function(event){
    var imgSrc = onlineChat.fileHost + '/static'+event.currentTarget.dataset.faceImg;
    const that = this;
    this.editorCtx.getContents({
      success:function(res){
        //console.log(res.delta.ops);
        var delta = [];
        for( var i=0;i<res.delta.ops.length;i++ ){
          //console.log( typeof res.delta.ops[i].insert.image );
          //console.log( typeof res.delta.ops[i].insert );
          if( typeof res.delta.ops[i].insert.image != "undefined" ){
             delta.push(res.delta.ops[i]);
          }else if( typeof res.delta.ops[i].insert == "string" && res.delta.ops[i].insert.length > 1){
            //console.log( res.delta.ops[i].insert.replace("\n","") );
            delta.push({
              insert:res.delta.ops[i].insert.replace("\n","")
            });
          }
        }
        delta.push({
          attributes:{
            height:'22px',
            width:'22px',
            class:'face-img'
          },
          insert:{
            image:imgSrc
          }
        });
        //console.log(delta);
        that.editorCtx.setContents({delta});
        that.onEditorChange();
      }
    });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var app = getApp();
    var that = this;
    var faceImgs = [];
    for( var i=1;i<73;i++){
      faceImgs.push('/img/face/'+i+'.png');
    }
    this.setData({
      faceImgs
    });
    var timer = setInterval(function(){
      if( onlineChat.userinfo != null ){
        that.setData({
          currentUser:onlineChat.userinfo
        });
        clearInterval(timer);
      }
    },500);
    var currentPage = getCurrentPages().pop();
    //console.log(currentPage.options);
    setInterval(function(){
      for( var i=0;i<onlineChat.sessions.length;i++ ){
        if( onlineChat.sessions[i].to_id == currentPage.options.to_id && onlineChat.sessions[i].chat_type == currentPage.options.chat_type ){
          if( that.data.session == null ){
            that.data.session = onlineChat.sessions[i];
            that.getMessages(onlineChat.sessions[i]);
            onlineChat.sessions[i].newMessage = false;
            setTimeout(function(){
              that.chatMessageScrollBottom();
            },200);
          }else if( onlineChat.sessions[i].newMessage == true ){
            //console.log(onlineChat.sessions[i]);
            that.setData({
              session:onlineChat.sessions[i]
            });
            onlineChat.sessions[i].newMessage = false;
            that.chatMessageScrollBottom();
          }
        }
      }
    },100);
  },
  getMessages(session){
    var that = this;
    onlineChat.httpApi.getMessages(session.to_id,session.chat_type,function(data){
        session.messages = data;
        for( var j=0;j<session.messages.length;j++ ){
          if( typeof session.messages[j].ctimeFormat == 'undefined' ){
            session.messages[j].ctimeFormat = onlineChat.helper.messageFormatTime(session.messages[j].ctime*1000);
          }
        }
        console.log(session);
        that.setData({
          session:session
        });
        setTimeout(function(){
          that.chatMessageScrollBottom();
        },50);
    });
  },
  sendMsg(){
    var that = this;
    this.editorCtx.getContents({
      success:function(res){
        var message = res.html;
        if( /<img[^>]*>/.test( message ) ){
            var msg_type = onlineChat.MSG_TYPE_RICH_TXT;
        }else{
            message = res.text;
            var msg_type = onlineChat.MSG_TYPE_TXT;
        }
        if( message == '' ){
            console.log('消息不能为空！');
            return;
        }
        //console.log(that.data.session);
        onlineChat.socketClient.sendMessage({
            chat_type:that.data.session.chat_type,
            to_id:that.data.session.to_id,
            msg:message,
            msg_type:msg_type
        });
        that.editorCtx.clear('');
        that.onEditorChange();
        that.hideFaceFile();
      }
    });
  },
  chatMessageScrollBottom(){
    var  that = this;
    var query = wx.createSelectorQuery();
    query.select('#chat-message').boundingClientRect(function(res){
      that.setData({
          scrollTop: 100000
      })
    }).exec();

  },
  textContentHeightChange(){
    var that = this;
    var query = wx.createSelectorQuery();
    query.select('.text-content').boundingClientRect().exec(function(rect){
      console.log(rect[0].height + 'px');
      if( that.data.chatMessageBottom != rect[0].height + 'px' ){
        that.setData({
          chatMessageBottom:rect[0].height + 'px'
        });
      }
    });
    this.chatMessageScrollBottom();
  },
  changeChatInputModel(){
    if( this.data.chatInputModel == 'txt' ){
      this.setData({
        chatInputModel:'sound',
        sendBtnShow:false
      });
    }else{
      this.setData({
        chatInputModel:'txt',
        sendBtnShow:false
      });
    }
  },
  startRecord(){
    this.setData({
      recording:true
    });
    var that = this;
    const recorderManager = wx.getRecorderManager()

    recorderManager.onStop((res) => {
      onlineChat.httpApi.uploadFile(res.tempFilePath,that.data.session.to_id,that.data.session.chat_type);
    })

    const options = {
      duration: 10000,
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 96000,
      format: 'mp3',
      frameSize: 50
    }
    recorderManager.start(options)
  },
  stopRecord(){
    this.setData({
      recording:false
    });
    const recorderManager = wx.getRecorderManager();
    recorderManager.stop();
  },
  uploadImg(){
    var that =  this;
    wx.chooseImage({
      count: 3,
      sizeType: ['original', 'compressed'],
      sourceType: ['album'],
      success (res) {
        // tempFilePath可以作为img标签的src属性显示图片
         for( var i=0;i<res.tempFilePaths.length;i++ ){
           onlineChat.httpApi.uploadFile(res.tempFilePaths[i],that.data.session.to_id,that.data.session.chat_type);
         }
      }
    });
    that.hideFaceFile();
  },
  take_a_img(){
    var that =  this;
    wx.chooseImage({
      count: 3,
      sizeType: ['original', 'compressed'],
      sourceType: ['camera'],
      success (res) {
        // tempFilePath可以作为img标签的src属性显示图片
         for( var i=0;i<res.tempFilePaths.length;i++ ){
           onlineChat.httpApi.uploadFile(res.tempFilePaths[i],that.data.session.to_id,that.data.session.chat_type);
         }
         
      }
    });
    that.hideFaceFile();
  },
  take_a_vedio(){
    var that =  this;
    wx.chooseVideo({
      sourceType: ['album','camera'],
      maxDuration: 60,
      camera: 'back',
      success(res) {
        onlineChat.httpApi.uploadFile(res.tempFilePath,that.data.session.to_id,that.data.session.chat_type);
        
      }
    });
    that.hideFaceFile();
  },
  playVideo(res){
    this.setData({
      videoSrc:res.currentTarget.dataset.videoSrc
    });
  },
  closeVideo(){
    this.setData({
      videoSrc:''
    });
  },
  showImgList(res){
    var imgSrc = res.currentTarget.dataset.imgSrc;
    var imgs = [];
    for( var i=0;i<this.data.session.messages.length;i++ ){
      //console.log( this.data.session.messages[i].msg_type );
      if( this.data.session.messages[i].msg_type==1 ){
        imgs.push(this.data.fileHost+this.data.session.messages[i].msg);
      }
    }
    console.log(imgs);
    wx.previewImage({
      current: imgSrc, // 当前显示图片的http链接
      urls: imgs // 需要预览的图片http链接列表
    })
  },
  audioPlay(res){
    var audioSrc = res.currentTarget.dataset.audioSrc;
    var that = this;
    if( typeof this.data.innerAudioContext != 'undefined' && this.data.innerAudioContext != null ){
      this.data.innerAudioContext.destroy();
      if( this.data.audioSrc == audioSrc ){
        this.data.innerAudioContext = null;
        return;
      }
    }
    this.data.audioSrc = audioSrc;
    this.data.innerAudioContext = wx.createInnerAudioContext();
    this.data.innerAudioContext.autoplay = true;
    this.data.innerAudioContext.src = audioSrc;
    this.data.innerAudioContext.onPlay(() => {
      console.log('开始播放')
    })
    this.data.innerAudioContext.onError((res) => {
      console.log(res.errMsg)
      console.log(res.errCode)
    });
    this.data.innerAudioContext.onEnded(function(){
      that.data.innerAudioContext.destroy();
      that.data.innerAudioContext = null;
    });
  },
  downloadFile(res){
    var fileSrc = res.currentTarget.dataset.fileSrc;
    var filename = res.currentTarget.dataset.filename;
    wx.downloadFile({
      url: this.data.fileHost + fileSrc, //仅为示例，并非真实的资源
      success (res) {
        const FileSystemManager = wx.getFileSystemManager();
        console.log( res.tempFilePath );
        FileSystemManager.saveFile({
          tempFilePath:res.tempFilePath,
          filePath:'http://store/'+filename,
          success:function(savedFilePath){
            console.log(savedFilePath);
          },
          fail:function(errMsg){
            console.log(errMsg);
          }
        });
      }
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