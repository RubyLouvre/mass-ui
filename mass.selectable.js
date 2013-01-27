define("selectable", ["mass.droppable"], function($) {
    var defaults = {
        appendTo: "body",
        filter: "*",
        //从当前匹配元素中的子元素选取目标
        selector: null,
        // callbacks
        selectstart: null,
        //this为可能被选中的元素的集合
        select: null,
        //this为正在选中的元素的集合
        selectend: null,
        //this为已被选中的元素的集合
        selectingClass: "ui-selecting",
        selectedClass: "ui-selected"
    }

    var draggable = $.fn.draggable;
    var droppable = $.fn.droppable;
    var selectable = $.fn.selectable = function(hash) {
            var data = $.mix({}, defaults, hash || {})
            data.helper = $("<div class='ui-selectable-helper'></div>");
            data["this"] = this;
            this.on("mousedown.selectable", data.selector, {
                selectable: data
            }, handleSelectStart);
            this.on("click.selectable", data.selector, {
                selectable: data
            }, handleSelectClick);
            // this.on("mousemove.selectable", data.selector, data, handleSelectDrag);
            return this;
        }
    selectable.defaults = defaults;
    selectable.droppers = [];
    //通过点击事件霎间完成选择


    function handleSelectClick(event) {
        var data = event.handleObj.selectable;
        if(!data) {
            return;
        }
        data["this"].removeClass(data.selectingClass + " " + data.selectedClass);
        var drg = [event.pageX, event.pageY];
        var hasSelected = false;
        for(var i = 0, drp; drp = selectable.droppers[i++];) {
            if(!hasSelected) {
                var bool = droppable.contains(drp, drg);
                if(bool) {
                    selectable.nodes = [drp.node]
                    drp.wrapper.addClass(data.selectedClass);
                    hasSelected = true;
                    if($.isFunction(data.selectend)) {
                        event.type = "selectend";
                        data.selectend.call(selectable.nodes, event, data)
                    }
                }
            }
        }
    }

    function handleSelectStart(event) {
        var obj = event.handleObj.selectable;
        if(!obj) {
            return;
        }
        var data = $.mix({
            startX: event.pageX,
            startY: event.pageY
        }, obj);
        var nodes = typeof data.selector == "string" ? data["this"].find(data.selector) : data["this"];
        var thisArr = [];
        data.realm = nodes.children(data.filter).removeClass(data.selectedClass).get();
        data.helper.css({
            display: "none",
            left: event.pageX,
            top: event.pageY,
            width: 0,
            height: 0,
            position: "absolute",
            borderWidth: 1,
            borderStyle: "dotted",
            borderColor: "red",
            backgroundColor: "#fff",
            opacity: .5
        });
        $(data.appendTo).append(data.helper); //创建一个临时节点，用于显示选择区域
        selectable.droppers = data.realm.map(function(el) {
            thisArr.push(el); //收集元素节点
            return new droppable.Locate(el);
        });
        selectable.data = data; //公开到全局，方便让其他回调也能访问到
        draggable.textselect(false); //阻止文本被选择
        if($.isFunction(data.selectstart)) {
            event.type = "selectstart";
            data.selectstart.call(thisArr, event, data)
        }
    }

    //通过拖动进行选择


    function handleSelectDrag(event) {
        var data = selectable.data
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
            if(!data._reflow_one_time) {
                data.helper.css("display", "block")
                data._reflow_one_time = 1;
            }
            //处理动态生成的选择区域
            var x1 = data.startX,
                y1 = data.startY,
                x2 = event.pageX,
                y2 = event.pageY;
            if(x1 > x2) {
                var tmp = x2;
                x2 = x1;
                x1 = tmp;
            }
            if(y1 > y2) {
                var tmp = y2;
                y2 = y1;
                y1 = tmp;
            }
            data.helper.css({
                left: x1,
                top: y1,
                width: x2 - x1,
                height: y2 - y1
            });
            //判定选择区域与复数个选择元素是否有相关
            var drg = {
                left: x1,
                top: y1,
                right: x2,
                bottom: y2
            }
            var fn = droppable.modes.intersect;
            selectable.nodes = [];
            for(var i = 0, drp; drp = selectable.droppers[i++];) {
                var isEnter = fn(event, drg, drp);
                if(isEnter) {
                    if(!drp['isEnter']) { //如果是第一次进入,则触发dragenter事件
                        drp['isEnter'] = 1;
                        drp.wrapper.addClass(data.selectingClass);
                    }
                    selectable.nodes.push(drp.node);
                } else { //如果光标离开放置对象
                    if(drp['isEnter']) {
                        drp.wrapper.removeClass(data.selectingClass);
                        $.Array.remove(selectable.nodes, drp.node);
                        delete drp['isEnter'];
                    }
                }
            }
            if($.isFunction(data.select)) {
                event.type = "select";
                data.select.call(selectable.nodes, event, data);
            }
        }
    }
    //当鼠标弹起，完成选择，统一冒泡到HTML节点进行处理


    function handleSelectEnd(event) {
        draggable.textselect(true);
        var data = selectable.data;
        if(data) {
            $(selectable.nodes).replaceClass(data.selectingClass, data.selectedClass);
            if($.isFunction(data.selectend)) {
                event.type = "selectend";
                data.selectend.call(selectable.nodes, event, data);
            }
            selectable.nodes = [];
            delete selectable.data;
            delete data._reflow_one_time;
            setTimeout(function() {
                data.helper.remove();
            });
        }
    }
    draggable.underway.push(handleSelectDrag);
    draggable.dropscene.push(handleSelectEnd);
    return $;
})