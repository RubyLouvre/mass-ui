define("draggable",["$event","$attr"], function($){
    var facade = $.event,
    eventHooks = facade.special
    //.draggable()
    //.draggable( type )
    //.draggable( handler, opts )
    //.draggable( type, handler, opts )
    $.fn.draggable = function( type, handler, opts ){
        var hash = {
            type: "drag"
        }, hasCallback
        for(var i = 0; i < arguments.length; i++) {
            var el = arguments[i];
            if(typeof el == "string") {
                //如果第一个参数为更具体的事件类型,合并成此事件
                if ( el.indexOf("drag") !== 0 )
                    hash.type = "drag"+ el;
            } else if(typeof el == "function") {
                //合并成draginit , dragstart ,dragend 事件
                //draginit当鼠标按下时触发的事件,返回false会取消后继事件产生.如果参数中"not", "handle", "which"不符合条件时,它不会触发
                //dragstart跟接draginit触发的事件,但如果设置了distance参数,则要求移动了相应的距离才触发它,返回false会取消后继事件产生
                //drag,跟接着dragstart触发的事件,它会在用户移动鼠标时持续发生,返回false可阻止fragend与drop事件发生
                //如果存在多个拖动元素,那么它会单独为每个元素触发相应回调
                //dragend,当鼠标被释放或drop事件被触发后,就行执行此事件.如果存在多个拖动元素,那么它会单独为每个元素触发相应回调
                hasCallback = hash.handler = el
            } else if(el && typeof el == "object"){
                $.mix(hash, el)
            }
        }
        return  this.each(function(){
            if(hasCallback){
                facade.bind(this, hash);
            }else{
                facade.trigger.apply(this, hash.type);
            }
        });
    };

    // local refs (increase compression)
    var $event = $.event,
    $special = $event.special,
    // configure the drag special event
    //特殊处理拖动事件
    drag = eventHooks.drag = {

        // these are the default settings
        defaults: {
            which: 1, // mouse button pressed to start drag sequence
            distance: 0, // distance dragged before dragstart
            not: ':input', // selector to suppress dragging on target elements
            handle: null, // selector to match handle target elements
            relative: false, // true to use "position", false to use "offset"
            drop: true, // false to suppress drop events, true or selector to allow
            click: false // false to suppress click events after dragend (no proxy)
        },
        //用于储存相应的拖动数据
        datakey: "dragdata",
        //阻止沓泡提高性能
        // prevent bubbling for better performance
        noBubble: true,

        // count bound related events
        add: function( obj ){
            // read the interaction data
            var data = $.data( this, drag.datakey ),
            // read any passed options
            opts = obj.data || {};
            // count another realted event
            data.related += 1;
            // extend data options bound with this event
            // don't iterate "opts" in case it is a node
            $.each( drag.defaults, function( key, def ){
                if ( opts[ key ] !== undefined )
                    data[ key ] = opts[ key ];
            });
        },

        // forget unbound related events
        remove: function(){
            $.data( this, drag.datakey ).related -= 1;
        },

        // configure interaction, capture settings
        setup: function(){
            // check for related events
            if ( $.data( this, drag.datakey ) )
                return;
            // initialize the drag data with copied defaults
            var data = $.extend({
                related:0
            }, drag.defaults );
            // store the interaction data
            $.data( this, drag.datakey, data );
            // bind the mousedown event, which starts drag interactions
            $event.add( this, "touchstart mousedown", drag.init, data );
            // prevent image dragging in IE...
            if ( this.attachEvent )
                this.attachEvent("ondragstart", drag.dontstart );
        },

        // destroy configured interaction
        teardown: function(){
            var data = $.data( this, drag.datakey ) || {};
            // check for related events
            if ( data.related )
                return;
            // remove the stored data
            $.removeData( this, drag.datakey );
            // remove the mousedown event
            $event.remove( this, "touchstart mousedown", drag.init );
            // enable text selection
            drag.textselect( true );
            // un-prevent image dragging in IE...
            if ( this.detachEvent )
                this.detachEvent("ondragstart", drag.dontstart );
        },

        // initialize the interaction
        init: function( event ){
            // sorry, only one touch at a time
            if ( drag.touched )
                return;
            // the drag/drop interaction data
            var dd = event.data, results;
            // check the which directive
            if ( event.which != 0 && dd.which > 0 && event.which != dd.which )
                return;
            // check for suppressed selector
            if ( $( event.target ).is( dd.not ) )
                return;
            // check for handle selector
            if ( dd.handle && !$( event.target ).closest( dd.handle, event.currentTarget ).length )
                return;

            drag.touched = event.type == 'touchstart' ? this : null;
            dd.propagates = 1;
            dd.mousedown = this;
            dd.interactions = [ drag.interaction( this, dd ) ];
            dd.target = event.target;
            dd.pageX = event.pageX;
            dd.pageY = event.pageY;
            dd.dragging = null;
            // handle draginit event...
            results = drag.hijack( event, "draginit", dd );
            // early cancel
            if ( !dd.propagates )
                return;
            // flatten the result set
            results = drag.flatten( results );
            // insert new interaction elements
            if ( results && results.length ){
                dd.interactions = [];
                $.each( results, function(){
                    dd.interactions.push( drag.interaction( this, dd ) );
                });
            }
            // remember how many interactions are propagating
            dd.propagates = dd.interactions.length;
            // locate and init the drop targets
            if ( dd.drop !== false && $special.drop )
                $special.drop.handler( event, dd );
            // disable text selection
            drag.textselect( false );
            // bind additional events...
            if ( drag.touched )
                $event.add( drag.touched, "touchmove touchend", drag.handler, dd );
            else
                $event.add( document, "mousemove mouseup", drag.handler, dd );
            // helps prevent text selection or scrolling
            if ( !drag.touched || dd.live )
                return false;
        },

        // returns an interaction object
        interaction: function( elem, dd ){
            var offset = $( elem )[ dd.relative ? "position" : "offset" ]() || {
                top:0,
                left:0
            };
            return {
                drag: elem,
                callback: new drag.callback(),
                droppable: [],
                offset: offset
            };
        },

        // handle drag-releatd DOM events
        handler: function( event ){
            // read the data before hijacking anything
            var dd = event.data;
            // handle various events
            switch ( event.type ){
                // mousemove, check distance, start dragging
                case !dd.dragging && 'touchmove':
                    event.preventDefault();
                case !dd.dragging && 'mousemove':
                    //  drag tolerance, x?+ y?= distance?				if ( Math.pow(  event.pageX-dd.pageX, 2 ) + Math.pow(  event.pageY-dd.pageY, 2 ) < Math.pow( dd.distance, 2 ) )
                    break; // distance tolerance not reached
                    event.target = dd.target; // force target from "mousedown" event (fix distance issue)
                    drag.hijack( event, "dragstart", dd ); // trigger "dragstart"
                    if ( dd.propagates ) // "dragstart" not rejected
                        dd.dragging = true; // activate interaction
                // mousemove, dragging
                case 'touchmove':
                    event.preventDefault();
                case 'mousemove':
                    if ( dd.dragging ){
                        // trigger "drag"
                        drag.hijack( event, "drag", dd );
                        if ( dd.propagates ){
                            // manage drop events
                            if ( dd.drop !== false && $special.drop )
                                $special.drop.handler( event, dd ); // "dropstart", "dropend"
                            break; // "drag" not rejected, stop
                        }
                        event.type = "mouseup"; // helps "drop" handler behave
                    }
                // mouseup, stop dragging
                case 'touchend':
                case 'mouseup':
                default:
                    if ( drag.touched )
                        $event.remove( drag.touched, "touchmove touchend", drag.handler ); // remove touch events
                    else
                        $event.remove( document, "mousemove mouseup", drag.handler ); // remove page events
                    if ( dd.dragging ){
                        if ( dd.drop !== false && $special.drop )
                            $special.drop.handler( event, dd ); // "drop"
                        drag.hijack( event, "dragend", dd ); // trigger "dragend"
                    }
                    drag.textselect( true ); // enable text selection
                    // if suppressing click events...
                    if ( dd.click === false && dd.dragging )
                        $.data( dd.mousedown, "suppress.click", new Date().getTime() + 5 );
                    dd.dragging = drag.touched = false; // deactivate element
                    break;
            }
        },

        // re-use event object for custom events
        hijack: function( event, type, dd, x, elem ){
            // not configured
            if ( !dd )
                return;
            // remember the original event and type
            var orig = {
                event:event.originalEvent,
                type:event.type
            },
            // is the event drag related or drog related?
            mode = type.indexOf("drop") ? "drag" : "drop",
            // iteration vars
            result, i = x || 0, ia, $elems, callback,
            len = !isNaN( x ) ? x : dd.interactions.length;
            // modify the event type
            event.type = type;
            // remove the original event
            event.originalEvent = null;
            // initialize the results
            dd.results = [];
            // handle each interacted element
            do if ( ia = dd.interactions[ i ] ){
                // validate the interaction
                if ( type !== "dragend" && ia.cancelled )
                    continue;
                // set the dragdrop properties on the event object
                callback = drag.properties( event, dd, ia );
                // prepare for more results
                ia.results = [];
                // handle each element
                $( elem || ia[ mode ] || dd.droppable ).each(function( p, subject ){
                    // identify drag or drop targets individually
                    callback.target = subject;
                    // force propagtion of the custom event
                    event.isPropagationStopped = function(){
                        return false;
                    };
                    // handle the event
                    result = subject ? $event.dispatch.call( subject, event, callback ) : null;
                    // stop the drag interaction for this element
                    if ( result === false ){
                        if ( mode == "drag" ){
                            ia.cancelled = true;
                            dd.propagates -= 1;
                        }
                        if ( type == "drop" ){
                            ia[ mode ][p] = null;
                        }
                    }
                    // assign any dropinit elements
                    else if ( type == "dropinit" )
                        ia.droppable.push( drag.element( result ) || subject );
                    // accept a returned proxy element
                    if ( type == "dragstart" )
                        ia.proxy = $( drag.element( result ) || ia.drag )[0];
                    // remember this result
                    ia.results.push( result );
                    // forget the event result, for recycling
                    delete event.result;
                    // break on cancelled handler
                    if ( type !== "dropinit" )
                        return result;
                });
                // flatten the results
                dd.results[ i ] = drag.flatten( ia.results );
                // accept a set of valid drop targets
                if ( type == "dropinit" )
                    ia.droppable = drag.flatten( ia.droppable );
                // locate drop targets
                if ( type == "dragstart" && !ia.cancelled )
                    callback.update();
            }
            while ( ++i < len )
            // restore the original event & type
            event.type = orig.type;
            event.originalEvent = orig.event;
            // return all handler results
            return drag.flatten( dd.results );
        },

        // extend the callback object with drag/drop properties...
        properties: function( event, dd, ia ){
            var obj = ia.callback;
            // elements
            obj.drag = ia.drag;
            obj.proxy = ia.proxy || ia.drag;
            // starting mouse position
            obj.startX = dd.pageX;
            obj.startY = dd.pageY;
            // current distance dragged
            obj.deltaX = event.pageX - dd.pageX;
            obj.deltaY = event.pageY - dd.pageY;
            // original element position
            obj.originalX = ia.offset.left;
            obj.originalY = ia.offset.top;
            // adjusted element position
            obj.offsetX = obj.originalX + obj.deltaX;
            obj.offsetY = obj.originalY + obj.deltaY;
            // assign the drop targets information
            obj.drop = drag.flatten( ( ia.drop || [] ).slice() );
            obj.available = drag.flatten( ( ia.droppable || [] ).slice() );
            return obj;
        },

        // determine is the argument is an element or jquery instance
        element: function( arg ){
            if ( arg && ( arg.jquery || arg.nodeType == 1 ) )
                return arg;
        },

        // flatten nested jquery objects and arrays into a single dimension array
        flatten: function( arr ){
            return $.map( arr, function( member ){
                return member && member.jquery ? $.makeArray( member ) :
                member && member.length ? drag.flatten( member ) : member;
            });
        },

        // toggles text selection attributes ON (true) or OFF (false)
        textselect: function( bool ){
            $( document )[ bool ? "unbind" : "bind" ]("selectstart", drag.dontstart )
            .css("MozUserSelect", bool ? "" : "none" );
            // .attr("unselectable", bool ? "off" : "on" )
            document.unselectable = bool ? "off" : "on";
        },

        // suppress "selectstart" and "ondragstart" events
        dontstart: function(){
            return false;
        },

        // a callback instance contructor
        callback: function(){}

    };

    // callback methods
    drag.callback.prototype = {
        update: function(){
            if ( $special.drop && this.available.length )
                $.each( this.available, function( i ){
                    $special.drop.locate( this, i );
                });
        }
    };

    // patch $.event.$dispatch to allow suppressing clicks
    var $dispatch = $event.dispatch;
    $event.dispatch = function( event ){
        if ( $.data( this, "suppress."+ event.type ) - new Date().getTime() > 0 ){
            $.removeData( this, "suppress."+ event.type );
            return;
        }
        return $dispatch.apply( this, arguments );
    };

    // event fix hooks for touch events...
    var touchHooks =
    $event.fixHooks.touchstart =
    $event.fixHooks.touchmove =
    $event.fixHooks.touchend =
    $event.fixHooks.touchcancel = {
        props: "clientX clientY pageX pageY screenX screenY".split( " " ),
        filter: function( event, orig ) {
            if ( orig ){
                var touched = ( orig.touches && orig.touches[0] )
                || ( orig.changedTouches && orig.changedTouches[0] )
                || null;
                // iOS webkit: touchstart, touchmove, touchend
                if ( touched )
                    $.each( touchHooks.props, function( i, prop ){
                        event[ prop ] = touched[ prop ];
                    });
            }
            return event;
        }
    };

    // share the same special event configuration with related events...
    $special.draginit = $special.dragstart = $special.dragend = drag;

})