var connect, fs, io;
fs = require('fs');

connect = require('connect');

var mindmap = {};

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
  res.end();
  return;

  // fs.writeFileSync('maps/' + 'map', req.body.data);
  // return res.end();
})
.use('/slide', function (req, res) {
  res.end(JSON.stringify(mindmap));
  return;

    // var data;
    // data = fs.readFileSync('maps/' + 'map');
    // return res.end(data);
})
.use('/slide/vote', function (req,res){
  io.sockets.emit('vote', req.body.ids);
  res.end();
  return;
})
.listen(8000);

// io = require('socket.io').listen(server);
// io.sockets.on('connection', function (socket) {
//   socket.emit('ping', { hello: 'world' });
//   socket.on('pong', function (data) {
//     console.log(data);
//   });
// });