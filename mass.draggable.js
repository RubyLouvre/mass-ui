define("draggable", ["$event", "$attr", "$fx"], function($) {
    var $doc = $(document.documentElement),
    //支持触模设备
    supportTouch = $.support.touch = "createTouch" in document || 'ontouchstart' in window || window.DocumentTouch && document instanceof DocumentTouch,
    onstart = supportTouch ? "touchstart" : "mousedown",
    ondrag = supportTouch ? "touchmove" : "mousemove",
    onend = supportTouch ? "touchend" : "mouseup",
    rdrag = new RegExp("(^|\\.)draggable(\\.|$)")
    /**
     *
     *  containment：规定拖动块可活动的范围。有五种情况.
     *       如果是一个CSS表达式，将会通过选择器引擎找到第一个符合它的那个元素节点。
     *       如果是一个mass的节点链对象,取得其第一个元素。
     *       如果是一个元素节点，取其左上角与右下角的坐标。
     *       如果是一个包含四个数字的数组，分别是[x1,y1,x2,y2]
     *       如果是这三个字符串之一：parent,document,window，顾名思义，parent就是其父节点， document就是文档对象，取其左上角与右下角的坐标。
     *   noCursor：boolean 默认false。拖动时我们基本都会给个标识说明它能拖动，一般是改变其光标的样式为move，但如果不想改变这个样式， 或者你自己已经用图标做了一个好看的光标了，那么就设置它为true吧。
     *   selector：string   使用事件代理。
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
     *   duration：Number 当ghosting或revert为true，它会执行一个平滑的动画到目的地，这是它的持续时间，默认是500ms。
     *
     */
    var facade = $.fn.draggable = function(hash) {
        if(typeof hash == "function") {//如果只传入函数,那么当作是drag自定义事件的回调
            var fn = hash;
            hash = {
                drag: fn
            }
        }
        hash = hash || {};
        //使用享元模式切割数据，防止每个匹配元素都缓存一个非常臃肿的配置对象
        //配置部分划为内蕴状态，一旦配置了不会随环境改变而改变
        //元素相关的部分划为外蕴状态，临时生成，用完即弃，并包含配置数据，同时用于暴露到外部(通过回调接口)
        var internal = $.mix({
            scope: "default",
            addClasses: true
        }, hash);
        $.mix(internal, {
            multi: $.isArrayLike(hash.multi) ? hash.multi : null,
            handle: typeof hash.handle == "string" ? hash.handle : null,
            scroll: typeof hash.scroll == "boolean" ? hash.scroll : true,
            returning: typeof hash.returning == "boolean" ? hash.returning : true
        });
        //处理滚动相关
        if(internal.scroll) {
            internal.scrollSensitivity = hash.scrollSensitivity >= 0 ? hash.scrollSensitivity : 20;
            internal.scrollSpeed = hash.scrollSensitivity >= 0 ? hash.scrollSpeed : 20;
            internal.scrollParent = this.scrollParent()[0]
            internal.overflowOffset = this.scrollParent().offset();
        }
        //处理方向拖拽
        if(internal.axis !== "" && !/^(x|y|xy)$/.test(internal.axis)) {
            internal.axis = "xy";
        }
        //添加表示能拖放的样式
        if(!internal.noCursor) {
            if(internal.handle) {
                this.find(internal.handle).css('cursor', 'move');
            } else {
                this.css('cursor', 'move');
            }
        }
        //缓存数据
        this.data("draggable.internal",internal);
        if(internal.handle) { //处理手柄拖拽
            this.find(internal.handle).data("draggable.internal",internal);
        }
        //绑定事件
        var target = this;
        "dragstart drag dragend dragenter dragover dragleave drop".replace($.rword, function(event) {
            var fn = hash[event];
            if(typeof fn == "function") {
                target.on(event + ".draggable", fn);
            }
        });
        this.on(onstart + ".draggable", internal.handle, dragstart); //绑定拖动事件
        return this;
    }
    "dropinit dropstart drop dropend".replace($.rword, function(method) {
        facade[method] = $.noop;
    });
    facade.dispatch = function(event, external, type) {
        //用于触发用户绑定的dragstart drag dragend回调, 第一个参数为事件对象, 第二个为dd对象
        event.type = type;
        event.namespace = "draggable";//注意这里
        event.namespace_re = rdrag;
        var el = /drag/.test(type) ? external.dragger : external.dropper;
        el.fire(event, external);
    }
    //用于实现多点拖动
    facade.patch = function(event, data, callback, l, t) {
        var elements = data.multi,
        check = data.element[0]
        if(elements && $.isArrayLike(elements) && elements.length > 0) {
            for(var j = 0, node; node = elements[j]; j++) {
                if(node != check) { //防止环引用，导致死循环
                    callback(event, node, l, t);
                }
            }
        }
    }
    facade.clearSelection = window.getSelection ?
    function() {
        window.getSelection().removeAllRanges();
    } : function() {
        document.selection.clear();
    }

    function dragstart(event, multi) {
        var node = multi || event.delegateTarget || event.currentTarget; //如果是多点拖动，存在第二个参数
        var internal = $.data(node, "draggable.internal");
        if(!multi && typeof internal.selector === "string") { //这里是用于实现事件代理
            var el = event.target;
            do {
                if($.match(el, internal.selector)) {
                    node = el;
                    $.data(node, "draggable.internal", internal);
                    break;
                }
            } while (el = el.parentNode);
            if(!el) {
                return;
            }
        }
        var external = $.data(node,"draggable.external",$.mix({}, internal));
        var dragger = external.element = $(node); //本来打算要拖拽的元素
        external.scope = internal.scope;
        external.multi = internal.multi;
        if(internal.ghosting) { //处理影子拖拽,创建幽灵元素
            var ghosting = node.cloneNode(false);
            node.parentNode.insertBefore(ghosting, node.nextSibling);
            if(internal.handle) {
                dragger.find(internal.handle).appendTo(ghosting);
            }
            if($.support.cssOpacity) {
                ghosting.style.opacity = 0.4;
            } else {
                ghosting.style.filter = "alpha(opacity=40)";
            }
            dragger = $(ghosting).addClass("mass_ghosting"); //拖动对象
            dragger.data("draggable.internal", internal);
            dragger.data("draggable.external", external);
        }
        if(node.setCapture) { //设置鼠标捕获
            node.setCapture();
        }
       
        var offset = dragger.offset();
        internal.addClasses && dragger.addClass("mass_dragging");
        external.dragger = dragger; //实际上被拖动的元素
        external.startX = event.pageX;
        external.startY = event.pageY;
        external.originalX = offset.left;
        external.originalY = offset.top;
        external.dragtype = "dragstart"; //    先执行dragstart ,再执行dropstart
        facade.dispatch(event, external, "dragstart"); //处理dragstart回调，我们可以在这里重设dragger与multi
        facade.dragger = dragger[0]; //暴露到外围作用域，供drag与dragend与dragstop调用
        var limit = internal.containment;//处理区域鬼拽,确认可活动的范围
        if(limit) {
            if($.isArray(limit) && limit.length == 4) { //如果传入的是坐标 [x1,y1,x2,y2] left,top,right,bottom
                external.limit = limit;
            } else {
                if(limit == 'parent') limit = node.parentNode; //如果是parent参数
                if(limit == 'document' || limit == 'window') { //如果是document|window参数
                    external.limit = [limit == 'document' ? 0 : $(window).scrollLeft(), limit == 'document' ? 0 : $(window).scrollTop()];
                    external.limit[2] = external.limit[0] + $(limit == 'document' ? document : window).width();
                    external.limit[3] = external.limit[1] + $(limit == 'document' ? document : window).height();
                }
                if(!(/^(document|window|parent)$/).test(limit) && !this.limit) { //如果是元素节点,或元素的CSS表达式或元素的mass对象
                    var c = $(limit);
                    if(c[0]) {
                        offset = c.offset();
                        external.limit = [offset.left + parseFloat(c.css("borderLeftWidth")), offset.top + parseFloat(c.css("borderTopWidth"))]
                        external.limit[2] = external.limit[0] + c.innerWidth();
                        external.limit[3] = external.limit[1] + c.innerHeight();
                    }
                }
            }
            if(external.limit) { //减少拖动块的面积
                external.limit[2] = external.limit[2] - dragger.outerWidth();
                external.limit[3] = external.limit[3] - dragger.outerHeight();
            }
        }

        if(!multi) { //处理多点拖拽
            facade.dropinit(event, external, node);
            facade.patch(event, external, dragstart); //自己调用自己
            if(internal.strict) { //防止隔空拖动，为了性能起见，150ms才检测一下
                external.intervalID = setInterval(dragstop, 150);
            }
        }
        facade.dropstart(event, external, node);
    }

    function drag(event, multi, docLeft, docTop) {
        if(facade.dragger) {
            var node = multi || facade.dragger;
            var internal = $.data(node, "draggable.internal");
            var external = $.data(node, "draggable.external");
            external.event = event; //这个供dragstop API调用
            //当前元素移动了多少距离
            external.deltaX = event.pageX - external.startX;
            external.deltaY = event.pageY - external.startY;
            //现在的坐标
            external.offsetX = external.deltaX + external.originalX;
            external.offsetY = external.deltaY + external.originalY;
            if(internal.axis.indexOf("x") != -1) { //如果没有锁定X轴left,top,right,bottom
                var left = external.limit ? Math.min(external.limit[2], Math.max(external.limit[0], external.offsetX)) : external.offsetX;
                node.style.left = left + "px";
            }
            if(internal.axis.indexOf("y") != -1) { //如果没有锁定Y轴
                var top = external.limit ? Math.min(external.limit[3], Math.max(external.limit[1], external.offsetY)) : external.offsetY;
                node.style.top = top + "px";
            }
            if(internal.scroll) {
                if(internal.scrollParent != document && internal.scrollParent.tagName != 'HTML') {
                    if(internal.axis.indexOf("x") != -1) {
                        if((internal.overflowOffset.left + internal.scrollParent.offsetWidth) - event.pageX < internal.scrollSensitivity) {
                            internal.scrollParent.scrollLeft = internal.scrollParent.scrollLeft + internal.scrollSpeed;
                        } else if(event.pageX - internal.overflowOffset.left < internal.scrollSensitivity) {
                            internal.scrollParent.scrollLeft = internal.scrollParent.scrollLeft - internal.scrollSpeed;
                        }
                    }

                    if(internal.axis.indexOf("y") != -1) {
                        if((internal.overflowOffset.top + internal.scrollParent.offsetHeight) - event.pageY < internal.scrollSensitivity) {
                            internal.scrollParent.scrollTop = internal.scrollParent.scrollTop + internal.scrollSpeed;
                        } else if(event.pageY - internal.overflowOffset.top < internal.scrollSensitivity) {
                            internal.scrollParent.scrollTop = internal.scrollParent.scrollTop - internal.scrollSpeed;
                        }
                    }

                } else {
                    docLeft = docLeft || $doc.scrollTop();
                    docTop = docTop || $doc.scrollTop();
                    if(internal.axis.indexOf("x") != -1) {
                        if(event.pageX - docLeft < internal.scrollSensitivity) {
                            $doc.scrollLeft(docLeft - internal.scrollSpeed);
                        } else if($(window).width() - event.pageX + docLeft < internal.scrollSensitivity) {
                            $doc.scrollLeft(docLeft + internal.scrollSpeed);
                        }
                    }
                    if(internal.axis.indexOf("y") != -1) {
                        if(event.pageY - docTop < internal.scrollSensitivity) {
                            $doc.scrollTop(docTop - internal.scrollSpeed);
                        } else if($(window).height() - event.pageY + docTop < internal.scrollSensitivity) {
                            $doc.scrollTop(docTop + internal.scrollSpeed);
                        }
                    }
                }
            }
            facade.clearSelection(); //清理文档中的文本选择
            facade.dispatch(event, external, "drag"); //处理drag回调
            facade.drop(event, external, node);
            if(!multi) { //处理多点拖拽
                facade.patch(event, external, drag, docLeft, docTop);
            }

        }
    }

    function dragend(event, multi) {
        if(facade.dragger || multi) {
            var node = multi || facade.dragger
            var dragger = $(node);
            var internal = $.data(node, "draggable.internal");
            var external = $.data(node, "draggable.external");
            if(external.intervalID) {
                clearInterval(external.intervalID);
                external.event = external.intervalID = null;
            }
            if(node.releaseCapture) {
                node.releaseCapture();
            }
            internal.addClasses && dragger.removeClass("mass_dragging");
            if(internal.revert || internal.ghosting && internal.returning) {
                external.element.animate({ //先让拖动块回到幽灵元素的位置
                    left: internal.revert ? external.originalX : external.offsetX,
                    top: internal.revert ? external.originalY : external.offsetY
                }, 500);
            }
          
            facade.dropend(event, external, node); //先执行dropend回调
            facade.dispatch(event, external, "dragend"); //再执行dragend回调
            if(external.dragtype == "drag" && internal.click === false) { //阻止"非刻意"的点击事件,因为我们每点击页面,都是依次触发mousedown mouseup click事件
                $.event.fireType = "click";
                setTimeout(function() {
                    delete $.event.fireType;
                }, 30);
                external.dragtype = "dragend";
            }
            if(!multi) {
                facade.patch(event, external, dragend);
                delete facade.dragger;
            }
            dragger.removeData("draggable.external");
            internal.ghosting && dragger.remove(); //再移除幽灵元素
        }
    }

    function dragstop() { //如果鼠标超出了拖动块的范围,则中断拖拽
        if(facade.dragger) {
            var node = facade.dragger;
            var external = $.data(node, "draggable.external");
            if(external.event) {
                var offset = $(node).offset(),
                left = offset.left,
                top = offset.top,
                event = external.event,
                pageX = event.pageX,
                pageY = event.pageY
                if(pageX < left || pageY < top || pageX > left + node.offsetWidth || pageY > top + node.offsetHeight) {
                    dragend(event);
                }
            }
        }
    }

    $doc.on(ondrag + ".draggable", drag);
    $doc.on(onend + ".draggable blur.draggable", dragend);

    return $;
});
//2013.1.13 draggable v1
//2013.1.19 切割其缓存数据为内蕴,外蕴两部分