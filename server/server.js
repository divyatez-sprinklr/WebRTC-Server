var port = process.env.PORT || 8080;
var http = require('http');
var io = require('socket.io')(port,{
    cors: {
        origin: "http://127.0.0.1:5501",
    },
    maxHttpBufferSize: 1e8
});


var server = http.createServer(function(req, res){ 
    res.writeHead(200,{ 'Content-Type': 'text/html' }); 
    res.end('<h1>Hello Socket Lover!</h1>');
});

var socket = io.listen(server);

socket.on('connection', function(client){ 
    console.log('Connection to client established');

    client.on('message',function(event){ 
        console.log('Received message from client!',event);
        io.emit('message',event);
        console.log('sent',event);
    });
});

console.log('Server running at http://127.0.0.1:' + port + '/');