var DATA_FILE = "mm/data.json";
var DATA_DEMO_FILE = "mm/data.json.backup";

var mindmapProvider = {
  _instance: null,

  get: function() {
    if( !this._instance) this._instance = this.getFile(DATA_FILE);
    return this._instance;
  },

  getFile: function(filename) {
    filename = filename || DATA_FILE;
    return JSON.parse(fs.readFileSync(filename));
  },

  set: function(mindmap) {
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

    fs.writeFileSync(DATA_FILE, JSON.stringify(mindmap));

    this._instance = mindmap;
  },

  getOption: function(id) {
    return this._instance.cachedVoteOptions[ id];
  },

  Void: null
}

var fs = require('fs');
var connect = require('connect');

var io;
var mindmap;

var server = connect()

.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return next();
})

.use(connect.query())

.use(connect.bodyParser())

.use('/', connect.static(__dirname + '/'))

/**
 * Handles the short URL for voting: Redirects to the original URL, with appropriate parameters
 */
.use('/c', function(req,res){
  res.statusCode = 307;
  res.setHeader('Location', '/client/app.html');
  res.end();
})

/**
 * When the presenter clicks on the Save button
 */
.use('/upload', function (req, res) {
  // req.body = {id:xxx , name: xxx, data: xxxx}
  mindmapProvider.set( JSON.parse(req.body.data));
  return res.end();
})

/**
 * Loaded by the 'Slide' page
 */
.use('/slide', function (req, res) {
  res.end(JSON.stringify(mindmapProvider.get()));
})

/**
 * Loaded demo map
 */
.use('/demo', function(req,res){
  res.end(JSON.stringify(mindmapProvider.getFile(DATA_DEMO_FILE)));
})

/**
 * Both for obtaining vote options and for actual voting
 */
.use('/client/vote', function (req,res){
  if(req.method == 'GET') { // Obtaining options. From the audience
    var rootNode = mindmapProvider.get().mindmap.root;
    for( var i = 0; i < rootNode.children.length; ++i) {
      var secondLevelNode = rootNode.children[ i];
      if(secondLevelNode.id === req.query.id) {
        res.end(JSON.stringify(secondLevelNode));
        return;
      }
    }    
  } else if(req.method == 'POST') { // Submitting the vote. From the audience
  	var result = {};
    var ids = req.body.ids;
    if(typeof ids == 'string') ids = [ids]; // The user checked only one option
    for( var i = 0; i < ids.length; ++i) {
  	  var id = ids[ i] + '';
      result[ id] = ++mindmapProvider.getOption(id).voteCount;
  	}
    io.sockets.emit('vote', result);
    res.end('你已经提交成功！');
  }
})

.listen(8000);

io = require('socket.io').listen(server);
