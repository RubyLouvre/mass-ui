
define("sortable", ["mass.droppable"], function($) {
    var defaults = {
        filter: "*"
    };
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
        if (data.axis !== "" && !/^(x|y|xy)$/.test(data.axis)) {
            data.axis = "xy";
        }
        this.data("sortable", data);
        this.on("mousedown.sortable", data.selector, data, handleSortStart);
        return this;
    };
    var draggable = $.fn.draggable;

    function contains(target, nodes) {//取得nodes里面包含或等于target的元素
        for (var i = 0, node; node = nodes[i++]; ) {
            if ($.contains(node, target, true)) {
                return node;
            }
        }
    }

    function handleSortStart(event) {
        draggable.textselect(false);
        var handleObj = event.handleObj;
        //在鼠标按下时，立即确认现在页面的情况，包括动态插入的节点
        //如果使用了事件代理，则在原基础上找到那被代理的元素
        var realm = typeof handleObj.selector === "string" ? handleObj["this"].find(handleObj.selector) : handleObj["this"];   
        var nodes = realm.children(handleObj.filter).valueOf(); //过滤那些不配被选中的子元素
        var sorters = nodes.concat(); //可以重新排序的元素
        var node = contains(event.target, sorters); //正在被拖拽的目标元素
        var dragger = $(node);
        var offset = dragger.offset();
        $.Array.remove(sorters, node);//去掉自身
       
        //必须基于全局样式计算的样式变成内联样式,防止拖拽时走形
        dragger.width(dragger.width());
        dragger.height(dragger.height());
        var data = $.mix({}, handleObj, {
            node: node,
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
            return new Locate(node)
        });
        data.dragger = new Locate(node)
        //判定是上下重排还是左右重排
        //  data.floating = data.droppers ? data.axis === "x" || (/left|right/).test($(sorters).css("float")) || (/inline|table-cell/).test($(sorters).css("display")) : false;
        if ($.isFunction(data.sortstart)) {
            event.type = "sortstart";
            data.sortstart.call(sorters, event, data)
        }
        sortable.data = data;
    }
// 判断两个矩形是否相交
//  http://051031wangcj.blog.163.com/blog/static/334067622010112841335693/
    function isIntersect(A, B) { //如果A，B相交面积大于A的51%以上，则返回true
        var bool = Math.max(A.top, B.top) <= Math.min(A.bottom, B.bottom) && Math.max(A.left, B.left) <= Math.min(A.right, B.right)
        if (bool === false) {
            return false;
        }
        var top = Math.max(A.top, B.top),
        left = Math.max(A.left, A.left),
        bottom = Math.min(A.bottom, B.bottom),
        right = Math.min(A.right, B.right);
        return (right - left) * (bottom - top) > A.width * A.height * .51

    }
    function isIsolate(A, B) {
        return !isIntersect(A, B);
    }

    function Locate(node) {
        this.node = node;
        var wrapper = $(node);
        var rect = node.getBoundingClientRect()
        this.wrapper = wrapper;
        this.top = rect.top;
        this.left = rect.left;
        this.bottom = rect.bottom;
        this.right = rect.right;
        this.width = rect.width || rect.right - rect.left;
        this.height = rect.height || rect.bottom - rect.top;
    }
    Locate.prototype.refresh = function() {
        var rect = this.node.getBoundingClientRect()
        this.top = rect.top;
        this.left = rect.left;
        this.bottom = rect.bottom;
        this.right = rect.right;
        return this;
    }


    function handleSortDrag(event) {
        var data = sortable.data;
        if (data) {
            if (!contains(event.target, data.realm)) {
                return;
            }
            var dragger = data.dragger, node = data.node, dropper, other;
            if (!data.placeholder) {//我们需要插入一个空白区域到原位撑着
                other = node.cloneNode(false);
                other.style.visibility = "hidden";
                other.id = "placeholder";
                data.placeholder = $(node.parentNode.insertBefore(other, node));
                node.style.position = "absolute";
            }

            //当前元素移动了多少距离
            data.deltaX = event.pageX - data.startX;
            data.deltaY = event.pageY - data.startY;
            data.prevX = event.pageX;
            data.prevY = event.pageY;
            //现在的坐标
            data.offsetX = data.deltaX + data.originalX;
            data.offsetY = data.deltaY + data.originalY;

            //通过document.elementFromPoint求得要交换的元素
            //这里是第一步,先设法移走遮在它上方的拖动块
            node.style.visibility = "hidden"
            node.style.top = "-1000px";
            node.style.left = "-1000px";
            other = document.elementFromPoint(event.pageX, event.pageY);

            node.style.left = data.offsetX + "px";
            node.style.top = data.offsetY + "px";
            //然后遍历所有候选项,如果某某与other相包含即为目标
            node.style.visibility = "visible";
            for (i = 0; el = data.droppers[i++]; ) {
                if ($.contains(el.node, other, true)) {
                    dropper = el;
                    break;
                }
            }
            draggable.clearSelection();
            if (dropper) { //如果存在交换元素
                dragger.refresh()
                if (!data._dropper) {
                    //如果相交的面积是否达拖动块的51%以上
                    if (isIntersect(dragger, dropper)) {
                        data._dropper = dropper;
                    }
                } else {
                    if (isIsolate(dragger, data._dropper)) { //判定拖动块已离开原放置元素
                        // $.log("可以交换元素了")
                        var wrapper = data._dropper.wrapper;
                        wrapper[data.placeholder.index() < wrapper.index() ? 'after' : 'before'](data.placeholder);
                        data._dropper.refresh();
                        delete data._dropper;
                    }
                }

            }
        }

    }

    function handleSortEnd() {
        draggable.textselect(true);
        var data = sortable.data;
        if (data && data.placeholder) {
            var perch = data.placeholder[0]
            var parent = perch.parentNode;
            var node = data.node;
            parent.insertBefore(node, perch)
            node.style.position = "static";
            parent.removeChild(perch);
            parent.style.visibility = "inherit";
            parent.style.visibility = "visible";
            delete data.placeholder
            delete sortable.data
        }
    }
    draggable.underway.push(handleSortDrag);
    draggable.dropscene.push(handleSortEnd);
    return $;
})

//https://github.com/farhadi/html5sortable/blob/master/jquery.sortable.js
//http://farhadi.ir/projects/html5sortable/