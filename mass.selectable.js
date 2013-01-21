define("selectable",["mass.droppable"], function($){
    var defaults =  {
        appendTo: "body",
        filter: "*",//从当前匹配元素中的子元素选取目标
        selector: null,
        // callbacks
        selectstart: null,//this为可能被选中的元素的集合
        select: null,//this为正在选中的元素的集合
        selectend: null,//this为已被选中的元素的集合
        selectingClass: "ui-selecting",
        selectedClass: "ui-selected"
    }

    var draggable = $.fn.draggable;
   
    var selectable = $.fn.selectable = function(hash){
        var data = $.mix({}, defaults, hash || {})
        data.helper = $("<div class='ui-selectable-helper'></div>");
        data["this"] = this;
        this.data("selectable",data);
        this.on("mousedown", data.selector, data, handleSelectStart);
        this.on("click",     data.selector, data, handleSelectClick);
        this.on("mousemove", data.selector, data, handleSelectDrag);
        return this;
    }
    selectable.droppers = [];
    //通过点击事件霎间完成选择
    function handleSelectClick(event){
        var data = event.handleObj;
        if(!data.selectingClass){
            return
        }
        data["this"].removeClass( data.selectingClass + " " + data.selectedClass );
        var drg = [event.pageX, event.pageY];
        var hasSelected = false;
        for(var i = 0, drp; drp = selectable.droppers[i++];) {
            if(!hasSelected){
                var bool = draggable.contains(drp, drg);
                if(bool){
                    selectable.nodes = [drp.element[0]]
                    drp.element.addClass( data.selectedClass );
                    hasSelected = true;
                    if($.isFunction( data.selectend )){
                        event.type = "selectend";
                        data.selectend.call(selectable.nodes, event, data )
                    }
                }
            }
        }
    }

    function handleSelectStart(event){
        var data = event.handleObj;
        if(!data.selectingClass){
            return
        }
        selectable.data = data;//公开到全局，方便让其他回调也能访问到
        $(data.appendTo).append(data.helper);//创建一个临时节点，用于显示选择区域
        data.helper.css({
            left: event.pageX,
            top:  event.pageY,
            width: 0,
            height: 0,
            position:"absolute",
            borderWidth:1,
            borderStyle:"dotted",
            borderColor:"#ccc",
            backgroundColor:"#fff",
            opacity:.5
        });
        data.opos = [event.pageX, event.pageY];
        //如果使用了事件代理，则在原基础上找到那被代理的元素
        var nodes = typeof data.selector == "string" ? data["this"].find(data.selector) : data["this"];
        //再过滤那些不配被选中的子元素
        nodes = nodes.children(data.filter);
        //批量生成放置元素的坐标对象
        var els = [];
        selectable.droppers = $.map(nodes, function() {
            els.push(this);//收集元素节点
            var el = $(this).removeClass(data.selectedClass)
            return draggable.locate( el );
        });
        if($.isFunction( data.selectstart )){
            event.type = "selectstart";
            data.selectstart.call(els, event, data )
        }
    }

    //通过拖动进行选择
    function handleSelectDrag(event){
        var data = selectable.data
        if( data ){
            //处理动态生成的选择区域
            var x1 = data.opos[0], y1 = data.opos[1], x2 = event.pageX, y2 = event.pageY;
            if (x1 > x2) {
                var tmp = x2; x2 = x1; x1 = tmp;
            }
            if (y1 > y2) {
                var tmp = y2; y2 = y1; y1 = tmp;
            }
            data.helper.css({
                left: x1,
                top: y1,
                width: x2-x1,
                height: y2-y1
            });
            //判定选择区域与复数个选择元素是否有相关
            var drg = {
                left: x1,
                top : y1,
                right: x2,
                bottom:y2
            }
            var fn = draggable.modes.intersect;
            selectable.nodes = [];
            for(var i = 0, drp; drp = selectable.droppers[i++];) {
                var isEnter = fn(event, drg, drp);
                if(isEnter) {
                    if(!drp['isEnter']) { //如果是第一次进入,则触发dragenter事件
                        drp['isEnter'] = 1;
                        drp.element.addClass( data.selectingClass );
                    }
                    selectable.nodes.push(drp.element[0])
                } else { //如果光标离开放置对象
                    if(drp['isEnter']) {
                        drp.element.removeClass(data.selectingClass)
                        delete drp['isEnter'];
                    }
                }
            }
            if($.isFunction( data.select )){
                event.type = "select";
                data.select.call(selectable.nodes, event, data );
            }
        }
    }
    //当鼠标弹起，完成选择，统一冒泡到HTML节点进行处理
    $(document.documentElement).on("mouseup", function(event){
        var data = selectable.data
        if( data ){
          //  $.log("selectend", 7);
            $(selectable.nodes).replaceClass(data.selectingClass, data.selectedClass);
            if($.isFunction( data.selectend )){
                event.type = "selectend";
                data.selectend.call( selectable.nodes, event, data );
            }
            selectable.nodes = [];
            delete selectable.data;
            setTimeout(function(){
                data.helper.remove();
            });
        }
    })
    
    return $;
})
