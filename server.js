var connect, fs, io;
fs = require('fs');

connect = require('connect');

var mindmap;

var server = connect().use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return next();

})
.use(connect.query())
.use(connect.bodyParser())
.use('/', connect.static(__dirname + '/'))
.use('/upload', function (req, res) {
  // req.body = {id:xxx , name: xxx, data: xxxx}
  mindmap = JSON.parse(req.body.data);

  // Detects vote pages and add voteCount properties and reset them.
  mindmap.cachedVoteOptions = {};
  for( var i = 0; i < mindmap.mindmap.root.children.length; ++i) {
    var secondLevelNode = mindmap.mindmap.root.children[ i];
    if( ":select" === secondLevelNode.text.caption.substring( secondLevelNode.text.caption.length - ":select".length))
    	for( var j = 0; j < secondLevelNode.children.length; ++j) {
    		var thirdLevelNode = secondLevelNode.children[ j];
    		thirdLevelNode.voteCount = 0;
    		mindmap.cachedVoteOptions[ thirdLevelNode.id] = thirdLevelNode;
    	}
  }
  
  res.end();
  return;

  // fs.writeFileSync('maps/' + 'map', req.body.data);
  // return res.end();
})
.use('/slide', function (req, res) {
  if(!mindmap) {
    mindmap = JSON.parse(fs.readFileSync('mm/' + 'data.json'));
  }
  res.end(JSON.stringify(mindmap));    
})
.use('/slide/vote', function (req,res){
  io.sockets.emit('vote', req.body.ids);
  console.log(req.body.ids);
  res.end();
})
.use('/client/vote', function (req,res){
  if(req.method == 'GET')
  {
    res.end(JSON.stringify(mindmap.mindmap.root));  
  }
  else if(req.method == 'POST')
  {
	var result = {};
	for( var i = 0; i < req.body.ids.length; ++i) {
		var id = req.body.ids[ i];
		result[ id] = mindmap.cachedVoteOptions[ id].voteCount++;
	}
    io.sockets.emit('vote', result);

    res.end('你已经提交成功！');
  }
})
.listen(8000);

io = require('socket.io').listen(server);
io.sockets.on('connection', function (socket) {
  socket.emit('ping', { hello: 'world' });
  socket.on('pong', function (data) {
    console.log(data);
  });
});