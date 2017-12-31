

$(document).ready(function(){
		//Prompt for user name of chatter wanting to join chat room
	var currentUser = prompt("Enter your name: ")||"User";

	var socket = io();
	socket.currentUser = currentUser;
	socket.on('connect', function(){
		socket.emit("intro", socket.currentUser);
	});

	$('#messageEnteredInKeyboard').keypress(function(ev){
		if(ev.which===13){
			socket.emit("message",$(this).val());
			ev.preventDefault();
			$("#messagesInChatBox").append((new Date()).toLocaleTimeString() + ", " + currentUser + ": " + $(this).val() + "\n");
			$(this).val(null);
		}
	});
   //Purpose: Ensure message entered is appended to chat box data
	socket.on("message",function(data){
		$('#messagesInChatBox')[0].scrollTop=$('#messagesInChatBox')[0].scrollHeight;
		$("#messagesInChatBox").append(data + "\n");
	});
	//Purpose: Check for repetetive user name
	socket.on("reload", function(){
		alert('Username "'+currentUser+'" corresponds to an existing user! Please enter another username.');
		window.location.reload(true);
	});
    //Purpose: toggling between chatters and blocked list users and sending private messages
	socket.on("userList", function(data){
		$("#userList").html("");
		for(var i=0; i < data.length; i++){
			var chattersInIndex;
			chattersInIndex = $("<li name='" + data[i] + "' class='chatter'></li>").text(data[i]);
			chattersInIndex.dblclick(function(event) {
				if(!($(this).text() === socket.currentUser)){
					if(!event.shiftKey){
						var userMessage;
						userMessage = prompt("Message To Send: " + $(this).text());
						if(!(userMessage === null)){
							var dataObj = {
								currentUser: $(this).text(),
								message:userMessage
							};
							socket.emit("privateMessage", dataObj);
						}
					}
					else{
						var dataObj = {
							currentUser: $(this).text(),
						};
						socket.emit("blockUser", dataObj);
						$(this).toggleClass("chatter");
						$(this).toggleClass("blacklisted");

					}

				}
			});
			$("#userList").append(chattersInIndex);
		}
	});
	//Purpose: Private message receival
	socket.on("privateMessage", function(data){
		var userMessage = prompt("Message from " + data.currentUser + ": " + data.message);
		if(!(userMessage === null)){
			var dataObj = {
				currentUser: data.currentUser,
				message:  userMessage
			};
			socket.emit("privateMessage", dataObj);
		}
	});


});
