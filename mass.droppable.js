define("droppable", ["mass.draggable"], function($) {
    var defaults = {
        accept: "*",
        activeClass: false,
        addClasses: true,
        hoverClass: false,
        scope: "default",
        tolerance: "intersect"
    }
    var draggable = $.fn.draggable;
    draggable.scopes = {};
    $.fn.droppable = function(hash) {
        if(typeof hash == "function") {//如果只传入函数,那么当作是drop自定义事件的回调
            var fn = hash;
            hash = {
                drop: fn
            }
        }
        hash = hash || {}
        var data = $.mix({
            element: this
        }, defaults, hash);
        data.tolerance = typeof data.tolerance === "function" ? data.tolerance : draggable.modes[data.tolerance];
        this.data("droppable", data);
        var queue = draggable.scopes["#" + data.scope] || (draggable.scopes["#" + data.scope]  = [])
        queue.push(data);
        return this;
    }
    //取得放置对象的坐标宽高等信息
    draggable.locate = function(el, config, drg) {
        var posi = el.offset() || {
            top: 0,
            left: 0
        }
        drg = drg || {
            element: el,
            config: config,
            width: el.outerWidth(),
            height: el.outerHeight()
        }
        drg.top = posi.top;
        drg.left = posi.left;
        drg.right =  posi.left + drg.width;
        drg.bottom = posi.top + drg.height;
        return drg;
    }
    //八大行为组件 draggable droppable resizable sortable selectable scrollable switchable fixedable
    draggable.dropinit = function(event, dd) {
        var queue = draggable.scopes["#" + dd.scope]
        if(queue) {
            //收集要放置的元素
            var a = [];
            for(var i =0, el; el = queue[i++];){
                var arr = el.element
                if(typeof el.selector === "string"){
                    arr = $(el.selector, el.element) ;
                    arr.data("droppable", el)
                }
                arr = -[1,] ? arr : $.slice(arr);//IE6-8只能传入数组，其他浏览器只需类数组就行了
                a.push.apply(a, arr );
            }
            var b = $.filter(a, function(node) {//去掉非元素节点
                return node.nodeType == 1;
            });
            this.nodes =  $.unique(b);//去重，排序

            draggable.droppers = $.map(this.nodes, function() { //批量生成放置元素的坐标对象
                var el = $(this), config = el.data("droppable")
                if(typeof config.drop == "function") {
                    el.on("drop.draggable", config.drop);
                }
                return draggable.locate(el, config);
            });
        } else {
            this.nodes = [];
            this.droppers = false;
        }
    }
    draggable.dropstart = function(event, dd, node) {
        var nodes = draggable.droppers;
        for(var i =0, el; el = nodes[i++];){
            var accept = el.config.accept;
            if(accept == "*" || $.match(node, accept)) {
                if(draggable.nodes.indexOf(node) == -1) {
                    dd.droppable = true;
                    break;
                }
            }
        }
    }
    draggable.drop = function(event, dd) {
        //此事件在draggable的drag事件上执行
        if(!dd.droppable) return;
        var xy = [event.pageX, event.pageY];
        var droppers = draggable.droppers;
        var el = dd.dragger
        var drg = el.drg || (el.drg = {
            element: el,
            width: el.outerWidth(),
            height: el.outerHeight()
        });
        draggable.locate(el, null, el.drg); //生成拖拽元素的坐标对象
        for(var i = 0, drp; drp = droppers[i++];) {
            var config = drp.config;
            var activeClass = config.activeClass;
            var hoverClass = config.hoverClass;
            var tolerance = config.tolerance;
            if(!droppers.actived && activeClass) { //如果还没有激活
                drp.element.addClass(activeClass);
            }
            //判定光标是否进入到dropper的内部
            var isEnter = tolerance ? tolerance(event, drg, drp) : draggable.contains(drp, xy);
            if(isEnter) {
                if(!drp['isEnter']) { //如果是第一次进入,则触发dragenter事件
                    drp['isEnter'] = 1;
                    hoverClass && drp.element.addClass(hoverClass);
                    dd.dropper = drp.element;
                    var type = "dragenter";
                } else { //标识已进入
                    type = "dragover";
                }
                draggable.dispatch(event, dd, type);
            } else { //如果光标离开放置对象
                if(drp['isEnter']) {
                    hoverClass && drp.element.removeClass(hoverClass);
                    dd.dropper = drp.element; //处理覆盖多个靶场
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
        delete dd.dragger.drg;
        for(var i = 0, drp; drp = draggable.droppers[i++];) {
            var config = drp.config;
            config.activeClass && drp.element.removeClass(config.activeClass);
            if(drp['isEnter']) {
                dd.dropper = drp.element;
                draggable.dispatch(event, dd, "drop");
                delete drp['isEnter'];
            }
        }
    }
    // 判定dropper是否包含dragger
    draggable.contains = function(dropper, dragger) {
        return((dragger[0] || dragger.left) >= dropper.left && (dragger[0] || dragger.right) <= dropper.right && (dragger[1] || dragger.top) >= dropper.top && (dragger[1] || dragger.bottom) <= dropper.bottom);
    }
    // 求出两个方块的重叠面积
    draggable.overlap = function(dropper, dragger) {
        return Math.max(0, Math.min(dropper.bottom, dragger.bottom) - Math.max(dropper.top, dragger.top)) * Math.max(0, Math.min(dropper.right, dragger.right) - Math.max(dropper.left, dragger.left));
    }
    draggable.modes = {
        // 拖动块是否与靶场相交，允许覆盖多个靶场
        intersect: function(event, dragger, dropper) {
            return draggable.contains(dropper, [event.pageX, event.pageY]) ? true : draggable.overlap(dragger, dropper);
        },
        // 判定光标是否在靶场之内
        pointer: function(event, dragger, dropper) {
            return draggable.contains(dropper, [event.pageX, event.pageY]);
        },
        // 判定是否完全位于靶场
        fit: function(event, dragger, dropper) {
            return draggable.contains(dropper, dragger); //? 1 : 0
        },
        // 至少有一半进入耙场才触发dragenter
        middle: function(event, dragger, dropper) {
            return draggable.contains(dropper, [dragger.left + dragger.width * .5, dragger.top + dragger.height * .5]) ;//? 1 : 0
        }
    }
    return $;
})
//2013.1.19 优化draggable.locate
