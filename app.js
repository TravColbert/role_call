
/**
 * Module dependencies.
 */

var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io')(server),
    events = require('events'),
    fs = require('fs'),
    routes = require('./routes');
var e = new events.EventEmitter();

var DirList = (function(){
	var fs = require('fs'),
			events = require('events');

	// Constructor
	function DirList(dir,configObj) {
		this.base = dir;
		this.recurse = false;
		this.files = [];
		this.e = new events.EventEmitter();

		if(configObj) {
			if(configObj.hasOwnProperty("dir")) this.base = configObj.dir;
			if(configObj.hasOwnProperty("recurse")) this.recurse = configObj.recurse;
		}

		if(this.base) this.read();
	};

	DirList.prototype.getBase = function() {
		return this.base;
	};

	DirList.prototype.read = function(f) {
		var that = this;
    f = f || that.base;
    console.log("Reading dir: " + f);
		fs.readdir(f,function(err,files) {
      var that = this;
			if(err) {
        console.log("Can't read " + f + ": " + err);
        return;
      }
			files.forEach(function(file) {
        if(file.indexOf('.')===0) {
          console.log(file + " is a hidden file/folder. Skipping");
          return;
        }
				file = f + "/" + file;
        var that = this;
        console.log("Found object: " + file + "...");
				that.doIf(
                  file,
                  function(stats) {
                    //console.log("Checking if file is a FILE...");
                    return stats.isFile();
                  },
                  function(file) {
                    console.log("Adding " + file + " to file list");
                    that.files.push(file);
                  }
        );
        that.doIf(
                  file,
                  function(stats) {
                    //console.log("Checking if file is a DIRECTORY...");
                    return stats.isDirectory();
                  },
                  function(file) {
                    //console.log("Invoking new read on directory " + f);
                    that.read(file);
                  }
        );
			},that);
		}.bind(that));

		return this;
	};

	DirList.prototype.doIf = function(file,test,success) {
    var that = this;
		fs.stat(file,function(err,stats) {
			if(err) {
        console.log("Error: " + err);
        return;
      }
			if(test(stats)) {
        success(file);
      }
		}.bind(that));
	};

	DirList.prototype.getFileList = function() {
		return this.files;
	};

	return DirList;
})();

// The program data
var appPort = 3000;
var appStaticDir = __dirname + '/public';
var appMediaDir = '/media';
var programDir = "./programs";
var programFile = programDir + "/program.json";
//var mediaHome = '/home/vid/role_call/public/media';
//var defaultProgram = {bug:"",title:"",subtitle:"",chairman1:"",chairman2:"",parts:{}};
var program;
var mediaqueue = [];

var medialist = new DirList(appStaticDir + appMediaDir,{recurse:true});

// Configuration
app.locals.title = "Worship Program Control";

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.static(appStaticDir));
// Get the socket.io client
//app.use(express.static(__dirname + '/node_modules'));

// Routes
app.get('/', routes.index);
app.get('/parts', routes.parts);
app.get('/control', routes.control);
//app.get('/test', routes.test);
//app.get('/login', routes.login);
//app.get('/logout', routes.logout);

var programAccessErr = function(err) {
	err = err || "Couldn't read from program file";
	console.log(err);
	console.log("Sending default program: " + JSON.stringify(defaultProgram));
	io.emit('program',JSON.stringify(defaultProgram));
	return;
};

var saveProgram = function(str, cb) {
	console.log("Saving program:\n" + str);
	fs.writeFile(programFile,str,function(err) {
		if(err) throw err;
		console.log("Program file was saved");
		if(cb) cb();
	});
};

var getProgram = function(prg) {
	prg = prg || "program";
	console.log("Got request to get program data " + prg);
	programFile = programDir + "/" + prg + ".json";
	fs.access(programFile,function(err) {
		if(err) {
			programAccessErr("No access or non-existant program file: " + programFile);
			return;
		}
		fs.readFile(programFile,function(err,data){
			if(err) {
				programAccessErr("Failed to read from program file: " + programFile);
				return;
			}
			console.log("Sending program data:\n" + data);
			program = JSON.parse(data);
			io.emit('program',JSON.stringify(program));
		});
	});
}

var isEmpty = function(val) {
	if(!val || val===null || val===undefined || val.length==0) {
		console.log("Found zero-length, null, undefined or non-existent value. We'll consider it empty");
		return true;
	}
	return false;
}

var sanitizeProgram = function(data) {
	console.log("Sanitizing program data");
	// Check for empty parts and delete them
	if(data.hasOwnProperty("parts")) {
		var parts = Object.keys(data["parts"]);
		while(part = parts.shift()) {
			console.log("Sanity-checking part " + part);
			// Check for all-empty parts...
			if(isEmpty(data["parts"][part].name) && isEmpty(data["parts"][part].title)) {
				delete data["parts"][part];
				continue;
			}
			// Trim
			if(!isEmpty(data["parts"][part].name)) data["parts"][part].name = data["parts"][part].name.trim();
			if(!isEmpty(data["parts"][part].title)) data["parts"][part].title = data["parts"][part].title.trim();

			// Fix case-inconsistencies
			//data["parts"][part].name = data["parts"][part].name
			if(!isEmpty(data["parts"][part].title)) data["parts"][part].title = data["parts"][part].title.toUpperCase();
		}
	}
	return data;
}

var mediaGet = function() {
  var list = [];
  var trimBaseDir = function(val) {
    return val.replace(baseDir,'');
  }

  //var baseDir = medialist.getBase();
  var baseDir = appStaticDir;
  /**
   * Remember that Array.concat smooshes two arrays together. So, we start
   * with an empty array (defined above), then add the results of the
   * getFileList() function (below)
   */
  list = list.concat(medialist.getFileList().map(trimBaseDir,this));
  /*
  baseDir = videolist.getBase();
  list = list.concat(videolist.getFileList().map(trimBaseDir,this));
  */
  console.log("Media list:\n" + JSON.stringify(list));
  io.emit('medialist',JSON.stringify(list));
}

var mediaPlay = function(obj) {
	if(mediaqueue.length==0) return;
	if(obj) {
		console.log("mediaPlay: Starting PLAY of: " + obj.media + " (" + obj.index + ")");
		if(!obj.hasOwnProperty("media") && obj.hasOwnProperty("index")) {
			console.log("No media file requested - using the index");
			obj.media = mediaqueue[obj.index];
		}
		if(obj.hasOwnProperty("media") && !obj.hasOwnProperty("index")) {
			console.log("No index requested - using media file");
			obj.index = mediaqueue.indexOf(obj.media);
		}
	} else {
		obj = {media:mediaqueue[0],index:0};
	}
	sendMediaQueue();
	io.emit('mediaplay',obj);
}

var mediaStepForward = function() {
	mediaqueue.push(mediaqueue.shift());
	mediaPlay();
}

var mediaStepBackward = function() {
	mediaqueue.unshift(mediaqueue.pop());
	mediaPlay();
}

var mediaStop = function() {
	io.emit('command',{command:'mediastop'});
}

var sendMediaQueue = function() {
  console.log("==> SEND queuelist");
	io.emit('queuelist',JSON.stringify(mediaqueue));
}

// IO routines
io.on('connection', function(socket) {
	console.log("Connection: " + socket.client.conn.id);

	socket.on('command', function(msg){
		console.log("Got command: " + msg.command + ": " + msg.param);
		io.emit('command',msg);
	});

	socket.on('setprogram', function(data) {
		console.log("Setting new program data:\n" + data);
		program = sanitizeProgram(JSON.parse(data));
		saveProgram(JSON.stringify(program),getProgram);
	});

	socket.on('eraseprogram', function() {
		console.log("Erasing current program");
		saveProgram(JSON.stringify(defaultProgram),getProgram);
	});

	socket.on('getprogram',function(data) {
		console.log("Got getProgram command for program: " + data);
		getProgram(data);
	});

	socket.on('bannercomplete',function(data) {
		console.log("Banner on program has been drawn for part " + data);
		io.emit('bannercomplete',data);
	});

  socket.on('getmedia',mediaGet);

  socket.on('refreshmedia',function() {
    medialist = new DirList(appStaticDir + appMediaDir,{recurse:true});
    mediaGet();
  });

	socket.on('queuelist',function() {
		console.log("Current queued media:\n" + mediaqueue.join(', '));
		sendMediaQueue();
	});

	socket.on('queuemedia',function(file) {
		console.log("Queueing media: " + file);
		mediaqueue.push(file);
		sendMediaQueue();
	});

	socket.on('dequeuemedia',function(index) {
    if(index===null || index==="undefined") {
			console.log("Dequeueing all media");
			mediaqueue = [];
    } else {
			console.log("De-queueing media item number: " + index);
			mediaqueue.splice(index,1);
      //var loc = mediaqueue[index];
			//if(loc>-1) mediaqueue.splice(loc,1);
    }

    /*
		if(!file) {
			console.log("Dequeueing all media");
			mediaqueue = [];
		} else {
			console.log("De-queueing media: " + file);
			var loc = mediaqueue.indexOf(file);
			if(loc>-1) mediaqueue.splice(loc,1);
		}
		*/
		sendMediaQueue();
	});

	socket.on('requestplayer',function() {
		//console.log("Looking for a media player connection...");
		io.emit('requestplayer');
	});

	socket.on('playerconfirmed',function() {
		//console.log("A valid media player is available");
		io.emit('playerconfirmed');
	})

	socket.on('mediaplay',function(obj) {
		//file = JSON.parse(file);
		mediaPlay(obj);
	});

	socket.on('mediastepforward',function() {
		mediaStepForward();
	});

	socket.on('mediastepback', function() {
		mediaStepBackward();
	})

	socket.on('mediaplaying',function(obj) {
    if(obj.hasOwnProperty("media")) var m = obj.media;
    if(obj.hasOwnProperty("index")) var i = obj.index;
		console.log("Playing media: " + m + " (" + i + ")");
		io.emit('mediaplaying',obj);
	});

	socket.on('mediapause',function() {
		console.log("(Un)Pausing media");
		io.emit('mediapause');
	});

	socket.on('mediaprogress',function(timeObj) {
		//console.log("Playing media at: " + time);
		io.emit('mediaprogress',timeObj);
	});

  socket.on('mediastopped', function(obj) {
    console.log("Media: " + obj.param + " STOPPED");
    io.emit('mediastopped',obj);
  });
});

// Start listening
server.listen(appPort, function(){
  console.log("Express server listening on port: " + appPort);
});
