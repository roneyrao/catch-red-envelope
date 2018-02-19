var URL={
  getStatusScore:'getUserScoreNum.do'
  ,gamble:'chance.do'
};

for(var i in URL){
  URL[i]='MOCK/data/'+URL[i]+'.json';    
}
   
(function(U, G){
	var App={
		doms:{spFlowTotal:'#spFlowTotal', shortageDlg:'#shortageDlg', qbDlg:'#qbDlg', luckyList:'#exgLucky', luckyListCtnr:'#exgLuckyCtnr', gambleBoxPre:'#gambleBoxPre', gambleBoxStart:'#gambleBoxStart', gambleBoxPlay:'#gambleBoxPlay', gambleBoxGot:'#gambleBoxGot', gambleBoxFail:'#gambleBoxFail', phase:'#phase', timeLeft:'#timeLeft', btnStart:'#gBtnStart', flowMin:'.flowMin', bags:'.bags', prize:'#prize', btnRestart:'.btnRestart', btnGet:'#btnGet', bagGot:'#bagGot', gameTime:'#gameTime', titPre:'.boxTit3', titRun:'.boxTit4', playGnd:'#gPlayGnd', btnClaim:'#btnClaim'}
		,flies:[$('<div class="bag"></div>'), $('<div class="bug"></div>'), $('<div class="angel"></div>')]
		,preloads:['img/bomb.png', 'img/bagfly0.png', 'img/bagfly1.png', 'img/bagfly2.png', 'img/bugFly.png', 'img/angel.png']
		,INIT_RATE:4 ,rate:0//redbags proportion;
		,domIxArr:[]
		,speeds:[[450, '900ms'], [400, '1500ms'], [350, '2000ms']]//from hard to easy; delay(time between), duration(time for a travel)
		,INIT_SPEED:null ,speedIx:null, speed:null// the bigger, the slower and more;
		,timeLimit:15 //seconds for each play;
		//debug
    // ,timeLimit:3 //seconds for each play;
		,stopped:true //not playing
		,timerCD:null ,timerFly:null ,bagsGot:0 ,totalFlow:0 ,flowMin:null
		,startXOff:0 ,startYOff:0 ,ratioHW:0 ,rDeg:0 ,fWthX:0 ,maxX:0 ,prevFlyX:0
		,init:function(){
			var doms=this.doms;
			U.initDoms(doms);

			U.preloadImgs(this.preloads);

			this.initDimen();
      G.win.on('resize', this.initDimen.bind(this))
			this.INIT_SPEED=this.speeds.length-1;
			this.newFly=this.newFly.bind(this);
			this.countDown=this.countDown.bind(this);
			this.incBags=this.incBags.bind(this);
			this.handleBet=this.handleBet.bind(this);

			doms.btnStart.click(this.start.bind(this));
			doms.btnRestart.click(this.restart.bind(this));

			doms.playGnd[0].addEventListener('click', this.onClick.bind(this), true);

			this.luckyTpl=$(doms.luckyList.children()[0]).remove();

			this.loadScore();

			this.restart();
		}
		,restart:function(auto){
			if(!this.stopped){
				this.stop(true);
			}
			this.rate=this.INIT_RATE;
			this.speedIx=this.INIT_SPEED;
			this.speed=this.speeds[this.speedIx];
			this.timerFly=this.timerCD=null;
			this.bagsGot=0;
			this.doms.bagGot.html(0);
			this.prevFlyX=this.maxX+this.fWthX+10;//never overlap the first time;

			this.initBox();
			this.initDomIxArr();

			if(auto){
				this.start();
			}
		}
		,start:function(){
			if(this.flowMin==null){
				return U.toast('请稍等，正在请求数据');
			}
			if(this.flowMin>this.totalFlow){
				return U.showDlg(this.doms.shortageDlg);
			}
			this.showBox(this.doms.gambleBoxPlay);
			this.startTime=new Date();
			this.doms.gameTime.html(this.timeLimit);
			this.timerCD=window.setInterval(this.countDown, 1000);
			this.stopped=false;
			this.newFly();
			//this.sendStart();
		}
		,initDimen:function(){
			this.doms.gambleBoxPlay.css('visibility', 'hidden').show();

			var gWth=this.doms.playGnd.width(), gHt=this.doms.playGnd.height();
			this.startXOff=-gWth/2;
			this.startYOff=gHt/2;
      // this.startXOff= this.startYOff=0;
			this.ratioHW=gHt/gWth;

			var radian=Math.atan(this.ratioHW);
			this.rDeg=['rotateZ(', radian*180/Math.PI+'deg', ')'].join('');
			//same width, diff height;
			var fHt=0;
			for(var i=0,len=this.flies.length; i<len; i++){
				var f=this.flies[i].clone();
				f.css('visibility', 'hidden');
				this.doms.playGnd.append(f);

				if(!i){
					this.fWthX=f.width()*Math.cos(radian);
					this.maxX=gWth-this.fWthX;
				}
				fHt=Math.max(fHt, f.height());
			}
			//height replaces for y for conveniece;
			this.endXOff=gWth/2+this.fWthX;
			this.endYOff=-gHt/2-fHt;
			//this.transTo=[this.rDeg, ' translate3d(', gWth+this.fWthX, 'px,', -gHt-fHt, 'px,', '0)'].join('');

			this.doms.playGnd.empty();
			this.doms.gambleBoxPlay.css('visibility', 'visible').hide();
		}
		,initDomIxArr:function(){
			var rate=this.rate, len=this.flies.length, prop=Math.floor((10-rate)/(len-1)), rem=(10-rate)%(len-1);
			var arr=this.domIxArr=[];
			for(var i=0; i<rate; i++){
				arr[i]=0;
			}
			for(var i=1; i<len; i++){
				for(var j=0; j<prop; j++){
					arr[rate+j]=i;
				}
				rate+=j
			}
			if(rem){
				arr[rate]=i-1;
			}
		}
		,initBox:function(){
			var boxShowed;
      boxShowed=this.doms.gambleBoxStart;
			this.showBox(boxShowed);
		}
		,showBox:function(boxShowed){
			if(this.boxShowed!=boxShowed){
				this.boxShowed&&this.boxShowed.hide();
				this.boxShowed=boxShowed;
				if(boxShowed){
					boxShowed.show();;
					var tit;
					if(boxShowed==this.doms.gambleBoxPre){
						tit=this.doms.titPre;
					}else{
						tit=this.doms.titRun;

					}
					if(this.tit!=tit){
						this.tit&&this.tit.hide();
						tit.show();;
						this.tit=tit;
					}
				}
			}
		}
		,stop:function(cancel){
			this.stopped=true;
			if(this.timerFly){
				window.clearInterval(this.timerFly);
				this.timerFly=null;
			}
			if(this.timerCD){
				window.clearInterval(this.timerCD);
				this.timerCD=null;
			}
			if(cancel){
				this.initBox();
			}else{
				if(this.bagsGot){
					this.sendBet();
				}else{
					this.showBox(this.doms.gambleBoxFail.removeClass('empty'));
				}
			}
		}
		,countDown:function(){
			var lft=this.timeLimit-Math.round((new Date()-this.startTime)/1000);
			this.doms.gameTime.html(lft);
			if(lft<=0){
				this.stop();
			}
		}
		,newFly:function(){
			if(this.stopped)return;
			var r=Math.random(), ix=this.domIxArr[Math.floor(r*10)];
			var dom=this.flies[ix].clone();
			if(!ix){
				dom.addClass('bag'+Math.floor(r*3))
			}
			var x=Math.random()*this.maxX;
			if(Math.abs(x-this.prevFlyX)<this.fWthX){//overlap
				if(this.prevFlyX>this.fWthX){//left space is enough;
					x=this.prevFlyX-this.fWthX;
				}else{//then place in the right
					x=this.prevFlyX+this.fWthX;
				}
			}
			y=x*this.ratioHW;
			dom.css({
				'transition-duration':this.speed[1]
				,'-webkit-transition-duration':this.speed[1]
				,'transform':this.rDeg
				,'-webkit-transform':this.rDeg
				,left:(x+this.startXOff)+'px'
				,top:(y+this.startYOff)+'px'
			}).on('transitionend', this.onMoveEnd).on('webkitTransitionEnd', this.onMoveEnd);
			this.doms.playGnd.append(dom);
			var t=this;
			this.anim(function(){
				dom.css({
					left:(x+t.endXOff)+'px'
					,top:(y+t.endYOff)+'px'
				});
			});
			if(!this.timerFly){
				this.timerFly=window.setInterval(this.newFly, this.speed[0]);
			}
		}
		,anim:function(fun){
      window.setTimeout(fun, 50);
		}
		,onMoveEnd:function(){
			$(this).remove();
		}
		,incBags:function(evt){
			$(evt.target).off('transitionend', this.incBags).off('webkitTransitionEnd', this.incBags);
			this.bagsGot++;
			this.doms.bagGot.html(this.bagsGot);
		}
		,onClick:function(evt){
			if(evt.target.className){
				var cls=evt.target.className;
				if(cls){
					var tar=$(evt.target);
					if(cls.substr(0, 3)=='bag'){
						tar.css({
							left:''
							,top:''
							,'transition-duration':''
							,'-webkit-transition-duration':''
						}).on('transitionend', this.incBags).on('webkitTransitionEnd', this.incBags);
						if(this.speedIx){
							this.speedIx--;
							this.speed=this.speeds[this.speedIx];
						}
						if(this.rate>1){
							this.rate--;
							this.initDomIxArr();
						}
					}else if(cls=='bug'){
						var s=window.getComputedStyle(tar[0]);
						tar.css({
							'left':s['left']
							,'top':s['top']
							,'transition-duration':''
							,'-webkit-transition-duration':''
							,'transform':''
							,'-webkit-transform':''
						});
						this.anim(function(){tar.addClass('fade')});
					}else if(cls=='angel'){
						tar.css({
							'transition-duration':'150ms'
							,'-webkit-transition-duration':'150ms'
						});
					}
					tar.addClass('capture');
				}
			}
		}
		// ,move:function(dom){
		//	var t=this;
		//	window.setTimeout(function(){
		//		dom.css('transform',t.transTo);
		//		dom.css('-webkit-transform',t.transTo);
		//	}, 0);
		//}
    // ,handleRs:function(){
    // ,hif(this.prize.exchangeType==1){
    // ,h  B.showSelfDlg(this.prize.prizeDesc, this.data.chanceInfo);
    // ,h  this.restart();
    // ,h}else{
    // ,h  if(this.prize.operType==4){
    // ,h    this.saveQB();
    // ,h  }else{
    // ,h    this.claim();
    // ,h  }
    // ,h}
    // }
    //,saveQB:function(){
    // 	var t=this;
    // 	vB.showQQDlg(this.gambleResult.logId, this.prize.prizeId, {}, function(d){
    // 	v	if(d.ret){
    // 	v    t.setFlow(d.userScore);
    // 	v		U.toast('已保存');
    // 	v	}else{
    // 	v		U.toast('error');
    // 	v	}
    // 	v	t.restart();
    // 	v});
    // }
		,claim:function(){
			var t=this;
			if(U.get(URL.claim, {logId:this.gambleResult.logId, prizeId:this.prize.prizeId}, function(d){
				if(d.ret){
          this.setFlow(d.userScore);
					U.toast('+'+t.prize.prizeDesc);
				}else{
					U.toast('error');
				}
				t.restart();
			})){
				this.restart();
			}
		}
		,sendStart:function(){
      var t=this;
      U.get(URL.gamble, null, this.handleBet, function(){
        U.toast('网络异常，请重试');
      });
		}
		,sendBet:function(flow){
      var t=this;
      U.get(URL.gamble, null, this.handleBet, function(){
        U.toast('网络异常，请重试');
      });
		}
		,handleBet:function(d){
			this.gambleResult=d;
			this.data=d;
			this.prize=d.prizeInfo;
			this.setFlow(d.userScore);
			this.doms.bags.html(this.bagsGot);
			if(this.prize&&this.prize.minScore){
				this.doms.prize.html(this.prize.prizeDesc);
				this.showBox(this.doms.gambleBoxGot);
			}else{
				this.showBox(this.doms.gambleBoxFail.addClass('noprize'));
			}
		}
		,loadScore:function(cb){
			var t=this;
			U.get(URL.getStatusScore, {pn:''}, function(d){
        t.setFlow(d.userScore);
				t.flowMin=d.chanceFlow; //new field
				t.doms.flowMin.html(d.chanceFlow);
				G.body.addClass(LEN.CLS.rendered);
				cb&&cb();
			});
		}
    ,setFlow(f){
      this.doms.spFlowTotal.html(f);
			this.totalFlow=f;
    }
	};

	


	$(function(){
		App.init(App);
	});
})(LEN.UTIL, LEN.GLOBAL);
