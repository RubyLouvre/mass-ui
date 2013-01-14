define("draggable", ["$event", "$attr", "$fx"], function($) {
    var $doc = $(document),
    $dragger,
    //支持触模设备
    supportTouch = $.support.touch = "createTouch" in document || 'ontouchstart' in window || window.DocumentTouch && document instanceof DocumentTouch,
    onstart = supportTouch ? "touchstart" : "mousedown",
    ondrag = supportTouch ? "touchmove" : "mousemove",
    onend = supportTouch ? "touchend" : "mouseup",
    rdrag = new RegExp("(^|\\.)mass_dd(\\.|$)"),
    clearSelection = window.getSelection ? function(){
        window.getSelection().removeAllRanges();
    } : function(){
        document.selection.clear();
    }
    function preventDefault(event) { //阻止默认行为
        event.preventDefault();
    }

    function dispatchEvent(event, dragger, type) {
        //用于触发用户绑定的dragstart drag dragend回调, 第一个参数为事件对象, 第二个为dd对象
        event.type = type;
        event.namespace = "mass_dd";
        event.namespace_re = rdrag;
        dragger.fire(event, this);
    }

    function patchEvent(event, dragger, callback, l, t) {
        if(this.multi && $.isArrayLike(this.multi) && this.multi.length > 0) {
            for(var j = 0, node; node = this.multi[j]; j++) {
                if(node != dragger) { //防止环引用，导致死循环
                    callback(event, node, l, t);
                }
            }
        }
    }
    /**
     *
     *  containment：规定拖动块可活动的范围。有五种情况.
     *       如果是一个CSS表达式，将会通过选择器引擎找到第一个符合它的那个元素节点。
     *       如果是一个mass的节点链对象,取得其第一个元素。
     *       如果是一个元素节点，取其左上角与右下角的坐标。
     *       如果是一个包含四个数字的数组，分别是[x1,y1,x2,y2]
     *       如果是这三个字符串之一：parent,document,window，顾名思义，parent就是其父节点， document就是文档对象，取其左上角与右下角的坐标。
     *   noCursor：boolean 默认false。拖动时我们基本都会给个标识说明它能拖动，一般是改变其光标的样式为move，但如果不想改变这个样式， 或者你自己已经用图标做了一个好看的光标了，那么就设置它为true吧。
     *   live：boolean   如果为true，则使用事件代理。
     *   axis：String  决定拖动块只能沿着某一个轴移动，x为水平移移动，y为垂直移动，不等于前两者任意移动
     *   handle：string  手柄的类名，当设置了此参数后，只允许用手柄拖动元素。
     *   ghosting：boolean 默认false。当值为true时，会生成一个幽灵元素，拖动时只拖动幽灵，以减轻内存消耗。 此幽灵元素拥有一个名为mass_ghosting的类名，半透明。
     *   revert：boolean 默认false。当值为true时，让拖动元素在拖动后回到原来的位置。。
     *   strict：boolean 默认true。当值为true时，监视鼠标的位置，一旦超过出拖动块就立即停止。
     *   scroll：boolean 默认false。当值为true时，允许滚动条随拖动元素移动。
     *   click：function 默认为false。当我们点击页面时依次发生的事件为mousedown mouseup click 但有时我们想在点击后做一些事情才拖动元素，
                     这时就需要将click设置为false，意即阻止浏览器的默认行为
     *   dragstart：function 在拖动前鼠标按下的那一瞬执行。
     *   drag：function          在拖动时执行。
     *   dragend：function   在拖动后鼠标弹起的那一瞬执行。
     *   addClasses：boolean 是否为正在拖动的元素添加一个叫mass_dragging的类名，它会在拖动结束自动移除，默认是true。
     *   duration：Number 当ghosting或rewind为true，它会执行一个平滑的动画到目的地，这是它的持续时间，默认是500ms。
     *
     */
    $.fn.draggable = function(hash) {
        hash = hash || {}
        var dd = $.mix({},  hash)
        var limit = dd.containment;
        var target = this;
        //DD拖动数据对象,用于储存经过修整的用户设置
        $.mix(dd, {
            multi:  $.isArrayLike( hash.multi ) ? hash.multi : null,
            handle: typeof hash.handle == "string" ? hash.handle : null,
            scroll: typeof hash.scroll == "boolean" ? hash.scroll : true,
            returning: typeof hash.returning == "boolean" ? hash.returning : true,
            //用于触发用户绑定的dragstart drag dragend回调, 第一个参数为事件对象, 第二个为dd对象
            dispatchEvent: dispatchEvent,
            //用于实现多点拖动
            patchEvent: patchEvent
        });
        //处理滚动相关
        if(dd.scroll) {
            dd.scrollSensitivity = hash.scrollSensitivity >= 0 ? hash.scrollSensitivity : 20;
            dd.scrollSpeed = hash.scrollSensitivity >= 0 ? hash.scrollSpeed : 20;
            dd.scrollParent = target.scrollParent()[0]
            dd.overflowOffset = target.scrollParent().offset();
        }
        if(!hash.noCursor) {
            if(dd.handle) { //添加表示能拖放的样式
                target.find(dd.handle).css('cursor', 'move');
            } else {
                target.css('cursor', 'move');
            }
        }
        //绑定事件
        "dragstart drag dragend dragenter dragover dragleave drop".replace($.rword, function(event) {
            var fn = hash[event];
            if(typeof fn == "function") {
                target.on(event + ".mass_dd", fn);
            }
        });
       
        if(limit) { //修正其可活动的范围，如果传入的坐标
            if(Array.isArray(limit) && limit.length == 4) { //[x1,y1,x2,y2] left,top,right,bottom
                dd.limit = limit;
            } else {
                if(limit == 'parent') limit = target[0].parentNode;
                if(limit == 'document' || limit == 'window') {
                    dd.limit = [limit == 'document' ? 0 : $(window).scrollLeft(), limit == 'document' ? 0 : $(window).scrollTop()]
                    dd.limit[2] = dd.limit[0] + $(limit == 'document' ? document : window).width()
                    dd.limit[3] = dd.limit[1] + $(limit == 'document' ? document : window).height()
                }
                if(!(/^(document|window|parent)$/).test(limit) && !this.limit) {
                    var c = $(limit);
                    if(c[0]) {
                        var offset = c.offset();
                        dd.limit = [offset.left + parseFloat(c.css("borderLeftWidth")), offset.top + parseFloat(c.css("borderTopWidth"))]
                        dd.limit[2] = dd.limit[0] + c.innerWidth()
                        dd.limit[3] = dd.limit[1] + c.innerHeight()
                    }
                }
            }
            if(dd.limit) { //减少拖动块的面积
                dd.limit[2] = dd.limit[2] - target.outerWidth();
                dd.limit[3] = dd.limit[3] - target.outerHeight();
            }
        }
        target.on('dragstart.mass_dd', preventDefault); //处理原生的dragstart事件
        target.on(onstart + ".mass_dd", dd.handle, dragstart); //绑定拖动事件
        dd.dropinit && dd.dropinit(hash);
        return target.each(function(){
            $.data(this,"_mass_dd",$.mix({}, dd))//防止共享一个对象
            if(dd.handle){
                $(dd.handle, this).data("_mass_dd", $.mix({}, dd))
            }
        })
    }

    function dragstart(event, multi) {
        var node = multi || event.delegateTarget || event.currentTarget; //如果是多点拖动，存在第二个参数
        var dd = $.data(node, "_mass_dd");
        if(typeof dd.selector === "string"){
            var el = event.target;
            do{
                if($.match(el, dd.selector)){
                    $.data(el, "_mass_dd", dd);
                    node = el;
                    break;
                }
            }while(el = el.parentNode)
        }
        console.log(node)
        var dragger = $(node)
        dd.target = dragger;
        if(dd.ghosting) { //创建幽灵元素
            var ghosting = node.cloneNode(false);
            node.parentNode.insertBefore(ghosting, node.nextSibling);
            if(dd.handle) {
                dragger.find(dd.handle).appendTo(ghosting)
            }
            if($.support.cssOpacity) {
                ghosting.style.opacity = 0.5;
            } else {
                ghosting.style.filter = "alpha(opacity=50)";
            }
            dragger = $(ghosting).addClass("mass_ghosting"); //拖动对象
            dragger.data("_mass_dd", dd);
        }
        var offset = dragger.offset();
        dragger.addClass("mass_dragging");
        dd.startX = event.pageX;
        dd.startY = event.pageY;
        dd.originalX = offset.left;
        dd.originalY = offset.top;
        if(node.setCapture) { //设置鼠标捕获
            node.setCapture();
        } else { //阻止默认动作
            event.preventDefault();
        }
        dd.dragtype = "dragstart"; //    先执行dragstart ,再执行dropstart
        dd.dispatchEvent(event, dragger, "dragstart"); //允许dragger在回调中被改写,dd.multi可在这里被添加
        $dragger = dragger[0];//暴露到外围作用域，供drag与dragend与dragstop调用
     
        if(!multi) { //开始批处理dragstart  
            dd.patchEvent(event, node, dragstart);//自己调用自己
            //防止隔空拖动，为了性能起见，150ms才检测一下
            if(dd.strict) {
                dd.checkID = setInterval(dragstop, 150);
            }
        }
        dd.dropstart && dd.dropstart(event);
    }

    function drag(event, multi, docLeft, docTop) {
        if($dragger) {
            var node = multi || $dragger;
            var dd = $.data(node,"_mass_dd");
            var dragger = $(node)
            dd.event = event; //这个供dragstop API调用
            //当前元素移动了多少距离
            dd.deltaX = event.pageX - dd.startX;
            dd.deltaY = event.pageY - dd.startY;
            //现在的坐标
            dd.offsetX = dd.deltaX + dd.originalX;
            dd.offsetY = dd.deltaY + dd.originalY;
            if(dd.axis != "y") { //如果没有锁定X轴left,top,right,bottom
                var left = dd.limit ? Math.min(dd.limit[2], Math.max(dd.limit[0], dd.offsetX)) : dd.offsetX
                node.style.left = left + "px";
            }
            if(dd.axis != "x") { //如果没有锁定Y轴
                var top = dd.limit ? Math.min(dd.limit[3], Math.max(dd.limit[1], dd.offsetY)) : dd.offsetY;
                node.style.top = top + "px";
            }

            if(dd.scroll) {
                if(dd.scrollParent != document && dd.scrollParent.tagName != 'HTML') {
                    if(dd.axis != "y") {
                        if((dd.overflowOffset.left + dd.scrollParent.offsetWidth) - event.pageX < dd.scrollSensitivity) {
                            dd.scrollParent.scrollLeft = dd.scrollParent.scrollLeft + dd.scrollSpeed;
                        } else if(event.pageX - dd.overflowOffset.left < dd.scrollSensitivity) {
                            dd.scrollParent.scrollLeft = dd.scrollParent.scrollLeft - dd.scrollSpeed;
                        }
                    }

                    if(dd.axis != "x") {
                        if((dd.overflowOffset.top + dd.scrollParent.offsetHeight) - event.pageY < dd.scrollSensitivity) {
                            dd.scrollParent.scrollTop = dd.scrollParent.scrollTop + dd.scrollSpeed;
                        } else if(event.pageY - dd.overflowOffset.top < dd.scrollSensitivity) {
                            dd.scrollParent.scrollTop = dd.scrollParent.scrollTop - dd.scrollSpeed;
                        }
                    }

                } else {
                    docLeft = docLeft || $doc.scrollTop();
                    docTop = docTop || $doc.scrollTop();
                    if(dd.axis != "y") {
                        if(event.pageX - docLeft < dd.scrollSensitivity) {
                            $doc.scrollLeft(docLeft - dd.scrollSpeed);
                        } else if($(window).width() - event.pageX + docLeft < dd.scrollSensitivity) {
                            $doc.scrollLeft(docLeft + dd.scrollSpeed);
                        }
                    }
                    if(dd.axis != "x") {
                        if(event.pageY - docTop < dd.scrollSensitivity) {
                            $doc.scrollTop(docTop - dd.scrollSpeed);
                        } else if($(window).height() - event.pageY + docTop < dd.scrollSensitivity) {
                            $doc.scrollTop(docTop + dd.scrollSpeed);
                        }
                    }
                }
            }
            clearSelection();
            dd.dispatchEvent(event, dragger, "drag");
            dd.drop && dd.drop(event);
            //开始批处理drag
            if(!multi) {
                dd.patchEvent(event, node, drag, docLeft, docTop);
            }
           
        }
    }

    function dragend(event, multi) {
        if($dragger) {
            var node = multi || $dragger
            var dragger = $(node)
            var dd = $.data(node, "_mass_dd");
            if(dd.checkID) {
                clearInterval(dd.checkID);
                dd.event = dd.checkID = null;
            }
            if(node.releaseCapture) {
                node.releaseCapture();
            }
            dragger.removeClass("mass_dragging");
            if(dd.revert || dd.ghosting && dd.returning) {
                dd.target.fx({ //先让拖动块回到幽灵元素的位置
                    left: dd.revert ? dd.originalX : dd.offsetX,
                    top: dd.revert ? dd.originalY : dd.offsetY
                }, 500);
            }
            dd.ghosting && dragger.remove(); //再移除幽灵元素
            dd.dropend && dd.dropend(event); //先执行drop回调
            dd.dispatchEvent(event, dragger, "dragend"); //再执行dragend回调
            if(dd.dragtype == "drag" && dd.click === false) { //阻止"非刻意"的点击事件,因为我们每点击页面,都是依次触发mousedown mouseup click事件
                $.event.fireType = "click";
                setTimeout(function() {
                    delete $.event.fireType
                }, 30);
                dd.dragtype = "dragend";
            }
            if(!multi) {
                dd.patchEvent(event, node, dragend);
                $dragger = null;
            }
        }
    }

    function dragstop() {
        if($dragger) {
            var dd = $.data($dragger,"_mass_dd");
            if(dd.event) {
                var offset = $($dragger).offset(),
                left = offset.left,
                top = offset.top,
                event = dd.event,
                pageX = event.pageX,
                pageY = event.pageY
                if(pageX < left || pageY < top || pageX > left + $dragger.offsetWidth || pageY > top + $dragger.offsetHeight) {
                    dragend(event)
                }
            }
        }
    }

    $doc.on(ondrag + ".mass_dd", drag)
    $doc.on(onend + ".mass_dd blur.mass_dd", dragend)

    return $;
});
//2013.1.13 draggable v1