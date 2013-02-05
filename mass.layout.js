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

        var children = [], w = [], h = [];
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

        var row = 0, col, delta, left, top;
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
        elem.width(1);//通过这种方式完美消息滚动条
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
                el[prop]("+=" + delta);//补高
            }
        }
        obj[prop] += max;
    }
    $.fn.layout.flexgrid = function(elem, opts) {
        var children = [], h = [], w = [];
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
        }
        //处理每一行的高与top值
        for (var i = 0, el; el = children[i]; i++) {
            var col = i % cols;//当前列数
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
            rowsArray.values.push(h[i])
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


    return $;
});