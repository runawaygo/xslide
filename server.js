var DATA_FILE = "mm/data.json";
var DATA_DEMO_FILE = "mm/data.json.backup";

var mindmapProvider = {
  _instance: null,
  _cachedVotes: null,
  _cachedVoteOptions: null,
  _currentPage: null,

  _cache: function() {
    this._cachedVotes = {};
    this._cachedVoteOptions = {};
    for( var i = 0; i < this._instance.mindmap.root.children.length; ++i) {
      var secondLevelNode = this._instance.mindmap.root.children[ i];
      if(
        ":select" === secondLevelNode.text.caption.substring( secondLevelNode.text.caption.length - ":select".length)
        || ":radio" === secondLevelNode.text.caption.substring( secondLevelNode.text.caption.length - ":radio".length)
      ) {
   	    this._cachedVotes[ secondLevelNode.id] = secondLevelNode;
        for( var j = 0; j < secondLevelNode.children.length; ++j) {
          var thirdLevelNode = secondLevelNode.children[ j];
          thirdLevelNode.voteCount = 0;
          this._cachedVoteOptions[ thirdLevelNode.id] = thirdLevelNode;
        }
      }
    }
  },

  get: function() {
    if( !this._instance) {
    	this._instance = this.getFile(DATA_FILE);
    	this._cache();
    }
    return this._instance;
  },

  getFile: function(filename) {
    filename = filename || DATA_FILE;
    return JSON.parse(fs.readFileSync(filename));
  },

  set: function(mindmap) {
    this._instance = mindmap;
    this._cache();
    
    fs.writeFileSync(DATA_FILE, JSON.stringify(mindmap));
  },

  getVote: function(id) {
    return id?this._cachedVotes[ id]:null;
  },

  getOption: function(id) {
    return this._cachedVoteOptions[ id];
  },

  getCurrentPage: function() {
    return this._currentPage;
  },

  setCurrentPage: function(pageId) {
    this._currentPage = pageId;
  },

  Void: null
}

var tucaoList = ["ORZ","爱你一万年","杭州人民爱晚风","今天我们十八大","11.11单身快乐","创新，创造，创意","冬天来了，春天还会远吗","黑夜给了我黑色的眼睛，我却用它寻找光明"];

var fs = require('fs');
var connect = require('connect');

var io;
var mindmap;


var bodyParser = require('body-parser');
var serveStatic = require('serve-static')

var server = connect()

.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return next();
})
.use(bodyParser.urlencoded({extended: false}))
.use('/', serveStatic(__dirname + '/', {'index': ['index.html', 'index.htm']}))


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
  console.log(req.method);
  if(req.method == 'GET') { // Obtaining options. From the audience
    var votePage = mindmapProvider.getVote(mindmapProvider.getCurrentPage());
    if( votePage) { // Current page is a vote page, setup the vote for the audience
      res.end(JSON.stringify(votePage));
    } else { // Current page is not a vote page, turn off the vote page
      res.end(JSON.stringify({notVote:true}));
    }
    return;
  } else if(req.method == 'POST') { // Submitting the vote. From the audience
    var ids = req.body.ids;
    if(typeof ids == 'string') ids = [ids]; // The user checked only one option
    var parentNode = mindmapProvider.getVote(mindmapProvider.getOption(ids[0]).parentId);
    for( var i = 0; i < ids.length; ++i) {
      console.log(ids[i])
      console.log(mindmapProvider.getOption(ids[i]).text)
      ++mindmapProvider.getOption(ids[i]).voteCount;
  	}
    console.log(parentNode);
    io.sockets.emit('vote', parentNode);
    res.end('你已经提交成功！');
  }
})

/**
 * TU CAO TU CAO TU CAO AO AO AO ~
 */
.use('/client/tucao', function(req, res) {
  var tucao = req.body.tucao;
  if( tucao) {
    tucaoList.push(tucao);
    io.sockets.emit('tucao', tucao);
  }
  res.end();
})

/**
 * Gets TU CAO's in batch
 */
.use('/tucaoMessages', function(req, res) {
  res.end( JSON.stringify(tucaoList));
})

.listen(8080);

io = require('socket.io').listen(server);

io.sockets.on('connection', function(socket) {
  socket.on('page', function(data) {
    console.log("The main screen has turned to page: " + data.current);
    var pageId = data.current;
    mindmapProvider.setCurrentPage( pageId);
  });
});
