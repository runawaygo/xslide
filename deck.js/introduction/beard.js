  // var socket = io.connect('http://localhost:8000');
  // socket.on('ping', function (data) {
  //   console.log(data);
  //   socket.emit('pong', { my: 'data' });
  // });


function chart(charttype, containerid, titles, seriesdata) {
    switch (charttype) {
        case "column":
            var columnchart = new Highcharts.Chart({
                title:"",
                chart: {
                    renderTo: containerid,
                    defaultSeriesType: "column"
                },
                xAxis: {
                    categories: titles,
                    labels:{
                      style:{
                        fontSize:'16px'                       
                      }
                    }
                },
                series: [{
                    name: 'vote count',
                    data: seriesdata
                }]
            });
            return columnchart;
        case "pie":
            var strdata = "";
            var total  = 0;
            for (var i = 0; i <= seriesdata.length - 1; i++) {
                total += seriesdata[i];
            }
            if(total ===0){
              for (var i = 0; i <= seriesdata.length - 1; i++) {
                  seriesdata[i] = 1;
              } 
              total =seriesdata.length;
            }


            for (var i = 0; i <= titles.length - 1; i++) {
                strdata += "['" + titles[i] + "'," + (seriesdata[i] * 100) / total + "],";
            }
            strdata = strdata.substring(0,strdata.length-1);
            var datashow = eval("[" + strdata + "]");

            var piechart = new Highcharts.Chart({
                title:"",
                chart: {
                    renderTo: containerid,
                    plotBackgroundColor: null,
                    plotBorderWidth: null,
                    plotShadow: false
                },
                series: [{
                    type: 'pie',
                    name: 'Browser share',
                    data: datashow
                }]
            });
            return piechart;
    }
}

function chartUpdate(chartObject, node){
  if(node.text.caption.indexOf(':select')>0)
  {
    var resultX = [];
    for(var i = 0; i < node.children.length; i++){
      resultX.push(node.children[i].voteCount);
    }
    chartObject.series[0].setData(resultX);
  }
  else{
    var resultX = [];
    for(var i = 0; i < node.children.length; i++){
      resultX.push([node.children[i].text.caption, node.children[i].voteCount ]);
    }
    console.log(resultX);
   chartObject.series[0].setData(resultX);
  }
}

function getParameterByName(name)
{
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regexS = "[\\?&]" + name + "=([^&#]*)";
  var regex = new RegExp(regexS);
  var results = regex.exec(window.location.search);
  if(results == null)
    return "";
  else
    return decodeURIComponent(results[1].replace(/\+/g, " "));
}


function RandomArray(count){
  var original=new Array;//原始数组 
  //给原始数组original赋值 
  for (var i=0;i<count;i++){ 
   original[i]=i+1; 
  } 
  original.sort(function(){ return 0.5 - Math.random(); }); 
  return original;
}

var randomArray = RandomArray(1000);

function GenerateSimpleAnimation(origin, target){
  var name = 'random' + randomArray.pop();
  var keyframes = '@-webkit-keyframes '+ name +' { '+
                    '0% {-webkit-transform: translate3d('+ origin.x+'px,'+ origin.y+'px,0) scale(1)}'+
                    '100% {-webkit-transform: translate3d('+ target.x+'px,'+ target.y+'px,0) scale(1)}'+
                  '}';

  if( document.styleSheets && document.styleSheets.length ) {
    console.log(keyframes)
      document.styleSheets[0].insertRule( keyframes, 0 );
  } else {
    var s = document.createElement( 'style' );
    s.innerHTML = keyframes;
    document.getElementsByTagName( 'head' )[ 0 ].appendChild( s );
  }
  return name;
}  

var IMMEDIATE_UPDATE = true;

$(function() {
    var key = getParameterByName('key');
    var parentNode;
    var lastUpdate;
    if( !IMMEDIATE_UPDATE) {
	    setInterval(function(){
	      var now = new Date();
	      if(!lastUpdate || lastUpdate.getTime()+2000 < now.getTime()) return;
	
	      var elementId  = 'chart-'+parentNode.id;
	      var resultY = [];
	      var resultX = [];
	      for(var i = 0;i<parentNode.children.length;i++){
	        var node = parentNode.children[i];
	        resultY.push(node.text.caption);
	        resultX.push(node.voteCount);
	      }
	
	      chart('column', elementId , resultY, resultX);
	    },2000);
    }

    $.get('/slide/'+key,function(data){
      var socket = io.connect('http://'+ window.location.host);
      socket.on('vote', function (node) { // TIP: you can avoid listening on `connect` and listen on events directly too!
    	  if( IMMEDIATE_UPDATE) {
    	      var chartObject = window[ 'chartObject-chart-' + node.id];
    	      
            chartUpdate(chartObject, node);

    	  } else {
    	        lastUpdate = new Date();
    	        parentNode = node;
    	  }
      });

      socket.on('tucao', function (tucao) { // TIP: you can avoid listening on `connect` and listen on events directly too!
        $('#running-box').html(tucao).addClass('fadeInLeft');
        setTimeout(function(){  
          $('#running-box').removeClass('fadeInLeft');
        },1100);
      });


    	var mindMap = JSON.parse(data);
  		$('#tmplTitle').tmpl(mindMap.mindmap.root).appendTo('body');
  		for (var i = 0; i < mindMap.mindmap.root.children.length; i++) {
  			$('#tmplSlide').tmpl(mindMap.mindmap.root.children[i]).appendTo('body');
  		};

  		$.deck('.slide');

      $('.qr').each(function(index,item){
        showQR(item,'http://' + window.location.host+ '/c', 512, 512);
      });

      $('.vote-chart').each(function(index,item){
        var dataChart = $(item).attr('data-chart');
        var resultY = [];
        var resultX = [];
        var dataChartArray = dataChart.split('--');
        for(var i = 0;i<dataChartArray.length-1;i+=3){
          resultY.push(dataChartArray[i+1]);
          resultX.push(parseInt( dataChartArray[i+2]));
        }
        console.log(resultY);
        console.log(resultX);
        window[ "chartObject-" + item.id] = chart($(item).attr('data-chart-type'), item.id, resultY, resultX);
      })

      $(document).bind('deck.change', function(event, from, to) {
          setTimeout(function(){
            var $current = $('section.deck-current, section.deck-child-current');
            if($current.length == 0) return;
            socket.emit('page', {current:$current[0].id});
          },100);
          console.log(to);
          console.log($('.slide').length);
          if($('.slide').length-1 == to){
            TuCao();
          }
      });

      function TuCao(){
        $.get('/tucaoMessages',function(data){
          var messages = JSON.parse(data);
          console.log(messages);
          messages = messages.concat(messages,messages); 
          console.log(messages);

          var screenWidth = window.innerWidth;
          var screenHeight = window.innerHeight;
          var thread = setInterval(function(){
            if(messages.length == 1) clearTimeout(thread);

            var y = Math.random() * screenHeight;
            var animationName = GenerateSimpleAnimation({x:screenWidth, y:y},{x:-600, y:y});
            var element = document.createElement('div');

            element.style['-webkit-animation'] = animationName + ' 6s ease-in-out forwards infinite';
            element.style.position = 'absolute';
            element.innerHTML = messages.pop();
            $('body').append(element);

          },100);
        })
      }
    })
});