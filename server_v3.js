var vhttp = require("http");
var url  = require('url');

function onRequest(req, res) {
  console.log("Request received.");
  res.writeHead(200, {"Content-Type": "text/plain"});
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  console.log(query); //{Object}
  res.write("Hello World\n"+query.a+"\n"+query.b);
  res.end();
}

vhttp.createServer(onRequest).listen(3000);

console.log("Server has started to listen at port: 3000.");