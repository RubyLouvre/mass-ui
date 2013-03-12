define(function() {
    var params = function(obj) {
        var ret = [];
        for (var name in obj) {
            if (obj.hasOwnProperty(name)) {
                ret.push('<param name="', name, '" value="', obj[name], '"/>');
            }
        }
        return ret.join("");
    };
    var props = function(obj) {
        var ret = [];
        for (var name in obj) {
            if (obj.hasOwnProperty(name)) {
                ret.push(name + '="' + obj[name] + '" ');
            }
        }
        return ret.join("");
    };
    var query = function(obj){
        var ret = [];
	for(var name in obj){
            if(typeof obj[name] !== "function"){
                ret.push(encodeURIComponent(name)+"="+encodeURIComponent(obj[name]));
            }
        }
	return ret.join("&");
    };
    /**
     * 创建Flash对象
     * @param {Element} el 放置flash的容器元素
     * @param {Object} obj swf的相关配置
     * @param {String|Object} vars 可选参数,以queryString形式传入
     */
    return function(el, obj, vars) {
        var html, flashvars = typeof vars === "string"? vars : query(vars);
        // 由于默认的交互参数是JSON格式，会有双引号，需要转义掉，以免HTML解析出错
        flashvars = flashvars.replace(/"/g, '&quot;');
         // IE下必须有id属性，不然与javascript交互会报错
         // http://drupal.org/node/319079
        obj.id = obj.id || 'flash' + setTimeout(Date);
        obj.name = obj.name || obj.id;
        obj.width = obj.width || 1;
        obj.height = obj.height || 1;
        obj.flashvars = flashvars;
        if ('classid' in document.createElement('object')) { //旧式IE
            var paramObj = {},
                    propObj = {
                id: obj.id,
                name: obj.name,
                width: obj.width,
                height: obj.height,
                "class": obj["class"],
                data: obj.src,//flash播放器地址
                classid: "clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"
            };
            for (var name in obj) {
                if (!(name in propObj)) {
                    paramObj[name] = obj[name];
                }
            }
            paramObj.movie = obj.src;//flash播放器地址
            html = "<object " + props(propObj) + ">" + params(paramObj) + "</object>";
        } else {
            //style="width:1px;height:1px" 是为了保证firefox下正常工作
            obj.style = "width:" + obj.width + "px;height:" + obj.height + "px;";
            obj.type = "application/x-shockwave-flash";
            html = "<embed " + props(obj) + "/>";
        }
        //注意, el必须在DOM 树中， 否则IE8下flash可能无法正常显示与工作.
        el.innerHTML = html;
        return el.firstChild; //返回节点供后续操作
    }
});
//2013.3.12


