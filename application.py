import os
from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit

app = Flask(__name__)
socketio = SocketIO(app)

# list of all channels
messages = {
    'general' : []
}

#route for index page
@app.route("/")
def index():
    return render_template("index.html", messages = messages)

# handle add new channel event
@socketio.on("add new channel")
def add_channel(channel_name):
    # channel already exists
    if channel_name['channel_name'] in messages:
        socketio.emit("error", "Channel name already exists")
    
    # add the channel key to the messages dictionary.
    else:
        messages[channel_name['channel_name']] = []
        emit("add channel to ui", channel_name['channel_name'], broadcast=True)   

# handle add new message event
@socketio.on("add new message")
def message(data):
    # if channel does not exist
    if data['channel'] not in messages:
        socketio.emit("error", "Channel name does not exist")

    # add the message otherwise        
    else:
        # if number of messages is less than 100 
        if len(messages[data['channel']]) <= 100:
            message = {"username": data['username'],
                "channel": data['channel'],
                "message": data['message'],
                "timestamp": data['timestamp'],
                "hash": data['hash']
                }
            messages[data['channel']].append(message)
            emit("add message to ui", data, broadcast=True) 

        # if limit of 100 messages reached            
        else:
            socketio.emit("error", "Only 100 messages can be sent in a channel.")

# handle delete message event
@socketio.on("delete this message")
def message(data):
    # if channel does not exist
    if data['channel'] not in messages:
        socketio.emit("error", "Channel name does not exist")

    #otherwise, delete the message from the channel
    else:

        #search for the message
        for el in messages[data['channel']]:  
            #if found, remove it.                     
            if el['hash'] == data['hash']:
                messages[data['channel']].remove(el)
                emit("remove message from ui", data, broadcast=True)
                break;                   

# run the app
if __name__ == "__main__":
    socketio.run(app)
