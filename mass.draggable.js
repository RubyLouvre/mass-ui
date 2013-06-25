define("draggable", ["$event", "$attr", "$fx"], function($) {
    var topElement = $(document.documentElement),
        //支持触模设备
        supportTouch = $.support.touch = "ontouchend" in document,
        onstart = supportTouch ? "touchstart" : "mousedown",
        ondrag = supportTouch ? "touchmove" : "mousemove",
        onend = supportTouch ? "touchend" : "mouseup"
        /**
     *  range：规定拖动块可活动的范围。有五种情况.
     *       如果是一个CSS表达式，将会通过选择器引擎找到第一个符合它的那个元素节点。
     *       如果是一个mass的节点链对象,取得其第一个元素。
     *       如果是一个元素节点，取其左上角与右下角的坐标。
     *       如果是一个包含四个数字的数组，分别是[x1,y1,x2,y2]
     *       如果是这三个字符串之一：parent,document,window，顾名思义，parent就是其父节点， document就是文档对象，取其左上角与右下角的坐标。
     *   cursor：string|boolean 默认move。拖动时我们基本都会给个标识说明它能拖动，一般是改变其光标的样式为move，但如果不想改变这个样式， 或者你自己已经用图标做了一个好看的光标了，那么就设置它为true吧。
     *   selector：string   使用事件代理。
     *   axis：String  决定拖动块只能沿着某一个轴移动，x为水平移移动，y为垂直移动，不等于前两者任意移动
     *   handle：string  手柄的类名，当设置了此参数后，只允许用手柄拖动元素。
     *   ghosting：boolean 默认false。当值为true时，会生成一个幽灵元素，拖动时只拖动幽灵，以减轻内存消耗。 此幽灵元素拥有一个名为mass_ghosting的类名，半透明。
     *   revert：boolean 默认false。当值为true时，让拖动元素在拖动后回到原来的位置。。
     *   strict：boolean 默认true。当值为true时，监视鼠标的位置，一旦超过出拖动块就立即停止。
     *   scroll：boolean 默认false。当值为true时，允许滚动条随拖动元素移动。
     *   scrollSensitivity: number 当接近两端某个像素才开始操作
     *   click：function 默认为false。当我们点击页面时依次发生的事件为mousedown mouseup click 但有时我们想在点击后做一些事情才拖动元素，
                     这时就需要将click设置为false，意即阻止浏览器的默认行为
     *   dragstart：function 在拖动前鼠标按下的那一瞬执行。
     *   drag：function          在拖动时执行。
     *   dragend：function   在拖动后鼠标弹起的那一瞬执行。
     *   addClasses：boolean 是否为正在拖动的元素添加一个叫mass_dragging的类名，它会在拖动结束自动移除，默认是true。
     *   duration：Number 当ghosting或revert为true，它会执行一个平滑的动画到目的地，这是它的持续时间，默认是500ms。
     *
     */
    var defaults = {
        scope: "default",
        addClasses: true,
        cursor: "move",
        handle: null,
        returning: true
    }
    var draggable = $.fn.draggable = function(hash) {
            if(typeof hash == "function") { //如果只传入函数,那么当作是drag自定义事件的回调
                var fn = hash;
                hash = {
                    drag: fn
                }
            }
            hash = hash || {};
            //使用享元模式切割数据，防止每个匹配元素都缓存一个非常臃肿的配置对象
            //配置部分划为内蕴状态，一旦配置了不会随环境改变而改变
            //元素相关的部分划为外蕴状态，临时生成，用完即弃，并包含配置数据，同时用于暴露到外部(通过回调接口)
            var data = $.mix({}, defaults, hash);
            //处理多点拖拽
            data.multi = $.isArrayLike(hash.multi) ? hash.multi : null;
            //处理方向拖拽
            if(data.axis !== "" && !/^(x|y|xy)$/.test(data.axis)) {
                data.axis = "xy";
            }
            //处理滚动相关
            data.scroll = typeof hash.scroll == "boolean" ? hash.scroll : true
            //绑定事件
            data["this"] = this;
            "dragstart drag dragend dragenter dragover dragleave drop".replace($.rword, function(event) {
                var fn = hash[event];
                if(typeof fn == "function") {
                    data["this"].on(event + ".draggable", data.selector, fn);
                }
            });
            this.on(onstart + ".draggable", data.selector, {
                draggable: data
            }, dragstart); //绑定拖动事件
            return this;
        }

    function dragstart(event, multi) {
        //如果是多点拖动，存在第二个参数
        var node = multi || this,
            curData = event.handleObj.draggable || draggable.curData,
            cursorNode = this;
        //复制一个，防止污染蓝本
        var data = $.mix({}, curData);
        //如果是使用手柄拖拽,注意保证焦点是落在手柄中
        if(!multi && data.handle) {
            var handle = $(this).find(data.handle).get(0);
            var ok = handle && $.contains(handle, event.target, true);
            if(!ok) {
                return;
            }
            cursorNode = handle;
        }
        //如果指定了要处理滚动条
        if(data.scroll) {
            data.scrollSensitivity = data.scrollSensitivity >= 0 ? data.scrollSensitivity : 20;
            data.scrollSpeed = data.scrollSensitivity >= 0 ? data.scrollSpeed : 20;
            data.scrollParent = data["this"].scrollParent()[0]
            data.overflowOffset = data["this"].scrollParent().offset();
        }
        //本来打算要拖拽的元素
        var dragger = data.element = $(node);
        //处理影子拖拽，创建幽灵元素
        if(data.ghosting) {
            var ghosting = node.cloneNode(false);
            node.parentNode.insertBefore(ghosting, node.nextSibling);
            if(data.handle) {
                dragger.find(data.handle).appendTo(ghosting);
            }
            if($.support.cssOpacity) {
                ghosting.style.opacity = 0.4;
            } else {
                ghosting.style.filter = "alpha(opacity=40)";
            }
            dragger = $(ghosting).addClass("mass_ghosting"); //拖动对象
        }
        dragger.data("draggable", data)
        if(node.setCapture) { //设置鼠标捕获
            node.setCapture();
        }
        var offset = dragger.offset();
        data.addClasses && dragger.addClass("mass_dragging");
        data.dragger = dragger; //这里是给用户调用的
        data.startX = event.pageX;
        data.startY = event.pageY;
        data.originalX = offset.left;
        data.originalY = offset.top;
        data.dragtype = "dragstart"; // 先执行dragstart ,再执行dropstart
        draggable.dragger = dragger[0]; //这里是给框架调用的
        draggable.dispatch(event, data, "dragstart"); //处理dragstart回调，我们可以在这里重设dragger与multi
        if(!multi) { //处理多点拖拽
            var cursor = data.cursor;
            if(cursor) { //如果不能false
                data.cursorNode = $(cursorNode);
                data.cursor = data.cursorNode.css("cursor");
                data.cursorNode.css("cursor", cursor);
            }
            draggable.curData = curData;
            draggable.setDragRange(data, node);
            draggable.textselect(false);
            draggable.dropinit(event, data, node);
            draggable.patch(event, data, dragstart); //自己调用自己
            if(data.strict) { //防止隔空拖动，为了性能起见，150ms才检测一下
                data.intervalID = setInterval(dragstop, 150);
            }
        }
        draggable.dropstart(event, data, node);
    }

    function drag(event, multi, docLeft, docTop) {
        if(draggable.dragger) {
            var node = multi || draggable.dragger,
                data = $.data(node, "draggable");
            data.event = event; //这个供dragstop API调用
            //当前元素移动了多少距离
            data.deltaX = event.pageX - data.startX;
            data.deltaY = event.pageY - data.startY;
            //现在的坐标
            data.offsetX = data.deltaX + data.originalX;
            data.offsetY = data.deltaY + data.originalY;
            if(data.axis.indexOf("x") != -1) { //如果没有锁定X轴left,top,right,bottom
                var left = data.range ? Math.min(data.range[2], Math.max(data.range[0], data.offsetX)) : data.offsetX;
                node.style.left = left + "px";
            }
            if(data.axis.indexOf("y") != -1) { //如果没有锁定Y轴
                var top = data.range ? Math.min(data.range[3], Math.max(data.range[1], data.offsetY)) : data.offsetY;
                node.style.top = top + "px";
            }
            draggable.setDragScroll(data, event, docLeft, docTop); //处理滚动条
            draggable.dispatch(event, data, "drag"); //处理drag回调
            draggable.drop(event, data, node);
            draggable.clearSelection();
            if(!multi) { //处理多点拖拽
                draggable.patch(event, data, drag, docLeft, docTop);
            }
        }
    }

    function dragend(event, multi) {
        if(draggable.dragger || multi) {
            var node = multi || draggable.dragger,
                dragger = $(node),
                data = $.data(node, "draggable");
            if(data.cursorNode) { //还原光标状态
                data.cursorNode.css("cursor", data.cursor);
            }
            if(data.intervalID) {
                clearInterval(data.intervalID);
                data.event = data.intervalID = null;
            }
            if(node.releaseCapture) {
                node.releaseCapture();
            }
            data.addClasses && dragger.removeClass("mass_dragging");
            if(data.revert || data.ghosting && data.returning) {
                data.element.animate({ //先让拖动块回到幽灵元素的位置
                    left: data.revert ? data.originalX : data.offsetX,
                    top: data.revert ? data.originalY : data.offsetY
                }, 500);
            }
            draggable.dropend(event, data, node); //先执行dropend回调
            draggable.dispatch(event, data, "dragend"); //再执行dragend回调
            if(data.dragtype == "drag" && data.click === false) { //阻止"非刻意"的点击事件,因为我们每点击页面,都是依次触发mousedown mouseup click事件
                $.event.fireType = "click";
                setTimeout(function() {
                    delete $.event.fireType;
                }, 30);
                data.dragtype = "dragend";
            }
            if(!multi) {
                draggable.textselect(true);
                draggable.patch(event, data, dragend);
                delete draggable.dragger;
            }
            dragger.removeData("draggable");
            data.ghosting && dragger.remove(); //再移除幽灵元素
        }
    }

    function dragstop() { //如果鼠标超出了拖动块的范围,则中断拖拽
        if(draggable.dragger) {
            var node = draggable.dragger;
            var data = $.data(node, "draggable");
            if(data.event) {
                var offset = $(node).offset(),
                    left = offset.left,
                    top = offset.top,
                    event = data.event,
                    pageX = event.pageX,
                    pageY = event.pageY
                if(pageX < left || pageY < top || pageX > left + node.offsetWidth || pageY > top + node.offsetHeight) {
                    dragend(event);
                }
            }
        }
    }
    $.mix(draggable, {
        defaults: defaults,
        underway: [drag],
        //拖拽时调用的回调
        dropscene: [dragend],
        //鼠标弹起时调用的回调
        clearSelection: window.getSelection ?
        function() {
            //在拖动时禁止文本选择,配合textselect一起使用,防止有漏网之鱼
            window.getSelection().removeAllRanges();
        } : function() {
            document.selection.clear();
        },
        textselect: function(bool) {
            //放于鼠标按下或弹起处的回调中,用于开启或禁止文本选择
            $(document)[bool ? "unbind" : "bind"]("selectstart", function() {
                return false; //支持情况 Firefox/Opera不支持onselectstart事件 http://www.cnblogs.com/snandy/archive/2011/06/01/2067283.html
            }).css("-user-select", bool ? "" : "none");
            document.unselectable = bool ? "off" : "on";
        },
        dispatch: function(event, data, type) {
            //用于触发用户绑定的dragstart drag dragend回调, 第一个参数为事件对象, 第二个为dd对象
            event.type = type;
            var el = /drag/.test(type) ? data.dragger : data.dropper;
            el.fire(event, data);
        },
        patch: function(event, data, callback, l, t) {
            //用于实现多点拖动
            var nodes = data.multi,
                check = data.element[0];
            if(nodes && $.isArrayLike(nodes)) {
                for(var j = 0, node; node = nodes[j]; j++) {
                    if(node != check) { //防止环引用，导致死循环
                        callback(event, node, l, t);
                    }
                }
            }
        },
        setDragRange: function(data, node) {
            var range = data.range; //处理区域鬼拽,确认可活动的范围
            if(range) {
                if($.isArray(range) && range.length == 4) { //如果传入的是坐标 [x1,y1,x2,y2] left,top,right,bottom
                    data.range = range;
                } else {
                    if(range == 'parent') { //如果是parent参数
                        range = node.parentNode;
                    }
                    if(range == 'document' || range == 'window') { //如果是document|window参数
                        data.range = [range == 'document' ? 0 : $(window).scrollLeft(), range == 'document' ? 0 : $(window).scrollTop()];
                        data.range[2] = data.range[0] + $(range == 'document' ? document : window).width();
                        data.range[3] = data.range[1] + $(range == 'document' ? document : window).height();
                    } else { //如果是元素节点(比如从parent参数转换地来),或者是CSS表达式,或者是mass对象
                        var c = $(range);
                        if(c[0]) {
                            var offset = c.offset();
                            data.range = [offset.left + parseFloat(c.css("borderLeftWidth")), offset.top + parseFloat(c.css("borderTopWidth"))]
                            data.range[2] = data.range[0] + c.innerWidth();
                            data.range[3] = data.range[1] + c.innerHeight();
                        }
                    }
                }
                if(data.range) { //减少拖动块的面积
                    data.range[2] = data.range[2] - $(node).outerWidth();
                    data.range[3] = data.range[3] - $(node).outerHeight();
                }
            }
        },
        setDragScroll: function(data, event, docLeft, docTop) {
            if(data.scroll) {
                if(data.scrollParent != document && data.scrollParent.tagName != 'HTML') {
                    if(data.axis.indexOf("x") != -1) {
                        if((data.overflowOffset.left + data.scrollParent.offsetWidth) - event.pageX < data.scrollSensitivity) {
                            data.scrollParent.scrollLeft = data.scrollParent.scrollLeft + data.scrollSpeed;
                        } else if(event.pageX - data.overflowOffset.left < data.scrollSensitivity) {
                            data.scrollParent.scrollLeft = data.scrollParent.scrollLeft - data.scrollSpeed;
                        }
                    }
                    if(data.axis.indexOf("y") != -1) {
                        if((data.overflowOffset.top + data.scrollParent.offsetHeight) - event.pageY < data.scrollSensitivity) {
                            data.scrollParent.scrollTop = data.scrollParent.scrollTop + data.scrollSpeed;
                        } else if(event.pageY - data.overflowOffset.top < data.scrollSensitivity) {
                            data.scrollParent.scrollTop = data.scrollParent.scrollTop - data.scrollSpeed;
                        }
                    }

                } else {
                    docLeft = docLeft || topElement.scrollTop();
                    docTop = docTop || topElement.scrollTop();
                    if(data.axis.indexOf("x") != -1) {
                        if(event.pageX - docLeft < data.scrollSensitivity) {
                            topElement.scrollLeft(docLeft - data.scrollSpeed);
                        } else if($(window).width() - event.pageX + docLeft < data.scrollSensitivity) {
                            topElement.scrollLeft(docLeft + data.scrollSpeed);
                        }
                    }
                    if(data.axis.indexOf("y") != -1) {
                        if(event.pageY - docTop < data.scrollSensitivity) {
                            topElement.scrollTop(docTop - data.scrollSpeed);
                        } else if($(window).height() - event.pageY + docTop < data.scrollSensitivity) {
                            topElement.scrollTop(docTop + data.scrollSpeed);
                        }
                    }
                }
            }
        }

    })

    "dropinit dropstart drop dropend".replace($.rword, function(method) {
        draggable[method] = $.noop;
    });

    //绑定全局事件,统一处理组件的拖拽操作
    topElement.on(ondrag, function(e) {
        for(var i = 0, fn; fn = draggable.underway[i++];) {
            var ret = fn(e);
        }
        return ret;
    }).on(onend, function(e) {
        for(var i = 0, fn; fn = draggable.dropscene[i++];) {
            var ret = fn(e);
        }
        return ret;
    }).on("blur", dragend);
    return $;
});
//2013.1.13 draggable v1
//2013.1.19 切割其缓存数据为内蕴,外蕴两部分
//2013.1.26 draggable v2 将共享的数据放到draggable.curData,延迟生成针对元素的私有缓存体,
//抽取个别复杂的逻辑封装成setDragRange与setDragScroll方法
