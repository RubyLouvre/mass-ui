define("selectable",["droppable"], function(){
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
    $.selectable = function(hash){
        var config = $.mix({}, defaults, hash || {})
        hash.selector = hash.filter;
        
        $.fn.droppable(hash)
    }
})
