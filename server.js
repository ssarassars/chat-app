//Saranya R (100981198)
//Purpose: Assignment on chat application
var http = require('http').createServer(handler);
var io = require('socket.io')(http);
var fs = require('fs');
var url = require('url');
var mime = require('mime-types');
var ROOT = "./util";
http.listen(2406);

console.log("Chat server listening on port 2406");
//Purpose: Send request and response on io socket
//In/Out: req, res
function handler(req,res){
	//process the request
	console.log("Request method "+req.method+" for: "+req.url);
	var filename = ROOT+req.url;
	var myUrl = url.parse(req.url, true);
	var pathname = myUrl.pathname;
	var data = "";
	var code;
	if(pathname === "/"){
		filename = ROOT+"/index.html";
		code = 200;
		data = getFileContents(filename);
		res.writeHead(code, {'content-type': mime.lookup(filename)||'text/html'});
		res.end(data);
	}
	else if(fs.existsSync(filename)){
		code = 200;
		data = getFileContents(filename);
		res.writeHead(code, {'content-type': mime.lookup(filename)||'text/html'});
		res.end(data);
	}
	else{
		filename = ROOT+"/404.html";
		code = 404;
		data = getFileContents(filename);
		res.writeHead(code, {'content-type': mime.lookup(filename)||'text/html'});
		res.end(data);
	}	
};
//Purpose: Declare three sets of chatters and blocked list of users and private chat users
var chattersWhoHaveBeenBlocked = [], chatAppUsers = [];
var privateAppChatters;

io.on("connection", function(socket){
	var newChatter = true;   //set boolean value to check user status
	//Loop through list to get user data
	socket.on("intro",function(data){
		socket.currentUser = data;
		chattersWhoHaveBeenBlocked[socket.currentUser] = [];
		for(var i = 0; i < chatAppUsers.length; i++){
			if(chatAppUsers[i].currentUser === data){
				newChatter = false;
			}
		}
		if(!newChatter){    //if chat user is alreadt present, request for new chat user info
			socket.emit("User already exists. Reload.");
			socket.emit("message","Welcome, "+socket.currentUser+".");
			socket.broadcast.emit("message", (new Date()).toLocaleTimeString()+": "+socket.currentUser+" has entered the chatroom.");
			chatAppUsers.push(socket);
			io.emit("userList", getUserList());
		}
		else{     //else welcome the user and add user to socket
			socket.emit("message","Welcome, "+socket.currentUser+".");
			socket.broadcast.emit("message", (new Date()).toLocaleTimeString()+": "+socket.currentUser+" has entered the chatroom.");
			chatAppUsers.push(socket);
			io.emit("userList", getUserList());
		}
	});
	socket.on("disconnect", function(){
		if(newChatter){   //if user leaves the chat room
			var indexOfAppUser = chatAppUsers.indexOf(socket);
			chatAppUsers.splice(indexOfAppUser, 1);
			io.emit("message", (new Date()).toLocaleTimeString()+": "+socket.currentUser+" disconnected.");
			io.emit("userList", getUserList());
		}
	});
	socket.on("message", function(data){ 
		socket.broadcast.emit("message",(new Date()).toLocaleTimeString()+", "+socket.currentUser+": "+data);
		
	});
		socket.on("blockUser", function(data){  //blocked user pushed to blocked user list
		if(!chattersWhoHaveBeenBlocked[socket.currentUser].includes(data.currentUser)){
			chattersWhoHaveBeenBlocked[socket.currentUser].push(data.currentUser);
			socket.emit("message","User '"+data.currentUser+"' is blocked.");	//notified in app room user has been blocked
		}
		else{
			var indexOfUser = chattersWhoHaveBeenBlocked[socket.currentUser].indexOf(data.currentUser);
			chattersWhoHaveBeenBlocked[socket.currentUser].splice(indexOfUser, 1);
			socket.emit("message","User '"+data.currentUser+"' is unblocked.");
		}
	});
	socket.on("privateMessage", function(data){    //private message users are added to private message list
		if(!(chattersWhoHaveBeenBlocked[data.currentUser].includes(socket.currentUser))){
			var obj = {
				currentUser:socket.currentUser,
				message:data.message
			};
			for(var i = 0; i < chatAppUsers.length; i++){
				if(chatAppUsers[i].currentUser === data.currentUser){
					privateAppChatters = chatAppUsers[i];
				}
			}
			privateAppChatters.emit("privateMessage", obj);
		}		
	});
});

//Purpose: get all the users intp the list
function getUserList(){
    var userListforGet = [];
    for(var i=0;i<chatAppUsers.length;i++){
        userListforGet.push(chatAppUsers[i].currentUser);
    }
    return userListforGet;
}
//Purpose: Get all the file contents by readFileSync
function getFileContents(filename){
	
	var contents;
	contents = fs.readFileSync(filename);
	return contents;
}