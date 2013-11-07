(function($){
	/**
	 * @desc ��oninput�������¼�����Ϊonpropertychange��ie�£���js�ı�ֵҲ�ᱻ������
	 * ��suggest����оͲ��Ǻܺ����ˡ���ʹ����������¼����, ԭ���λ��http://www.zurb.com/playground/jquery-text-change-custom-event��
	 * �����Ѿ���ʵ�������޸ģ���.data('lastValue')��Ϊ.attr('lastValue'���洢��������ܡ�
	 */
	$.event.special.textchange = { //bind('textchange', function(event, oldvalue, newvalue){}) //�����ֵ�͵�ǰ��ֵ
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
     * @update 2012-8-30
     * @desc �������ݵ�ƥ���Զ���ʾ 
     * @question: Ŀǰ�ڸմ�FF�����ʱ���ͻᴥ��input�¼��������Ҫ��ʵ���з����Ƿ���Ҫinit���
     * @DONE��
     * 1������������ʱ��ɵĶ��ajax������ң���Ҫ����ʱ��������ʱ��ajax����
     * 2����֤Ψһ��<del>suggest-wrap�����¼���</del>,ie6 shim, suggest-wrap����Ψһ����󶨵�clickѡ���¼�����õ�c.onselect����c.onselect�����Ƕ��input��������Ŀ 
     * 3��Ψһ��resize��
     * @release
     * 2011-5-20 ���sequential��������
     * @release 2.0
     * 1�����unselect���������޶�һЩ�ص��������
     * 2��ajax��������300ms���ӳ٣���ֹ̫Ƶ��������
     * 3�����������ݹ��ڵĴ�������
     * 4�������˱�׼������� onpaste oncut�¼�����
	 */
	$.fn.suggest = function(c){
        c = $.extend({
        	url: '',
        	queryName: null, //url?queryName=value,Ĭ��Ϊ������name����
        	jsonp: null, //���ô˲�������������jsonp���ܣ�����ʹ��json���ݽṹ
        	item: 'li', //������ʾ��Ŀ��λ��ѡ������Ĭ��һ��li��һ����ʾ����processDataд�����
        	itemOverClass: 'suggest-curr-item', //��ǰ������Ŀ�ı���࣬������Ϊcss��������
        	sequential: 0, //���ŷ���������Ƿ���Գ���ѡ��Ĭ�ϲ����ԣ�����ֵ�������κεȼ۵�boolean��
        	delay:100, //����ѡ����ӳ�ʱ�䣬Ĭ��100ms�����������ѡ�������
        	'z-index': 999, //��ʾ��Ĳ�����ȼ����ã�css���㶮��
        	processData: function(data){ //�Զ��崦���ص����ݣ��÷�������returnһ��html�ַ�����jquery���󣬽���д�뵽��ʾ����������
	        	var template = [];
	            template.push('<ul class="suggest-list">');
	            var evenOdd = {'0' : 'suggest-item-even', '1': 'suggest-item-odd'}, count = 0;
	            for(var key in data) { //���������ż������
	                template.push('<li class="' , evenOdd[(++count) % 2] , '">', key,'</li>');
	            };
	            template.push('</ul>');
	            return template.join('');
        	},
        	getCurrItemValue: function($currItem){ //�������ȥȡ�õ�ǰ��ʾ��Ŀ��ֵ������ֵ,������ݴ˺�����ȡ��ǰ��ʾ��Ŀ��ֵ��������input�У��˷���Ӧ����processData����������
        		return $currItem.text();
        	},
        	textchange: function(value, $suggestList){}, //��ͬ��change�¼���ʧȥ���㴥����textchange�����������ֻҪ�����б仯���ͻᴥ��������������ֵ�������б�����, �ڲ�this��ָ��input�����
        	onselect: function($currItem, $input){}, //��ѡ���������ĵ�ǰ��Ŀʱִ�У������뵱ǰ��Ŀ
            unselect: function($input, e) {} //û��ѡ���κ���ʾ��Ŀ��ֱ��TAB��س�
        }, c);

		var ie = !-[1,], ie6 = ie && !window.XMLHttpRequest,
        CURRINPUT = 'suggest-curr-input', SUGGESTOVER = 'suggest-panel-overing', suggestShimId = 'suggest-shim-iframe',
        UP = 38, DOWN = 40, ESC = 27, TAB = 9, ENTER = 13,
        CHANGE = 'input.suggest paste.suggest cut.suggest '/*@cc_on + ' textchange.suggest'@*/, RESIZE = 'resize.suggest',
        BLUR = 'blur.suggest', KEYDOWN = 'keydown.suggest', KEYUP = 'keyup.suggest';
       
        return this.each(function(){
        	var $t = $(this).attr('autocomplete', 'off');
        	var hyphen = c.url.indexOf('?') != -1 ? '&' : "?"; //���жϣ����url�Ѿ����ڣ�����jsonp�����ӷ�Ӧ��Ϊ&
            var URL = c.jsonp ? [c.url, hyphen, c.jsonp, '=?'].join('') : c.url, //����jsonp�����޶�url����������param���ݣ����ᱻ����Ϊ%3F
            CURRITEM = c.itemOverClass,  $currItem = $(), sequentialTimeId = null;
        	 
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
            			$t.val(c.getCurrItemValue($item));
            			c.onselect($item, $t);
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
            
            /* iframe shim�ڵ��� ie6, ���Թ���һ�� */
            if(ie6) {
            	var $suggestShim = $('#' + suggestShimId);
            	if(! $suggestShim.length) {
            		$suggestShim = $(["<iframe src='about:blank' style='position:absolute;filter:alpha(opacity=0);z-index:", c['z-index'] - 2, "' id='", suggestShimId ,"'></iframe>"].join('')).appendTo('body');
            	};
            };

            /*window resize������λ�� */
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
        	
        	var selectBusy = false /* ��ֹһֱ����ʱ��ͣ����keydown */, triggerChange = true /*for ie*/,
            keyHandler = { //û����������ʱ��Ҫ�ص�input��
            	'move': function(down) {
        			if(! $suggest.is(":visible"))
        				return;
            		if($currItem.length) {
        				$currItem.removeClass(CURRITEM);
            			if(down) {
                			$currItem = $currItem.next();
                		} else {
                			$currItem = $currItem.prev();
                		};
            		} else {
            			$currItem = $suggest.find(c.item + (down ? ':first' : ':last'));
            		};
            		
        			if($currItem.length) {
            			$currItem.addClass(CURRITEM);
            			$t.val($currItem.text());
            		} else {
            			$t.val($t.attr('curr-value'));//.focus()
            		};
            		selectBusy = true; //����setTimeoutÿ��һ��ʱ�������һ��selectBusy = false,�������Ի����ƶ�
            	},
            	'select': function(e) { //ѡ��
            		if($currItem.length) {
            			$t.val(c.getCurrItemValue($currItem));
            			c.onselect($currItem, $t);
            		} else {
                        c.unselect($t, e);
                    };
            		suggestClose();
            	}
            };
        	//input��Ҫ�󶨵ı���
        	var inputEvents = {};
			inputEvents[KEYUP] = function(e) { //���������
            	selectBusy = false;
            	//sequentialTimeId && clearTimeout(sequentialTimeId);
            	if(ie) {
            		var kc = e.keyCode;
                	if(kc === UP || kc === DOWN || kc === TAB || kc === ENTER || kc === ESC) { //for IE: ��Ϊieʹ��keyup�ж�change�¼�����Ҫ�ų����Ƽ�,�����¼�����ǰ����֤��һ�ξ���Ч
                		triggerChange = false;
                	} else {
                		triggerChange = true;
                	}; 
            	};
            };
			inputEvents[BLUR] = function(){ //ʧȥ���㴥��
            	if(! $suggest.hasClass(SUGGESTOVER)) { //�������ڵ���������жϷ�ֹʧȥ�����ֱ�����أ����µ��ѡ����Ŀ��Ч
            		suggestClose();
            	};
            };
			inputEvents[KEYDOWN] = function(e) { //���������
        		var kc = e.keyCode;
            	if(kc === UP || kc === DOWN ) { //�����
            		if(! selectBusy) {
            			keyHandler.move(kc === DOWN);
            			
                		if(c.sequential) { //�Ƿ���������������Ӧ
                			sequentialTimeId = setTimeout(function(){
                				selectBusy = 0;
                			}, c.delay);
                		};
            		};
            	} else if(kc === TAB || kc === ENTER) {
            		keyHandler.select(e);
            		if(kc === ENTER)
            			e.preventDefault();
            	} else if(kc == ESC) {
            		$t.val($t.attr('curr-value'));
            		suggestClose();
            	}; 
            };
        	inputEvents[CHANGE] = function(e) { //ֵ�ı䴥��
                if($t.data('changeDelayId')) {
                    clearTimeout($t.data('changeDelayId'));
                };

                //�ӳٺ���
                var changeDelayTime = 300;
                var changeDelayId = setTimeout(function(){
                    if(ie && ! triggerChange) {
                        return;
                    };
                    var value = $.trim($t.val());
                    if(value && c.url) {
                        $t.attr('curr-value', value); //keep input value������Ĳ�������IE����ʹ��propertychange�¼��󶨣��������ѭ������ʹ��textchange�¼���չ���
                        var param = {}, queryName = c.queryName ? c.queryName : $t.attr('name'); //���δ���ò�����ѯ���֣�Ĭ��ʹ��input����name
                        param[queryName] = value;

                        var xhr = $.getJSON(URL, param, function(data){
                            var _xhr = $t.data('cache-xhr');
                            if(_xhr && _xhr.readyState != 4) {
                                _xhr.abort();
                            };

                            if(data) {
                                $suggest.html(c.processData(data));
                                fixes();
                                $suggest.show();
                                $currItem = $(); //�������ݣ�����$currItem
                            } else {
                                $suggest.hide();
                            };
                        });  
                        $t.data('cache-xhr', xhr);
                    } else {
                        $suggest.hide();
                    };
                    c.textchange.call($t, value, $suggest); //ִ�������е�textchange��˳���ṩһ�����õ�api
                }, changeDelayTime);

                $t.data('changeDelayId', changeDelayId);
			};
			
    		$t.bind(inputEvents);
        });
    };
})(jQuery);
