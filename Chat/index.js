const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const Trie = require('./trie')
const fs = require('fs');
const minioClient = require('./minio');
const PORT = 3000;
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);


const bucketName = 'abusemasterfile';
const filePath = path.join(__dirname, 'abusefile.json');
const localFilePath = 'downloaded_abusefile.json';
const objectName='abusefile.json';


let abuseTrie;

minioClient.fPutObject(bucketName, objectName, filePath, function(err, etag) {
  if (err) {
    console.error(err);
  } else {
    console.log('File uploaded successfully. ETag: ' + etag);
    minioClient.fGetObject(bucketName, objectName, localFilePath, function (err) {
      if (err) {
        console.error('Error downloading the file:', err);
      } else {
        fs.readFile(localFilePath, 'utf8', function (fileErr, fileData) {
          if (fileErr) {
            console.error('Error reading the downloaded file:', fileErr);
          } else {
            try {
              const abuseList = JSON.parse(fileData);
              abuseTrie = buildAbuseTrie(abuseList);
            } catch (parseError) {
              console.error('Error parsing file data:', parseError);
            }
          }
          fs.unlink(localFilePath, function(unlinkErr) {
            if (unlinkErr) {
              console.error('Error deleting the downloaded file:', unlinkErr);
            } else {
              console.log('Downloaded file deleted.');
            }
          });
       
         
        });
      }
    });
  }
});


function buildAbuseTrie(abuseList) {
  const trie = new Trie(); 

  for (const abuse of abuseList) {
    trie.insert(abuse);
  }

  return trie; 
}

function censorAbuse(sentence, abuseTrie) {
  const words = sentence.split(' ');
  const censoredWords = [];

  for (const word of words) {
    let currentNode = abuseTrie.root;
    let isAbuse = false;

    for (const char of word) {
      const charLower = char.toLowerCase(); 
      if (currentNode.children.has(charLower)) {
        currentNode = currentNode.children.get(charLower);
        if (currentNode.isEndOfWord) {
          isAbuse = true;
          break;
        }
      } else {
        break;
      }
    }

    if (isAbuse) {
      censoredWords.push('*'.repeat(word.length));
    } else {
      censoredWords.push(word);
    }
  }

  return censoredWords.join(' ');
}




app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});


const users = {};

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('join', (nickname) => {
    socket.nickname = nickname;
    users[socket.id] = nickname;

    io.emit('chat message', `${nickname} has joined the chat`);
    socket.emit('userlist', Object.values(users));
    io.emit('update userlist', Object.values(users));
  });

  socket.on('chat message', (msg) => {

    io.emit('chat message', `${socket.nickname}: ${censorAbuse(msg,abuseTrie)}`);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    delete users[socket.id];
    io.emit('chat message', `${socket.nickname} has left the chat`);
    io.emit('update userlist', Object.values(users));
  });
});

server.listen(PORT, () => {
  console.log(`listening on Port ${PORT}`);
});
