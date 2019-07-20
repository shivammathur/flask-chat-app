//When time is a single digit pad 0s to the left
String.prototype.lpad = function(padString, length) {
    var str = this;
    while (str.length < length)
        str = padString + str;
    return str;
}

// Connect to websocket
let socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);


let current_channel = '';		//initialize the current_channel to empty
let current_view = 'name';		//initialize the current_view to 'name'

// function to replace space with underscore.
let handleSpaces = (str) => {
	return str.split(' ').join('_');
}

//add event listener to set the 'channel' parameter in the html docoument. Store channel in local storage.
//addChannelClick is the add a new channel event after clicking the Add button on the 'channelForm' form.
let addChannelClick = (channel) => {
	channel.addEventListener('click', () => {
		document.querySelector('.heading').innerHTML = channel.innerHTML				//Assign channel to heading class in Document
		current_channel = channel.innerHTML
		document.querySelectorAll('.channel').forEach( (ch) => {
			ch.classList.add('d-none');
			document.querySelector('.messages .'+handleSpaces(ch.innerHTML)).classList.add('d-none');  //Do not display chatrooms
		});
		document.querySelector('.messages .'+handleSpaces(channel.innerHTML)).classList.remove('d-none');	//Show the chat messages
		document.querySelector('.channelFormRow').classList.add('d-none');					//Do not show channelFormRow
		document.querySelector('.messageFormRow').classList.remove('d-none');				//Show messageFormRow
		document.querySelector('.messages').classList.remove('d-none');						//show the chat messages
		document.querySelector('.'+handleSpaces(channel.innerHTML)).classList.remove('d-none');			//show all child channels	
		current_view = 'chat'																//assign current_view = 'chat'
		localStorage.setItem("channel", channel.innerHTML)								//set the channel name to channel
	});
}
//switchToChannels creates the Channels View in HTML. The 'd-none' utility in bootstrap creates a nice user experience 
let switchToChannels = func => {
	document.querySelector('.nameHeading').innerHTML = 'Hi '+ localStorage.getItem("name"); //nameHeading class changes
	document.querySelector('.heading').innerHTML = 'Select channel';		//heading class changes to 'Select channel
	document.querySelector('#nameForm').classList.add('d-none');			//id=nameForm view is set to not visible
	document.querySelector('.chatrooms').classList.remove('d-none');		//chatrooms class is set to visible
	document.querySelector('.channelFormRow').classList.remove('d-none');	//channelFormRow is set to visible
	current_view = 'channels'
}

let switchToChat = func => {
	let ch = document.querySelector('.channel[data-channel="' + localStorage.getItem("channel") + '"]')
	if(ch != null){
		ch.click();
		current_view = 'chat';
	} else {
		localStorage.setItem("channel", '');
	}
}

//this is executed when the the close button is clicked. Delete message emits and broadcasts over the server.
let handleClose = (cl) => {    
	//get message attributes from the close button (cl)
	let data = {'message': cl.getAttribute('data-message'),
			'author': cl.getAttribute('data-author'),
			'channel': cl.getAttribute('data-channel'),
			'timestamp': cl.getAttribute('data-timestamp')
	   	};
		
	//emit delete event with the message data
    socket.emit('delete message', data);
}

document.addEventListener('DOMContentLoaded', () => {
	socket.on('connect', () => {
		if(localStorage.getItem("name") !== null && localStorage.getItem("name") !== "") {
			switchToChannels();
		}

		document.querySelectorAll('.channel').forEach( (channel) =>  {
			addChannelClick(channel);
		});

		if(localStorage.getItem("channel") !== null && localStorage.getItem("channel") !== ""){
			switchToChat();
		}	
	//The class back refers to the event when the user clicks the back arrow key. 
	//This changes the view back to the channelFormRow and removes the messages and the messageFormRow
		document.querySelector('.back').addEventListener('click', () => {
			document.querySelector('.heading').innerHTML = 'Select channel';
			document.querySelector('.channelFormRow').classList.remove('d-none');
			document.querySelector('.chatrooms').classList.remove('d-none');
			document.querySelector('.messages').classList.add('d-none');
			document.querySelector('.messageFormRow').classList.add('d-none');
			document.querySelectorAll('.channel').forEach( (channel) => {
				document.querySelectorAll('.messages>div').forEach( (messages) => {
					if(!messages.classList.contains('d-none')){
						messages.classList.add('d-none');
					}
				})
				if(channel.classList.contains('d-none')){
					channel.classList.remove('d-none');
				}
			})
			current_view = 'channels'
			localStorage.setItem("channel", '')
		})

		document.querySelectorAll('.message').forEach( (message) => {
			if(message.getAttribute('data-author') == localStorage.getItem("name")){
				message.classList.add("self");
				let icon = '<ion-icon onClick="handleClose(this)" data-author="'+message.getAttribute('data-author');
				icon += '" data-message="'+message.getAttribute('data-message');
				icon += '" data-channel="'+message.getAttribute('data-channel');
				icon += '" data-timestamp="'+message.getAttribute('data-timestamp');
				icon += '" name="close-circle" class="close"></ion-icon>';
				message.innerHTML += icon;
			}
		});		
		//set the name input into the id-nameForm to localStorage.
		document.querySelector('#nameForm').addEventListener('submit', (event) => {
			event.preventDefault();			//Prevent a submit button from submitting a form.
			localStorage.setItem("name", document.querySelector('#inputName').value);
			document.querySelector('#inputName').value = '';	//reset value in form to null
			switchToChannels();		//switch to the channel view
		});	
		//emit the channel_name from the HTML document to the Server by 'add channel'
		document.querySelector('#channelForm').addEventListener('submit', (event) => {
			event.preventDefault();			//Prevent a submit button from submitting a form.
			const channel_name = document.querySelector("#channelName").value;  //channel_name= id-channelName 
			document.querySelector("#channelName").value = '';		//reset value in form to null
			socket.emit('add channel', {'channel_name': channel_name});	//broadcast channel name to all clients
		});	
		//emit the message from the HTML document to the Server by 'new message' - date and time are formatted
		document.querySelector('#messageForm').addEventListener('submit', (event) => {
			event.preventDefault();
			const message = document.querySelector("#message").value;
			document.querySelector("#message").value = '';
			let date = new Date;
			let minutes = date.getMinutes().toString().lpad("0", 2);
			let hours = (date.getHours() % 12).toString().lpad("0", 2);			
			let data = {'message': message,
						'author': localStorage.getItem("name"),
						'channel': current_channel,
						'timestamp': hours+':'+minutes
				   	};
			socket.emit('new message', data);
		});				
	});	
	
	//handle error event
	socket.on('error', error => {
		alert(error);
	});	
	
	//adds a new channel to the UI on announce channel event
	socket.on('announce channel', channel_name => {
		//create div for channel
	    let div = document.createElement('div')
		div.setAttribute("data-channel", channel_name)
	  	div.classList.add("alert", "alert-primary", "text-center", "channel")

	  	//if a channel is open, hide the new channel
		if(current_view == 'chat') {
	  		div.classList.add('d-none');
	  	}
	  	div.innerHTML = channel_name;
	    document.querySelector('.chatrooms').append(div);
	   	
		//add click event to the channel
		addChannelClick(div);

	    //add a div to store message for the channel
		let div_messages = document.createElement('div')
	    div_messages.classList.add("d-none", handleSpaces(channel_name))
	    document.querySelector('.messages').append(div_messages);
	});	

	//adds a new message to the UI on load message event
	socket.on('load message', message => {
		//create message for the channel
	    let div = document.createElement('div')
		
		//Set attributes to identify the message
	    div.setAttribute('data-author', message.author)
	    div.setAttribute('data-message', message.message)
	    div.setAttribute('data-channel', message.channel)
	    div.setAttribute('data-timestamp', message.timestamp)
		
		//add classes to the div
	  	div.classList.add("alert", "alert-primary", "message")
	  	div.innerHTML = message.message + ' <span class="author">' + message.author + '</span>';
	  	div.innerHTML += '<span class="timestamp">' + message.timestamp + '</span>';
	  	
		//if current user created the message, then add a delete button
		if(message.author == localStorage.getItem('name')) {
	  		div.classList.add("self");
			let icon = '<ion-icon data-timestamp="'+message.timestamp+'"';
			icon += 'data-author="'+message.author+'"';
			icon += 'data-message="'+message.message+'"';
			icon += 'data-channel="'+message.channel+'" name="close-circle" class="close"></ion-icon>';
			div.innerHTML += icon;
	  	}

	  	//add the message div
	    document.querySelector('.messages .'+ handleSpaces(message.channel)).append(div);	

	    //add event listener to the close button.
	    document.querySelectorAll('.close').forEach( (cl) => {
			cl.addEventListener('click', () => {
				handleClose(cl)
			});
	    });
	});

	socket.on('refresh messages', message => {
		let selector = '.message[data-timestamp="'+message.timestamp+'"]'
		selector += '[data-message="'+message.message+'"]'
		selector += '[data-author="'+message.author+'"]'
		selector += '[data-channel="'+message.channel+'"]'
		document.querySelector(selector).remove();
	});
});