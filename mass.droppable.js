define("droppable", ["mass.draggable"], function($) {
    var defaults = {
        accept: "*",
        activeClass: false,
        addClasses: true,
        hoverClass: false,
        scope: "default",
        tolerance: "intersect"
    }

    var droppable = $.fn.droppable = function(hash) {
            if(typeof hash == "function") { //如果只传入函数,那么当作是drop自定义事件的回调
                var fn = hash;
                hash = {
                    drop: fn
                }
            }
            var data = $.mix({}, defaults, hash || {});
            data["this"] = this;
            data.tolerance = typeof data.tolerance === "function" ? data.tolerance : droppable.modes[data.tolerance];
            var queue = droppable.scopes["#" + data.scope] || (droppable.scopes["#" + data.scope] = [])
            queue.push(data);
            return this;
        }

    var draggable = $.fn.draggable;

    function Locate(node) {
        //取得放置对象的坐标宽高等信息
        this.node = node;
        var wrapper = $(node);
        var offset = wrapper.offset();
        this.wrapper = wrapper
        this.top = offset.top;
        this.left = offset.left;
        this.width = wrapper.innerWidth();
        this.height = wrapper.innerHeight();
        this.bottom = this.height + this.top;
        this.right = this.width + this.left;
    }
    Locate.prototype.refresh = function() {
        var offset = this.wrapper.offset();
        this.top = offset.top;
        this.left = offset.left;
        this.bottom = this.height + this.top;
        this.right = this.width + this.left;
        return this;
    }
    //八大行为组件 draggable droppable resizable sortable selectable scrollable switchable fixedable
    draggable.dropinit = function(event, dd) {
        var queue = droppable.scopes["#" + dd.scope]
        if(queue) {
            //收集要放置的元素
            var uniq = {},
                droppers = [],
                nodes = [];
            for(var i = 0, data; data = queue[i++];) {
                var arr = data["this"];
                if(typeof data.selector === "string") {
                    arr = data["this"].find(data.selector);
                }
                //构建即用即弃的放置对象数组
                for(var j = 0, node; node = arr[j++];) {
                    if(node.nodeType == 1) {
                        var uuid = $.getUid(node)
                        if(!uniq[uuid]) {
                            uniq[uuid] = 1;
                            nodes.push(node);
                            if(typeof data.drop == "function") {
                                $(node).on("drop.draggable", data.drop);
                            }
                            var obj = new Locate(node)
                            obj.data = data;
                            droppers.push(obj)
                        }
                    }
                }
            }
            droppable.dragger = new Locate(dd.dragger[0]);
            droppable.nodes = nodes;
            droppable.droppers = droppers;
        } else {
            droppable.nodes = [];
            droppable.droppers = false;
        }
    }
    draggable.dropstart = function(event, dd, node) {
        var nodes = droppable.droppers;
        for(var i = 0, el; el = nodes[i++];) {
            var accept = el.data.accept;
            if(accept == "*" || $.match(node, accept)) {
                if(droppable.nodes.indexOf(node) == -1) {
                    dd.droppable = true;
                    break;
                }
            }
        }
    }
    draggable.drop = function(event, dd) {
        //此事件在draggable的drag事件上执行
        if(!dd.droppable) return;
        var droppers = droppable.droppers;
        var drg = droppable.dragger.refresh();
        for(var i = 0, drp; drp = droppers[i++];) {
            var data = drp.data,
                activeClass = data.activeClass,
                hoverClass = data.hoverClass,
                tolerance = data.tolerance,
                wrapper = drp.wrapper,
                isEnter = tolerance ? tolerance(event, drg, drp) : droppable.contains(drp, [event.pageX, event.pageY]);
            if(!droppers.actived && activeClass) { //如果还没有激活
                wrapper.addClass(activeClass);
            }
            if(isEnter) { //如果第一次相交
                if(!drp['isEnter']) { //如果是第一次进入,则触发dragenter事件
                    drp['isEnter'] = 1;
                    hoverClass && wrapper.addClass(hoverClass);
                    dd.dropper = wrapper;
                    var type = "dragenter";
                } else { //标识已进入
                    type = "dragover";
                }
                draggable.dispatch(event, dd, type);
            } else { //如果光标离开放置对象
                if(drp['isEnter']) {
                    hoverClass && wrapper.removeClass(hoverClass);
                    dd.dropper = wrapper; //处理覆盖多个靶场
                    draggable.dispatch(event, dd, "dragleave");
                    delete drp['isEnter'];
                }
            }
        }
        droppers.actived = 1;
    }
    draggable.dropend = function(event, dd) {
        if(!dd.droppable) return;
        delete dd.droppable;
        for(var i = 0, drp; drp = droppable.droppers[i++];) {
            var data = drp.data,
                wrapper = drp.wrapper;
            data.activeClass && wrapper.removeClass(data.activeClass);
            if(drp['isEnter']) {
                dd.dropper = wrapper;
                draggable.dispatch(event, dd, "drop");
                delete drp['isEnter'];
            }
        }
    }
    $.mix(droppable, {
        scopes: {},
        Locate: Locate,
        defaults: defaults,
        contains: function(dropper, dragger) {
            // 判定dropper是否包含dragger
            return((dragger[0] || dragger.left) >= dropper.left && (dragger[0] || dragger.right) <= dropper.right && (dragger[1] || dragger.top) >= dropper.top && (dragger[1] || dragger.bottom) <= dropper.bottom);
        },
        overlap: function(dropper, dragger) {
            // 求出两个方块的重叠面积
            return Math.max(0, Math.min(dropper.bottom, dragger.bottom) - Math.max(dropper.top, dragger.top)) * Math.max(0, Math.min(dropper.right, dragger.right) - Math.max(dropper.left, dragger.left));
        },
        modes: {
            intersect: function(event, dragger, dropper) {
                // 拖动块是否与靶场相交，允许覆盖多个靶场
                return droppable.contains(dropper, [event.pageX, event.pageY]) ? true : droppable.overlap(dragger, dropper);
            },
            pointer: function(event, dragger, dropper) {
                // 判定光标是否在靶场之内
                return droppable.contains(dropper, [event.pageX, event.pageY]);
            },
            fit: function(event, dragger, dropper) {
                // 判定是否完全位于靶场
                return droppable.contains(dropper, dragger) ? 1 : 0;
            },
            middle: function(event, dragger, dropper) {
                // 至少有一半进入耙场才触发dragenter
                return droppable.contains(dropper, [dragger.left + dragger.width * .5, dragger.top + dragger.height * .5]); //? 1 : 0
            }
        }
    });
    return $;
})
//2013.1.19 优化draggable.locate
//2013.1.27 升级到 v2