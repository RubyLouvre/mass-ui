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

        elem.width(maxWidth * cols + hgap * (cols - 1));
        elem.height(maxHeight * (row + 1) + vgap * row);


    }
    //充许每行的元素的宽不一样，但高必须一致
    //  cols 一行共有多少列
    //  hgap 每列之间的距离 1
    //  vgap 每行之间的距离 1
    var sum = function() {
        var ret = 0;
        for (var i = 0; i < arguments.length; i++) {
            ret += arguments[i];
        }
        return ret;
    };
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
        var row = 0, col, delta, left, top;
        var cols = parseFloat(opts.cols) || children.length;
        var hgap = parseFloat(opts.hgap) || 1;
        var vgap = parseFloat(opts.vgap) || 1;
        var rowHeights = [], rowElements = [], rowHeight;
        var outerWidth = 0;
        var outerHeight = 0;
        var heightObject = {};
        //处理每一行的高与top值
        for (var i = 0, el, last = children.length - 1; el = children[i]; i++) {
            rowHeights.push(h[i]);
            rowElements.push(el);
            col = i % cols;//当前列数
            if (!heightObject[col]) {
                heightObject[col] = [];
                heightObject[col].max = 0;
            }
            if (heightObject[col]) {
                heightObject[col].push(el[0]);
                if (heightObject[col].max <= h[i]) {
                    heightObject[col].max = h[i];
                }
            }
            //如果到每行的最后一个或到最后一个
            if (col === cols - 1 || i === last) {
                row++;
                rowHeight = Math.max.apply(0, rowHeights);
                for (var k = 0, rowElement; rowElement = rowElements[k]; k++) {
                    //只有求出每行的最高值后，才能设置这一行的top值
                    rowElement.css("top", outerHeight + vgap * (row - 1))
                    delta = rowHeight - rowHeights[k];//求得差值
                    if (delta) {
                        rowElement.height("+=" + delta);//补高
                    }
                }
                outerHeight += rowHeight;
                rowElements = [];
                rowHeights = [];
            }
        }
//处理每一列的宽与left值
        for (var i in heightObject) {
            if (heightObject.hasOwnProperty(i)) {
                $(heightObject[i]).css({
                    width: heightObject[i].max,
                    left: outerWidth + i * hgap
                });
                outerWidth += heightObject[i].max;
            }
        }
        //     console.log(outerWidth)
        //  console.log(outerWidth + (cols -1 ) * hgap )
        elem.width(1);
        elem.width(elem[0].scrollWidth);
        elem.height(1);
        elem.height(elem[0].scrollHeight);

    };


    return $;
});