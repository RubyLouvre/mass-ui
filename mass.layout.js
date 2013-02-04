define("mass.layout", ["css", "attr"], function($) {

    function wrap(item, resize) {
        var that = {};
        "min,max".replace($.rword, function(name) {
            that[name + 'Size'] = function(value) {
                var l = item.data('jlayout');
                if (l) {
                    return l[name + 'imum'](that);
                } else {
                    if (value.width !== undefined) {
                        item.css(name + '-width', value.width);
                    }
                    if (value.height !== undefined) {
                        item.css(name + '-height', value.height);
                    }
                    return item;
                }
            };
        });
        var node = item[0]

        $.mix(that, {
            doLayout: function() {
                var l = item.data('jlayout');
                if (l) {
                    l.layout(that);
                }
                item.css("position", 'absolute');
            },
            isVisible: function() {
                return !$.isHidden(node)
            },
            insets: function() {
                var p = wrap.padding(item);
                var b = wrap.border(item);
                return {
                    top: p.top,
                    bottom: p.bottom + b.bottom + b.top,
                    left: p.left,
                    right: p.right + b.right + b.left
                };
            },
            bounds: function(value) {
                var tmp = {};
                if (value) {
                    if (typeof value.x === 'number') {
                        tmp.left = value.x;
                    }
                    if (typeof value.y === 'number') {
                        tmp.top = value.y;
                    }
                    if (typeof value.width === 'number') {
                        tmp.width = (value.width - (item.outerWidth(true) - item.width()));
                        tmp.width = (tmp.width >= 0) ? tmp.width : 0;
                    }
                    if (typeof value.height === 'number') {
                        tmp.height = value.height - (item.outerHeight(true) - item.height());
                        tmp.height = (tmp.height >= 0) ? tmp.height : 0;
                    }
                    item.css(tmp);
                    return item;
                } else {
                    tmp = item.position();
                    return {
                        x: tmp.left,
                        y: tmp.top,
                        width: item.outerWidth(false),
                        height: item.outerHeight(false)
                    };
                }
            },
            preferredSize: function() {
                var minSize, maxSize, margin = wrap.margin(item),
                        size = {
                    width: 0,
                    height: 0
                },
                l = item.data('jlayout');
                if (l && resize) {
                    size = l.preferred(that);
                    minSize = that.minSize();
                    maxSize = that.maxSize();
                    size.width += margin.left + margin.right;
                    size.height += margin.top + margin.bottom;
                    if (size.width < minSize.width || size.height < minSize.height) {
                        size.width = Math.max(size.width, minSize.width);
                        size.height = Math.max(size.height, minSize.height);
                    } else if (size.width > maxSize.width || size.height > maxSize.height) {
                        size.width = Math.min(size.width, maxSize.width);
                        size.height = Math.min(size.height, maxSize.height);
                    }
                } else {
                    size = that.bounds();
                    size.width += margin.left + margin.right;
                    size.height += margin.top + margin.bottom;
                }
                return size;
            }
        });
        return that;
    }
    var num = function(value) {
        return parseInt(value, 10) || 0;
    };
    "border,margin,padding".replace($.rword, function(name) {
        wrap[name] = function(item) {
            var postfix = name === "border" ? "-width" : "";
            return {
                top: num(item.css(name + '-top' + postfix)),
                bottom: num(item.css(name + '-bottom' + postfix)),
                left: num(item.css(name + '-left' + postfix)),
                right: num(item.css(name + '-right' + postfix))
            };
        };
    });
    $.fn.layout = function(options) {
        var opts = $.extend({}, $.fn.layout.defaults, options);
        return this.each(function() {
            var element = $(this),
                    o = (element.data('layout')) ? $.mix(opts, element.data('layout')) : opts,
                    elementWrapper = wrap(element, o.resize);
            o.items = [];
            var xtype = o.type;
            switch (xtype) {
                case "border":
                    "north,south,west,east,center".replace($.rword, function(name) {
                        if (element.children().hasClass(name)) {
                            o[name] = wrap(element.children('.' + name + ':first'));
                        }
                    });
                    break;
                case "grid":
                case "flexGrid":
                case "column":
                case "flow":
                    element.children().each(function(i) {
                        if (!$(this).hasClass('ui-resizable-handle')) {
                            o.items[i] = wrap($(this));
                        }
                    });
                    break;
            }
            element.data('jlayout', jLayout[xtype](o));
            if (o.resize) {
                elementWrapper.bounds(elementWrapper.preferredSize());
            }

            elementWrapper.doLayout();
            element.css( "position","relative");

        });
    };
    $.fn.layout.defaults = {
        resize: true,
        type: 'grid'
    };

});