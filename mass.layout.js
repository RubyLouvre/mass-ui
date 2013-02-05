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
    //让本元素相对定位，求得它的最大面积的孩子，然后全部孩子通过对内容区进行拉伸，
    //统一为此面积，然后逐一绝对定位
    //最后修正本元素的大小
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


    return $;
});