define(["node"], function($) {
    function Messenger(config) {
        //主页面的target参数应该为iframe元素的CSS表达式
        var win = config.target
        if (typeof win === "string") {
            win = $(win).get(0);
            if (win && win.tagName === 'IFRAME') {
                win = win.contentWindow;
            }
        } else {
            win = parent;//子窗口的target参数恒为parent,以防不小心访问它的其他属性时报错
        }
        this.win = win;
        this._messages = [];
        var mode = document.documentMode;
        if (mode === 8 || mode === 9) {
            this.hack = true;
        }
        //onmessage为当前页面处理其他页面发过来的
        if (typeof config.onmessage === "function") {
            this.receive(config.onmessage);
        }
        this.init();
    }

    Messenger.prototype = {
        init: function() {
            var me = this;
            me._callback = function(event) {
                if (event.source != me.win)
                    return;//如果不是来源自win所指向的窗口,返回
                var data = event.data;
                if (typeof data === "string" && data.indexOf("__hack__") === 0) {
                    data = data.replace("__hack__", "");
                    data = JSON.parse(data, function(k, v) {
                        if (v.indexOf && v.indexOf('function') > -1) {
                            return eval("(function(){return " + v + " })()")
                        }
                        return v;
                    });
                }
                for (var i = 0, fn; fn = me._messages[i++]; ) {
                    fn.call(me, data);
                }
            };

            $.bind(window, "message", me._callback);
        },
        receive: function(fn) {
            fn.win = this.win;
            this._messages.push(fn);
        },
        send: function(data) {
            var str = data, hack = false;
            //如果对象中存在函数,会抛DataCloneError: DOM Exception 25异常,需要序列化
            //http://stackoverflow.com/questions/7506635/uncaught-error-data-clone-err-dom-exception-25-thrown-by-web-worker
            if (!this.hack && typeof data === "object") {
                for (var i in data) {//这只是一个简单的检测,只检测一重
                    if (data.hasOwnProperty(i) && typeof data[i] === "function") {
                        hack = true;
                        break;
                    }
                }
            }
            if (hack || (this.hack  && typeof str !== "string")) {
                //在w3c规范中,data可以是任意数据类型,但IE8-9由于实现得够早,只支持字符串
                //这时我们就需要用到JSON进行序列化与反序列化
                //JavaScript primitive, such as a string
                //object
                //Array
                //PixelArray object
                //ImageData object
                //Blob
                //File
                //ArrayBuffer
                str = JSON.stringify(str, function(key, val) {
                    if (typeof val === 'function') {
                        return val + '';
                    }
                    return val;
                });
                data = "__hack__" + str;
            }
            this.win.postMessage(data, '*');//parent
        }
    };
    if (!"1"[0]) {//IE6-7
        Messenger.prototype.init = function() {
            var isSameOrigin = false;
            //判定是否同源，不同源会无法访问它的属性抛错
            try {
                isSameOrigin = !!this.win.location.href;
            } catch (e) {
            }
            if (isSameOrigin) {
                this.initForSameOrigin();
            } else {
                this.initForCrossDomain();
            }

        };

        Messenger.prototype.initForCrossDomain = function() {
            var fns = navigator.messages = navigator.messages || [];
            var me = this;
            for (var i = 0, fn; fn = this._messages[i++]; ) {
                fns.push(fn);
            }
            this.receive = function(fn) {
                fn.win = this.win;
                fns.push(fn);
            };
            this.send = function(data) {
                setTimeout(function() {
                    for (var i = 0, fn; fn = fns[i++]; ) {
                        if (fn.win != me.win) {
                            fn.call(me, data);
                        }
                    }
                });
            };
        }

        Messenger.prototype.initForSameOrigin = function() {
            var me = this;
            this.send = function(data) {
                setTimeout(function() {
                    var event = me.win.document.createEventObject();
                    event.eventType = 'message';
                    event.eventSource = window;
                    event.eventData = data;
                    me.win.document.fireEvent('ondataavailable', event);
                });
            }
            this._dataavailable = function(event) {
                if (event.eventType !== 'message' || event.eventSource != me.win)
                    return;
                for (var i = 0, fn; fn = me._messages[i++]; ) {
                    fn.call(me, event.eventData);
                }
            };
            document.attachEvent('ondataavailable', this._dataavailable);
        };
    }

    Messenger.prototype.destroy = function() {
        // 解除绑定事件
        if (this._callback) {
            $.unbind(this.win, "message", this._callback)
        }
        // 解除绑定事件 ie
        if (document.detachEvent && this._dataavailable) {
            document.detachEvent('ondataavailable', this._dataavailable);
        }
        // 删除实例属性
        for (var p in this) {
            if (this.hasOwnProperty(p)) {
                delete this[p];
            }
        }
        navigator.messages = void 0;
    };

    return Messenger;
});
//如果想在旧式的标准浏览器支持跨域通信，可以使用window.name;

