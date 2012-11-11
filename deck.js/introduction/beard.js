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

            for (var i = 0; i <= titles.length - 1; i++) {
                strdata += "['" + titles[i] + "'," + (seriesdata[i] * 100) / total + "],";
            }
            var datashow = eval("[" + strdata + "]");

            var piechart = new Highcharts.Chart({
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
    	      var resultX = [];
    	      for(var i = 0; i < node.children.length; i++){
    	        resultX.push(node.children[i].voteCount);
    	      }
    	      chartObject.series[0].setData(resultX);
    	  } else {
    	        lastUpdate = new Date();
    	        parentNode = node;
    	  }
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
        window[ "chartObject-" + item.id] = chart('column', item.id, resultY, resultX);
      })

      $(document).bind('deck.change', function(event, from, to) {
          setTimeout(function(){
            var $current = $('section.deck-current, section.deck-child-current');
            if($current.length == 0) return;
            socket.emit('page', {current:$current[0].id});
          },100);
         
      });

    })


   
});