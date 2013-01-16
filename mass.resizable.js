
//事件 resizestart  resize resizestop
//canHaveChildren 获取表明对象是否可以包含子对象的值。document.createElement("textarea").canHaveChildren
//canHaveHTML 获取表明对象是否可以包含丰富的 HTML 标签的值。 html返回false,因为只能包含head与body
/**
 *思路首先判定元素是否能插入节点 不能则创建包裹对象 然后插入8个子元素作为拖动手柄 拖动手柄在drag事件中改变原对象或包裹对象的宽高
 */
define("resizable",["mass.draggable"], function($){
    var defaults = {
        handles: "e,s,se",
        helper: false,
        maxHeight: null,
        maxWidth: null,
        minHeight: 10,
        minWidth: 10,
        // See #7960
        zIndex: 90
    }
    $.fn.resizable = function(hash){
        var config = $.mix({},defaults,hash || {});
        this.each(function(){
            if(this.nodeType == 1){
                var data = $.mix({},config)
                var element = $(this)
                data.element = element
                if(this.canHaveHTML  === false  || this.nodeName.match(/canvas|textarea|input|select|button|img/i)) {
                    var wrapper =  $("<div class='ui-wrapper' style='overflow: hidden;'></div>").css({
                        position: element.css("position"),
                        width: element.outerWidth(),
                        height: element.outerHeight(),
                        top: element.css("top"),
                        left: element.css("left")
                    }).replaceTo(this);
                    data.element = wrapper;
                    data.elementIsWrapper = true;//标识使用了包裹元素
                    data.originalResizeStyle = element.css("resize");
                    element.css("resize", "none");
                    wrapper.append(this);
                    "Left,Right,Top,Bottom".replace($.rword, function(w){
                        var style = "margin"+w;
                        wrapper.css(style, element.css(style) );
                        element.css(style, 0)
                    })
                }
            }
        })
    }

})