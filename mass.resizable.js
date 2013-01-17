
//事件 resizestart  resize  resizeend
//canHaveChildren 获取表明对象是否可以包含子对象的值。document.createElement("textarea").canHaveChildren
//canHaveHTML 获取表明对象是否可以包含丰富的 HTML 标签的值。 html返回false,因为只能包含head与body
define("resizable",["mass.draggable"], function($){
    var defaults = {
        handles: "n,e,s,w,ne,se,sw,nw",
        maxHeight: 10000,
        maxWidth: 10000,
        minHeight: 10,
        minWidth: 10,
        noCursor: true,
        edge:5,
        resizestart: $.noop,
        resize: $.noop,
        resizeend: $.noop
    }
    var facade = $.fn.draggable;
    //用于修正拖动元素靠边边缘的区域的鼠标样式
    function getDirection(e, target, data) {
        var dir = '';
        var offset = target.offset();
        var width = target.outerWidth();
        var height = target.outerHeight();
        var edge = data.edge;
        if (e.pageY > offset.top && e.pageY < offset.top + edge) {
            dir += 'n';
        } else if (e.pageY < offset.top + height && e.pageY > offset.top + height - edge) {
            dir += 's';
        }
        if (e.pageX > offset.left && e.pageX < offset.left + edge) {
            dir += 'w';
        } else if (e.pageX < offset.left + width && e.pageX > offset.left + width - edge) {
            dir += 'e';
        }
        for(var i=0, handle; handle = data.handles[i++]; ) {
            if (handle == 'all' || handle == dir) {
                return dir;
            }
        }
        return '';
    }
    function getCssValue(el, css) {
        var val = parseInt(el.css(css), 10);
        if (isNaN(val)) {
            return 0;
        } else {
            return val;
        }
    }
    function refresh(e, target, data){
        if (data.dir.indexOf("e") != -1) {
            var width = data.startWidth + e.pageX - data.startX;
            width = Math.min(Math.max(width, data.minWidth),data.maxWidth);
            data.width = width;
        }
        if (data.dir.indexOf("s") != -1) {
            var height = data.startHeight + e.pageY - data.startY;
            height = Math.min(Math.max(height, data.minHeight), data.maxHeight);
            data.height = height;
        }
        if (data.dir.indexOf("w") != -1) {
            data.width = data.startWidth - e.pageX + data.startX;
            if (data.width >= data.minWidth && data.width <= data.maxWidth) {
                data.left = data.startLeft + e.pageX - data.startX;
            }
        }
        if (data.dir.indexOf("n") != -1) {
            data.height = data.startHeight - e.pageY + data.startY;
            if (data.height >= data.minHeight && data.height <= data.maxHeight) {
                data.top = data.startTop + e.pageY - data.startY;
            }
        }
        target.css({
            left: data.left,
            top: data.top,
            width: data.width,
            height: data.height
        });
    }
    $.fn.resizable = function(hash){
        var data = $.mix({},defaults,hash || {});
        data.handles =  data.handles.match($.rword) || ["all"]
        if(!/^(x|y|xy)$/.test(data.axis) ){
            data.axis = "";//如果用户没有指定,就禁止拖动
        }
        this.each(function(){
            if(this.nodeType == 1){
                var target = $(this)
                var cursor = target.css("cursor");
                //当鼠标在拖动元素上移动时,在它们靠近边缘的那一霎修改光标样式
                target.bind('mousemove.resizable', function(e){
                    if (facade.dragger)return;
                    var dir = getDirection(e, target, data );
                    if (dir == "") {
                        target.css("cursor", "default");
                    } else {
                        target.css("cursor", dir + "-resize");
                    }
                }).bind("mouseleave.resizable", function(e){
                    target.css("cursor", cursor);//还原光标样式
                })
            }

        })
        //在dragstart回调中,我们通过draggable已经设置了
        //dd.startX = event.pageX; dd.startY = event.pageY;
        //dd.originalX = offset.left;   dd.originalY = offset.top;
        data.dragstart = function(e, data){
            var target = data.element
            var dir = getDirection(e, target, data );
            if (dir == '') return;
            $.mix(data,{
                dir: dir,
                startLeft:  getCssValue(target, "left"),
                startTop:   getCssValue(target, "top"),
                startWidth: target.width(),
                startHeight: target.height()
            })
            "startLeft,startTop,startWidth,startHeight".replace($.rword, function(word){
                data[  word.replace("start","").toLowerCase() ] = data[word];
            })
            e.type = "resizestart"
            data.resizestart.call(target[0], e, data);//触发用户回调
            $('body').css('cursor', dir+'-resize');
        }
        data.drag = function(e, data){
            if(data.dir){
                var target = data.element;
                refresh(e, target, data);
                e.type = "resize"
                data.resize.call( data.element[0], e, data);//触发用户回调
            }
        }
        data.dragend = function(e, data){
            if(data.dir){
                var target = data.element;
                refresh(e, target, data);
                delete data.dir;
                e.type = "resizeend";
                data.resizeend.call( data.element[0], e, data);//触发用户回调
                $('body').css("cursor","");
            }
        }
        return  this.draggable(data)

    }
    return $;
})