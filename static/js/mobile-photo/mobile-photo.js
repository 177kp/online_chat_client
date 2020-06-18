//基于layer的photo修改的，用于移动端
$(function(){
    //点击图片，退出预览
    $('body').on('click', '#layui-layer-photos img', function () {
        layer.closeAll();
    });
    $("body").on("touchstart", '.layui-layer-shade,.layui-layer-photos', function (e) {
        e.preventDefault();
        startX = e.originalEvent.changedTouches[0].pageX,
        startY = e.originalEvent.changedTouches[0].pageY;
    });
    //左右滑动，切换图片
    $("body").on("touchmove", '.layui-layer-shade,.layui-layer-photos', function (e) {
        e.preventDefault();
        moveEndX = e.originalEvent.changedTouches[0].pageX,
        moveEndY = e.originalEvent.changedTouches[0].pageY,
        X = moveEndX - startX,
        Y = moveEndY - startY;
        if (Math.abs(X) > Math.abs(Y) && X > 0) {
            //alert("left 2 right");
            $('.layui-layer-imgnext').click();
        } else if (Math.abs(X) > Math.abs(Y) && X < 0) {
            //alert("right 2 left");
            $('.layui-layer-imgprev').click();
        } else if (Math.abs(Y) > Math.abs(X) && Y > 0) {
            //alert("top 2 bottom");
        } else if (Math.abs(Y) > Math.abs(X) && Y < 0) {
            //alert("bottom 2 top");
        } else {
            //alert("just touch");
        }
    });
});
