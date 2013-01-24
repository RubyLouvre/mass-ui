/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
define("sortable",["mass.droppable"], function($){
    var defaults = {
        filter: "*"
    }
    var sortable =  $.fn.sortable = function(hash) {
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
    function handleSortStart(event){
        var inner = event.handleObj;
        var target = event.target
        var offset = $(target).offset();
        var data = $.mix({ }, inner,
        {
            opos: [event.pageX, event.pageY],
            dragger: $(target),//实际上被拖动的元素
            startX: event.pageX,
            startY: event.pageY,
            originalX: offset.left,
            originalY: offset.top
        });
        //在鼠标按下时，立即确认现在页面的情况，包括动态插入的节点
        //如果使用了事件代理，则在原基础上找到那被代理的元素
        var nodes = typeof data.selector == "string" ? data["this"].find(data.selector) : data["this"];
        var els = [];
        var droppers = [];
        data.realm = nodes.valueOf();//活动范围
        //再过滤那些不配被选中的子元素
        nodes = nodes.children(data.filter);
        for(var i = 0, node; node = nodes[i++];){
            if(node !== target && !$.contains(node, target)){
                els.push(node);
                droppers.push( draggable.locate(  $(node))  );    //批量生成放置元素的坐标对象
            }
        }
        data.droppers = droppers;
        //判定是上下重排还是左右重排
        data.floating = data.droppers ? data.axis === "x" ||
        (/left|right/).test( $(els).css("float")) || (/inline|table-cell/).test( $(els).css("display") ) : false;

        if($.isFunction(data.sortstart)) {
            event.type = "sortstart";
            data.sortstart.call(els, event, data)
        }
        sortable.data = data;
    }
    function handleSortDrag (event){
        var data =  sortable.data ;
        if(data){
            var target = event.target, ok = false
            for(var i = 0, node ; node = data.realm[i++];){
                if( $.contains(node, target, true)){
                    ok = true;
                    break
                }
            }
            if(!ok){
                return
            }

            node = data.dragger[0]
            if(!data._placeholder){
                var placeholder = node.cloneNode(false);
                placeholder.style.visibility = "hidden";
                placeholder.id ="placeholder"
                data._placeholder = node.parentNode.insertBefore(placeholder, node)
                node.style.position =  "absolute";
            }
            //当前元素移动了多少距离
            data.deltaX = event.pageX - data.startX;
            data.deltaY = event.pageY - data.startY;
            if(data.floating){
                data.direction = data.deltaX > 0 ? "right" : "left";
            }else{
                data.direction = data.deltaY > 0 ? "down" : "up";
            }
         
        
            //现在的坐标
            data.offsetX = data.deltaX + data.originalX;
            data.offsetY = data.deltaY + data.originalY;
            node.style.left = data.offsetX + "px";
            node.style.top = data.offsetY + "px";
            //开始判定有没有相交
            var dragger = data.dragger
            var drg = dragger.drg || (dragger.drg = {
                element: dragger,
                
                width: dragger.outerWidth(),
                height: dragger.outerHeight()
            });
            draggable.locate(dragger, null, dragger.drg); //生成拖拽元素的坐标对象
            //console.log( data.droppers)
            var fn = draggable.modes.middle;
            if(!data.crossing){//如果还没有相交者
                for(var i = 0, drp; drp = data.droppers[i++];) {
          
                    var isEnter = drp.node != drg.node && fn(event, drg, drp);
                    if(isEnter) {
                        data.crossing = drp;
                        console.log("rrrrrrrrrrrrrrrrrr")
                        console.log(drp.node)
                        break;
                    }
                }
            }else if( data.crossing && !fn(event, drg, data.crossing)){//判定拖动块已离开原
                delete  data.crossing
            }
         
         
        }

    }
    function handleSortEnd(){
        delete sortable.data
    }
    draggable.underway.push(handleSortDrag)
    draggable.dropscene.push(handleSortEnd)
    return $;
})
/*
var a = {
    _convertPositionTo: function(d, pos) {

        if(!pos) {
            pos = this.position;
        }

        var mod = d === "absolute" ? 1 : -1,
        scroll = this.cssPosition === "absolute" && !(this.scrollParent[0] !== document &&
            $.contains(this.scrollParent[0], this.offsetParent[0])) ? this.offsetParent :
            this.scrollParent, scrollIsRootNode = (/(html|body)/i).test(scroll[0].tagName);

        return {
            top: (
                pos.top	+																// The absolute mouse position
                this.offset.relative.top * mod +										// Only for relative positioned nodes: Relative offset from element to offset parent
                this.offset.parent.top * mod -										// The offsetParent's offset without borders (offset + border)
                ( ( this.cssPosition === "fixed" ? -this.scrollParent.scrollTop() : ( scrollIsRootNode ? 0 : scroll.scrollTop() ) ) * mod)
                ),
            left: (
                pos.left +																// The absolute mouse position
                this.offset.relative.left * mod +										// Only for relative positioned nodes: Relative offset from element to offset parent
                this.offset.parent.left * mod	-										// The offsetParent's offset without borders (offset + border)
                ( ( this.cssPosition === "fixed" ? -this.scrollParent.scrollLeft() : scrollIsRootNode ? 0 : scroll.scrollLeft() ) * mod)
                )
        };

    },

    _generatePosition: function(event) {

        var containment, co, top, left,
        o = this.options,
        scroll = this.cssPosition === "absolute" && !(this.scrollParent[0] !== document && $.contains(this.scrollParent[0], this.offsetParent[0])) ? this.offsetParent : this.scrollParent,
        scrollIsRootNode = (/(html|body)/i).test(scroll[0].tagName),
        pageX = event.pageX,
        pageY = event.pageY;



        if(this.originalPosition) { //If we are not dragging yet, we won't check for options
            if(this.containment) {
                if (this.relative_container){
                    co = this.relative_container.offset();
                    containment = [ this.containment[0] + co.left,
                    this.containment[1] + co.top,
                    this.containment[2] + co.left,
                    this.containment[3] + co.top ];
                }
                else {
                    containment = this.containment;
                }

                if(event.pageX - this.offset.click.left < containment[0]) {
                    pageX = containment[0] + this.offset.click.left;
                }
                if(event.pageY - this.offset.click.top < containment[1]) {
                    pageY = containment[1] + this.offset.click.top;
                }
                if(event.pageX - this.offset.click.left > containment[2]) {
                    pageX = containment[2] + this.offset.click.left;
                }
                if(event.pageY - this.offset.click.top > containment[3]) {
                    pageY = containment[3] + this.offset.click.top;
                }
            }

            if(o.grid) {
                //Check for grid elements set to 0 to prevent divide by 0 error causing invalid argument errors in IE (see ticket #6950)
                top = o.grid[1] ? this.originalPageY + Math.round((pageY - this.originalPageY) / o.grid[1]) * o.grid[1] : this.originalPageY;
                pageY = containment ? ((top - this.offset.click.top >= containment[1] || top - this.offset.click.top > containment[3]) ? top : ((top - this.offset.click.top >= containment[1]) ? top - o.grid[1] : top + o.grid[1])) : top;

                left = o.grid[0] ? this.originalPageX + Math.round((pageX - this.originalPageX) / o.grid[0]) * o.grid[0] : this.originalPageX;
                pageX = containment ? ((left - this.offset.click.left >= containment[0] || left - this.offset.click.left > containment[2]) ? left : ((left - this.offset.click.left >= containment[0]) ? left - o.grid[0] : left + o.grid[0])) : left;
            }

        }

        return {
            top: (
                pageY -																	// The absolute mouse position
                this.offset.click.top	-												// Click offset (relative to the element)
                this.offset.relative.top -												// Only for relative positioned nodes: Relative offset from element to offset parent
                this.offset.parent.top +												// The offsetParent's offset without borders (offset + border)
                ( ( this.cssPosition === "fixed" ? -this.scrollParent.scrollTop() : ( scrollIsRootNode ? 0 : scroll.scrollTop() ) ))
                ),
            left: (
                pageX -																	// The absolute mouse position
                this.offset.click.left -												// Click offset (relative to the element)
                this.offset.relative.left -												// Only for relative positioned nodes: Relative offset from element to offset parent
                this.offset.parent.left +												// The offsetParent's offset without borders (offset + border)
                ( ( this.cssPosition === "fixed" ? -this.scrollParent.scrollLeft() : scrollIsRootNode ? 0 : scroll.scrollLeft() ))
                )
        };

    },
}*/