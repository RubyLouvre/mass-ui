/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
define("sortable",["mass.droppable"], function($){
    var defaults = {
       filter: "*"
    }
    $.fn.sortable = function(hash) {
        var data = $.mix({}, defaults, hash || {})
      //  data.helper = $("<div class='ui-selectable-helper'></div>");
        data["this"] = this;
        this.data("sortable", data);
        this.on("mousedown.sortable", data.selector, data, handleSortStart);
        this.on("mousemove.sortable", data.selector, data, handleSortDrag);
        return this;
    }
    function handleSortStart(){
        
    }
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