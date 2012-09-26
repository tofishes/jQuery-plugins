/**
 * return IE version
 */
window.ie = (function(){ 
    var undef, v = 4, div = document.createElement('div'), all = div.getElementsByTagName('i'); 
    while ( 
        div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->', 
        all[0] 
    ); 
    return v > 5 ? v : undef; 
}());

/**
 * @author ToFishes
 * @date 2011-1-13
 * @desc 针对ajax载入的元素方便事件绑定的插件（注意：只能绑定可以冒泡的事件类型， 这是插件功能的实现原理）
 * @update 2011-5-16 修复closest用法上的错误 _e.closest(key, this); 此处是this dom对象，而非 $(this) jquery对象
 *  
 * 将ajax内容需要绑定事件的元素，将事件绑定到非ajax载入的父级元素， 通过冒泡原理实现事件绑定，有一定限制
 * 能够在一定程度上提高jQuery事件绑定效率 
 *  
 *  注意新增的_self, _origin优先级高于普通目标源，使用时候要放在最后定义
 *  
 * Example:
 * 	$("#parent").bindFor("click", {
 *  	"#demo": function(event){ //#demo是被动态写入#parent的
 *  		alert(this.html());
 *  		alert(e);
 *  	},
 *      '_self': function(){
 *      	//_self 是新增的为自身绑定事件的方法
 *      },
 *      '_origin':function(){ 
 *          //_origin 调用者自行处理，把事件源传入
 *  	}
 * 	});
 * 
 * html:
 * 	<div id="parent">
 * 		<p id="demo">这里是ajax动态载入的内容data
 * 			比如： $.get(url, function(data){ $("#parent").html(data);   })
 * 		</p>	
 * 	</div>
 */
;(function($){
    $.bindFor = $.fn.bindFor = function(event, map){
    	var $o = this.jquery ? this : $(document),
    			event = event || "click",
    			map = map || {};

    	return $o.bind(event, function(e){
    		var _e = $(e.target);
    	
    		for(var key in map) {
    			var $t = jQuery();
    			if(key === '_self') {
    				$t = $(this);
    			} else if(key === '_origin') { //调用者自行处理，把事件源传入
    				$t = _e;
    			} else if(_e.is(key)) {
    				$t = _e;
    			} else {
    				if(e.target !== this) { //如果等于自身，closest的context参数就会失去本身的意义，不再拥有范围限定
    					$t = _e.closest(key, this);
    				};
    			};
    		
    			if($t.length) {
    				return map[key].call($t, e);
    			};
    		};
    	});
    };
    $.delegateFor = $.fn.delegateFor = function(event, map){
    	var $o = this.jquery ? this : $(document),
    			event = event || "click.delegateFor",
    			map = map || {};
		for(var key in map) {
			$o.delegate(key, event, map[key]);
		};
    	return $o;
    };
})(jQuery);

/**
 * @author ToFishes
 * @date 2010-11-23
 * @desc jQuery 多用插件集合包
 *  
 */
;(function($){
    var ie6 = !-[1,] && !window.XMLHttpRequest;
    var win = $(window), body;
    $(function(){
    	body = $("body");
    });
    
    /**
     * @author ToFishes
     * @date 2010-11-23
     * @desc 该插件获取针对当前视窗，元素居中的左，上坐标值
     */
    $.fn.centerPos = function(){
        win = $(window);         
        var pos = {}, w = $(this).outerWidth(), h = $(this).outerHeight();
        pos.left = (win.width() - w) / 2;
        pos.top = (win.height() - h) / 2;
        return pos;
    };

    /**
     * @author ToFishes
     * @date 2010-11-23
     * @desc 固定位置的插件，不给参数则默认上下左右居中
     * @depend $.fn.centerPos
     * 
     */
    $.fn.jFixed = function(c){
        c = $.extend({
            left:null,
            right:null,
            top:null,
            bottom:null,
            x: 0, //水平偏移量，可为正负数
            y: 0  //垂直偏移量，可为正负数            
        }, c);
        c.limit = $.extend({
    		l:0,
    		r:0,
    		t:0,
    		b:0
    	}, c.limit);
        $.jFixed = {};
        $.jFixed.className = "j-fixed";
        var limit = c.limit.t + c.limit.l + c.limit.r + c.limit.b;
        /* style */
        var style = "<style>." + $.jFixed.className + " {position:fixed !important;}</style><!--[if IE 6]><style>." + $.jFixed.className
        		+ " {position:absolute !important;}body {position:relative;}</style><[endif]-->";
        $("head").append(style);
        /* 帮助方法，获取到定位的坐标，并附带一个参数center，判断是否是居中的情况 */
        function getPos(o){
            var h = c.left != null ? c.left : c.right,//水平位置, 左优先
            v = c.top != null ? c.top : c.bottom,//垂直位置，上优先
            css = {};
            if(h == null || v == null) {
                var pos = o.centerPos();
                h = h != null ? h : pos.left;
                v = v != null ? v : pos.top; //h, v可以是0，所以不能v = v || pos.top
                css.center = true; //顺便返回一下是居中的
            }; 
            h += c.x;
            v += c.y;
            
            c.right != null ? css.right = h : css.left = h;
            c.bottom != null ? css.bottom = v : css.top = v;

            if(ie6) {
            	if(c.bottom !=null) {
            		var b = body.height() - win.height() - win.scrollTop();
            		if(b <= c.limit.b)
            			b = c.limit.b;
            		css.bottom = b + v;
            	} else {
            		css.top = v + win.scrollTop(); //修正ie6下的位置
            		if(css.top <= c.limit.t)
            			css.top = c.limit.t;
            	};           
            };
            if(limit && !ie6) { //暂时只实现bottom限制高度
            	if(c.bottom != null) {
            		var b = body.height() - win.height() - win.scrollTop();
            		if( b <= c.limit.b) {
            			if(b < 0) {
            				css.bottom = c.limit.b -b;
            			} else {
            				css.bottom = c.limit.b;
            			};
                	} else {
                		css.bottom = v;	
                	};
            	};
            };
           
            return css;                                    
        };
        
        return this.each(function(){
            var _t = $(this).addClass($.jFixed.className);
            var css;
            var fixed = function(){
            	css = getPos(_t); //需要利用到居中的情况
            	_t.css(css);
            };
            fixed();
     
            if(css.center) {
                win.bind("resize", fixed);
            };
            if(ie6 || limit) {
                win.bind("scroll", fixed);
            };
        });
    };
    
    /**
     * @author ToFishes
     * @date 2010-11-23
     * @desc 当窗口滚到到该元素原本位置时，固定该元素位置，回到原位置时取消固定 
     * 
     */
  
    $.fn.jUntilFixed = function(c){
    	c = $.extend({
    		bottom: 0 //限制离窗口底部的距离,0为不限制
        },c);

    	return this.each(function(){
    		var _t = $(this),
    			dom = $(document),
				os = _t.offset(),
				css = {};
			function fixed(){
    			var top = dom.scrollTop(), left = dom.scrollLeft();
    			if(top >= os.top) {
    				css.position = "fixed";
    				css.top = 0;
        			if(c.bottom) {
        				var currTop = dom.height() - top, currBottom = currTop - _t.outerHeight();
        				if(currBottom < c.bottom) {
        					css.top = currBottom - c.bottom;
        				};
        			};
    				css.left = os.left - left;
    				if(ie6) {
    					css.position = "absolute";
    					css.top += top;
    					css.left += left;
    					css.zoom = 1;
    				};
    			} else {
    				css.position = "static";
    			};

    			_t.css(css);
    		};
    		win.scroll(fixed);
    		win.resize(function(){
    			css.position = "static";
    			_t.css(css);
    			os = _t.offset();
    			fixed();
    		});
    	});
    };
    

    /**
     * @author Tofishes
     * 下拉面板插件
     */
    $.fn.jDropPanel = function(c){
    	c = $.extend({
    		wrap: null, //上级元素，包裹单组drop和panel的元素，其作用是为了在下拉状态时增加一个curr当前类，类名可以配置，以便于某些样式控制。
    		drop: ".j-drop",
    		panel: ".j-panel",
    		curr: "dropping", //下拉状态时对 父级 对象增加一个当前class
    		autoHideTime: 1000,
    		
    		ondrop: function(index, $drop, $panel){}//下拉以后的回调函数, 传入当前触发下拉的元素索引及所有的下拉按钮与面板
        },c);
    	    	
    	return this.each(function(){
    		var _t = $(this);
    		var $wrap = c.wrap ? (c.wrap.jquery ? c.wrap : _t.find(c.wrap)) : _t;
    		var $drop = c.drop.jquery ? c.drop : _t.find(c.drop);
            var $panel = c.panel.jquery ? c.panel : _t.find(c.panel);
            var dropid;
            var currPanel;

            $drop.click(function(){
            	var i = $drop.index($(this));
                currPanel = $panel.eq(i);
                $panel.not(currPanel).hide();
                currPanel.toggle().unbind("click").bind("click", function(e){
                    e.stopPropagation();
                });
            	var currWrap = $wrap.eq(i).toggleClass(c.curr);
            	$wrap.not(currWrap).removeClass(c.curr);
            
                if(currPanel.is(":visible")) {//实际应用这个更有效，bug出现在一组下拉拥有同一个$wrap,原代码是判断wrap.hasClass不行
                	//c.ondrop(i, $drop, $panel); //处于下拉时，执行回调
                	($.proxy(c.ondrop, _t))(i, $drop, $panel);
                	if(ie6 && ! currPanel.hasClass('overlay-ok')) { //IE6处理select，但是内容ajax载入就暂时无法解决
                		currPanel.addClass('overlay-ok').append(['<iframe style="position:absolute;z-index:-1;bottom:0;left:-1px;filter:alpha(opacity=0);width:', currPanel.outerWidth() ,
                		          'px;height:', currPanel.outerHeight() ,'px;"></iframe'].join(''));
                	};
                };
                return false;
            });
            _t.add($panel).mouseover(function(){
                clean();
                /* close event */
                $("body").unbind("mouseover").one({
                	"mouseover": function(){
                        dropid = setTimeout(close_panel, 1000);
                    },
                    "click": close_panel
                });
                return false;
            });
            var clean = function(){ //清理
                if(dropid){
                    clearTimeout(dropid);
                    dropid = null;
                };
            };
            function close_panel(){
            	$wrap.removeClass(c.curr);
            	currPanel && currPanel.hide();
            };
            _t.data('closeDropPanel', close_panel);
    	});
    };
    
    
    /**
     * @author ToFishes
     * @desc 简单选项卡切换
     * url: http://localhost/something#tab-current
     * html:
     * <div id="jtabsimple">
     * 	<div class="tabs">
     *      <li id="current"><a class="curr">标题1</a></li>
     * 		<li><a>标题2</a></li>
     * 		<li><a>标题3</a></li>
     * 	</div>
     * 	<div class="jtab-con">
     * 		内容1
     * 	</div>
     * 	<div class="jtab-con" style="display:none;">
     * 		内容2
     * 	</div>
     * 	<div class="jtab-con" style="display:none;">
     * 		内容3
     * 	</div>
     * </div>
     * 
     * js:
     * 
     * $(function(){
     * 		$("#jtabsimple").jTabSimple({
     * 			tab: ".tabs a",
     * 			con: ".jtab-con"
     *      });
     * });
     */
    $.jTabSimple = $.fn.jTabSimple = function(c){
        c = $.extend({
            tab: ".tabs li", //标题项
            con: ".tab-con", //内容项
            curr: "curr",  //当前高亮的css类名
            init: true, //是否自动初始化，否则手动
            index: 0,      //默认显示的tab
            remote: false, //远程加载
            loading: '<p class="panel t-c"><em class="loading"></em></p>', //自定义loading的提示html片段
            timeout: 15000, //远程ajax载入超时设置
            event: "click", //触发的事件，jQuery所支持的所有事件
            prevent: true,
            callback: function(i, tab, con){} //传递一个索引，tab集合，con集合
        },c);
        var o = this.jquery ? this : $(document);
        return o.each(function(){
            var tab = c.tab.jquery ? c.tab : $(this).find(c.tab),
            		con = c.con.jquery ? c.con : $(this).find(c.con);
            
            function toggle(i){
                i = (i < 0) ? c.index : i; 
                tab.removeClass(c.curr).eq(i).addClass(c.curr); 
                if(c.remote){
                    con.html(c.loading);            
                    $.ajax({
                    	'type': "GET",
                    	'url': tab.eq(i).find("a").attr("href"),
                    	'success': function(ret){
                         	con.html(ret);
                        },
                        'error': function(xhq, info){
                        	if(info == 'timeout') {
                        		con.html('<p style="text-align:center">内容载入超时，请稍后再试。</p>');
                        	};
                        },
                        'timeout': c.timeout
                    });
                } else {
                    con.hide().eq(i).show();
                }
                c.callback(i, tab, con);
            };
            
            tab.bind(c.event, function(){
                var i = tab.index($(this));
                toggle(i);
                return ! c.prevent;
            });
            
            //init, hash必须以 #tab- 开头，代表元素id
            var uri = location.hash.match(/\#tab\-(.*)$/);
            if(uri != null){
                $("#"+uri[1]).addClass(c.curr);
            }
            var index = tab.index(tab.filter("." + c.curr));
            c.init && toggle(index);
        });
    };
    /**
     * @author ToFishes
     * @desc 各类弹出确认框的接口
     * 
     * sysDialog 是原生弹出框的实现
     */
    var sysDialog = {
    	'alert': function(c){
			c = $.extend({
				title: "Alert Dialog", 
				msg:"",
				time: 5000, //默认5秒自动消失
				callback: function(){} //按下确定后的回调函数,比如页面跳转    			
			}, c);
			
			alert(c.msg);
		},
		'confirm': function(c){
    		c = $.extend({
    			title: "Confirm Dialog", 
    			msg:"",
    			callback: function(flag){} //按下确定后的回调函数,比如页面跳转    			
    		}, c);
    		
        	c.callback(confirm(c.msg));	
    	} 
    };        
    /* 扩展接口 */
    $.extend({
		alert: sysDialog.alert,
		confirm: sysDialog.confirm
    });

    /**
     * @author ToFishes
     * @date 2010-9-21
     * @desc 提供对checkbox的选择操作
     * 
     *  
     * Example:
     * 
     * html:
     * 
     * <div id="check-list">
     * 	<input type="checkbox" />
     * 	<input type="checkbox" />
     * 	<input type="checkbox" />
     * 	<input type="checkbox" />
     * </div>
     * 	<input id="#check-all-posts" type="checkbox" />
     * 
    	<script type="text/javascript">
    		$("#check-list").jChecked({
    			all: "#check-all-posts",
    			target: ":checkbox"
    		});
    	</script> 
     * 
     */
    $.fn.jChecked = function(c){
    	c = $.extend({
            all: ".checked-all", //触发全选的元素
            invert: ".checked-invert", //触发反选的元素
            target: ":checkbox", //内容项
            	
            onchecked: function(items){}, //当所有选中时执行，会传入所选中的集合及值的数组。
    		unchecked: function(items){}, //传入未被选择的集合
    		onchange: function(items){} //选择发生改变，无论是选中或是未选中
        },c);
    	
    	return this.each(function(){
    		var _t, $wrap = _t = $(this), eventMap = {},
    		statusCheck = function(){
    			var _tg = $(this).find(c.target).not(c.all).not(c.invert),
    			$checked = _tg.filter(":checked"),
    			_a = $(this).find(c.all);
    			if($checked.length == _tg.length){
    				_a.attr("checked",true);
    			} else {
    				_a.attr("checked",false);
    			};
    		};

    		eventMap[c.all] = function(){
    			_tg = _t.find(c.target).not(c.all).not(c.invert);
    			if(! $(this)[0].checked) {
    				_tg.attr("checked",false);
    				c.unchecked(_tg);
    			} else {
    				_tg.attr("checked",true);
    				c.onchecked(_tg);
    			};
    			c.onchange(_tg);
    		};
    		eventMap[c.target] = function(){ //每一次选项的点击检查是否已经全选
    			_t.trigger('status-check');
    			c.onchange(_t.find(c.target).not(c.all).not(c.invert));
    		};
    		eventMap[c.invert] = function(){     
    			var _tg = _t.find(c.target).not(c.all).not(c.invert);
    			
    			_tg.each(function(){
	    			$(this).attr("checked", !$(this).attr("checked"));
	    		});
    			var checked = _tg.filter(":checked");
    			c.onchecked(_tg);
    			c.unchecked(_tg);
    			c.onchange(_tg);
    		};
    		
    		$wrap.bindFor('click', eventMap).bind('status-check', statusCheck);
    	});
    };
   /**
    * 选中与取消选中： $(":checkbox").uncheck();
    */
	$.fn.extend({
  		check: function() {
    		return this.each(function() { this.checked = true; });
	  	},
		uncheck: function() {
		    return this.each(function() { this.checked = false; });
	  	},
        toggleCheck: function() {
			return this.each(function() { this.checked = ! this.checked});
	  	}
	});
})(jQuery);

/**
 * author: ToFishes@163.com
 * date: 2010年4月23日
 * version: 1.0
 * description: form表单的美化插件，支持radio,checkbox,select
 * @Example:
 * 1、单选(多选结构类似，class名不一样而已，属性name是值)：
 *   <em class="jradio"><a name="all">原创</a><a name="red">转载</a><a name="red">改编</a>
 *      <input type="hidden" name="" value="" />
 *  </em>
 * 2、下拉菜单
 * <div class="jdropbox">      
 *  <p class="jtext" ><input type="hidden" name="" value="" />--请选择分类--<em></em></p>
 *  <div class="db-con">
 *      下拉的内容
 *  </div>
 * </div>     
 */
;(function($){
    /* 下拉jSelect， 使用这个插件时，要非常注意其他js行为冒泡到body的单击事件
     */
    $.fn.jSelect = function(c){
        c = $.extend({
            item: ".option", //相当于select的option元素，下拉的选择项目，默认为此dom元素内部的class为option的元素。
            attr: "value", //指定item选项的值存放在哪个属性中，比如 <li value="value" />, 其值存储在value属性上(value只能存储数值)
            input: "input", //挂载值的表单元素，多个值以逗号相隔，默认为此dom元素内部的<input>元素,可以是任何表单元素，一般为隐藏文本域
            checked: "checked", //被选中状态下item选项元素的class定义 
			event: "click", //下拉的触发事件，默认单击展开下拉
            
            show: ".jtext", //用于显示所选择的项目的元素，同时也是点击此处显示下拉内容文字的元素。默认为此dom元素内class为jtext的元素。
            con: ".jdcon", //存储下拉的内容的元素
            width: 0, // 设置下啦内容的宽度，0表示自适应宽度, -1表示同show等宽，大于0的数值则会被设置此数值宽度
            widthFix: 0, //设置宽度增减量，用于与show等宽时的宽度误差
            curr: "curr", // 显示下拉内容时给本元素设置一个当前的样式类class定义，比如用于设置下拉箭头的指向
            
            handle: $(),
                
            onchange: function(v, index, $items){} //当值发生改变时执行某个函数动作,当前值, 当前项目索引，项目集合作为参数传入该函数
        }, c);
        return this.each(function(){
            var _t = $(this);
            var zindex = parseInt(_t.css("zIndex")) || 20;
            var flag = false; //减少body单击事件的多次执行
            var $s = $(c.show, _t), $c = $(c.con, _t), w = c.width;
            var $i = $(this).find(c.item);
            var $in = $(c.input, _t);
            $s.append("<q class='jselect-show-text'></q>");
            var $st = $(".jselect-show-text", $s);
            var index = -1; //避免选中的元素再次被选,从而使onchange事件更有效      
            
            /* 初始化处理 */
            var $ch = $i.filter("." + c.checked);
            if($ch.length != 0) {
                index = $i.index($ch);
            };
            var o = getVals();
            $in.val(o.val);
            $st.html(o.t);
            /* 选项动作 */
            $i.bind("click",function(e){
                var i = $i.index($(this));
                if(index == i) {
                    return;
                };
                index = i;
                $i.removeClass(c.checked);
                var v = $(this).addClass(c.checked).attr(c.attr);
                $in.val(v);
                $st.html($(this).html());
                c.onchange(v, index, $i);
                e.preventDefault();//取消默认行为但不阻止事件冒泡，为了激发body单击事件。                
            });
            //对于select下拉框取值，这个取值原先考虑是可以多选，但暂时没实现，也就保留了多值的获取。
            function getVals(){
                 var $checked = $i.filter("." + c.checked), o = {val: "", t: ""};
                 $checked.each(function(){
                     o.val = ($(this).attr(c.attr));
                     o.t = ($(this).html());
                 });
                 return o;
            };
            //下拉动作
            $s.add(c.handle).bind(c.event,function(e){
                if(c.width < 0) {
                    w = $s.innerWidth() + c.widthFix;//如果整个下了框事先是被隐藏的，之后被显示，在这里才能正确获取到$s.width()
                };
                if(c.width != 0) {
                    $c.width(w); //设置下拉内容宽度               
                };
                _t.toggleClass(c.curr).css("z-index", ++zindex);
                $c.toggle();
                flag = !flag;
                e.stopPropagation();//阻止事件冒泡到body上
            });
            $("body").click( function(){
                if(flag) {
                    _t.removeClass(c.curr);
                    $c.hide();
                    flag = !flag;
                };
            });
        });
    };
    /* 单选 */
    $.fn.jRadio = function(c){
        c = $.extend({
            item: ".radio", //单选项元素，默认为此dom元素内部的class为radio的元素。
            input: ":hidden", //挂载值的表单元素，默认为此dom元素内部的<input>元素,可以是任何表单元素，一般为隐藏文本域
            attr: "data-value", //指定item单选项的值存放在哪个属性中，比如 <a class="radio" data-value="value" />, 其值存储在data-value属性上
            checked: "checked", //被选中元素的class定义
            onchange: function($currItem, v){} //当值发生改变时执行某个函数动作,当前值作为参数传入该函数
        }, c);
        return this.each(function(){
            var _t = $(this), $c = $(c.checked, _t), $in = $(c.input, _t);
            /* 初始化赋值 */
            if($c.length != 0) { 
                $in.val($c.attr(c.attr));
            };
			_t.delegate(c.item, "click", function(e){ //事件绑定到父元素
				if(! $(this).hasClass(c.checked)){//避免选中的元素再次被选,从而使onchange事件更有效
					$("."+c.checked, _t).removeClass(c.checked);
	                var v = $(this).addClass(c.checked).attr(c.attr);
	                $in.val(v);
	                c.onchange($(this), v);
	                e.preventDefault();//取消默认行为但不阻止事件冒泡，为了jSelect的body单击事件。
				};
			});
        });
    };
    /* 多选 */
    $.fn.jCheckbox = function(c){
        c = $.extend({
            item: ".checkbox", //多选项元素，默认为此dom元素内部的class为checkbox的元素。
            input: ":hidden", //挂载值的表单元素，多个值以逗号相隔，默认为此dom元素内部的<input>元素,可以是任何表单元素，一般为隐藏文本域
            attr: "name", //指定item单选项的值存放在哪个属性中，比如 <a class="checkbox" name="value" />, 其值存储在name属性上
            checked: "checked", //被选中元素的class定义
            onchange: function($currItem, v){} //当值发生改变时执行某个函数动作,当前值作为参数传入该函数
        }, c);
        return this.each(function(){
            var _t = $(this);
            var $i = $(c.item, _t);
            var $in = $(c.input, _t);
            /* 初始化赋值 */
            $in.val(getVals());
    		_t.delegate(c.item, "click", function(e){
                $(this).toggleClass(c.checked);
                var v = getVals();
                $in.val(v);
                c.onchange($(this), v);
                e.preventDefault();//取消默认行为但不阻止事件冒泡，为了jSelect的body单击事件。
    		});
            function getVals(){
                 var $checked = $i.filter("." + c.checked), vals = [];
                 $checked.each(function(){
                     vals.push($(this).attr(c.attr));
                 });
                 return vals;
            };
        });
    };
})(jQuery);

/**
 * @author ToFishes
 * @date 2010-9-21
 * @desc 输入框显示一个灰色的默认值
 * 
 * Example: 
 * $("#card-edit .text, textarea").jDefault({ 
 *     value: function(t){
 *         return t.prev().html();
 *     }  //or  value: "一个默认提示"
 * });
 * 
 */
;(function($){
    $.fn.jDefault = function(c){
    	c = $.extend({
    		value: function(t){var v = t.attr("placeholder"); t.removeAttr('placeholder'); return v || '';}, //设置默认值,可以是字符串, 也可以是function计算返回的字符串。
    		css: {color: "#999"}, //提示信息的样式定义
    		onfocus: function($this){},
    		onblur: function($this){}
        },c);
    	c.css = $.extend({
    		position:"absolute",
    		margin:0,
    		padding:0
    	}, c.css);
      	
    	return this.each(function(){
    		var _t = $(this), cName = "j-defaulting",
    				left = parseInt(_t.css("paddingLeft")) + parseInt(_t.css("marginLeft")) + parseInt(_t.css('border-left-width')),
    				top = parseInt(_t.css("marginTop")) + parseInt(_t.css("paddingTop")) + parseInt(_t.css('border-top-width')),
    				fs = _t.css("fontSize"), fw = _t.css('fontWeight'), def = c.value.call ? c.value(_t) : (c.value || ""),
    				info = $("<q style='top:"+ top +"px;left:"+left+"px;font-size:"+fs+";font-weight:"+fw+"'>" + def + "</q>");
    		info.css(c.css);
    		var wrap = $(["<span style='display:inline-block;zoom:1;position:relative;margin:0;padding:0;vertical-align:", _t.css("verticalAlign"), "' class='jdefault-wrap'></span>"].join(""));
    	//	if(! _t.hasClass(cName)) {
    			_t.addClass(cName).wrap(wrap).after(info);
    	//	};
			_t.bind('rm-placeholder', function(){
				info.hide();
			}).bind('add-placeholder', function(){
				var val = $.trim(_t.val());
    			if(val == "") {
    				info.show();
    			};
			}).focus(function(){
    			$(this).trigger('rm-placeholder');
    			c.onfocus($(this));
    		}).blur(function(){
    			$(this).trigger('add-placeholder');
    			c.onblur($(this));
    		});
    		info.click(function(){
    			_t.focus();
    		});
    		if($.trim(_t.val()) != "") info.hide(); //慎用 || ! _t.is(':visible')
    	});
    };
})(jQuery);

/**
 * @author ToFishes
 * @version 1.0
 * @desc 内容遮罩插件及弹出面板插件，类似于blockUI插件
 */
;(function($){
    var ie6 = !-[1,] && !window.XMLHttpRequest;
    /**
     * jCover
     * 内容遮罩插件，可用于元素遮罩或窗口遮罩
	 * 参数可以是：
	 * {
	 *     msg: "" //可选的，遮罩上面可以显示一些信息
	 *     className: "j-cover" //遮罩元素的类名，如果与已有类名冲突，可以在这里修改
	 *     coverCss:  {} //遮罩的样式定义，一般定义背景色，透明度，鼠标指针即可
	 *     msgCss: {} //遮罩提示信息的样式定义，默认是绝对定位，top,left为0
	 *	   cache: true //开启遮盖缓存，如果在同一个元素上显示不同的msg,则应该设置为false
	 *     unCoverEvent: "click"
	 * }
     * */
    $.jCover = $.fn.jCover = function(c){
        c = $.extend({
            msg: "",
            className: "j-cover",
		    cache: true, //开启遮盖缓存，如果在同一个元素上显示不同的msg,则应该设置为false
		    unCoverEvent: null, //设置取消遮罩的事件，比如click,dblclick，这样在遮罩层上单击或双击可以取消遮罩
		    unCover: function(){}
        }, c);
        c.coverCss = $.extend({
            "top": 0,
            "left": 0,
            "z-index": 9000,
            "opacity": 0.5,
            "background": "#000",
            "cursor": "default",
		    "margin": 0,
			"padding": 0
        }, c.coverCss);
        c.msgCss = $.extend({
            "position":"absolute",
            "top":0,
            "left":0,
            "z-index":9001
        }, c.msgCss);
 
        var $body = $("body"), $html = $("html"), $head = $('head');
        $head.append('<style>.fullheight{height:100%}</style>');
        $body.add($html).addClass('fullheight');
        var full = ! this.jquery,  $o = full ? $body : this;
        return $o.each(function(){
            var _t = $(this), cover = _t.data("jCover");
			if(_t.hasClass($.jCover.coverFlag))
				_t.jUnCover();//return; //替换了_t.jUnCover(); 当时不知道基于什么考虑做unCover处理，但是return貌似更合理一些
	
            if(c.cache && cover && cover.parent().length) { //如果开启了缓存，确保cover对象存在并且位于dom中
            	cover.fadeIn(100);
            } else {
                !full && _t.css("position", "relative");
                var flag = ie6 || ! full,
                css = $.extend(c.coverCss, {
                    position: flag ? "absolute" : "fixed",
                    height: flag ? _t.innerHeight() : "100%",
                    width: flag ? _t.innerWidth() : "100%"
                });
 
                cover = $(['<p class="', c.className, '"></p>'].join("")).css(css);
                if(c.msg) {
                    cover = cover.add($("<div></div>").html(c.msg).css(c.msgCss));
                };
                if(c.unCoverEvent && c.unCoverEvent.spilt) {
                	cover.bind(c.unCoverEvent, function(){
                		_t.jUnCover();
                		c.unCover();
                	});
                };
                _t.append(cover).data("jCover", cover).addClass($.jCover.coverFlag); 
            };			
			if(ie6) {
				$("select:visible", _t).css("visibility", "hidden").addClass("select-jcover-hidden");
				if(! $(window).data("cover-resize-win")) {
					$(window).resize(function(){
						cover.css({
							height: _t.innerHeight(),
							width: _t.innerWidth()
						});
					}).data("cover-resize-win", 1);
				};
			};
        });
    };
    /* 表示当前已经有了jCover */
    $.jCover.coverFlag = "jCovering";
    $.fn.isjCovering = function(){
    	var $o = ! this.jquery ? $('body') : this;
    	return $o.hasClass($.jCover.coverFlag);
    };
    /*
     * 配套的取消内容遮罩的插件
     * */
    $.jUnCover = $.fn.jUnCover = function(){
    	if($('div.open-panel-cover-flager:visible').length > 1) {  //一致的弹层加open-panel-cover-flager标志类名，这样判断可以允许最后一个弹层才取消cover
    		return;
    	};
        var $o = this.jquery ? this : $("body").removeClass('fullheight');
        return $o.each(function(){
            $(this).removeClass($.jCover.coverFlag).data("jCover").fadeOut(300);
            ie6 && $("select.select-jcover-hidden", $(this)).css({"visibility": "visible"}).removeClass("select-jcover-hidden");
        });
    };
	/* 
	 * 弹出面板插件，依赖于jCover提供遮罩背景
	 */
	$.jOpenPanel =  function(c){
		c = $.extend({
			overlayCss:  { 
	            backgroundColor: '#fff', 
	            opacity:         0.3,
	            cursor: "default"
	        }, 
			
	        title: "", //标题
			message: "", //静态内容，字符串或jQuery对象
			url:"", //ajax载入message的URL， ajax完成后将替换message参数的内容
			params: {}, //ajax附加的参数
			ajaxBefore: function(){}, //ajax载入前的处理函数
			ajaxEnd: function(){}, //ajax载入后的处理函数, 传入message挂载点的元素，和ajax取得的数据
			
			close: ".jOpenPanel-close", //关闭弹出面板
			closeOn: true,
			
			top: 80, //距离顶部100像素
			width: 620, //默认最小宽度
			
			afterOpen: function(){},
			beforeClose: function(){},
				
			panelWrapId: "j-open-panel-wrap", //辅助参数
			panelConId: "j-open-panel-message",	
			panelTitleId: "j-open-panel-title"		
	    },c);
		var $panelWrap = $("#" + c.panelWrapId), $panelCon = $("#" + c.panelConId), $panelTitle = $("#" + c.panelTitleId), $body = $("body"), retainCover = 0;

		/* 1、准备UI wrap */
		$.jCover({coverCss: c.overlayCss});
		if(!$panelWrap.length) {
			var cloud = ['<div id="', c.panelWrapId, '" class="cloud-tip open-panel-cover-flager"><div class="cloud-wrap" ',
			             '><h4 id="', c.panelTitleId , '"></h4>',]
			if(c.closeOn) cloud.push('<a title="关闭" class="self-close ', c.close.replace(".", ""), '">×</a>');
			cloud.push('<div id="', c.panelConId, '" class="cloud-con"></div>',
			             '</div></div>');
			$body.append(cloud.join(""));
			$panelWrap = $("#" + c.panelWrapId);
			$panelCon = $("#" + c.panelConId);	   
			$panelTitle = $("#" + c.panelTitleId);
		};

		/* 2、挂载内容并显示 */
		var siteHook; //创建一个位置的钩子，以便对象再放回来，是为了应用在ajax载入的内容中，防止内容重复
		if(c.message.jquery && ! c.url) {
			siteHook = $("<i id='panel-hook-" + Math.random() + "'></i>"); 
			siteHook.insertBefore(c.message);
		};
		$panelTitle.html(c.title);
		$panelCon.html(c.message);
		
		var cssWidth = {};//加zoom:1,同时修正IE一些tab切换的界面文字消失情况及宽度不正常设置width:300;IE6下标题宽度300
		cssWidth.width = c.width;
		$panelWrap.css(cssWidth).add(c.message).show();	 //先设置宽度，后面要用到

		var css = {
			position: "absolute",
			top: c.top + $(window).scrollTop(),
			left: "50%",
			"margin-left": - $panelWrap.outerWidth() / 2
		};
		$panelWrap.css(css);
		c.afterOpen(); //显示面板后的回调
		//ajax content
		if(c.url) {
			c.ajaxBefore($panelCon);
			$.get(c.url, c.params, function(data){
				$panelCon.html(data);
				c.ajaxEnd && c.ajaxEnd($panelCon, data);
			});
		};
		/* 3、关闭panel */
		$.jOpenPanel.close = $.jOpenPanel.closePanel = function(){
			c.beforeClose();
			$.jUnCover();//	$.unblockUI();
			if(c.message.jquery && !c.url) {
				siteHook.replaceWith(c.message.hide()); //IE6下会有比较严重的性能问题，当内容节点比较多的时候
			};
		    $panelWrap.hide();
		};
		
		var closed = "bind-closed";//已经有这个类的话就避免重复绑定事件
		$panelWrap.hasClass(closed) || $panelWrap.click(function(e){
			var $e = $(e.target);
			if($e.is(c.close)) //关闭事件元素
				$.jOpenPanel.closePanel();
		}).addClass(closed);
	};

    /* 简单的完全空白弹出层，仅提供内容容器 */
    $.jOpen =  function(c){
		c = $.extend({
			overlayCss:  { }, 
			content: "", //静态内容，字符串或jQuery对象
			url:"", //ajax载入content的URL， ajax完成后将替换content参数的内容
			extendClass: '', //额外对弹出面板元素增加的控制css类
			closer: ".j-open-close", //关闭弹出面板，只能提供一个css类
			
			reloader: '.j-open-reloader', //读取reloader的指定属性获取url，根据url重新载入内容
			reloaderAttr: 'href', //存储url的reloader的属性
						
			top: 80, //距离顶部像素
			width: 620, //默认宽度
			
			addCover: 1,
			delegateHandle: function($panel){}
	    },c);
		
		/* 1、准备UI wrap */
		var $body = $('body'), $panelWrap = $(['<div class="j-open-wrap open-panel-cover-flager ',c.extendClass,'"><div class="j-open-wrap-content"></div><a class="j-open-close-std ', c.closer.replace('.', '') ,'">关闭</a></div>'].join(''));
		var $panelCon = $panelWrap.children('.j-open-wrap-content');

		/* 2、挂载内容并显示 */
		if(c.addCover) {
			$.jCover({cache: 0, coverCss: c.overlayCss});
		};
		$panelCon.html(c.content);
		var css = {
			top: c.top + $(window).scrollTop(),
			left: "50%",
			"margin-left": - c.width / 2,
			'width': c.width
		};
		$panelWrap.css(css);
		$body.append($panelWrap);
		//ajax content
		var dataExpire;
		var loader = function(url){
			dataExpire = 0;
			$.get(url, function(data){
				if(! dataExpire) {
					$panelCon.html(data);
					dataExpire = 1;
				};
			});
		};
		if(c.url) {
			loader(c.url);
		};
		/* 3、关闭或重载入panel内容 */
		$panelWrap.delegate(c.reloader, 'click.jopen', function(e){
			var reurl = $(this).attr(c.reloaderAttr);
			if(reurl) {
				loader(reurl);
			};
			return false;
		}).delegate(c.closer, 'click.jopen', function(e){
			$.jUnCover();
			$panelWrap.remove();
			$panelCon = $();
			dataExpire = 1;
		});
		c.delegateHandle($panelWrap);
	};
    
    /* 借用jOpen实现 */
    $.jConfirm = function(c){
    	c = $.extend({
    		title: "",
    		msg: "",
    		ok: function(){},
    		cancel: function(){}
    	}, c);
    	var msg = [c.msg, '<p id="jconfirm-btn" style="padding:20px 0 0;text-align:center"><a name="ok" class="jconfirm-btn btn-ok"><em class="btn">确定</em></a><a style="margin-left:10px" name="cancel" class="jconfirm-btn btn-cancel"><em class="btn">取消</em></a></p>'].join('');
    	$.jOpenPanel({title: c.title, message: msg, width: 500});
    	$.jConfirm.exit = $.jOpenPanel.closePanel;

    	var jConfirm = {
    		"ok": function(){
    			c.ok($(msg)); //不可以像cancel一样主动exit, 变化太多
    		},
    		"cancel": function(){
    			c.cancel($(msg));
    			$.jConfirm.exit();
    		}
    	};   
    	$("#jconfirm-btn").bindFor("click", {
    		"a": function(){
    			var name = this.attr("name");
    			name && jConfirm[name]();
    		}
    	});
    	return false;
    };
    

    /**
     * @author ToFishes
     * 根据指定css属性闪烁的插件
     * @TODO 实现太烂，等待修订
     */
	$.fn.jFlash = function(c){
		c = $.extend({
			css: {}, //闪烁变化的css属性
			time: 100, //interval time 闪烁间隔时间
			count: 20, //闪烁的次数
			status: "jFlashing", //表示闪烁中
			onStop: function(t){} //闪烁完的回调函数，传入闪烁对象的引用
		}, c);

		return this.each(function(){		
			var _t = $(this), init = {};
			/* 如果正在闪烁中，则回避再次调用闪烁 */
			if(_t.hasClass(c.status))
				return;

			for(var n in c.css) {
				init[n] = _t.css(n);
			};

			var params = {
				"0": init,
				"1": c.css
			},  flashId, count = c.count % 2 == 0 ? c.count : c.count + 1; //count保证为偶，这样最后的css才是最初的状态。

			function flash(){
				_t.css(params[count % 2]).addClass(c.status);
				count--;	
				if(count < 0) {
					c.onStop(_t.removeClass(c.status));
					flashId && clearTimeout(flashId);
					return;
				};
				flashId = setTimeout(flash, c.time);
			};
			flash();		
		});
	};
	
	/**
	 * @author ToFishes
	 * @desc 图片焦点集合滚动插件
	 */
	$.fn.jFocus = function(c){
        c = jQuery.extend({
            meta: "li", //指定需要循环切换的元素标签
            event: "click", //绑定触发切换的事件，比如设置为mouseover
            currClass: "curr", //当前数字高亮的class
            firstShow: 0, //指定第一次显示的图片索引，从0开始
            width: 0, //设置一个宽度，默认0代表自动获取宽度，如果获取失败可以尝试手动设置
            height:0, //设置一个高度，默认0代表自动获取高度，如果获取失败可以尝试手动设置

            auto: true, //是否开启自动切换,默认否
            time: 5000 //自动切换的时间间隔
        },c);
        return this.each(function(){
            var $this = $(this), index = 0;
            var $meta = $(c.meta, $this), count = $meta.size(), metaIndex = ['<p class="focus-index">'];
            
            for(var i = 1; i <= count; i++) {
            	if(i == 1) {
            		metaIndex.push('<a class="curr"></a>');
            	} else {
            		metaIndex.push('<a></a>');
            	};
            };
            metaIndex.push('</p>');
            $this.append(metaIndex.join(''));

            var $num = $('.focus-index a', $this), viewWidth = parseInt($this.innerWidth());
            
            $meta.css({
            	left: viewWidth
            }).eq(0).css({
            	left: 0
            });
            
            $this.delegate('.focus-index a', c.event, function(){
            	$num.removeClass(c.currClass);
            	
            	var _t = $(this).addClass(c.currClass), $curr = $meta.filter('.' + c.currClass), $next = $meta.eq($num.index(_t));
            	if(! $curr.length) {
            		$curr = $meta.eq(0).addClass(c.currClass);
            	};
            	
            	$next.css({
            		left: viewWidth
            	});
            	$next.animate({
            		left: 0
            	}, 800).addClass(c.currClass);
            	$curr.animate({
            		left: - viewWidth
            	}, 800).removeClass(c.currClass);
            	
            	return false;
            });

            /* 内容区域鼠标停留移出时，取消恢复自动切换 */
            if(c.auto) {
                var autoId;
                $this.hover(function(){
                        clearTimeout(autoId);
                    }, function(){
                        autoId = setTimeout(autoF, c.time);       
                });
                /* 以下为自动切换的定义 */
                var autoF = function(){
                    if(++index >= count) {
                        index = 0;
                    };
                    $num.eq(index).trigger(c.event);//去触发切换的事件
                    autoId = setTimeout(autoF, c.time);
                };
                autoId = setTimeout(autoF, c.time);
            };
        });
	};

	/**
	 * @author ToFishes
	 * 文本框内容选中
	 */
    $.fn.selection = function(c){
        c = $.extend({
        	start:0,
        	end: null
        }, c);

        function selectText(textbox, startIndex, stopIndex){   
            try {
            	if (textbox.setSelectionRange){   
                    textbox.setSelectionRange(startIndex, stopIndex);   
                 } else if (textbox.createTextRange){//IE   
                     var range = textbox.createTextRange();   
                     range.collapse(true);   
                     range.moveStart('character', startIndex);   
                     range.moveEnd('character', stopIndex - startIndex);   
                     range.select();   
                 }
            } catch(e) {};  
            textbox.focus();   
        };  
        
        return this.each(function(){
        	var t = $(this)[0], len = $(this).val().length;
        	selectText(t, c.start, c.end == null ? len : c.end);
        });
    };


    /**
     * @author ToFishes
     * 链接的倒计时自动跳转
     */
    $.fn.autoForward = function(c){
        c = $.extend({
            time: 5,
            timeShow: $('#time-left'),
            defaultUrl: '/'
        }, c);
        
        return this.each(function(){
        	var $left = c.timeShow.jquery ? c.timeShow : $(c.timeShow), times = c.time, _t = $(this),
        	        timer = function(url){
        	            $left.html(times);
        	            if(-- times > 0) {
        	                setTimeout(timer,1000);
        	            } else {
        	                location.href = _t.attr("href") || c.defaultUrl;
        	            };
        	        };
            timer();
        });
    };
    
	/**
	 * @author ToFishes
	 * 定制型： 针对note关闭的插件
	 */
    $.fn.disappear = function(c){
        c = $.extend({
            target: ".note",
            css: {}, 
            time: 500,
            callback: function(){}
        }, c);
        var css = $.extend({marginTop:0, marginBottom:0, paddingTop:0, paddingBottom:0, height:0, opacity:0}, c.css);
        return this.each(function(){
            $(this).closest(c.target).animate(css, c.time, function(){
                $(this).hide();
                c.callback();
            });
        });
    };
    
    /**
     * @author ToFishes
     * @date 2011年3月8日11:59:55
     * 参照hover()方法，enter()绑定的是mouseenter,mouseleave, 同时提供第三个参数time用于enter的延迟触发
     */
    $.fn.enter = function(enter, leave, delay) {
    	return this.each(function(){
            var $this = $(this);
            var enterTimeId;
            $this.mouseenter(function(e) {
                enterTimeId = setTimeout(function() {
                    enter.call($this, e);
                }, delay);
            }).mouseleave(function(e) {
                enterTimeId && clearTimeout(enterTimeId);
                leave.call($this, e);
            });
    	});
    };

    /**
     * @author ToFishes
     * @date 2011.4.29
     * 3个简单的帮助方法，$.isLock(), $.lock(), $.unLock().
     * 比如用于链接的ajax载入，通过这3个方法防止重复点击。
     */
    $.fn.extend({
    	'isLock': function() {
    		return $(this).attr('jquery-fn-locked');
    	},
    	'lock': function() {
    		return $(this).attr('jquery-fn-locked', 1);
    	},
    	'unLock': function() {
    		return $(this).removeAttr('jquery-fn-locked');
    	}
    });
    
    /**
     * @author ToFishes
     * @date 2011-4-28
     * @desc checkbox版的select multiple
     */
	$.fn.multiSelect = function(c){
    	c = $.extend( {
    		item: 'li',
    		checked: 'checked', //选中状态的class，加在item上
    		search: '.multi-search',
    		input: '.multi-validate-helper',
    		max: 10000,
    		onchange: function($curr, $input){}
    	}, c);
    	//TODO: 1、init 2、矛盾选择
    	return this.each(function(){
    		//basic
    		var _t = $(this), checkedCount = 0, $input = _t.find(c.input), 
    		o = {};
    		o[c.item] = function() {
				var $curr = this.find(':checkbox');

				if(this.hasClass(c.checked)) {
					this.removeClass(c.checked);
					$curr.attr('checked', false);
					checkedCount --;
	    			$input.val(checkedCount > 0 ? checkedCount: "").trigger('change');
	    			c.onchange($curr, $input);
				} else {
					if (checkedCount < c.max) {
						this.addClass(c.checked);
					    $curr.attr('checked', true);
					    checkedCount ++;
		    			$input.val(checkedCount).trigger('change');
		    			c.onchange($curr, $input);
					};
				};
		 	};
    		_t.bindFor('click', o);
    		
    		/* simple items filter searcher */
    		_t.find(c.search).bind('propertychange input', function() {
    			var val = $.trim($(this).val()), $ops = _t.find(c.item);
    			if(val) {
    				var $result = _t.find([c.item, ":contains('", val.toUpperCase(), "')"].join(''));
    				$ops.not($result).hide();
    			} else {
    				$ops.show();
    			};
    		});
    	});
	};
	/**
	 * @desc 仿oninput的特殊事件，因为onpropertychange在ie下，用js改变值也会被触发，
	 * 在suggest插件中就不是很好用了。故使用这个特殊事件插件
	 */
	$.event.special.textchange = { //bind('textchange', function(event, oldvalue, newvalue){}) //传入旧值和当前新值
		setup: function (data, namespaces) {
		  $(this).attr('lastValue', this.contentEditable === 'true' ? $(this).html() : $(this).val());
			$(this).bind('keyup.textchange', $.event.special.textchange.handler);
			$(this).bind('cut.textchange paste.textchange input.textchange', $.event.special.textchange.delayedHandler);
		},
		teardown: function (namespaces) {
			$(this).unbind('.textchange');
		},
		handler: function (event) {
			$.event.special.textchange.triggerIfChanged($(this));
		},
		delayedHandler: function (event) {
			var element = $(this);
			setTimeout(function () {
				$.event.special.textchange.triggerIfChanged(element);
			}, 25);
		},
		triggerIfChanged: function (element) {
		  var current = element[0].contentEditable === 'true' ? element.html() : element.val();
			if (current !== element.attr('lastValue')) {
				element.trigger('textchange',  element.attr('lastValue'), current).attr('lastValue', current);
			};
		}
	};
	
	/**
	 * @author ToFishes
     * @date 2011-5-11
     * @desc 输入内容的匹配自动提示 
     * @question: 目前在刚打开FF浏览器时，就会触发input事件，这个需要在实践中发现是否需要init规避
     * @DONE：
     * 1、避免网络延时造成的多次ajax结果混乱，需要根据时间抛弃过时的ajax处理
     * 2、保证唯一的<del>suggest-wrap及其事件绑定</del>,ie6 shim, suggest-wrap不能唯一，其绑定的click选择事件会调用到c.onselect，而c.onselect可以是多个input的配置项目 
     * 3、唯一的resize绑定
     * @release
     * 2011-5-20 添加isSuccession参数配置
     * @release 2
     * 2011-6-20 
     * 1、跨元素的上下方向键选择
     * 2、取值可以传入原始输入
     * 3、请求内容类型可以参数指定，不再局限于json格式
     * 4、优化某些代码实现
	 */
	$.fn.suggest = function(c){
        c = $.extend({
        	url: 'ajax-ok.html',
        	queryName: null, //url?queryName=value,默认为输入框的name属性
        	dataType: 'json', //ajax返回内容的格式，默认json
        	jsonp: null, //设置此jsonp回调参数名，将开启jsonp功能，该参数是需要被后端程序捕获的
        	
        	item: 'li', //下拉提示项目单位的选择器，默认一个li是一条提示，与processData写法相关
        	itemOverClass: 'suggest-curr-item', //当前下拉项目的标记类，可以作为css高亮类名
        	
        	isSuccession: 0, //按着方向键不动是否可以持续选择，默认不可以，设置值可以是任何等价的boolean。
        	delay:100, //持续选择的延迟时间，默认100ms，是用来提高选择体验的
        	'z-index': 9999, //提示层的层叠优先级设置，css，你懂的
        	
        	processData: function(data){ //自定义处理返回的数据，该方法可以return一个html字符串或jquery对象，将被写入到提示的下拉层中
	        	var template = [];
	            template.push('<ul class="suggest-list">');
	            var evenOdd = {'0' : 'suggest-item-even', '1': 'suggest-item-odd'}, count = 0;
	            for(var key in data) { //添加奇数，偶数区分
	                template.push('<li class="' , evenOdd[(++count) % 2] , '">', key,'</li>');
	            };
	            template.push('</ul>');
	            return template.join('');
        	},
        	getCurrItemValue: function($currItem, originValue){ //定义如何去取得当前提示项目的值并返回值,插件根据此函数获取当前提示项目的值，并填入input中，此方法应根据processData参数来定义，默认传入当前选项及input的原始值
        		return $currItem.text();
        	},
        	textchange: function($input){}, //不同于change事件在失去焦点触发，inchange依赖本插件，只要内容有变化，就会触发，并传入input对象
        	onselect: function($currItem){} //当选择了下拉的当前项目时执行，并传入当前项目
        }, c);

        var ie = !-[1,], ie6 = ie && !window.XMLHttpRequest,
        CURRINPUT = 'suggest-curr-input', SUGGESTOVER = 'suggest-panel-overing', suggestShimId = 'suggest-shim-iframe',
        UP = 38, DOWN = 40, ESC = 27, TAB = 9, ENTER = 13,
        CHANGE = 'input.suggest paste.suggest cut.suggest'/*@cc_on + ' textchange.suggest'@*/, RESIZE = 'resize.suggest',
        BLUR = 'blur.suggest', KEYDOWN = 'keydown.suggest', KEYUP = 'keyup.suggest';
       
        return this.each(function(){
        	var $t = $(this).attr('autocomplete', 'off'), originValueAttr = 'origin-value';
        	var hyphen = c.url.indexOf('?') != -1 ? '&' : "?"; //简单判断，如果url已经存在？，则jsonp的连接符应该为&
            var URL = c.jsonp ? [c.url, hyphen, c.jsonp, '=?'].join('') : c.url, //开启jsonp，则修订url，不可以用param传递，？会被编码为%3F
            CURRITEM = c.itemOverClass,  $currItem = $(), $allItems = $(), successionTimeId = null;

        	var $suggest = $(["<div style='position:absolute;zoom:1;z-index:", c['z-index'], "' class='auto-suggest-wrap'></div>"].join('')).appendTo('body');
        	
            $suggest.bind({
            	'mouseenter.suggest': function(e){
            		$(this).addClass(SUGGESTOVER);
            	},
            	'mouseleave.suggest': function(){
            		$(this).removeClass(SUGGESTOVER);
            	},
            	'click.suggest': function(e){
            		var $item = $(e.target).closest(c.item);
            		if($item.length) {
            			$t.val(c.getCurrItemValue($item, $t.attr(originValueAttr)));
            			c.onselect($item);
                		suggestClose();
            		};
            	},
            	'mouseover.suggest': function(e) {
            		var $item = $(e.target).closest(c.item), currClass = '.' + CURRITEM;
            		if($item.length && ! $item.is(currClass)) {
            			$suggest.find(currClass).removeClass(CURRITEM);
            			$currItem = $item.addClass(CURRITEM);
            		};
            	}
            });
            
            /* iframe shim遮挡层 ie6, 可以共用一个 */
            if(ie6) {
            	var $suggestShim = $('#' + suggestShimId);
            	if(! $suggestShim.length) {
            		$suggestShim = $(["<iframe src='about:blank' style='position:absolute;filter:alpha(opacity=0);z-index:", c['z-index'] - 2, "' id='", suggestShimId ,"'></iframe>"].join('')).appendTo('body');
            	};
            };

            /*window resize调整层位置 */
            $(window).resize(function(){
            	fixes();
            });
               
            function fixes() {
        		var offset = $t.offset(),
                h = $t.innerHeight(),
                w = $t.innerWidth(),
                css = {
                    'top': offset.top + h,
                    'left': offset.left,
                    'width': w
                };
            	$suggest.css(css);
            	if(ie6) {
            		css['height'] = $suggest.height();
            		$suggestShim.css(css).show();
            	};
            };
            function suggestClose() {
                $suggest.hide().removeClass(SUGGESTOVER);
                if(ie6) {
                    $suggestShim.hide();
                };
            };
        	
        	var selectBusy = false /* 防止一直按键时候不停触发keydown */, triggerChange = true /*for ie*/, dataExpired = false /*检查网络延时导致的ajax数据过期*/,
            keyHandler = { //没有上下条的时候，要回到input内
            	'move': function(down) {
        			if(! $suggest.is(":visible"))
        				return;
            		if($currItem.length) {
        				$currItem.removeClass(CURRITEM);
        				var currIndex =  $allItems.index($currItem) + (down ? 1 : -1);
            			if(currIndex < 0) { //小于0，eq会取index = 0
                			$currItem = $();
                		} else {
                			$currItem = $allItems.eq(currIndex);
                		};
            		} else {
            			$currItem = $suggest.find(c.item + (down ? ':first' : ':last'));
            		};
            		
        			if($currItem.length) {
            			$currItem.addClass(CURRITEM);
            			$t.val(c.getCurrItemValue($currItem, $t.attr(originValueAttr)));
            		} else {
            			$t.val($t.attr(originValueAttr));//.focus()
            		};
            		selectBusy = true; //或者setTimeout每隔一段时间就设置一次selectBusy = false,这样可以缓慢移动
            	},
            	'select': function() { //选择
            		if($currItem.length) {
            			$t.val(c.getCurrItemValue($currItem, $t.attr(originValueAttr)));
            			c.onselect($currItem);
            		};
            		suggestClose();
            	}
            };
        	//input需要绑定的变量
        	var inputEvents = {};
			inputEvents[KEYUP] = function(e) { //监听方向键
            	selectBusy = false;
            	successionTimeId && clearTimeout(successionTimeId);
            	if(ie) {
            		var kc = e.keyCode;
                	if(kc === UP || kc === DOWN || kc === TAB || kc === ENTER || kc === ESC) { //for IE: 因为ie使用keyup判断change事件，需要排除控制键,并且事件绑定在前，保证第一次就生效
                		triggerChange = false;
                	} else {
                		triggerChange = true;
                	}; 
            	};
            };
			inputEvents[BLUR] = function(){ //失去焦点触发
            	dataExpired = true; //失去焦点后设置ajax数据过期
            	if(! $suggest.hasClass(SUGGESTOVER)) { //焦点先于点击，这里判断防止失去焦点后直接隐藏，导致点击选择项目无效
            		suggestClose();
            	};
            };
			inputEvents[KEYDOWN] = function(e) { //监听方向键
        		var kc = e.keyCode;
            	if(kc === UP || kc === DOWN ) { //方向键
            		if(! selectBusy) {
            			keyHandler.move(kc === DOWN);
            			
                		if(c.isSuccession) { //是否开启了连续按键响应
                			successionTimeId = setTimeout(function(){
                				selectBusy = 0;
                			}, c.delay);
                		};
            		};
            	} else if(kc === TAB || kc === ENTER) {
            		keyHandler.select(e);
            		if(kc === ENTER)
            			e.preventDefault();
            	} else if(kc == ESC) {
            		$t.val($t.attr(originValueAttr));
            		suggestClose();
            	}; 
            };
        	inputEvents[CHANGE] = function(e) { //值改变触发
        		if(ie && ! triggerChange) {
        			return;
        		};
                var value = $.trim($t.val());
                if(value) {
                	$t.attr(originValueAttr, value); //keep input value，这里的操作导致IE不能使用propertychange事件绑定，会造成死循环，故使用textchange事件扩展插件
                	var param = {}, queryName = c.queryName ? c.queryName : $t.attr('name'); //如果未设置参数查询名字，默认使用input自身name
                	param[queryName] = value;
                	dataExpired = false; //防止网络延时造成的数据过期，先请求的数据覆盖后请求的数据
                    $.get(URL, param, function(data){
                    	if(dataExpired) {
                    		return;
                    	};
                    	if(data) {
	                        $allItems = $suggest.html(c.processData(data)).show().find(c.item); //重置$allItem
	                        $currItem = $(); //有新数据，重置$currItem
	                        fixes();
                    	} else {
                    		$suggest.hide();
                    	};
                    	dataExpired = true;
                    }, c.dataType);  
                } else {
                    $suggest.hide();
                };
                c.textchange($t); //执行配置中的textchange，顺便提供一个有用的api
			};
			
    		$t.bind(inputEvents);
        });
    };
    /**
	 * @author ToFishes
     * @date 2011-6-1
     * @desc 设置可以拖动的对象 
     * @required jquery.event.drag.js
     */
    $.fn.jDrag = function(c){
    	c = $.extend({
    		relative: $('body') //以某个父元素范围做为边界
    	}, c);
    	
    	return this.each(function(){
    		var $div = c.relative.jquery ? c.relative : $(c.relative);
    		$(this).drag("start",function( ev, dd ){
				dd.limit = $div.offset();
				dd.limit.bottom = dd.limit.top + $div.outerHeight() - $( this ).outerHeight();
				dd.limit.right = dd.limit.left + $div.outerWidth() - $( this ).outerWidth();
			}).drag(function( ev, dd ){
				$( this ).css({
					top: Math.min( dd.limit.bottom, Math.max( dd.limit.top, dd.offsetY ) ),
					left: Math.min( dd.limit.right, Math.max( dd.limit.left, dd.offsetX ) )
				});   
			});
    	});
    	
    };

	/**
	 * @author ToFishes
	 * @date 2011-6-17
	 * @desc 图片的预加载，或可以加载中提示loading
	 */
	$.fn.jImageLoad = function(c){
		c = $.extend({
			src: function($this){return $this.attr('load-src') || $this.attr('data-load-src');},  //真实图片地址，可以是字符串图片地址，也可以是一个返回地址的函数，该函数接受一个参数为jquery对象本身
			placeholder: function($this){return $this.attr('placeholder') || $this.attr('data-placeholder');}, //替代图片地址，可以是字符串图片地址，也可以是一个返回地址的函数，该函数接受一个参数为jquery对象本身
			loading: function($this){},
			loaded: function($this, success){}
		}, c);
//		function extractUrl(input) {
//			return input.replace(/"/g,"").replace(/url\(|\)$/ig, "");
//		};
		
		return this.each(function(){
			var $img = $(new Image()), $this = $(this),
			set = {
				'src': '',
				'placeholder': ''
			};
			for(var key in set) {
				if(c[key].split) {
					set[key] = c[key];
				} else if($.isFunction(c[key])){
					set[key] = c[key]($this);
				};
			};
			if(! set.src) {
				c.loaded($this, false);
				return false;
			};
			c.loading($this);
			if($this.is('img')) {
				set.placeholder && $this.attr('src', set.placeholder);
				$img.load(function(){
					$this.attr('src', set.src);
					c.loaded($this, true);
				}).attr('src', set.src);
			} else { //非图片元素认定为背景图
				//set.src = set.src || extractUrl(set.src); //应该交由调用方保证url正确性
				set.placeholder && $this.css({
					'background-image': 'url("'+ set.placeholder +'")'
				});
				$img.load(function(){
					$this.css({
						'background-image': 'url("'+ set.src +'")'
					});
					c.loaded($this, true);
				}).attr('src', set.src);
			}
		});
	};

	/**
	 * 单独的验证方法
	 * @param
	 *     value 字符串，需要验证的值
	 *     valid 函数，当通过验证时候执行
	 *     invalid 函数，未通过验证时执行
	 * @example
	 * $.isEmail(value, valid, invalid);
	 */
	var validateTypeMap = {
		'isEmail': /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i,
		'isEmpty': function(v){return ! $.trim(v).length; }
	};
	for(var key in validateTypeMap) {
		var method = validateTypeMap[key];
		$[key] = (function(method){
			return function(value, valid, invalid){
				valid = valid || function(){};
				invalid = invalid || function(){};
				var v;
				if(method.test) {
					v = method.test(value);
				} else if($.isFunction(method)) {
					v = method(value);
				} else {
					v = false;
				};
				if(v) {
					valid();
				} else {
					invalid();
				};
				return v;
			};
		})(method);
	};
})(jQuery);
