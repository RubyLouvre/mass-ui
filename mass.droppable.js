define("droppable", ["mass.draggable"], function($) {
    var defaults = {
        accept: "*",
        activeClass: false,
        addClasses: true,
        greedy: false,
        hoverClass: false,
        scope: "default",
        tolerance: "intersect"
    }
    var facade = $.fn.draggable
    facade.scopes = {}
    $.fn.droppable = function(hash){
        hash = hash || {}
        var config = $.mix({
            element: this
        }, defaults, hash);
        config.tolerance = typeof config.tolerance === "function" ? config.tolerance : facade.modes[config.tolerance];
        facade.scopes["#"+ config.scope] = config;
        return this;
    }
    //取得放置对象的坐标宽高等信息
    facade.locate = function( $elem ){
        var posi = $elem.offset()||{
            top:0,
            left:0
        } ,
        height = $elem.outerHeight(),
        width = $elem.outerWidth()
        return  {
            elem: element,
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
            this.draggers = [];
            this.droppers = config.selector ? $(config.selector, config.element).valueOf(): config.element;
            this.activeConfig = config
        }else{
            this.activeConfig = this.droppers = false
        }
    }
    facade.dropstart = function(event, dd, node){
        var accept =  facade.activeConfig;
        if(node.nodeType == 1 ){
            if(accept == "*" || $.match(node, accept)){
                if(facade.droppers.indexOf( node ) !== -1){
                    facade.draggers.push( facade.locate( dd.dragger ) )//批量生成放置元素的坐标对象
                }
            }
        }
    }
    facade.drop = function( event, dd, node ){
        //此事件在draggable的drag事件上执行
        var config = facade.activeConfig;
        var tolerance = config.tolerance;
        var activeClass = config.activeClass;
        var hoverClass = config.hoverClass;
        var xy = [ event.pageX, event.pageY ];
        var uuid = $.getUid(node);
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
                if(!drp['###'+uuid]){//如果是第一次进入,则触发dragenter事件
                    drp['###'+uuid] = 1;
                    hoverClass && drp.elemement.addClass( hoverClass );
                    dd.dropper = drp.elemement;
                    type = "dragenter"
                }else{//标识已进入
                    type = "dragover"
                }
                facade.dispatch( event, dd, type );
            }else{//如果光标离开放置对象
                if(drp['###'+uuid]){
                    hoverClass && drp.elem.removeClass(hoverClass);
                    dd.dropper = drp.elemement;//处理覆盖多个靶场
                    facade.dispatch(event, dd, "dragleave" );
                    delete drp['###'+uuid]
                }
            }
        }
        droppers.actived = 1;
    }
    facade.dropend = function( event, dd, node ){
        var config = this.activeConfig;
        var uuid =  $.getUid(node);
        for( var i = 0, drp; drp = facade.droppers[i++];){
            config.activeClass && drp.element.removeClass(config.activeClass);
            if(drp["###" + uuid]){
                dd.dropper = drp.element;
                facade.dispatch(event, dd, "drop" );
                delete drp["###"+uuid]
            }
        }
    }
    return $;
})