import MultiStreamsMixer from './node_modules/multistreamsmixer/MultiStreamsMixer.js'






//////////

let connection;
let localMediaStream;
let remoteMediaStream;
let textChannelStream;
let conversation = [];
let exchange=[];

//
let mainContainer = document.getElementById('main-box');
let connectContainer = document.getElementById('connect-box');
let videoContainer = document.getElementById('video-box');

let localVideo = document.getElementById('local');
let remoteVideo = document.getElementById('remote');
let mixedVideo = document.getElementById('mixed');

let localScreenShare = document.getElementById('local-screen-share');
let remoteScreenShare = document.getElementById('remote-screen-share');

let createOfferAnswerButton = document.getElementById('create-offer-answer');
let sendMessegeButton = document.getElementById('send-button');
let sendMessegeTextArea = document.getElementById('send-messege');
let offerAnswerBox = document.getElementById('answer-offer-box');
let submitButton = document.getElementById('submit');
let endButton = document.getElementById('end-button');

var audio1;
var audio2;

let buttonOpen = 'rgb(0, 0, 0)';
let buttonClosed = 'rgb(139, 0, 0)';
let offerAnswerTextArea = document.getElementById('offer-answer-area');
var chunkLength = 1000;

let offer={description:"",candidate:""};
let answer={description:"",candidate:""};;
let screenSharetoggle=false;
let ssStreamTrack=[];
var arrayToStoreChunks = [];

let screenShareCount=0;
function onSuccess() {};
function onError(error) {console.error(error);};
function str(obj){return JSON.stringify(obj);};
function ustr(obj){return JSON.parse(obj);}


let setupConnection = async () => {
    initialCSS();
    startWebRTC();
}
let state =0;
// let socket = io('http://127.0.0.1:8080/'); 
// socket.on('connect', () => { console.log(socket.id) });


async function handleMeetEnd(){
    console.log('handle end called');
    await stopRecording();
    window.location.reload();
}

function startWebRTC() {

    console.log('Starting webrtc');
    connection = new RTCPeerConnection({
        iceServers: [
          {
              urls: 'stun:stun.l.google.com:19302'
          },
           {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject",
           },
          {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
          {
            urls: "turn:openrelay.metered.ca:443?transport=tcp",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
          {
          url: 'turn:numb.viagenie.ca',
          credential: 'muazkh',
          username: 'webrtc@live.com'
      },
      {
          url: 'turn:192.158.29.39:3478?transport=udp',
          credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
          username: '28224511:1379330808'
      },
      {
          url: 'turn:192.158.29.39:3478?transport=tcp',
          credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
          username: '28224511:1379330808'
      },
      {
          url: 'turn:turn.bistri.com:80',
          credential: 'homeo',
          username: 'homeo'
       },
       {
          url: 'turn:turn.anyfirewall.com:443?transport=tcp',
          credential: 'webrtc',
          username: 'webrtc'
      }
        ],
      });
    
    endButton.addEventListener('click',()=>{
        sentOverDataStream('system','MEET_ENDED');
        handleMeetEnd();
    });

    textChannelStream = connection.createDataChannel('dataChannel');
    
    connection.ondatachannel= e => {

        const receiveChannel = e.channel;
        receiveChannel.onmessage =e => {
            console.log('Messege recived');
            if(ustr(e.data).type=='system')
            {
                if(ustr(e.data).message=='SCREEN_SHARE_OPENED'){
                   toggleRemoteStreamShare();
                   // handleScreenShareBox();
                }
                else if(ustr(e.data).message=='SCREEN_SHARE_CLOSED'){
                    toggleRemoteStreamShare();
                    //handleScreenShareBox();
                }else if(ustr(e.data).message=='MEET_ENDED'){
                    handleMeetEnd();
                }else if(ustr(e.data).message=='AUDIO_TOGGLE'){
                    toggleElementDisplay(document.getElementById('overlay-remote-audio-icon'));
                }
            }
            else if(ustr(e.data).type=='file-share'){
                // var data = ustr(e.data).message;
                // arrayToStoreChunks.push(data.message); // pushing chunks in array
                // if (data.last) {
                //     //console.log(arrayToStoreChunks.join(''));
                //     download(`${data.name}`,arrayToStoreChunks.join(''));
                //     arrayToStoreChunks = []; // resetting array
                // }
            }
            else
                addMessege(2,"Sender : "+ustr(e.data).message);
        } 
        receiveChannel.onopen = e => {
            startMeet();
        }
        receiveChannel.onclose =e => console.log("Closed Text Channel.");

    }

    // function download(filename, text) {
    //     var element = document.createElement('a');
    //     element.setAttribute('href', 'data:jpg;charset=utf-8,' + encodeURIComponent(text));
    //     element.setAttribute('download', filename);
    
    //     element.style.display = 'none';
    //     document.body.appendChild(element);
    
    //     element.click();
    
    //     document.body.removeChild(element);
    // }

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        exchange.push(str(event.candidate));
      }
    };

    document.getElementById('submit-offer-answer').addEventListener('click', function (){
            let obj = document.getElementById('offer-answer-area').value;
            let message = ustr(obj);
            if(ustr(message.description).type=='offer'&&state===0)
            {
                state = 2;
                connection.setRemoteDescription(new RTCSessionDescription(ustr(message.description)), () => {
                    connection.createAnswer().then(handleLocalDescription).then(addIce(message.candidate));
                    setTimeout(createIceAnswer,1000);
                });
            }
            else if(ustr(message.description).type=='answer'&&state===1)
            {
                connection.setRemoteDescription(new RTCSessionDescription(ustr(message.description)), () => {
                    addIce(message.candidate);
                });
    
            }
        //}
    }
    )
  
    createOfferAnswerButton.addEventListener('click',() =>{
            state =1;
            connection.createOffer().then(handleLocalDescription).catch(onError);
            setTimeout(createIceOffer,1000);
    });


    let flg =0;
    connection.ontrack = event => {
      const stream = event.streams[0];

      if(flg==0)
      {
        remoteVideo.srcObject = stream;
        flg++;
      }
      else{
        remoteScreenShare.srcObject = stream;
        //toggleRemoteStreamShare();
        //handleScreenShareBox();

      }
    };
  
    navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    }).then(stream => {
      localVideo.srcObject = stream;
      document.getElementById('sample-video').srcObject = stream;

      stream.getTracks().forEach(track => connection.addTrack(track, stream))
    
    }, onError);

    navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      }).then(stream => {
       
        stream.getTracks().forEach(track => {ssStreamTrack.push(connection.addTrack(track, stream));})
        localScreenShare.srcObject = stream;
        //toggleLocalStreamShare();
    }, onError);

    document.getElementById('screen-share-button-2').addEventListener('click',()=>{
        if(screenSharetoggle==false){
            navigator.mediaDevices.getDisplayMedia().then(stream => {
                localScreenShare.srcObject = stream;
                console.log(localScreenShare.srcObject);
                localScreenShare.srcObject.oninactive = function (){
                    toggleLocalStreamShare();
                    handleScreenShareBox();
                    sentOverDataStream('system','SCREEN_SHARE_CLOSED');
                }            
                ssStreamTrack[0].replaceTrack(stream.getTracks()[0]);
                handleScreenShareBox();              
                sentOverDataStream('system','SCREEN_SHARE_OPENED');
                toggleLocalStreamShare();

            }, onError);
        }
        else{

        }
    });



    



    function addIce(candidates){
       let messege = ustr(candidates);
        messege.forEach((item) =>{
            let candidate = JSON.parse(item);
            connection.addIceCandidate(
              new RTCIceCandidate(candidate), onSuccess, onError
            );
        }); 

    }


    function createIceOffer(){
        offer.candidate = str(exchange); 
        document.getElementById('offer-answer-area').value = str(offer);
        // socket.emit('message',str(offer));
    }

    function createIceAnswer(){
        answer.candidate = str(exchange);
        //socket.emit('message',str(answer));
        document.getElementById('offer-answer-area').value = str(answer);
    }

    function handleLocalDescription(description) {
        connection.setLocalDescription(description);
        if(description.type==='offer'){
            offer.description = str(description); 
        }
        else{
            answer.description = str(description);
        }
    }




    //var name= "";
    
    // document.getElementById('fileshare').onchange = function(){
    //         console.log('file share invoked');
    //         var file = this.files[0];
    //         name  = file.name;
    //         var reader = new window.FileReader();
    //         reader.readAsDataURL(file);
    //         reader.onload = onReadAsDataURL;
    // }

    //     function onReadAsDataURL(event, text) {
    //         var data = {}; // data object to transmit over data channel
        
    //         if (event) text = event.target.result; // on first invocation
        
    //         if (text.length > chunkLength) {
    //             data.message = text.slice(0, chunkLength); // getting chunk using predefined chunk length
    //         } else {
    //             data.message = text;
    //             data.last = true;
    //             data.name = name;

    //         }
        
    //         sentOverDataStream('file-share',data); // use JSON.stringify for chrome!
        
    //         var remainingDataURL = text.slice(data.message.length);
    //         if (remainingDataURL.length) setTimeout(function () {
    //             onReadAsDataURL(null, remainingDataURL); // continue transmitting
    //         }, 500)
    //     }
    


    
}
document.getElementById('video-pause-button').addEventListener('click',()=>{
    console.log('Vide pause main screen clicked');
    toggleMediaOptionButtonColor(document.getElementById('video-pause-button'));
    localVideo.srcObject.getTracks()[1].enabled = !localVideo.srcObject.getTracks()[1].enabled ;
});

document.getElementById('audio-pause-button').addEventListener('click',()=>{
    toggleMediaOptionButtonColor(document.getElementById('audio-pause-button'));
    toggleElementDisplay(document.getElementById('overlay-sample-audio-icon'));
    localVideo.srcObject.getTracks()[0].enabled = !localVideo.srcObject.getTracks()[0].enabled ;
});

document.getElementById('video-pause-button-2').addEventListener('click',()=>{
    toggleMediaOptionButtonColor(document.getElementById('video-pause-button-2'));
    localVideo.srcObject.getTracks()[1].enabled = !localVideo.srcObject.getTracks()[1].enabled ;
});

document.getElementById('audio-pause-button-2').addEventListener('click',()=>{
    toggleMediaOptionButtonColor(document.getElementById('audio-pause-button-2'));
    toggleElementDisplay(document.getElementById('overlay-local-audio-icon'));
    localVideo.srcObject.getTracks()[0].enabled = !localVideo.srcObject.getTracks()[0].enabled ;
    sentOverDataStream('system','AUDIO_TOGGLE'); 
});



function toggleElementDisplay(element){
    if(element.style.display==='none')
        element.style.display='flex';
    else
        element.style.display='none';
}
// function getVisibleStream(){
//     let count=2;
//     if(localScreenShare.srcObject.getTracks()[0].enabled) count++;
//     if(remoteScreenShare.srcObject.getTracks()[0].enabled) count++;
//     return count;
// }

// function stopLocalStreamShare(){
//     if(!localScreenShare.srcObject.getTracks()[0].enabled)
//         localScreenShare.srcObject.getTracks()[0].enabled = !localScreenShare.srcObject.getTracks()[0].enabled;
// }

// function stopRemoteStreamShare(){
//     if(!remoteScreenShare.srcObject.getTracks()[0].enabled)
//         remoteScreenShare.srcObject.getTracks()[0].enabled = !remoteScreenShare.srcObject.getTracks()[0].enabled;
// }

function toggleLocalStreamShare(){
    if( document.getElementById('screen-share-local-box').style.display==='none')
        document.getElementById('screen-share-local-box').style.display='flex';
    else
        document.getElementById('screen-share-local-box').style.display='none';
    //localScreenShare.srcObject.getTracks()[0].enabled = !localScreenShare.srcObject.getTracks()[0].enabled;
    console.log('Local screen stream ',localScreenShare.srcObject.getTracks()[0].enabled);
}

function toggleRemoteStreamShare(){
    if( document.getElementById('screen-share-remote-box').style.display==='none')
        document.getElementById('screen-share-remote-box').style.display='flex';
    else
        document.getElementById('screen-share-remote-box').style.display='none';
    //remoteScreenShare.srcObject.getTracks()[0].enabled = !remoteScreenShare.srcObject.getTracks()[0].enabled ;
    console.log('Remote screen stream',remoteScreenShare.srcObject.getTracks()[0].enabled);
}


// function handleScreenShareBox(){
    
//     let localStreamActive =  localScreenShare.srcObject.getTracks()[0].enabled;
//     let remoteStreamActive = remoteScreenShare.srcObject.getTracks()[0].enabled;
//     if(localStreamActive)
//         localScreenShare.style.display = 'flex';
//     else
//         localScreenShare.style.display = 'none';

//     if(remoteStreamActive)
//         remoteScreenShare.style.display = 'flex';
//     else
//         remoteScreenShare.style.display = 'none';
//     handleView();
// }

function videoEventListenersAdd(){
    document.querySelectorAll('.video-stream-container').forEach(item => {
        item.addEventListener('click',()=>{
            console.log('clicked');
            console.log(item.srcObject);
            document.getElementById('main-stream').srcObject = item.srcObject;
            console.log(document.getElementById('main-stream').srcObject);
        })
    })
}

function handleView(){
    console.log('Handle View Called');
    let count = getVisibleStream();
    console.log(count);
    document.querySelectorAll('.video-stream-container').forEach(item => {
        item.style.width = `${100/count}%`
        console.log(item);
    })

    if(count>2){
        document.getElementById('video-box').style.height = `20vh`;
        document.querySelectorAll('.video-stream-container').forEach(item => {
            item.style.width = `20vh`;
            console.log(item);
        });
        document.getElementById('main-stream').srcObject = localVideo.srcObject;
        document.getElementById('main-stream').style.display = 'flex';
        document.getElementById('main-stream').style.height = `60vh`;
    }
    else{
        document.getElementById('video-box').style.height = `80vh`
        document.getElementById('main-stream').style.display = 'none';

    }
}

function addMessege(a,messege){
    const chats = document.getElementById('all-chats-id');
    if(conversation.length==0)
        chats.style.backgroundColor='transparent';
    conversation.push(messege);
    if(a==1)
        chats.innerHTML = chats.innerHTML +` <p class="chats me" id = 'chatid${conversation.length}'>${messege}</p>` ;
    else
        chats.innerHTML = chats.innerHTML +` <p class="chats sender" id = 'chatid${conversation.length}'>${messege}</p>` ;

    updateScroll();
}


function sentOverDataStream(type,message){
    textChannelStream.send(str({
        type: type,
        message: message
    }));
}

function onSend(){
    addMessege(1,"Me: "+sendMessegeTextArea.value);
    sentOverDataStream('user',sendMessegeTextArea.value);
    sendMessegeTextArea.value="";
    document.activeElement.blur();

}


function startMeet(){
    removeSetupScreen();
    addMeetScreen();
    //removeScreenShareInitially();
    //handleView();
    videoEventListenersAdd();
    //handleSuccess();
    startRecording();
    
}

function removeScreenShareInitially(){
    console.log('Removing stream local');
    // toggleLocalStreamShare();
    // toggleRemoteStreamShare();
    stopLocalStreamShare();
    stopRemoteStreamShare();
}

function initialCSS(){

    document.getElementById('main-box').style.display = 'none';
    //localScreenShare.style.display = 'none';
    ///document.getElementById('video-pause-button-2').style.display = 'none';
    // document.getElementById('audio-pause-button-2').style.display = 'none';
    // document.getElementById('screen-share-button-2').style.display = 'none';
    // document.getElementById('end-button').style.display = 'none';
    //mainContainer.classList.add('flexCol');
    // document.getElementById('video-box').style.display='none';
    // document.getElementById('chat-box').style.display='none';
    // remoteScreenShare.style.display = 'none';
    // localScreenShare.style.display = 'none';
    //document.getElementsByTagName("BODY")[0].style.backgroundColor ='#202020';

    document.getElementById('video-pause-button').style.backgroundColor = buttonOpen;
    document.getElementById('audio-pause-button').style.backgroundColor = buttonOpen;
    document.getElementById('overlay-sample-audio-icon').style.display = 'flex';

}

function addMeetScreen(){
    // document.getElementById('video-box').style.display='flex';
    // document.getElementById('chat-box').style.display='flex';
    document.getElementById('screen-share-remote-box').style.display='none';
    document.getElementById('screen-share-local-box').style.display='none';



    document.getElementById('video-pause-button-2').style.backgroundColor = buttonOpen;
    document.getElementById('audio-pause-button-2').style.backgroundColor = buttonOpen;
    document.getElementById('screen-share-button-2').style.backgroundColor = buttonOpen;
    document.getElementById('end-button').style.backgroundColor = buttonClosed;

    document.getElementById('main-box').style.display = 'flex';
    document.getElementById('overlay-local-audio-icon').style.display = 'flex';

    if(remoteVideo.srcObject.getTracks()[0].enabled)
        document.getElementById('overlay-remote-audio-icon').style.display = 'flex';
    else
        document.getElementById('overlay-remote-audio-icon').style.display = 'none';

    if(!localVideo.srcObject.getTracks()[0].enabled){
        toggleMediaOptionButtonColor(document.getElementById('audio-pause-button-2'));
        toggleElementDisplay(document.getElementById('overlay-local-audio-icon'));
        sentOverDataStream('system','AUDIO_TOGGLE');    };
    




}

function removeSetupScreen(){
    connectContainer.style.display = 'none';
}


function updateScroll(){
    const chats = document.getElementById('all-chats-id');
    chats.scrollTop = chats.scrollHeight - chats.clientHeight;

}


//sendMessegeButton.addEventListener('click', onSend);
//window.addEventListener('resize', handleResponsive , true);
sendMessegeTextArea.onkeypress = (event)=> {
     console.log(event.keyCode);
    if(event.keyCode==13){ event.preventDefault();
        onSend();}
};

setupConnection()


function isEllipsisActive(e) {
    return (e.offsetWidth < e.scrollWidth);
}



function handleResponsive(event) {
    console.log(window.innerHeight + " "+ window.innerWidth);
    // if(window.innerWidth<600)
    // {
    //     handleResponsiveOverflow();  
    // }
    // else 
    // {
    //     handleResponsiveUnderflow();
    // }
}

function  handleResponsiveOverflow(){
    console.log(offerAnswerBox.classList);
    offerAnswerBox.classList.remove('flexRow');
    offerAnswerBox.classList.add('flexCol');
    videoContainer.classList.remove('flexRow');
    videoContainer.classList.add('flexCol');
    
    localVideo.style.height= "auto";
    localVideo.style.width= "90vw";
    remoteVideo.style.height = "auto";
    remoteVideo.style.width = "90vw";

}

function  handleResponsiveUnderflow(){
    offerAnswerBox.classList.remove('flexCol');
    offerAnswerBox.classList.add('flexRow');
    videoContainer.classList.add('flexRow');
    videoContainer.classList.remove('flexCol');

    localVideo.style.height= "50vh";
    localVideo.style.width= "45vw";
    remoteVideo.style.height = "50vh";
    remoteVideo.style.width = "45vw";
}
function hexToRGB(h) {
    let r = 0, g = 0, b = 0;
  
    // 3 digits
    if (h.length == 4) {
      r = "0x" + h[1] + h[1];
      g = "0x" + h[2] + h[2];
      b = "0x" + h[3] + h[3];
  
    // 6 digits
    } else if (h.length == 7) {
      r = "0x" + h[1] + h[2];
      g = "0x" + h[3] + h[4];
      b = "0x" + h[5] + h[6];
    }
    
    return "rgb("+ +r + ", " + +g + ", " + +b + ")";
  }

function toggleMediaOptionButtonColor(element){
    console.log('Clr is :',element.style.backgroundColor);
    console.log(element.style.backgroundColor.toString());
    console.log(buttonClosed);
    if(element.style.backgroundColor===buttonClosed)
        element.style.backgroundColor=buttonOpen;    
    else
        element.style.backgroundColor=buttonClosed;

}



////////////////////

 let mediaRecorder;

 let recordedBlobs;
 
function downloader(){
    const blob = new Blob(recordedBlobs, {type: 'video/webm'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'test.webm';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
}


 function startRecording() {
  
  console.log('started recording');
  recordedBlobs = [];


  const options = {
    mimeType: 'video/webm'
  };
  try {
    const mixer = new MultiStreamsMixer([localVideo.srcObject, remoteVideo.srcObject]);


    mixer.frameInterval = 1;
    mixer.startDrawingFrames();

    mediaRecorder =  new MediaRecorder(mixer.getMixedStream(),options);
    //mixedVideo.srcObject = mixer.getMixedStream();

  } catch (e) {
    console.error('Exception while creating MediaRecorder:', e);
    return;
  }


  mediaRecorder.onstop = (event) => {
    console.log('Recorder stopped: ', event);
    console.log('Recorded Blobs: ', recordedBlobs);
    downloader();    
  };
  
  mediaRecorder.ondataavailable = (event)=>{
    //console.log('handleDataAvailable', event);
    if (event.data && event.data.size > 0) {
        recordedBlobs.push(event.data);
    }
}
 
  
  mediaRecorder.start(100);
  console.log('MediaRecorder started', mediaRecorder);

}

function stopRecording() {
  mediaRecorder.stop();
}




