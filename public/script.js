const socket=io('/')//because server is at root path so socket also connects to root path
const videoGrid=document.getElementById('video-grid');
var peer=new Peer(undefined,{
    path: '/peerjs',
    host:'/',
    port:'3000'
})//now userID is also unique for every user in the room

const myVideo=document.createElement('video')
myVideo.muted=true//we dont want to listen to our own video
let myVideoStream

navigator.mediaDevices.getUserMedia({
    video:true,
    audio:true
}).then(stream=>{
        //stream is the video audio media and we'll tell myVideo to use it
        myVideoStream=stream
        addVideoStream(myVideo,stream)
        
    //allowing ourselves to be connected to other users
        socket.on('user-connected',userID=>{
            connectToNewUser(userID,stream) 
        })
        let text=$('input')
        $('html').keydown((e)=>{
            if(e.which==13 && text.val().length!==0){
                socket.emit('message',text.val(),USERID)
                text.val('')
            }
        })

        socket.on('createMessage',(message,joke)=>{
                $('ul').append(`<li class="message"><b>${joke}</b><br/>${message}</li>`)
                scrollToBottom()
        })
    })

const us=prompt('Enter your display name:')
let USERID
peer.on('open',id=>{
    USERID=id
    socket.emit('join-room',ROOMID,id,us)
})//as soon as we connect to our peer server and get back an id, we want to run this callback function

peer.on('call',call=>{ 
    const video=document.createElement('video')
    call.on('stream',userVideoStream=>{
        addVideoStream(video,userVideoStream)
    })
    call.emit('stream',myVideoStream)
    call.answer(myVideoStream) 
})

socket.on('user-disconnected',(disconnectedUserID)=>{
    const videoElement = document.getElementById(`${disconnectedUserID}`);
    videoElement.remove();
  
})

function connectToNewUser(userID,stream){
    const call=peer.call(userID,stream)//call a person with the passed userID and send them our video and audio stream
    const video=document.createElement('video')
    call.on('stream',userVideoStream=>{
        addVideoStream(video,userVideoStream)
    })//when they send us back their video stream, callback function uses their video stream
    call.on('close',()=>{
        video.remove()
    })
}

function addVideoStream(video,stream){
    video.srcObject=stream//play our video
    video.addEventListener('loadedmetadata',()=>video.play())//once it loads that stream and the video is loaded on our page, we want to play it
    videoGrid.append(video)
}

function scrollToBottom(){
    let t=$('.chat-window')
    t.scrollTop(t.prop("scrollHeight"))
}

function muteUnmute(){
    const enabled=myVideoStream.getAudioTracks()[0].enabled
    if(enabled){
        myVideoStream.getAudioTracks()[0].enabled=false
        setUnmuteButton()
    }else{
        setMuteButton()
        myVideoStream.getAudioTracks()[0].enabled=true
    }
}

//leave meeting
document.getElementById('leaveMeet').addEventListener('click',()=>{
    fetch('/home')
    .then(response=>{
        return response.text()
    }).then(data=>{
        window.location.href='/home'
    }).catch(err=>console.log(err))
})

document.querySelector('.invite').addEventListener('click',()=>{
    prompt('Copy and send the following Room ID to the people you would like to meet with: ',ROOMID)
})

document.querySelector('.participants').addEventListener('click',()=>{
    socket.emit('list')
    socket.on('lists',(entries)=>{
        let receivedMap = new Map(entries)
        const uniqueValues = new Set()
        receivedMap.forEach((value)=>{
            uniqueValues.add(value)
        })
        const uniqueValuesArray = Array.from(uniqueValues);
        const uniqueValuesString = uniqueValuesArray.join(", ")
        prompt('List of participants: ',uniqueValuesString)
    })
})

function setUnmuteButton(){
    const html=`
    <i class="unmute fa-solid fa-microphone-slash"></i>
    <span>Mute</span>
    `
    document.querySelector('.mute').innerHTML=html;
}

function setMuteButton(){
    const html=`
    <i class="fa-solid fa-microphone"></i>
    <span>Mute</span>
    `
    document.querySelector('.mute').innerHTML=html;
}

function stopPlay(){
    let enabled=myVideoStream.getVideoTracks()[0].enabled
    if(enabled){
        myVideoStream.getVideoTracks()[0].enabled=false
        setPlayVideo()
    }else{
        setStopVideo()
        myVideoStream.getVideoTracks()[0].enabled=true
    }
}

function setStopVideo(){
    const html=`
    <i class="fa-solid fa-video"></i>
    <span>Stop Video</span>
    `
    document.querySelector('.vid').innerHTML=html
}

function setPlayVideo(){
    const html=`
    <i class="stop fa-solid fa-video-slash"></i>
    <span>Play Video</span>
    `
    document.querySelector('.vid').innerHTML=html
}


