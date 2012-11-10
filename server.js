var connect, fs;

fs = require('fs');

connect = require('connect');

connect().use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return next();
}).use(connect.bodyParser()).use('/', connect["static"](__dirname + '/')).use('/upload', function (req, res) {
    fs.writeFileSync('maps/' + 'map', req.body.data);
    return res.end();
}).use('/get', function (req, res) {
    var data;
    data = fs.readFileSync('maps/' + 'map');
    return res.end(data);
}).use('/getMaps', function (req, res) {
    var files;
    files = fs.readdirSync('maps');
    return res.end(JSON.stringify(files));
}).listen(8000);

console.log('superwolf');