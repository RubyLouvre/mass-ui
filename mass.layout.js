define("mass.layout", ["css", "attr"], function($) {

    $.fn.layout = function(options) {
        var opts = $.mix({}, $.fn.layout.defaults, options);
        return this.each(function() {
            var elem = $(this)
            var layout = elem.data('layout');
            var options = layout ? $.mix(opts, layout) : opts;
            $.fn.layout[options.type](elem, options);
        });
    };
    $.fn.layout.defaults = {
        resize: true,
        type: 'grid'
    };
    //强制每个格子的大小都一样，宽都为最宽的格子的宽，高都为最高的格子的高
    //  cols 一行共有多少列
    //  hgap 每列之间的距离 1
    //  vgap 每行之间的距离 1
    $.fn.layout.grid = function(elem, opts) {

        var children = [],
                w = [],
                h = [];
        elem[0].style.position = "relative";
        elem.children().each(function(el) {
            el = $(this);
            this.style.position = "absolute";
            children.push(el);
            w.push(parseFloat(el.outerWidth(true)));
            h.push(parseFloat(el.outerHeight(true)));
        });
        var maxWidth = Math.max.apply(0, w);
        var maxHeight = Math.max.apply(0, h);
        var row = 0,
                col, delta, left, top;
        var cols = parseFloat(opts.cols) || children.length;
        var hgap = parseFloat(opts.hgap) || 1;
        var vgap = parseFloat(opts.vgap) || 1;
        for (var i = 0, el; el = children[i]; i++) {

            col = i % cols;
            if (i !== 0 && col === 0) {
                row++;
            }
            left = (maxWidth + hgap) * col;
            top = (maxHeight + vgap) * row;
            el.css({
                top: top,
                left: left
            });
            delta = maxWidth - w[i];
            if (delta) {
                el.width("+=" + delta);
            }
            delta = maxHeight - h[i];
            if (delta) {
                el.height("+=" + delta);
            }
        }
        elem.width(1); //通过这种方式完美消息滚动条
        elem.width(elem[0].scrollWidth);
        elem.height(1);
        elem.height(elem[0].scrollHeight);
    };
    //充许每行的元素的宽不一样，但高必须一致
    //  cols 一行共有多少列
    //  hgap 每列之间的距离 1
    //  vgap 每行之间的距离 1


    function flexgrid(array, prop, callback, obj) {
        var max = Math.max.apply(0, array.values);
        for (var i = 0, el; el = array[i]; i++) {
            callback(el)
            var delta = max - array.values[i]
            if (delta) {
                el[prop]("+=" + delta); //补高
            }
        }
        obj[prop] += max;
    }
    $.fn.layout.flexgrid = function(elem, opts) {
        var children = [],
                h = [],
                w = [];
        elem[0].style.position = "relative";
        elem.children().each(function(el) {
            el = $(this);
            this.style.position = "absolute";
            children.push(el);
            w.push(parseFloat(el.outerWidth(true)));
            h.push(parseFloat(el.outerHeight(true)));
        });
        var row = 0;
        var cols = parseFloat(opts.cols) || children.length;
        var hgap = parseFloat(opts.hgap) || 1;
        var vgap = parseFloat(opts.vgap) || 1;
        var colsObject = {};
        var rowsObject = {};
        var outerObject = {
            width: 0,
            height: 0
        };
        //处理每一行的高与top值
        for (var i = 0, el; el = children[i]; i++) {
            var col = i % cols; //当前列数
            var colsArray = colsObject[col];
            if (!colsArray) {
                colsArray = colsObject[col] = [];
                colsArray.values = [];
            }
            colsArray.push(el);
            colsArray.values.push(w[i])
            var rowsArray = rowsObject[row];
            if (!rowsArray) {
                rowsArray = rowsObject[row] = [];
                rowsArray.values = [];
            }
            rowsArray.push(el);
            rowsArray.values.push(h[i]);
            //如果到每行的最后一个
            if (col === cols - 1) {
                row++;
            }
        }

        //处理每一列的宽与left值
        for (var i in colsObject) {
            if (colsObject.hasOwnProperty(i)) {
                flexgrid(colsObject[i], "width", function(el) {
                    el.css("left", outerObject.width + i * hgap);
                }, outerObject);
            }
        }
        //处理每一行的宽与top值
        for (i in rowsObject) {
            if (rowsObject.hasOwnProperty(i)) {
                flexgrid(rowsObject[i], "height", function(el) {
                    el.css("top", outerObject.height + i * vgap);
                }, outerObject);
            }
        }
        elem.width(1);
        elem.width(elem[0].scrollWidth);
        elem.height(1);
        elem.height(elem[0].scrollHeight);
    };

    function adjustHeight(item, top, width) {
        item.css({
            top: top,
            left: 0
        });
        var itemWidth = item.outerWidth(true);
        var delta = width - itemWidth;
        if (delta > 0) {
            item.width("+=" + delta); //补高
        } else if (delta < 0) {
            item.width(width)
        }
    }
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
    $.fn.layout.border = function(elem, opts) {
        var items = {};
        "north,south,west,east,center".replace($.rword, function(name) {
            items[name] = elem.find("[data-region=" + name + "]:visible");
            if (!items[name].length) {
                delete items[name];
            } else {
                items[name][0].style.position = "absolute";
            }
        });
        if (!items.center) {
            throw "必须指定center区域并且让其可见"
        }
        elem[0].style.position = "relative";
        var hgap = parseFloat(opts.hgap) || 1;
        var vgap = parseFloat(opts.vgap) || 1;
        var h = [],
                w = [],
                els = [],
                outerWidth = 0,
                outerHeight = 0; //收集中间格子的宽高与元素
        "west,center,east".replace($.rword, function(name) {
            if (items[name]) {
                els.push(items[name]);
                w.push(parseFloat(items[name].outerWidth(true)));
                h.push(parseFloat(items[name].outerHeight(true)));
            }
        });
        var maxHeight = Math.max.apply(0, h);
        //重设中间格子的left值与高度
        for (var i = 0, el; el = els[i]; i++) {
            var delta = maxHeight - h[i];
            el.css("left", outerWidth + hgap * i);
            if (delta) {
                el.height("+=" + delta); //补高
            }
            outerWidth += w[i];
        }
        outerWidth += (w.length - 1) * hgap;
        //重设north区域的top值与宽度
        var north = items.north;
        if (north) {
            adjustHeight(north, 0, outerWidth);
            outerHeight = north.outerHeight(true) + vgap;
        }
        //重设south区域的top值与宽度
        var south = items.south;
        if (south) {
            adjustHeight(south, outerHeight + maxHeight + vgap, outerWidth);
        }
        //重设中间区域的top值
        els.forEach(function(el) {
            el.css("top", outerHeight);
        });
        //=================================================
        elem.width(1);
        elem.width(elem[0].scrollWidth);
        elem.height(1);
        elem.height(elem[0].scrollHeight);
    };
    function adjuestRow(els, w, opts, top) {
        var left = 0;
        for (var i = 0, el; el = els[i]; i++) {
            el.css({
                left: left,
                top: top
            });
            left += w[i] + opts.hgap;
        }
        var align = opts.alignment;
        if (align === "left")
            return void 0;
        var detal = opts.width - left+ opts.hgap;
        if (align === "center") {
            detal = detal / 2;
        }
        for (i = 0; el = els[i]; i++) {
            el.css("left", "+=" + detal);
        }
    }
    $.fn.layout.flow = function(elem, opts) {
        var children = [],
                h = [],
                w = [];
        elem[0].style.position = "relative";
        elem.children().each(function(el) {
            el = $(this);
            this.style.position = "absolute";
            children.push(el);
            w.push(parseFloat(el.outerWidth(true)));
            h.push(parseFloat(el.outerHeight(true)));
        });
        opts.alignment = /left|right|center/i.test(opts.alignment) ? opts.alignment : "left";
        opts.hgap = parseFloat(opts.hgap) || 1;
        opts.vgap = parseFloat(opts.vgap) || 1;
        opts.width = elem.width()
        var rowElements = [], rowWidths = [], rowHeights = [], delta = 0, top = 0;
        for (var i = 0, el; el = children[i]; i++) {
            delta += w[i] + opts.hgap;
            if (delta < opts.width) {
                rowElements.push(el);
                rowWidths.push(w[i]);
                rowHeights.push(h[i])
                
            } else {
                adjuestRow(rowElements, rowWidths, opts, top);

                top += Math.max.apply(0, rowHeights) + opts.vgap;
                delta = 0;
                rowElements = [el];
                rowWidths = [w[i]];
                rowHeights = [h[i]];
            }

            console.log("delta : " + delta)
        }
        adjuestRow(rowElements, rowWidths, opts, top);
        elem.height(1);
        elem.height(elem[0].scrollHeight);

    }


    return $;
});