define("droppable", ["mass.draggable"], function($) {
    var defaults = {
        accept: "*",
        activeClass: false,
        addClasses: true,
        hoverClass: false,
        scope: "default",
        tolerance: "intersect"
    }
    var facade = $.fn.draggable
    facade.scopes = {}
    $.fn.droppable = function(hash){
        if(typeof hash == "function"){
            var fn = hash;
            hash = {
                drop: fn
            }
        }
        hash = hash || {}
        var config = $.mix({
            element: this
        }, defaults, hash);
        var target = this
        config.tolerance = typeof config.tolerance === "function" ? config.tolerance : facade.modes[config.tolerance];
        facade.scopes["#"+ config.scope] = config;

        fn = config.drop
        if(typeof fn == "function") {
            target.on("drop.mass_dd", fn);
        }

        return this;
    }
    //取得放置对象的坐标宽高等信息
    facade.locate = function( element ){
        var posi = element.offset()||{
            top:0,
            left:0
        } ,
        height = element.outerHeight(),
        width = element.outerWidth()
        return  {
            element: element,
            width: width,
            height: height,
            top: posi.top,
            left: posi.left,
            right: posi.left + width,
            bottom: posi.top + height
        };
    }
    facade.dropinit = function(event, dd){
        var config = facade.scopes["#"+dd.scope]
        if(config){
            this.nodes = [];
            var elements = config.selector ? $(config.selector, config.element): config.element;
            this.nodes = $.filter(elements, function(node){
                return node.nodeType == 1;
            })
            facade.droppers = $.map(this.nodes, function(){//批量生成放置元素的坐标对象
                return facade.locate($(this))
            });
            this.activeConfig = config
        }else{
            this.activeConfig = this.droppers =  false
        }
    }
    facade.dropstart = function(event, dd, node){
        var accept =  facade.activeConfig.accept;
        if(node.nodeType == 1 ){
            if(accept == "*" || $.match(node, accept)){
                if(facade.nodes.indexOf( node ) == -1){
                    dd.droppable = true
                }
            }
        }
    }
    facade.drop = function( event, dd ){
        //此事件在draggable的drag事件上执行
        if(!dd.droppable)
            return
        var config = facade.activeConfig;
        var tolerance = config.tolerance;
        var activeClass = config.activeClass;
        var hoverClass = config.hoverClass;
        var xy = [ event.pageX, event.pageY ];
        var droppers = facade.droppers, drg, drp, type;
        if ( tolerance ){//自己规定何时触发dragenter dragleave
            drg = facade.locate( dd.dragger );//生成拖拽元素的坐标对象
        }
        for( var i = 0, n = droppers.length; i < n ; i++ ){
            drp = droppers[i];
            if( !droppers.actived && activeClass){//如果还没有激活
                drp.element.addClass(activeClass);
            }
            //判定光标是否进入到dropper的内部
            var isEnter = tolerance ? tolerance( event, drg, drp ): facade.contains( drp, xy );
            if(isEnter){
                if(!drp['isEnter']){//如果是第一次进入,则触发dragenter事件
                    drp['isEnter'] = 1;
                    hoverClass && drp.element.addClass( hoverClass );
                    dd.dropper = drp.element;
                    type = "dragenter"
                }else{//标识已进入
                    type = "dragover"
                }
                facade.dispatch( event, dd, type );
            }else{//如果光标离开放置对象
                if(drp['isEnter']){
                    hoverClass && drp.element.removeClass(hoverClass);
                    dd.dropper = drp.element;//处理覆盖多个靶场
                    facade.dispatch( event, dd, "dragleave" );
                    delete drp['isEnter']
                }
            }
        }
        droppers.actived = 1;
    }
    facade.dropend = function( event, dd ){
        if(!dd.droppable)
            return
        delete dd.droppable
        var config = this.activeConfig;
        for( var i = 0, drp; drp = facade.droppers[i++];){
             config.activeClass && drp.element.removeClass(config.activeClass);
             if(drp['isEnter']){
                dd.dropper = drp.element;
                facade.dispatch( event, dd, "drop" );
                delete drp['isEnter']
            }
        }
    }
    // 判定dropper是否包含dragger
    facade.contains =  function(  dropper, dragger ){
        return ( dragger.left  >= dropper.left) && ( dragger.right  <= dropper.right)
        && ( dragger.top  >= dropper.top )&& (  dragger.bottom  <= dropper.bottom );
    }
    // 求出两个方块的重叠面积
    facade.overlap = function( dropper, dragger  ){
        return Math.max( 0, Math.min( dropper.bottom, dragger.bottom ) - Math.max( dropper.top, dragger.top ) )
        * Math.max( 0, Math.min( dropper.right, dragger.right ) - Math.max( dropper.left, dragger.left ) );
    }
    facade.modes = {
        // 拖动块是否与靶场相交，允许覆盖多个靶场
        intersect: function( event, dragger, dropper ){
            return facade.contains( dropper, [ event.pageX, event.pageY ] ) ?
            true : facade.overlap( dragger, dropper );
        },
        // 判定光标是否在靶场之内
        pointer: function( event, dragger, dropper ){
            return facade.contains( dropper, [ event.pageX, event.pageY ] )
        },
        // 判定是否完全位于靶场
        fit: function( event,  dragger, dropper  ){
            return facade.contains( dropper, dragger ) //? 1 : 0
        },
        // 至少有一半进入耙场才触发dragenter
        middle: function( event, dragger, dropper ){
            return facade.contains( dropper, [ dragger.left + dragger.width * .5, dragger.top + dragger.height * .5 ] )//? 1 : 0
        }
    }
    return $;
})