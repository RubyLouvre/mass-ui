
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
        draggable.textselect(false);
        var handleObj = event.handleObj;
        //在鼠标按下时，立即确认现在页面的情况，包括动态插入的节点
        //如果使用了事件代理，则在原基础上找到那被代理的元素
        var realm = typeof handleObj.selector == "string" ? handleObj["this"].find(handleObj.selector) : handleObj["this"];
        var nodes = realm.children(handleObj.filter).valueOf(); //过滤那些不配被选中的子元素
        var sorters = nodes.concat(); //可以重新排序的元素
        var node = getDragger(event.target, sorters); //正在被拖拽的目标元素
        var dragger = $(node)
        var offset = dragger.offset();
        $.Array.remove(sorters, node);
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
        data.dragger =  new Locate(node)
        //判定是上下重排还是左右重排
        data.floating = data.droppers ? data.axis === "x" || (/left|right/).test($(sorters).css("float")) || (/inline|table-cell/).test($(sorters).css("display")) : false;

        if($.isFunction(data.sortstart)) {
            event.type = "sortstart";
            data.sortstart.call(sorters, event, data)
        }
        sortable.data = data;
    }


    function isIntersect(A, B) { //如果A，B相交面积大于A的51%以上，则返回true
        var l = A.left >= B.left ? A.left : B.left;
        var r = A.right <= B.right ? A.right : B.right
        var t = A.top >= B.top ? B.top : A.top;
        var b = A.bottom <= B.bottom ? A.bottom : B.bottom;
        var w = r - l;
        var h = b - t;
        if(w <= 0 || h <= 0) {
            console.log("isIntersect false")
            return false;
        }
        var bool = w * h > A.width * A.height * .51
        console.log("isIntersect "+bool)
        return bool
    }
    //不相交

    function isSimpleIntersect(node, drag, dir, droppers) {
        var prop = "previousSibling",
        self = node;
        if(dir == "down" || dir == "right") {
            prop = "nextSibling"
        }
        while(node = node[prop]) {
            if(node.nodeType == 1 && node != drag ) {
                break;
            }
        }
        if(node != self) {
            for(var i = 0, obj; obj = droppers[i++];) {
                // console.log(obj)
                if(obj.node == node) {
                    return obj;
                }
            }
        }
        return null;
    }
    function Locate(node){
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
    Locate.prototype.refresh = function(){
        var offset =  this.wrapper.offset();
        this.top = offset.top;
        this.left = offset.left;
        this.bottom = this.height + this.top;
        this.right = this.width + this.left;
        return this;
    }
    function isIsolate(drg, drp, dir, petch) {
        switch(dir) {
            case "down":
                $.log("向下移动",8)
                return  drg.top > drp.bottom;
            case "up":
                 $.log("向上移动",8)
                return drg.bottom < drp.top;
            default:
                var horizontal = Math.abs(petch.top -drp.top) < 1;
                //      console.log("horizontal  "+horizontal)
                if(horizontal){
                    console.log("petch  "+petch.right +" drp.left "+ drp.left)
                    if(petch.right < drp.left){//如果占位符在左边
                        console.log(drg.left > drp.right)
                        return drg.left > drp.right;
                    }else{
                        return drg.right < drp.left;
                    }
                }else{
                    if(petch.bottom < drp.top){//如果占位符在左边
                        return drg.top > drp.bottom;
                    }else{
                        return drg.bottom < drp.top;
                    }
                }
        }
        return false;
    }
    function handleSortDrag(event) {
        var data = sortable.data;
        if(data) {
            var target = event.target,
            ok = false
            for(var i = 0, el; el = data.realm[i++];) {
                if($.contains(el, target, true)) {
                    ok = true;
                    break;
                }
            }
            if(!ok) {
                return;
            }
         
            var dragger = data.dragger, node = data.node, dropper, other;
            if(!data.placeholder) {//我们需要插入一个空白区域到原位撑着
                other = node.cloneNode(false);
                other.style.visibility = "hidden";
                other.id = "placeholder";
                data.placeholder = node.parentNode.insertBefore(other, node);
                data.petch = new Locate(data.placeholder)
                node.style.position = "absolute";
            }
            //判定移动方向
            var dir
            if(!data.floating) {
                dir = event.pageY - data.prevY > 0 ? "down" : "up";
            }
            //当前元素移动了多少距离
            data.deltaX = event.pageX - data.startX;
            data.deltaY = event.pageY - data.startY;
            data.prevX = event.pageX;
            data.prevY = event.pageY;
            //现在的坐标
            data.offsetX = data.deltaX + data.originalX;
            data.offsetY = data.deltaY + data.originalY;
            if(data.floating) {
                //通过document.elementFromPoint求得要交换的元素
                //这里是第一步,先设法移走遮在它上方的拖动块
                node.style.visibility = "hidden"
                node.style.top = "-1000px";
                node.style.left = "-1000px";
                other = document.elementFromPoint(event.pageX, event.pageY);
                
            }
            node.style.left = data.offsetX + "px";
            node.style.top = data.offsetY + "px";
            if(data.floating) {//data.floating
                //然后遍历所有候选项,如果某某与other相包含即为目标
                node.style.visibility = "visible"
                if(other.tagName == "HTML") {
                    if( ! data._dropper){
                        // console.log("other")
                        return
                    }
                   
                }else{
                    for(i = 0; el = data.droppers[i++];) {
                        if($.contains(el.node, other, true)) {
                            dropper = el;
                            break;
                        }
                    }
                }
            } else {
                //以最简单的方式求出要交换位置的元素
                dropper = isSimpleIntersect(data.placeholder, node, dir, data.droppers);
            }
            if( dropper ) { //如果存在交换元素
                dragger.refresh()
                //判定相覆盖的面积是否达拖动块的51%以上
                if(!data._dropper) {
                    if(isIntersect(dragger, dropper)) {
                        //console.log("ssssssssssssssssssssssssssssss")
                        data._dropper = dropper;
                    }
                } else {
                    if(isIsolate(dragger, data._dropper, data.direction, data.petch)) { //判定拖动块已离开原
                        var a = data._dropper.node,  b = data.placeholder, c = b;
                        node = b;
                        if(!dir){
                            dir =  "up";
                            while((c = c.nextSibling)){
                                if(c == a){
                                    dir = "down";
                                    break;
                                }
                            }
                        }
                        switch(dir) { //移动占位符与用于交换的放置元素
                            case "down":
                                b.parentNode.insertBefore(a, b);
                                break
                            case "up":
                                b.parentNode.insertBefore(b, a);
                                break;
                        }
                        data.petch.refresh();
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
        if(data && data.placeholder) {
            var perch = data.placeholder
            var parent = perch.parentNode;
            var node = data.node;
            //            parent.insertBefore(node, perch)
            //            node.style.position = "static";
            //            parent.removeChild(perch);
            //            parent.style.visibility = "inherit";
            //            parent.style.visibility = "visible";
            //            delete data.placeholder
            delete sortable.data
        }
    }
    draggable.underway.push(handleSortDrag);
    draggable.dropscene.push(handleSortEnd);
    return $;
})