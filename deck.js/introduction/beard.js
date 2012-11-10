  // var socket = io.connect('http://localhost:8000');
  // socket.on('ping', function (data) {
  //   console.log(data);
  //   socket.emit('pong', { my: 'data' });
  // });

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
        showQR(item,'http://' + window.location.host+ '/client/app.html?key=' + item.id, 512, 512);
        })
    })



    socket.on('vote', function (result) { // TIP: you can avoid listening on `connect` and listen on events directly too!
        for( var id in result)
        	$("#voteCount-" + id).html( result[ id]);
    });
});