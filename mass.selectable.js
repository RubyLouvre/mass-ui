define("selectable",["mass.resizable","mass.droppable"], function(){
    var defaults =  {
        appendTo: "body",
        autoRefresh: true,
        distance: 0,
        filter: "*",
        tolerance: "touch",

        // callbacks
        selected: null,
        selecting: null,
        start: null,
        stop: null,
        unselected: null,
        unselecting: null
    }
    $("html").draggable({
        selector: ".ui-selectable-helper"
    })
    $.fn.selectable = function(hash){
        var data = $.mix({}, defaults, hash || {})
        //   data.selector = data.filter;
        data.helper = $("<div class='ui-selectable-helper'></div>");
        this.on("mousedown", data.selector, function(e){
            $(data.appendTo).append(data.helper);
            data.opos = [e.pageX, e.pageY];
            data.selecting = true;
            data.helper.css({
                "left": e.pageX,
                "top": e.pageY,
                "width": 0,
                "height": 0,
                position:"absolute",
                backgroundColor:"red",
                opacity:.5
            });
        })
        this.on("mousemove", data.selector, function(e){
            if(  data.selecting ){
                var x1 = data.opos[0], y1 = data.opos[1], x2 = e.pageX, y2 = e.pageY;
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
            }
        })
        $(document).on("mouseup",  function(e){
            if(data.selecting){
                setTimeout(function(){
                    data.helper.remove();
                })
                delete data.selecting;
            }

         
           
        })
        //  config.dropinit
        
        this.droppable(data)
    }
    return $;
})
