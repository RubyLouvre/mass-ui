define(["event", "fx", "attr"], function($) {

    var API = function(api) {
        var api = $(api), api0 = api[0];
        for (var name in api0)
            (function(name) {
                if ($.isFunction(api0[name]))
                    api[ name ] = (/^get[^a-z]/.test(name)) ?
                            function() {
                                return api0[name].apply(api0, arguments);
                            } :
                            function() {
                                var arg = arguments;
                                api.each(function(v, idx) {
                                    var apix = api[idx];
                                    apix[name].apply(apix, arg);
                                })
                                return api;
                            }
            })(name);
        return api;
    }

    var scrollEvent = function(target, config) {
        var o = this;
        if (typeof config == 'function')
            config = {
                callback: config
            }
        var c = o.config = $.mix({}, scrollEvent.defaults, config, {
            target: target
        });
        c.status = 0;
        c.scroll = o.getPos();
        c.target.scroll(function(event) {
            if (o.isMove()) {
                c.status = (c.status == 0 ? 1 : (c.status == 1 ? 2 : c.status));
                c.callback(event, c);
            }
            if (c.timeoutID)
                clearTimeout(c.timeoutID);
            c.timeoutID = setTimeout(function() {
                o.isMove();
                c.status = 0;
                c.callback(event, c);
            }, c.delay);
        });
    }
    $.mix(scrollEvent.prototype, {
        isMove: function() {
            var o = this, c = o.config;
            var pos = o.getPos();
            var scrollY = (pos.top != c.scroll.top);
            var scrollX = (pos.left != c.scroll.left);
            if (scrollY || scrollX) {
                c.scrollY = scrollY;
                c.scrollX = scrollX;
                c.prevScroll = c.scroll;
                c.scroll = pos;
                return true;
            }
            return false;
        },
        getPos: function() {
            var o = this, c = o.config;
            return {
                top: c.target.scrollTop(),
                left: c.target.scrollLeft()
            }
        }
    });
    scrollEvent.defaults = {
        delay: 100
    }



    $.fn.fixedable = function(option) {
        var targets = this, api = [];
        targets.each(function(v, idx) {
            var target = targets.eq(idx);
            var obj = target.data('ex-fixed') || new fixedable(idx, targets, option);
            api.push(obj);
            target.data('ex-fixed', obj);
        });
        return option && option.api ? API(api) : targets;
    }
    var defaults = {
        //	top : ,
        //	right : ,
        //	bottom : ,
        //	left : ,
        //	width : ,
        //	height : ,
        api: false,
        dynamicFixed: false,
        baseNode: '',
        baseX: true,
        baseY: true,
        fixedX: true,
        fixedY: true
    }


    function fixedable(idx, targets, option) {
        var o = this,
                c = o.config = $.mix({}, fixedable.defaults, option);
        c.targets = targets;
        c.target = c.targets.eq(idx);
        c.index = idx;

        c = $.mix(c, {
            _hidePos: false,
            logicSize: {},
            rowSize: {},
            currentStyle: '',
            style: '',
            window: $(window),
            oldBrowser: !window.XMLHttpRequest
        });
        c.dynamicMode = c.baseNode || !c.fixedX || !c.fixedY;

        if (c.dynamicFixed || c.dynamicMode || c.oldBrowser) {
            $('body').append(c.target);//将要定位的元素放到body之下
        }

        if (c.baseNode)
            c.baseNode = $(c.baseNode);
        $.log(c)
        var size = o._cleanSize(c);

        if (c.dynamicFixed) {
            "top_bottom,left_right".replace($.rmapper, function(_, a, b) {
                c.dynamicFixed = c.dynamicFixed && (size[a] != void 0 || size[b] != void 0);
            });
        }

        if (c.dynamicMode)
            c.dynamicFixed = true;
        if (c.oldBrowser) {
            o._padPos(size, o._cleanSize(c.target[0].currentStyle));
        } else if (!c.dynamicFixed) {
            c.target.css('position', 'fixed').css(size);
            return;
        }

        c.container = document.compatMode != "CSS1Compat" ? $('body') : $('html')
        c.container.height(); //for IE Bug
        //如果不支持position:fixed，则使用absolute来模拟
        c.target.css('position', c.oldBrowser ? 'absolute' : 'fixed');
        if (!/hidden|scroll/i.test(c.target.css('overflow'))) {
            c.target.css('overflow', 'hidden');
        }
        o._smoothPatch();
        $.log(size);
        o._fixed(size);

        c.window.resize(function() {
            if (c.oldBrowser || c.baseNode) {
                o._fixed();
            }
        });

        if (!(c.fixedX && c.fixedY)) {
            if (c.oldBrowser) {
                var timeoutID;
                c.window.scroll(function() {
                    if (timeoutID)
                        clearTimeout(timeoutID);
                    timeoutID = setTimeout(function() {
                        o._fixed();
                    });
                });
            }
            else {
                new scrollEvent(c.window, function(evt, pa) {
                    if ((pa.scrollX && !c.fixedX) || (pa.scrollY && !c.fixedY)) {
                        if (pa.status == 1) {
                            o._fixed(c.logicSize, {
                                unfixed: true
                            });
                        }
                        else
                        if (pa.status == 0) {
                            o._fixed();
                        }
                    }
                })
            }
        }
    }


    $.mix(fixedable.prototype, {
        _attn: [
            {
                size: 'height',
                pos1: 'top',
                pos2: 'bottom'
            },
            {
                size: 'width',
                pos1: 'left',
                pos2: 'right'
            }
        ],
        _camel: [
            {
                size: 'Height',
                pos1: 'Top',
                pos2: 'Bottom'
            },
            {
                size: 'Width',
                pos1: 'Left',
                pos2: 'Right'
            }
        ],
        _smoothPatch: function() {
            //防止抖动
            var o = this, c = o.config;
            if (!c.oldBrowser)
                return o;
            if (c.container.css('background-image') == 'none') {
                c.container.css({
                    'background-image': 'url(null)'
                });
            }
            c.container.css({
                'background-attachment': 'fixed'
            });
            return o;
        },
        _eachSize: function(callback) {
            var i = 0;
            "Height,Top,Bottom,Width,Left,Right".replace($.rword, function(name) {
                if ("width" == name) {
                    i = 1;
                }
                callback({
                    idx: i,
                    name: name.toLowerCase(),
                    camel: name
                });
            })
        },
        _eachSizeSet: function(f) {
            var o = this, c = o.config;
            for (var i = 0; i < o._attn.length; i++) {//2
                f(o._attn[i], o._camel[i], i);
            }
        },
        //处理auto px 百分比
        _parseSize: function(val, xFlg) {
            var o = this, c = o.config;
            if (val == 'auto')
                return void 0;
            if ((val + '').indexOf('%') < 0)
                return parseInt(val) || 0;
            //			var cSize = c.container.attr(xFlg ? 'clientWidth' : 'clientHeight');
            var cSize = c.container[0][xFlg ? 'clientWidth' : 'clientHeight'];
            return Math.round(cSize * parseInt(val) / 100);
        },
        _parseIntSize: function(val, xFlg) {
            var o = this, c = o.config;
            return parseInt(o._parseSize(val, xFlg)) || 0;
        },
        //传一个配置对象进去，清理掉这无效的top，left, with, height, bottom, right,将有用的返回来
        _cleanSize: function(size) {
            var o = this, c = o.config;
            var ret = {};
            o._eachSize(function(obj) {
                var name = obj.name;
                $.log(name)
                if (/undefined|auto/i.test(size[name])) {
                    try {
                        delete size[name];
                    } catch (e) {
                    }
                } else {
                    ret[name] = size[name];
                }
            });

            return ret;
        },
        _padPos: function(size, pad) {
            var o = this, c = o.config;
            var pos;
            o._eachSizeSet(function(obj) {
                if (size[obj.pos1] == void 0 && size[obj.pos2] == void 0) {
                    if ((pos = pad[obj.pos1]) != void 0)
                        size[obj.pos1] = pos;
                    else if ((pos = pad[obj.pos2]) != void 0)
                        size[obj.pos2] = pos;
                    else
                        size[obj.pos1] = 0;
                }
                if (size[obj.size] == void 0) {
                    if ((size[obj.size] = pad[obj.size]) == void 0) {
                        size[obj.size] = c.target[obj.size]();
                    }
                }
            });
            return size;
        },
        _calcRowSize: function(size, opt) {
            var o = this, c = o.config;
            var opt = $.mix({
                abs: false,
                base: c.baseNode,
                unfixed: false
            }, opt);
            var ret = {};
            o._eachSize(function(pa) {
                var val = size[pa.name];
                if (!(/undefined/i.test(val))) {
                    ret[pa.name] = o._parseIntSize(val, /width|left|right/i.test(pa.name));
                    if (opt.abs && /top|left/i.test(pa.name)) {
                        ret[pa.name] += c.window['scroll' + pa.camel]();
                    }
                }
            });
            if (opt.base) {
                var basePos = c.baseNode.offset();
                o._eachSizeSet(function(pa, cm) {
                    basePos[pa.pos2] = c.container[0]['client' + cm.size]
                            - (basePos[pa.pos1] + c.baseNode['outer' + cm.size]());
                });
                o._eachSize(function(pa) {
                    if (!(/height|width/i.test(pa.name)) && ret[pa.name] == void 0
                            && ((!pa.idx && c.baseY) || (pa.idx && c.baseX))) {
                        var name = pa.name == 'top' ? 'bottom' : pa.name == 'bottom' ? 'top' : pa.name == 'left' ? 'right' : 'left';
                        ret[name] += basePos[name];
                    }
                });
            }
            var fg = opt.unfixed && !c.fixedX ? -1 : 1;
            if (fg == -1 || (!opt.unfixed && !c.fixedY)) {
                if (ret.top != undefined)
                    ret.top -= (c.window.scrollTop() * fg);
                if (ret.bottom != undefined)
                    ret.bottom += (c.window.scrollTop() * fg);
            }
            var fg = !opt.unfixed && !c.fixedX ? -1 : 1;
            if (fg == -1 || (opt.unfixed && !c.fixedY)) {
                if (ret.left != undefined)
                    ret.left += (c.window.scrollLeft() * fg);
                if (ret.right != undefined)
                    ret.right -= (c.window.scrollLeft() * fg);
            }
            return ret;
        },
        _fixed: function(size, opt) {
            var o = this, c = o.config;
            var opt = $.mix({
                unfixed: false
            }, opt);
            if (size)
                c.logicSize = o._padPos(o._cleanSize(size), c.logicSize);
            if (!c.oldBrowser) {
                c.target.css(
                        $.mix(
                        c.baseNode || !(c.fixedX && c.fixedY) ? o._calcRowSize(c.logicSize, opt) : c.logicSize,
                        {
                            position: opt.unfixed ? 'absolute' : 'fixed'
                        }
                )
                        );
            }
            else {
                var rowSize = o._calcRowSize(c.logicSize);
                var hide = false;
                if (c.target.is(':hidden')) {
                    if (!c._hidePos)
                        hide = true;
                    c.target.show();
                }
                c._hidePos = false;
                o._eachSizeSet(function(pa, cm, idx) {
                    c.target.css(pa.size, rowSize[ pa.size ]);
                    var pos1 = rowSize[ pa.pos1 ];
                    if (pos1 == void 0) { //right,bottom based
                        pos1 = c.container[0][ 'client' + cm.size ] - rowSize[ pa.pos2 ] - c.target[ 'outer' + cm.size ]();
                    }
                    var over = (pos1 + c.target['outer' + cm.size]()) - c.container[0]['client' + cm.size];
                    if (over > 0) {
                        over = c.target[pa.size]() - over;
                        if (over > 0) {
                            c.target[pa.size](over);
                        }
                        else {
                            if (!hide)
                                c._hidePos = true;
                        }
                    }
                    if (!hide && !c._hidePos) {
                        c.target[0].style.setExpression(pa.pos1,
                                pos1 +
                                ((!idx && !c.fixedY) || (idx && !c.fixedX) ?
                                        c.window['scroll' + cm.pos1]() :
                                        '+eval(document.body.scroll' + cm.pos1 + '||document.documentElement.scroll' + cm.pos1 + ')'
                                )
                                );
                    }
                });
                if (hide || c._hidePos) {
                    c.target.hide();
                }
            }
        },
        getTarget: function() {
            return this.config.target;
        },
        fixedOpen: function(f) {
            var o = this, c = o.config;
            if (!c.dynamicFixed)
                return;
            c.target.css(o.getFixedSize(c.logicSize));
            if (c.oldBrowser) {
                c.target[0].style.removeExpression('top');
                c.target[0].style.removeExpression('left');
            }
            if (f)
                setTimeout(function() { // for window.scrollTop()
                    if (c.oldBrowser) {
                        c.target.css({
                            top: 'auto',
                            left: 'auto'
                        });
                        c.target.css(o._calcRowSize(c.logicSize, {
                            abs: true
                        }));
                    }
                    f();
                }, 100);
            return o;
        },
        fixedClose: function(size) {
            var o = this, c = o.config;
            if (!c.dynamicFixed)
                return;
            o._fixed(size);
            return o;
        },
        getFixedSize: function(size) {
            var o = this, c = o.config;
            return o._calcRowSize(o._padPos(size, c.logicSize), {
                abs: c.oldBrowser
            });
        },
        resize: function(size) {
            var o = this, c = o.config;
            o.fixedOpen(function() {
                o.fixedClose(size);
            })
            return o;
        }
    });

    return $;


});
