// Place your server entry point code here

const express = require('express')
const app = express()
const morgan = require('morgan')
const fs = require('fs')
const logdb = require('./src/services/database')



const args = require('minimist')(process.argv.slice(2))

args["port", "help", "debug", "log"]

const port = args.port || process.env.PORT || 5555

const server = app.listen(port, () => {
  console.log('App listening on port %PORT%'.replace('%PORT%',port))
});

const help = (`
server.js [options]

--port	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.

--debug	If set to true, creates endpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.

--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.

--help	Return this message and exit.
`)

if (args.help || args.h) {
  console.log(help)
  process.exit(0)
}


app.use(express.json());

if (args.log == 'false') {
  console.log("NOTICE: not creating file access.log")
} else {
    
        const logdir = './log/';
    
        if (!fs.existsSync(logdir)){
            fs.mkdirSync(logdir);
        }
    
        const accessLog = fs.createWriteStream( logdir+'access.log', { flags: 'a' })
    
        app.use(morgan('combined', { stream: accessLog }))
    }

app.use((req, res, next) => {
  let logdata = {
      remoteaddr: req.ip,
      remoteuser: req.user,
      time: Date.now(),
      method: req.method,
      url: req.url,
      protocol: req.protocol,
      httpversion: req.httpVersion,
      status: res.statusCode,
      referrer: req.headers['referer'],
      useragent: req.headers['user-agent']
  };
  const stmt = logdb.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referrer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referrer, logdata.useragent)
  next();
})

if (args.debug || args.d) {
  app.get('/app/log/access/', (req, res, next) => {
      const stmt = logdb.prepare("SELECT * FROM accesslog").all();
    res.status(200).json(stmt);
  })
  app.get('/app/error/', (req, res, next) => {
    throw new Error('Error test works.')
})

}
app.get('/app', (req, res) => {
    res.status(200).send('200 OK')
    // res.type("text/plain")
})


app.get('/app/flip', (req, res) => {
    res.status(200).json({ 'flip' : coinFlip()})
})


 app.get('/app/flips/:number', (req, res) => {
     var flips = coinFlips(req.params.number)
    res.status(200).json({ 'raw' : flips, 'summary' : countFlips(flips) })
 })

 app.get('/app/flip/call/:guess', (req, res) => {
     res.status(200).json(flipACoin(req.params.guess))
 })



 // app.use(function(req, res) {
    //res.status(404).send("404 NOT FOUND")
    // res.type("text/plain")
// })


function coinFlip() {
    var num = Math.random();
    if (num > .5) {
      return "heads";
    } else {
      return "tails";
    }
  }

  function coinFlips(flips) {
    let arr = [];
    for (let i = 0; i<flips; i++) {
      var num = Math.random();
      if (num > .5) {
        arr[i]="heads";
      } else {
        arr[i]="tails";
      }
    }
    return arr;
  }

  function countFlips(array) {
  
    var numHeads = 0;
    var numTails = 0;
    for (let j = 0; j < array.length; j++) {
        if(array[j]=="heads"){
            numHeads++;
        } else if(array[j]=="tails"){
            numTails++;
        }
    }
    var obj = {tails: numTails, heads: numHeads}
    return obj;
  }

  function flipACoin(call) {
    let result = coinFlip();  
    if(call=="heads" && result=="heads") {
      return {call: call, flip: result, result: "win"}
    } else if(call=="tails" && result=="heads") {
      return {call: call, flip: result, result: "lose"}
    } else if (call=="heads"&&result=="tails") {
      return {call: call, flip: result, result: "lose"}
    } else if (call=="tails" && result=="tails") {
      return {call: call, flip: result, result: "win"}
    } else{
      return "Error: no input. \nUsage: node guess-flip --call=[heads|tails]"
    }
  }
