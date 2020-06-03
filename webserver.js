var http = require('http').createServer(handler); //require http server, and create server with function handler()
var fs = require('fs'); //require filesystem module
var io = require('socket.io')(http) //require socket.io module and pass the http object (server)
var Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
const piGpio = require('pigpio').Gpio;
var forward = new Gpio(23, 'out'); //use GPIO pin 4 as output
var back = new Gpio(24, 'out'); //use GPIO pin 4 as output
//var direction = new Gpio(4, 'out'); //use GPIO pin 4 as output
//var pushButton = new Gpio(17, 'in', 'both'); //use GPIO pin 17 as input, and 'both' button presses, and releases should be handled
const direction = new piGpio(4, {mode: Gpio.OUTPUT});
let pulseWidth = 1000;
let increment = 500;
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
  let forwardValue = 1; //static variable for current status
  let backValue = 1; //static variable for current status
  /*pushButton.watch(function (err, value) { //Watch for hardware interrupts on pushButton
    if (err) { //if an error
      console.error('There was an error', err); //output error message to console
      return;
    }
    lightvalue = value;
    socket.emit('light', lightvalue); //send button status to client
  });*/
  socket.on('left', function(data) { //get light switch status from client
    if(data){
      direction.servoWrite(2000);
    }else{
      direction.servoWrite(1500);
    }

  });
  socket.on('right', function(data) { //get light switch status from client
    if(data){
      direction.servoWrite(1000);
    }else{
      direction.servoWrite(1500);
    }
  });
  socket.on('forward', function(data) { //get light switch status from client
    forwardValue = data;
    if (forwardValue != forward.readSync()) { //only change LED if status has changed
      forward.writeSync(forwardValue); //turn LED on or off
    }
  });
  socket.on('back', function(data) { //get light switch status from client
    backValue = data;
    if (backValue != back.readSync()) { //only change LED if status has changed
      back.writeSync(backValue); //turn LED on or off
    }
  });
});


process.on('SIGINT', function () { //on ctrl+c
  forward.writeSync(0); // Turn LED off
  back.writeSync(0); // Turn LED off
  forward.unexport(); // Unexport LED GPIO to free resources
  back.unexport(); // Unexport LED GPIO to free resources
  //pushButton.unexport(); // Unexport Button GPIO to free resources
  process.exit(); //exit completely
});
