/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
define("sortable", ["mass.droppable"], function($) {
    var defaults = {
        filter: "*"
    }
    /**
     * 配置参数
     * axis 轴拖拽 x 水平 y 垂直 xy 任意 "" 不能拖 非以上四者或没有预设默认xy
     * sortstart 开始排序时调用的回调
     * seletor 选择器，用于事件代理
     * filter 原匹配元素的子元素的CSS表达式。比如$(ol).sortable({filter:".aaa"}),
     *      那么它只会在LI元素中类名为aaa的孩子中选择，默认为*
     * =============================
     * 经过组件调整后生成的配置对象多出的属性
     * this 原mass对象
     * dragger 正在被拖动的元素的mass对象
     * startX 鼠标按下时的它相对于页面的横坐标
     * startY 鼠标按下时的它相对于页面的纵坐标
     * droppers 能被放置的子元素（不包括拖拽元素）的坐标信息组成的数组
     * realm 鼠标可活动的有效范围
     * floating 判定是上下重排还是左右重排
     */
    var sortable = $.fn.sortable = function(hash) {
            var data = $.mix({}, defaults, hash || {})
            //  data.helper = $("<div class='ui-selectable-helper'></div>");
            data["this"] = this;
            //处理方向拖拽
            if(data.axis !== "" && !/^(x|y|xy)$/.test(data.axis)) {
                data.axis = "xy";
            }
            this.data("sortable", data);
            this.on("mousedown.sortable", data.selector, data, handleSortStart);
            // this.on("mousemove.sortable", data.selector, data, handleSortDrag);
            return this;
        }
    var draggable = $.fn.draggable;

    function getDragger(target, nodes) {
        for(var i = 0, node; node = nodes[i++];) {
            if($.contains(node, target, true)) {
                return node;
            }
        }
    }

    function handleSortStart(event) {
        var handleObj = event.handleObj;
        //在鼠标按下时，立即确认现在页面的情况，包括动态插入的节点
        //如果使用了事件代理，则在原基础上找到那被代理的元素
        var realm = typeof handleObj.selector == "string" ? handleObj["this"].find(handleObj.selector) : handleObj["this"];
        var nodes = realm.children(handleObj.filter).valueOf(); //过滤那些不配被选中的子元素
        var sorters = nodes.concat(); //可以重新排序的元素
        var node = getDragger(event.target, sorters); //正在被拖拽的目标元素
        var dragger = $(node)
        //  console.log(node)
        var offset = dragger.offset();
        $.Array.remove(sorters, dragger)
        //必须基于全局样式计算的样式变成内联样式,防止拖拽时走形
        dragger.width(dragger.width())
        dragger.height(dragger.height())
        var data = $.mix({}, handleObj, {
            dragger: dragger,
            //实际上被拖动的元素
            startX: event.pageX,
            startY: event.pageY,
            prevX: event.pageX,
            prevY: event.pageY,
            realm: realm,
            //鼠标的可活动范围
            nodes: nodes,
            sorters: sorters,
            originalX: offset.left,
            //拖动块的横坐标
            originalY: offset.top //拖动块的纵坐标
        });
        data.droppers = sorters.map(function(node) {
            return draggable.locate($(node))
        })
        //判定是上下重排还是左右重排
        data.floating = data.droppers ? data.axis === "x" || (/left|right/).test($(sorters).css("float")) || (/inline|table-cell/).test($(sorters).css("display")) : false;

        if($.isFunction(data.sortstart)) {
            event.type = "sortstart";
            data.sortstart.call(sorters, event, data)
        }
        sortable.data = data;
    }

    function implant(drg, drp, direction) {
        var bool = false;
        switch(direction) {
        case "down":
            bool = drg.bottom - drp.top > drp.height * .5;
            break;
        case "up":
            bool = drp.bottom - drg.top > drp.height * .5;
            break;
        case "right":
            bool = drg.right - drp.left > drp.width * .5;
            break;
        case "left":
            bool = drp.right - drg.left > drp.width * .5;
            break;
        }
        return bool;
    }

    function intersect(A, B) { //如果A，B相交面积大于A的51%以上，则返回true
        var l = A.left >= B.left ? A.left : B.left;
        var r = A.right <= B.right ? A.right : B.right
        var t = A.top >= B.top ? B.top : A.top;
        var b = A.bottom <= B.bottom ? A.bottom : B.bottom;
        var w = r - l;
        var h = b - t;
        $.log(w * h + " " + A.width * A.height + " " + A.node, 7)
        if(w <= 0 || h <= 0) {
            return false;
        }
        return w * h > A.width * A.height * .51
    }

    function isolate(drg, drp, direction) {
        var bool = false
        switch(direction) {
        case "down":
            bool = drg.top > drp.bottom;
            break;
        case "up":
            bool = drg.bottom < drp.top;
            break;
        case "right":

            bool = drg.left > drp.right;
            //  console.log(drg.left +" > "+drp.right+" - "+bool)
            break;
        case "left":
            bool = drg.right < drp.left;
            break;
        }
        return bool;
    }

    function simpleIntersect(node, drag, dir, droppers) {
        var prop = "previousSibling",
            self = node;
        if(dir == "down" || dir == "right") {
            prop = "nextSibling"
        }
        while(node = node[prop]) {
            if(node.nodeType == 1 && node != drag) {
                break;
            }
        }
        if(node != self) {
            for(var i = 0, obj; obj = droppers[i++];) {
                if(obj.node == node) {
                    return obj;
                }
            }
        }
        return null;
    }

    function handleSortDrag(event) {
        var data = sortable.data;
        if(data) {
            var target = event.target,
                ok = false
            for(var i = 0, node; node = data.realm[i++];) {
                if($.contains(node, target, true)) {
                    ok = true;
                    break;
                }
            }
            if(!ok) {
                return;
            }
            var dragger = data.dragger,
                other, drp;
            node = dragger[0];
            if(!data._placeholder) {
                other = node.cloneNode(false);
                other.style.visibility = "hidden";
                other.id = "placeholder";
                data._placeholder = node.parentNode.insertBefore(other, node);
                node.style.position = "absolute";
            }
            //判定移动方向
            if(data.floating) {
                data.direction = event.pageX - data.prevX > 0 ? "right" : "left";
            } else {
                data.direction = event.pageY - data.prevY > 0 ? "down" : "up";
            }
            // console.log( data.direction)
            //当前元素移动了多少距离
            data.deltaX = event.pageX - data.startX;
            data.deltaY = event.pageY - data.startY;
            data.prevX = event.pageX;
            data.prevY = event.pageY;
            //现在的坐标
            data.offsetX = data.deltaX + data.originalX;
            data.offsetY = data.deltaY + data.originalY;
            //移开底下的拖动块,取得下面的元素,然后把拖动块移回来,判定这两者的关系
            if(data.floating) {
                node.style.visibility = "hidden"
                node.style.top = "-1000px";
                node.style.left = "-1000px";
                other = document.elementFromPoint(event.pageX, event.pageY);
            }
            node.style.left = data.offsetX + "px";
            node.style.top = data.offsetY + "px";
            if(data.floating) {
                node.style.visibility = "visible"
                if(other.tagName == "HTML") {
                    return
                }
                for(i = 0; node = data.droppers[i++];) {
                    if($.contans(node.node, other, true)) {
                        drp = node;
                        break;
                    }
                }
            } else {
                //开始判定有没有相交
                drp = simpleIntersect(data._placeholder, node, data.direction, data.droppers)
            }
            if(drp) { //如果存在交换元素
                var drg = dragger.drg || (dragger.drg = {
                    element: dragger,
                    width: dragger.innerWidth(),
                    height: dragger.innerHeight()
                });

                draggable.locate(dragger, null, dragger.drg); //生成拖拽元素的坐标对象
                if(!data.swap) {

                    if(intersect(drg, drp, data.direction)) {
                        data.swap = drp;
                    }
                } else {
                    if(isolate(drg, data.swap, data.direction)) { //判定拖动块已离开原
                        drp = data.swap;
                        var a = drp.node,
                            b = data._placeholder
                        switch(data.direction) { //移动占位符与用于交换的放置元素
                        case "down":
                        case "right":
                            b.parentNode.insertBefore(a, b);
                            break
                        case "up":
                        case "left":
                            b.parentNode.insertBefore(b, a);
                            break;
                        }
                        var el = drp.element;
                        var offset = el.offset();
                        drp.top = offset.top;
                        drp.left = offset.left;
                        draggable.locate(el, null, drp);
                        delete data.swap;
                    }
                }
            }
        }

    }

    function handleSortEnd() {
        var data = sortable.data;
        if(data && data._placeholder) {
            var perch = data._placeholder
            var parent = perch.parentNode;
            var node = data.dragger[0]
            parent.insertBefore(node, perch)
            node.style.position = "static";
            parent.removeChild(perch);
            parent.style.visibility = "inherit";
            parent.style.visibility = "visible";
            delete data._placeholder
            delete sortable.data
        }
    }
    draggable.underway.push(handleSortDrag);
    draggable.dropscene.push(handleSortEnd);
    return $;
})