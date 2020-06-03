var http = require('http').createServer(handler); //require http server, and create server with function handler()
var fs = require('fs'); //require filesystem module
var io = require('socket.io')(http) //require socket.io module and pass the http object (server)
var Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
const piGpio = require('pigpio').Gpio; //include pigpio to interact with servo
var forward = new Gpio(23, 'out'); //use GPIO pin 23 as output (Motor -> forward)
var back = new Gpio(24, 'out'); //use GPIO pin 24 as output (Motor -> backward)
const direction = new piGpio(4, {mode: Gpio.OUTPUT});
http.listen(8080); //listen to port 8080

function handler (req, res) { //create server
  fs.readFile(__dirname + '/public/index.html', function(err, data) { //read file index.html in public folder
    if (err) {
      res.writeHead(404, {'Content-Type': 'text/html'}); //display 404 on error
      return res.end("404 Not Found");
    }
    res.writeHead(200, {'Content-Type': 'text/html'}); //write HTML
    res.write(data); //write data from index.html
    return res.end();
  });
}

io.sockets.on('connection', function (socket) {// WebSocket Connection
  let forwardValue = 1; // variable for forwardValue
  let backValue = 1; // variable for backValue
  socket.on('left', function(data) { //change direction
    if(data){
      direction.servoWrite(2000);//one direction
    }else{
      direction.servoWrite(1500);//back to center position
    }

  });
  socket.on('right', function(data) { //change direction
    if(data){
      direction.servoWrite(1000);//the other direction
    }else{
      direction.servoWrite(1500);//back to center position
    }
  });
  socket.on('forward', function(data) { //get status from client
    forwardValue = data;
    if (forwardValue != forward.readSync()) { //on status has changed
      forward.writeSync(forwardValue); //turn Motor forward
    }
  });
  socket.on('back', function(data) { //get status from client
    backValue = data;
    if (backValue != back.readSync()) { //on status has changed
      back.writeSync(backValue); //turn Motor backward
    }
  });
});


process.on('SIGINT', function () { //on ctrl+c
  forward.writeSync(0); // Turn Motor off
  back.writeSync(0); // Turn Motor off
  forward.unexport(); // Unexport Motor GPIO to free resources
  back.unexport(); // Unexport Motor GPIO to free resources
  process.exit(); //exit completely
});
