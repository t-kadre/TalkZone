const socket = io('/')//because server is at root path so socket also connects to root path
const videoGrid = document.getElementById('video-grid');
var peer = new Peer(undefined, {
    path: '/peerjs',
    host: '/',
    port: '9000'
})//now userID is also unique for every user in the room
//peer server running at port 9000

let current;
let local_stream;
const myVideo = document.createElement('video')
myVideo.muted = true//we dont want to listen to our own video
let myVideoStream

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    //stream is the video audio media and we'll tell myVideo to use it
    myVideoStream = stream
    local_stream = stream;
    addVideoStream(myVideo, stream);

    peer.on('call', call => {
        call.answer(stream)
        const video = document.createElement('video')
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream)
            current=call;
        })
    })

    //allowing ourselves to be connected to other users
    socket.on('user-connected', userID => {
        const call = peer.call(userID, stream)//call a person with the passed userID and send them our video and audio stream
        current=call;
        const video = document.createElement('video')
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream)
        })//when they send us back their video stream, callback function uses their video stream
        call.on('close', () => {
            video.remove()
        })
    })

    // MESSAGING FUNCTIONALITY
    let text = $('input')
    $('html').keydown((e) => {
        if (e.which == 13 && text.val().length !== 0) {
            socket.emit('message', text.val(), USERID)
            text.val('')
        }
    })

    socket.on('createMessage', (message, dispName) => {
        $('ul').append(`<li class="message"><b>${dispName}</b><br/>${message}</li>`)
        scrollToBottom()
    })

    socket.on('user-disconnected', (leaveid) => {
        let videoElement=document.querySelector(`#video-grid > video:nth-child(${leaveid})`);
        videoElement.remove();
    })

    // WHITEBOARD FUNCTIONALITY
    const whiteboard = document.querySelector('.whiteboard');
    const whitespace = document.querySelector('.whitespace');
    const whitespace_screen = document.querySelector('.whiteboard-screen');
    const eraser = document.querySelector('.eraser');
    whitespace.width = window.innerWidth - 410;
    whitespace.height = window.innerHeight - 110;
    let context = whitespace.getContext("2d");
    let whiteboardstatus = false;
    whiteboard.addEventListener('click', () => {

        if (whiteboardstatus) {
            whiteboard.style.backgroundColor = "";
            whiteboard.style.color = "#fff";
            
            whitespace_screen.style.display = 'none';
            videoGrid.style.display = 'flex';
            whiteboardstatus = false;
        }
        else {
            socket.emit('start-whiteboard');
            socket.on('start-whiteboard', () => {
                alert('Whiteboard has been shared you can open your whiteboard to contribute');
            })
            whiteboard.style.backgroundColor = "#343434";
            whiteboard.style.borderRadius = "5px";
            whiteboard.style.color = "white";
            whitespace_screen.style.display = 'block';
            videoGrid.style.display = 'none';
            whiteboardstatus = true;

            let current = {
                color: 'black',
                width: 2
            };

            let currentPath = null;

            document.querySelector('.red').addEventListener('click', () => {
                current.width = 2;
                current.color = '#CD1818';
            });

            document.querySelector('.black').addEventListener('click', () => {
                current.width = 2;
                current.color = 'black';
            });

            document.querySelector('.blue').addEventListener('click', () => {
                current.width = 2;
                current.color = '#525FE1';
            });

            document.querySelector('.green').addEventListener('click', () => {
                current.width = 2;
                current.color = '#609966';
            });

            eraser.addEventListener('click', () => {
                current.width = 30;
                current.color = '#F5F5F5';
            });

            let x, y;
            let mouseDown = false;
            let rect = whitespace.getBoundingClientRect();
            let offsetX = rect.left;
            let offsetY = rect.top;
            let scrollX = document.documentElement.scrollLeft;
            let scrollY = document.documentElement.scrollTop;

            whitespace.onmousedown = (e) => {
                x = e.clientX - offsetX + scrollX;
                y = e.clientY - offsetY + scrollY;
                currentPath = {
                    color: current.color,
                    width: current.width,
                    points: [{ x, y }]
                };
                mouseDown = true;
            };

            whitespace.onmouseup = (e) => {
                if (mouseDown && currentPath) {
                    socket.emit('draw', currentPath);
                    currentPath = null;
                }
                mouseDown = false;
            };

            socket.on('ondraw', (path) => {
                drawPath(path);
            });

            whitespace.onmousemove = (e) => {
                if (mouseDown && currentPath) {
                    x = e.clientX - offsetX + scrollX;
                    y = e.clientY - offsetY + scrollY;
                    currentPath.points.push({ x, y });
                    drawPath(currentPath);
                }
            };

            function drawPath(path) {
                context.strokeStyle = path.color;
                context.lineWidth = path.width;
                context.beginPath();
                context.moveTo(path.points[0].x, path.points[0].y);
                for (let i = 1; i < path.points.length; i++) {
                    context.lineTo(path.points[i].x, path.points[i].y);
                }
                context.stroke();
            }
        }
    })
})

const us = prompt('Enter your display name:')
let USERID
peer.on('open', id => {
    USERID = id
    socket.emit('join-room', ROOMID, id, us)
})//as soon as we connect to our peer server and get back an id, we want to run this callback function

// SCREEN SHARE FUNCTIONALITY
let screensharestatus = false;
let screenStream;
const screenPeer = new Peer();
screenPeer.on('open', id => {
    screenID = id;
})

const screenshare = document.querySelector('.screen');

function startScreenShare() {
    if (screensharestatus) {
        return;
    }
    navigator.mediaDevices.getDisplayMedia({

        audio: {
            echoCancellation: true,
            noiseSuppression: true,
        },
        video: {
            cursor: "always"
        },
    }).then((stream) => {
        screenStream = stream;
        let videoTrack = stream.getVideoTracks()[0];
        let sender = current.peerConnection.getSenders().find(s => {
            return s.track.kind == videoTrack.kind;
        })
        sender.replaceTrack(videoTrack);
        screensharestatus = true;
        screenshare.style.opacity = 0.5;
        console.log(screensharestatus);
    }).catch((err) => {
        console.log(err);
    })
}

function stopScreenShare() {
    if (screensharestatus == false) {
        return;
    }
    let videoTrack = local_stream.getVideoTracks()[0];
    let sender = current.peerConnection.getSenders().find(s => {
        return s.track.kind == videoTrack.kind;
    })
    sender.replaceTrack(videoTrack);

    screenStream.getTracks().forEach(track => {
        track.stop();
    })
    screensharestatus = false;
    screenshare.style.opacity = 0;
}

function screenShare() {
    if (screensharestatus) {
        stopScreenShare();
    }
    else {
        startScreenShare();
    }
}

screenshare.addEventListener('click', (e) => {
    e.preventDefault();
    screenShare();
})

function addVideoStream(video, stream) {
    video.srcObject = stream//play our video
    video.addEventListener('loadedmetadata', () => video.play())//once it loads that stream and the video is loaded on our page, we want to play it
    videoGrid.append(video)
}

function scrollToBottom() {
    let t = $('.chat-window')
    t.scrollTop(t.prop("scrollHeight"))
}

function muteUnmute() {
    const enabled = myVideoStream.getAudioTracks()[0].enabled
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false
        setUnmuteButton()
    } else {
        setMuteButton()
        myVideoStream.getAudioTracks()[0].enabled = true
    }
}

//leave meeting
document.getElementById('leaveMeet').addEventListener('click', () => {
    fetch('/home')
        .then(response => {
            return response.text()
        }).then(data => {
            window.location.href = '/home'
        }).catch(err => console.log(err))
})

document.querySelector('.invite').addEventListener('click', () => {
    prompt('Copy and send the following Room ID to the people you would like to meet with: ', ROOMID)
})

//PARTICIPANTS LIST
document.querySelector('.participants').addEventListener('click', () => {
    socket.emit('list')
    socket.on('lists', (entries) => {
        let receivedMap = new Map(entries)
        const uniqueValues = new Set()
        receivedMap.forEach((value) => {
            uniqueValues.add(value)
        })
        const uniqueValuesArray = Array.from(uniqueValues);
        const uniqueValuesString = uniqueValuesArray.join(", ")
        prompt('List of participants: ', uniqueValuesString)
    })
})

function setUnmuteButton() {
    const html = `
    <i class="unmute fa-solid fa-microphone-slash"></i>
    <span>Mute</span>
    `
    document.querySelector('.mute').innerHTML = html;
}

function setMuteButton() {
    const html = `
    <i class="fa-solid fa-microphone"></i>
    <span>Mute</span>
    `
    document.querySelector('.mute').innerHTML = html;
}

function stopPlay() {
    let enabled = myVideoStream.getVideoTracks()[0].enabled
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false
        setPlayVideo()
    } else {
        setStopVideo()
        myVideoStream.getVideoTracks()[0].enabled = true
    }
}

function setStopVideo() {
    const html = `
    <i class="fa-solid fa-video"></i>
    <span>Stop Video</span>
    `
    document.querySelector('.vid').innerHTML = html
}

function setPlayVideo() {
    const html = `
    <i class="stop fa-solid fa-video-slash"></i>
    <span>Play Video</span>
    `
    document.querySelector('.vid').innerHTML=html
}