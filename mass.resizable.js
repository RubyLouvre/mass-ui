//事件 resizestart  resize  resizeend
//canHaveChildren 获取表明对象是否可以包含子对象的值。document.createElement("textarea").canHaveChildren
//canHaveHTML 获取表明对象是否可以包含丰富的 HTML 标签的值。 html返回false,因为只能包含head与body
define("resizable", ["mass.draggable"], function($) {
    var defaults = {
        handles: "n,e,s,w,ne,se,sw,nw",
        maxHeight: 10000,
        maxWidth: 10000,
        minHeight: 10,
        minWidth: 10,
        cursor: false,
        edge: 5,
        resizestart: $.noop,
        resize: $.noop,
        resizeend: $.noop
    }
    /**
     * 用于修正拖动元素靠边边缘的区域的鼠标样式
     * @param {Event} e
     * @param {Mass} target
     * @param {Object} data 经过处理的配置对象
     */

    function getDirection(e, target, data) {
        var dir = '';
        var offset = target.offset();
        var width = target.outerWidth();
        var height = target.outerHeight();
        var edge = data.edge;
        if(e.pageY > offset.top && e.pageY < offset.top + edge) {
            dir += 'n';
        } else if(e.pageY < offset.top + height && e.pageY > offset.top + height - edge) {
            dir += 's';
        }
        if(e.pageX > offset.left && e.pageX < offset.left + edge) {
            dir += 'w';
        } else if(e.pageX < offset.left + width && e.pageX > offset.left + width - edge) {
            dir += 'e';
        }
        for(var i = 0, handle; handle = data.handles[i++];) {
            if(handle == 'all' || handle == dir) {
                return dir;
            }
        }
        return '';
    }

    function getCssValue(el, css) { //对样式值进行处理,强制转数值
        var val = parseInt(el.css(css), 10);
        if(isNaN(val)) {
            return 0;
        } else {
            return val;
        }
    }

    function refresh(event, target, data) { //刷新缩放元素
        var b = data.b || {
            minWidth: data.minWidth,
            maxWidth: data.maxWidth,
            minHeight: data.minHeight,
            maxHeight: data.maxHeight
        }
        if(data._aspectRatio || event.shiftKey) {
            var aspest = true,
                pMinWidth = b.minHeight * data.aspectRatio,
                pMinHeight = b.minWidth / data.aspectRatio,
                pMaxWidth = b.maxHeight * data.aspectRatio,
                pMaxHeight = b.maxWidth / data.aspectRatio;

            if(pMinWidth > b.minWidth) {
                b.minWidth = pMinWidth;
            }
            if(pMinHeight > b.minHeight) {
                b.minHeight = pMinHeight;
            }
            if(pMaxWidth < b.maxWidth) {
                b.maxWidth = pMaxWidth;
            }
            if(pMaxHeight < b.maxHeight) {
                b.maxHeight = pMaxHeight;
            }
        }

        if(data.dir.indexOf("e") != -1) {
            var width = data.startWidth + event.pageX - data.startX;
            width = Math.min(Math.max(width, b.minWidth), b.maxWidth);
            data.width = width;
            if(aspest) {
                data.height = width / data.aspectRatio;
            }
        }
        if(data.dir.indexOf("s") != -1) {
            var height = data.startHeight + event.pageY - data.startY;
            height = Math.min(Math.max(height, b.minHeight), b.maxHeight);
            data.height = height;
            if(aspest) {
                data.width = height * data.aspectRatio;
            }
        }
        if(data.dir.indexOf("w") != -1) {
            data.width = data.startWidth - event.pageX + data.startX;
            if(data.width >= b.minWidth && data.width <= b.maxWidth) {
                data.left = data.startLeft + event.pageX - data.startX;
                if(aspest) {
                    data.top = data.startTop + (event.pageX - data.startX) / data.aspectRatio;
                }
            }
        }
        if(data.dir.indexOf("n") != -1) {
            data.height = data.startHeight - event.pageY + data.startY;
            if(data.height >= b.minHeight && data.height <= b.maxHeight) {
                data.top = data.startTop + event.pageY - data.startY;
                if(aspest) {
                    data.left = data.startLeft + (event.pageY - data.startY) * data.aspectRatio;
                }
            }
        }
        target.css({
            left: data.left,
            top: data.top,
            width: data.width,
            height: data.height
        });
    }
    var draggable = $.fn.draggable;
    var resizable = $.fn.resizable = function(hash) {
            var config = $.mix({}, defaults, hash || {});
            config.handles = config.handles.match($.rword) || ["all"]; //
            if(!/^(x|y|xy)$/.test(config.axis)) {
                config.axis = ""; //如果用户没有指定,就禁止拖动
            }
            config._aspectRatio = !! config.aspectRatio
            this.each(function() {
                if(this.nodeType == 1) {
                    //当鼠标在拖动元素上移动时,在它们靠近边缘的那一霎修改光标样式
                    $(this).bind('mousemove.resizable', config.selector, function(e) {
                        var target = $(this)
                        if(draggable.dragger) return;
                        var dir = getDirection(e, target, config);
                        $._data(this, "cursor", target.css("cursor")); //保存原来的光标样式
                        if(dir == "") {
                            target.css("cursor", "default");
                        } else {
                            target.css("cursor", dir + "-resize");
                        }
                    }).bind("mouseleave.resizable", config.selector, function(e) {
                        $(this).css("cursor", $._data(this, "cursor")); //还原光标样式
                    })
                }

            })
            //在dragstart回调中,我们通过draggable已经设置了
            //data.startX = event.pageX;    data.startY = event.pageY;
            //data.originalX = offset.left; data.originalY = offset.top;
            config.dragstart = function(event, data) {
                var target = data.element;
                var dir = getDirection(event, target, data);
                if(dir == '') return;
                $.mix(data, {
                    dir: dir,
                    startLeft: getCssValue(target, "left"),
                    startTop: getCssValue(target, "top"),
                    startWidth: target.width(),
                    startHeight: target.height()
                });
                "startLeft,startTop,startWidth,startHeight".replace($.rword, function(word) {
                    data[word.replace("start", "").toLowerCase()] = data[word];
                });
                //等比例缩放
                data.aspectRatio = (typeof data.aspectRatio === "number") ? data.aspectRatio : ((data.startWidth / data.startHeight) || 1);
                event.type = "resizestart";
                data.resizestart.call(target[0], event, data); //触发用户回调
                $('body').css('cursor', dir + '-resize');
            }
            config.drag = function(event, data) {
                if(data.dir) {
                    var target = data.element;
                    refresh(event, target, data);
                    event.type = "resize";
                    data.resize.call(target[0], event, data); //触发用户回调
                }
            }
            config.dragend = function(event, data) {
                if(data.dir) {
                    var target = data.element;
                    refresh(event, target, data);
                    delete data.dir;
                    event.type = "resizeend";
                    data.resizeend.call(target[0], event, data); //触发用户回调
                    $('body').css("cursor", "default");
                }
            }
            return this.draggable(config)
        }
    resizable.defaults = defaults;
    return $;
})