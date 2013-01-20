define("selectable",["mass.droppable"], function(){
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
        data._nodes = this;
        this.on("mousedown", data.selector, function(event){
            $(data.appendTo).append(data.helper);
            data.opos = [event.pageX, event.pageY];
            data.selecting = true;
            data.helper.css({
                "left": event.pageX,
                "top": event.pageY,
                "width": 0,
                "height": 0,
                position:"absolute",
                backgroundColor:"red",
                opacity:.5
            });
            //如果使用了事件代理，则在原基础上找到那被代理的元素
            var nodes = typeof data.selector == "string" ? data._nodes.find(data.selector) :  data._nodes;
            //再过滤那些不配被选中的子元素
            nodes = nodes.children(data.filter);
            //批量生成放置元素的坐标对象
            var els = [];
            selectable.droppers = $.map(nodes, function() {
                els.push(this)
                var el = $(this).removeClass(data.selectedClass)
                return draggable.locate( el );
            });
            if($.isFunction( data.selectstart )){
                event.type = "selectstart";
                data.selectstart.call(els, event, data )
            }
        });
        this.on("click", data.selector, function(event){
            data._nodes.removeClass( data.selectingClass + " " + data.selectedClass )
            if( data.draging ){
                delete data.draging;
                return
            }
             
            var drg = [event.pageX, event.pageY];
            var fn = draggable.contains;
            var hasSelected = false;
           
            for(var i = 0, drp; drp = selectable.droppers[i++];) {
                if(!hasSelected){
                    var bool = fn(drp, drg);
                    if(bool){
                        selectable.els = [drp.element[0]]
                        drp.element.addClass( data.selectedClass );
                        hasSelected = true;
                        if($.isFunction( data.selectend )){
                            event.type = "selectend";
                            data.selectend.call(selectable.els, event, data )
                        }
                    }
                }
            }
        })
        this.on("mousemove", data.selector, function(event){
            if( data.selecting ){
                data.draging = true;
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
                var drg = {
                    left: x1,
                    top : y1,
                    right: x2,
                    bottom:y2
                }
                var fn = draggable.modes.intersect;
                selectable.els = []
                for(var i = 0, drp; drp = selectable.droppers[i++];) {
                    var isEnter = fn(event, drg, drp);
                    if(isEnter) {
                        if(!drp['isEnter']) { //如果是第一次进入,则触发dragenter事件
                            drp['isEnter'] = 1;
                            drp.element.addClass( data.selectingClass );
                        }
                        selectable.els.push(drp.element[0])
                    } else { //如果光标离开放置对象
                        if(drp['isEnter']) {
                            drp.element.removeClass(data.selectingClass)
                            delete drp['isEnter'];
                        }
                    }

                }

                if($.isFunction( data.select )){
                    event.type = "select";
                    data.select.call(selectable.els, event, data );
                }
            }
        })
        $(document).on("mouseup", function(event){

            if( data.selecting ){
                $(selectable.els).replaceClass(data.selectingClass, data.selectedClass);
                if($.isFunction( data.selectend )){
                    event.type = "selectend";
                    data.selectend.call( selectable.els, event, data );
                }
                delete selectable.els;
                delete data.selecting;
                setTimeout(function(){
                    delete  data.draging
                    data.helper.remove();
                });
                
            }
        })
        return this;
    }
    selectable.droppers = []
    return $;
})
