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
    $.fn.selectable = function(hash){
        var config = $.mix({}, defaults, hash || {})
        config.selector = config.filter;
        config.helper = $("<div class='ui-selectable-helper'></div>");
        this.mousedown(function(event){
            $(config.appendTo).append(config.helper);
            // position helper (lasso)
            config.helper.css({
                "left": event.pageX,
                "top": event.pageY,
                "width": 0,
                "height": 0,
                backgroundColor:"red",
                opacity:.5
            });
        })
        this.mouseup(function(event){
            config.helper.remove();
        })
        //  config.dropinit
        
        this.droppable(config)
    }
    return $;
})
