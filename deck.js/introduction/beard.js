  // var socket = io.connect('http://localhost:8000');
  // socket.on('ping', function (data) {
  //   console.log(data);
  //   socket.emit('pong', { my: 'data' });
  // });


function chart(charttype, containerid, titles, seriesdata) {
    switch (charttype) {
        case "column":
            var columnchart = new Highcharts.Chart({
                chart: {
                    renderTo: containerid,
                    defaultSeriesType: "column"
                },
                xAxis: {
                    categories: titles
                },
                series: [{
                    name: 'vote count',
                    data: seriesdata
                }]
            });
            break;
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
            break;
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

$(function() {
    var key = getParameterByName('key');

    $.get('/slide/'+key,function(data){
    	var mindMap = JSON.parse(data);
  		$('#tmplTitle').tmpl(mindMap.mindmap.root).appendTo('body');
  		for (var i = 0; i < mindMap.mindmap.root.children.length; i++) {
  			$('#tmplSlide').tmpl(mindMap.mindmap.root.children[i]).appendTo('body');
  		};

  		$.deck('.slide');

      $('.qr').each(function(index,item){
        showQR(item,'http://' + window.location.host+ '/c/' + item.id, 512, 512);        
      })

      $('.vote-chart').each(function(index,item){
        var dataChart = $(item).attr('data-chart');
        var resultY = [];
        var resultX = [];
        var dataChartArray = dataChart.split('--');
        for(var i = 0;i<dataChartArray.length;i+=3){
          resultY.push(dataChartArray[i+1]);
          resultX.push(dataChartArray[i+2]);
        }

        chart('column', item.id, resultY, resultX);
      })

      $(document).bind('deck.change', function(event, from, to) {
         var $current = $('.deck-current,deck-child-current');
         if($current.length == 0) return;


      });

    })


    var socket = io.connect('http://'+ window.location.host);
    socket.on('vote', function (result) { // TIP: you can avoid listening on `connect` and listen on events directly too!
        for( var id in result)
        	$("#voteCount-" + id).html( result[ id]);
    });




});