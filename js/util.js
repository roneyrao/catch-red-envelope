(function(WIN){
//////////////////////////////////
if(!Function.prototype.bind){
	Function.prototype.bind=function(obj){
		var fun=this;
		return function(){
			return fun.apply(obj, arguments);
		};
	};
}
/////////////////////////////////////
var LEN =WIN.LEN = WIN.LEN || {};
WIN.DEBUG=WIN.LOG=WIN.LOGA=function(){};

var G=LEN.GLOBAL={
	win:$(WIN)
	,doc:$(document)
	,docEl:$(document.documentElement)
	,body:$(document.body)
};

var T=LEN.TIPS={
	badNetwork:'网络不畅，请稍后再试'
};

var CLS=LEN.CLS={
	loading:'loading'
	,hidden:'hidden' 
	,none:'none' 
	,empty:'empty' 
	,noImg:'no-img' 
	,tpl:'tpl'
	,on:'on'
	,rendered:'rendered' 
	,disabled:'disabled'
	,a60:'isA60' 
};

var U=LEN.UTIL={
	getVP:(function(){
		//var ratio=window.devicePixelRatio;
		//var vp={width:window.screen.width/ratio, height:window.screen.height/ratio};
		var w=document.documentElement;
		function get(){
			return {width:w.clientWidth, height:w.clientHeight};
		}
		var vp=get();
		return function(getNew){
			return getNew?get():vp;
		};
	})()
	,initDoms:function(doms, ctnr){
		if(ctnr){
			for(var i in doms){
				doms[i]=ctnr.find(doms[i]);
			}
		}else{
			for(var i in doms){
				doms[i]=$(doms[i]);
			}
		}
	}
	,preloadImgs:function(arr){
		for(var i=0, len=arr.length; i<len; i++){
			new Image().src=arr[i];
		}
	}
	,showDlg:function(dom){
		var clsHtml='dialog_on';
		var dialog=$('<div id="dlgOuter"></div>').appendTo(G.body);
		var curInput, oriMarginTop, popHt;
		function open(dom){
			G.docEl.addClass(clsHtml);
			dom.addClass(CLS.hidden);
			dialog.empty().append(dom);
			vCenter();
			prepareTop();
			dom.removeClass(CLS.hidden);
		}
		function vCenter(){
			oriMarginTop=-dialog.height()/2;
			dialog.css('margin-top', oriMarginTop);
		}
		function close(dom){
			G.docEl.removeClass(clsHtml);
			return true;
		}
		function adjustTop(){
			curInput=this;
			window.setTimeout(function(){
				var vpHt=U.getVP(true).height;
				var gap=(popHt-vpHt)/2;
				if(gap>0){
					var offset;
					if((offset=gap-curInput.osTop)>0){//hidden out of top edge.
						dialog.css('margin-top', (oriMarginTop+offset)+'px');
					}else if((offset=curInput.osTop-gap-vpHt)>0){//hidden out of bottom edge.
						dialog.css('margin-top', (oriMarginTop-offset)+'px');
					}
					curInput.addEventListener('blur',restoreWin);
					window.addEventListener('resize',restoreWin);
				}
			}, 500);
		}
		function prepareTop(){
		    popHt=dialog.height();
			var inputList = dialog.find("input");
			var len = inputList.length;
			//DEBUG(len);
			for(var i=0;i<len;i++){
				inputList[i].osTop=getOsTop(inputList[i]);
				inputList[i].addEventListener('focus', adjustTop);	

			}
		}

		function getOsTop(ipt){
			var tp=0;
			while(ipt&&ipt!=dialog[0]){
				tp+=ipt.offsetTop;
				ipt=ipt.parentNode;
			}
			return tp;
		}
		function restoreWin(){
			curInput.removeEventListener('blur',restoreWin);
			window.removeEventListener('resize',restoreWin);
			window.setTimeout(function(){
				dialog.css('margin-top', oriMarginTop);
			}, 500);
		}

		this.hideDlg=close;
		(this.showDlg=open)(dom);
	}
	,toast : function(){
		if(WIN.API&&API.showToast){
			this.toast=API.showToast.bind(API);
			this.toast.apply(this, arguments);
		}else{
			var DURATION=3000;
			var node = $('<div id="toast"></div>').appendTo(G.docEl);
			node=$('<div class="toast_inner"></div>').appendTo(node);
			var timer=null;
			this.toast=function(msg, cb){
				if(typeof(msg)=='object'){
					try{
						msg=JSON.stringify(msg);
					}catch(err){
						msg='invalid json';
					}
				}

				if(timer){
					WIN.clearTimeout(timer);
					node.html(node.html()+'<br/>'+msg);
				}else{
					node.html(msg);
					node.show();
				}
				timer=WIN.setTimeout(function(){
					node.hide();
					timer=null;
				}, DURATION);
			};
			this.toast.apply(this, arguments);
		}
	}
	,get:function(url, data, success, error, fail){
		if(!url){
			return U.toast('URL缺失');
		}
		G.body.addClass(CLS.loading);
		return $.ajax({
			url:url
			,data:data
			,dataType : 'json'
			,success:function(d){
				G.body.removeClass(CLS.loading);
				//if(d&&d.success){
				if(d){
					typeof(success)=='function'?success(d):U.toast(success || '操作成功');
				}else{
					//U.toast('操作失败。\n['+(d.code||d.errorCode)+'] '+(d.msg||d.message)+'. =>[url]'+url);
					if(fail){
						typeof(fail)=='function'?fail(d):U.toast(fail);
					}else{
						U.toast(d.msg||d.message||'操作失败了哦');
					}
				}
			}
			,error:function(xhr, type, err){
				G.body.removeClass(CLS.loading);
				//var msg='连接异常。\n['+type+']'+err+'. =>[url]'+(xhr.responseURL||url);
				if(error){
					typeof(error)=='function'?error():U.toast(error);
				}else{
					//if(type=='abort'){
					//	err='请求被取消了哦';
					//}else if(type=='parsererror'){
					if(type=='parsererror'){
						err='返回的数据有误';
					}
					//type!='abort'&&U.toast(err||'连接异常了哦');
					U.toast(err||T.badNetwork);
				}
			}
		});
	}
};
})(window);
