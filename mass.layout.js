define("mass.layout", ["css", "attr"], function($) {

    $.fn.layout = function(options) {

        var opts = $.mix({}, $.fn.layout.defaults, options);
        if (opts.type == "flow") {
            opts = $.mix({
                autoHeight: true,
                autoWidth: false,
                type: "flow"
            }, options || {});
        }

        return this.each(function() {
            var elem = $(this);
            var layout = elem.data('layout');
            var options = layout ? $.mix(opts, layout) : opts;
            $.fn.layout[options.type](elem, options);
        });
    };
    $.fn.layout.defaults = {
        autoHeight: true,
        autoWidth: true,
        type: 'grid'
    };

    //强制每个格子的大小都一样，宽都为最宽的格子的宽，高都为最高的格子的高
    //  cols 一行共有多少列
    //  hgap 每列之间的距离 1
    //  vgap 每行之间的距离 1

    function sandwich(elem, opts, callback) {
        opts.items = [];
        opts.widths = [];
        opts.heights = [];
        elem[0].style.position = "relative";
        opts.hgap = parseFloat(opts.hgap) || 1;
        opts.vgap = parseFloat(opts.vgap) || 1;
        elem.children().each(function(el) {
            el = $(this);
            this.style.position = "absolute";
            opts.items.push(el);
            opts.widths.push(parseFloat(el.outerWidth(true)));
            opts.heights.push(parseFloat(el.outerHeight(true)));
        });
        opts.cols = parseFloat(opts.cols) || opts.items.length;
        "left,top,right,bottom".replace($.rword, function(name) {
            opts[name] = parseFloat(elem.css("padding-" + name));
        });
        callback(elem, opts);

        if (opts.autoWidth) {
            elem[0].style.overflowX = "hidden";
            elem.width(1); //通过这种方式完美消灭滚动条
            elem.width(elem[0].scrollWidth - opts.right);
        }
        if (opts.autoHeight) {
            elem[0].style.overflowY = "hidden";
            elem.height(1);
            elem.height(elem[0].scrollHeight - opts.bottom);
        }
    }
//如果有autoHeight:true，则panel中的滚动条就不会出现。
// 
// 
//Anchor布局
//1.容器内的组件要么指定宽度，要么在anchor中同时指定高/宽， 
//2.anchor值通常只能为负值(指非百分比值)，正值没有意义， 
//3.anchor必须为字符串值 
    $.fn.layout.grid = function(elem, opts) {
        sandwich(elem, opts, function(delta) {
            var maxWidth = Math.max.apply(0, opts.widths);
            var maxHeight = Math.max.apply(0, opts.heights);
            var row = -1;
            for (var i = 0, el; el = opts.items[i]; i++) {
                var col = i % opts.cols; //当前列数
                if (col === 0) {
                    row++; //当前行数
                }
                el.css({//父节点的paddingLeft + 这一行的格子总宽 +间隔宽度
                    left: opts.left + (maxWidth + opts.hgap) * col,
                    top: opts.top + (maxHeight + opts.vgap) * row
                });
                delta = maxWidth - opts.widths[i];
                if (delta) { //确保每个格子的outerWidth一致
                    el.width("+=" + delta);
                }
                delta = maxHeight - opts.heights[i];
                if (delta) { //确保每个格子的outerHeight一致
                    el.height("+=" + delta);
                }
            }
        });
    };

    function adjustGrid(array, prop, callback, obj) {
        var max = Math.max.apply(0, array.values);
        for (var i = 0, el; el = array[i]; i++) {
            callback(el, obj[prop]);
            var delta = max - array.values[i];
            if (delta) {
                el[prop]("+=" + delta); //补高
            }
        }
        obj[prop] += max;
    }
    $.fn.layout.flexgrid = function(elem, opts) {
        sandwich(elem, opts, function() {
            var row = -1,
                    colsObject = {},
                    rowsObject = {},
                    outerObject = {
                width: 0,
                height: 0
            };
            //处理每一行的高与top值
            for (var i = 0, el; el = opts.items[i]; i++) {
                var col = i % opts.cols; //当前列数
                if (col === 0) {
                    row++; //当前行数
                }
                var colsArray = colsObject[col];
                if (!colsArray) {
                    colsArray = colsObject[col] = [];
                    colsArray.values = [];
                }
                colsArray.push(el);
                colsArray.values.push(opts.widths[i]);

                var rowsArray = rowsObject[row];
                if (!rowsArray) {
                    rowsArray = rowsObject[row] = [];
                    rowsArray.values = [];
                }
                rowsArray.push(el);
                rowsArray.values.push(opts.heights[i]);

            }

            //处理每一列的宽与left值
            for (i in colsObject) {
                if (colsObject.hasOwnProperty(i)) {
                    adjustGrid(colsObject[i], "width", function(el, val) {
                        el.css("left", opts.left + val + i * opts.hgap);
                    }, outerObject);
                }
            }
            //处理每一行的宽与top值
            for (i in rowsObject) {
                if (rowsObject.hasOwnProperty(i)) {
                    adjustGrid(rowsObject[i], "height", function(el, val) {
                        el.css("top", opts.top + val + i * opts.vgap);
                    }, outerObject);
                }
            }
        });
    };
    //┌────────────────────┐
    //│　　 　north　  　　│
    //├──────┬───────┬─────┤
    //│west  │center │east │
    //├──────┴───────┴─────┤
    //│　　 　south　　    │
    //└────────────────────┘
    //border 布局：border 布局也称边界布局，他将页面分隔为 west,east,south,north,center 这五个部分， 我们需要在在其 items 中指定 
    //使用 region 参数为其子元素指定具体位置。 注意：north 和 south 部分只能设置高度（height），
    //west 和 east 部分只能设置宽度（width）。north south west east 区域变大，center 区域就变小了。
    function adjustBorder(item, left, top, width) {
        item.css({
            top: top,
            left: left
        });
        var itemWidth = item.outerWidth(true);
        var delta = width - itemWidth;
        if (delta > 0) {
            item.width("+=" + delta); //补高
        } else if (delta < 0) {
            item.width(width);
        }
    }

    $.fn.layout.border = function(elem, opts) {
        sandwich(elem, opts, function() {
            var items = opts.items = {};//重写opts.items
            "north,south,west,east,center".replace($.rword, function(name) {
                items[name] = elem.find("[data-region=" + name + "]:visible");
                if (!items[name].length) {
                    delete items[name];
                }
            });
            if (!items.center) {
                throw "必须指定center区域并且让其可见"
            }
            var h = [],
                    w = [],
                    els = [],
                    outerLeft = opts.left,
                    outerTop = opts.top; //收集中间格子的宽高与元素
            "west,center,east".replace($.rword, function(name) {
                if (items[name]) {
                    els.push(items[name]);
                    w.push(parseFloat(items[name].outerWidth(true)));
                    h.push(parseFloat(items[name].outerHeight(true)));
                }
            });
            //重设中间格子的left值与高度
            var maxHeight = Math.max.apply(0, h);
            for (var i = 0, el; el = els[i]; i++) {
                el.css("left", outerLeft);
                var delta = maxHeight - h[i];
                if (delta) {
                    el.height("+=" + delta); //补高
                }
                outerLeft += w[i] + opts.hgap;
            }
            outerLeft -= opts.hgap;//这是北面与南边区域的宽度
            //重设north区域的top值与宽度
            var north = items.north;
            if (north) {
                adjustBorder(north, opts.left, outerTop, outerLeft);
                outerTop += north.outerHeight(true) + opts.hgap;
            }
            //重设south区域的top值与宽度
            var south = items.south;
            if (south) {
                adjustBorder(south, opts.left, outerTop + maxHeight + opts.vgap, outerLeft);
            }
            //重设中间区域的top值
            els.forEach(function(el) {
                el.css("top", outerTop);
            });
        });
    };

    function adjuestFlow(els, opts, top, www) {
        var left = opts.left;
        for (var i = 0, el; el = els[i]; i++) {
            el.css({
                left: left,
                top: top
            });
            left += www[i] + opts.hgap;
        }
        var align = opts.alignment;
        if (align === "left")
            return void 0;
        var detal = opts.width - left + opts.hgap;
        if (align === "center") {
            detal = detal / 2;
        } else {
            detal = detal - opts.right;
        }
        for (i = 0; el = els[i]; i++) {
            el.css("left", "+=" + detal);
        }
    }
    $.fn.layout.flow = function(elem, opts) {

        sandwich(elem, opts, function() {
            opts.alignment = /left|right|center/i.test(opts.alignment) ? opts.alignment : "left";
            var innerWidth = opts.width = elem.innerWidth();
            var els = [],
                    www = [],
                    hhh = [],
                    delta = 0,
                    top = opts.top;
            for (var i = 0, el; el = opts.items[i]; i++) {
                var ww = opts.widths[i];
                var hh = opts.heights[i];
                delta += ww + opts.hgap;
                if (delta < innerWidth) {
                    els.push(el);
                    www.push(ww);
                    hhh.push(hh);
                } else {
                    adjuestFlow(els, opts, top, www);
                    top += Math.max.apply(0, hhh) + opts.vgap;
                    delta = opts.left;
                    els = [el];
                    www = [ww];
                    hhh = [hh];
                }
            }
            adjuestFlow(els, opts, top, www);
        });

    };


    return $;
});