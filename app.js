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
let localScreenShare = document.getElementById('local-screen-share');
let remoteScreenShare = document.getElementById('remote-screen-share');

let createOfferAnswerButton = document.getElementById('create-offer-answer');
let sendMessegeButton = document.getElementById('send-button');
let sendMessegeTextArea = document.getElementById('send-messege');
let offerAnswerBox = document.getElementById('answer-offer-box');
let submitButton = document.getElementById('submit');


let offerAnswerTextArea = document.getElementById('offer-answer-area');

let offer={description:"",candidate:""};
let answer={description:"",candidate:""};;
let screenSharetoogle=false;
let ssStreamTrack=[];

function onSuccess() {};
function onError(error) {console.error(error);};
function str(obj){return JSON.stringify(obj);};
function ustr(obj){return JSON.parse(obj);}


let setupConnection = async () => {
    initialCSS();
    startWebRTC(false);
}
let state =0;
let socket = io('http://127.0.0.1:8080/'); 
socket.on('connect', () => { console.log(socket.id) });

function startWebRTC(isOfferer) {

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
     
    textChannelStream = connection.createDataChannel('dataChannel');
    
    connection.ondatachannel= e => {

        const receiveChannel = e.channel;
        receiveChannel.onmessage =e => {
            addMessege(2,"Sender : "+e.data);
        } 
        receiveChannel.onopen = e => {
            console.log("Open Text Channnel.");
            startMeet();
        }
        receiveChannel.onclose =e => console.log("Closed Text Channel.");

    }


    connection.onicecandidate = (event) => {
      if (event.candidate) {
          console.log(str(event.candidate));
        exchange.push(str(event.candidate));
      }
    };

    socket.on('message', (obj) => {
        console.log('recieving a message',ustr(obj));
    //     let { description, candidate} = ustr(obj);
    //     description = ustr(description);
    //     candidate = ustr(candidate);
    //    // localConnection.setRemoteDescription(description).then(() => { console.log("Sender: answer accepted") });
    
    //     // adding proposed icecandidates
    //     icecandidates.forEach(candidate => {
    //         localConnection.addIceCandidate(new RTCIceCandidate(candidate));
    //     });
    
        //else{
            let message = ustr(obj);
         //   console.log(message);
            if(ustr(message.description).type=='offer'&&state===0)
            {
                state = 2;
                console.log('Submit offer type');
                connection.setRemoteDescription(new RTCSessionDescription(ustr(message.description)), () => {
                    connection.createAnswer().then(handleLocalDescription).then(addIce(message.candidate));
                    setTimeout(createIceAnswer,1000);
                });
            }
            else if(ustr(message.description).type=='answer'&&state===1)
            {
                console.log('sbmit answer type');
                connection.setRemoteDescription(new RTCSessionDescription(ustr(message.description)), () => {
                    addIce(message.candidate);
                });
    
            }
        //}
    })
  
    createOfferAnswerButton.addEventListener('click',() =>{
        state =1;
        //if(offerAnswerTextArea.value==''){
            connection.createOffer().then(handleLocalDescription).catch(onError);
            setTimeout(createIceOffer,1000);
        //}
    //     else{
    //         let message = JSON.parse(offerAnswerTextArea.value);
    //         console.log(message);
    //         if(ustr(message.description).type=='offer')
    //         {
    //             console.log('Submit offer type');
    //             connection.setRemoteDescription(new RTCSessionDescription(ustr(message.description)), () => {
    //                 connection.createAnswer().then(handleLocalDescription).then(addIce);
    //                 setTimeout(createIceAnswer,1000);
    //             });
    //         }
    //         else
    //         {
    //             console.log('sbmit answer type');
    //             connection.setRemoteDescription(new RTCSessionDescription(ustr(message.description)), () => {
    //                 addIce(message.candidates);
    //             });

    //         }
    // }
    });


  let flg =0;
    connection.ontrack = event => {
      const stream = event.streams[0];
    //   if (!remoteVideo.srcObject || remoteVideo.srcObject.id !== stream.id) {
    //     remoteVideo.srcObject = stream;
    //   }

      if(flg==0)
      {
        remoteVideo.srcObject = stream;
        flg++;
      }
      else{
          remoteScreenShare.srcObject = stream;
      }
      
    
    //   if()
    //   const sstream = event.streams[1];
      console.log("Event streams are: " + event.streams.length);
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
        audio: false,
        video: true,
      }).then(stream => {
       
        stream.getTracks().forEach(track => {ssStreamTrack.push(connection.addTrack(track, stream));})
        console.log(stream.getTracks());
        console.log('ss track is ');
        console.log(ssStreamTrack);
        localScreenShare.srcObject = stream;

    }, onError);

    document.getElementById('screen-share-button').addEventListener('click',()=>{
        if(screenSharetoogle==false){
            navigator.mediaDevices.getDisplayMedia().then(stream => {
                localScreenShare.srcObject = stream;
                console.log('stream is ');
                console.log(localScreenShare.srcObject);
                // stream.getTracks().forEach(track => connection.addTrack(track, stream));
                console.log("length is "+ connection.track);
                ssStreamTrack[0].replaceTrack(stream.getTracks()[0]);
            }, onError);
        }
        else{

        }
    });

    
    document.getElementById('video-pause-button').addEventListener('click',()=>{
        console.log('clicked video toogle');
        console.log(localVideo.srcObject.getTracks());
        console.log(localVideo.srcObject.getTracks()[1].enabled);
        localVideo.srcObject.getTracks()[1].enabled = !localVideo.srcObject.getTracks()[1].enabled ;
        console.log(localVideo.srcObject.getTracks()[1].enabled);
    });
    
    document.getElementById('audio-pause-button').addEventListener('click',()=>{
        console.log('clicked video toogle');
        console.log(localVideo.srcObject.getTracks());
        console.log(localVideo.srcObject.getTracks()[0].enabled);
        localVideo.srcObject.getTracks()[0].enabled = !localVideo.srcObject.getTracks()[0].enabled ;
        console.log(localVideo.srcObject.getTracks()[0].enabled);
    });

    function addIce(candidates){
        //let messege = ustr(offerAnswerTextArea.value);
       let messege = ustr(candidates);
        //document.getElementById('ice-area').value = "";
        messege.forEach((item) =>{
            console.log(item);
            let candidate = JSON.parse(item);
            connection.addIceCandidate(
              new RTCIceCandidate(candidate), onSuccess, onError
            );
        }); 

    }


    function createIceOffer(){
        offer.candidate = str(exchange);
        console.log('sending offer');
        //offerAnswerTextArea.value = str(offer);    
        socket.emit('message',str(offer));
    }

    function createIceAnswer(){
        answer.candidate = str(exchange);
       // offerAnswerTextArea.value = str(answer);
        console.log('sending answer',answer);
        socket.emit('message',str(answer));
    }

    function handleLocalDescription(description) {
        console.log(str(description));
        console.log('handle local desc');
        connection.setLocalDescription(description);
        if(description.type==='offer'){
            offer.description = str(description); 
        }
        else{
            answer.description = str(description);
        }
        console.log('conpleted');
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

function onSend(){
    addMessege(1,"Me: "+sendMessegeTextArea.value);
    textChannelStream.send(sendMessegeTextArea.value);
    sendMessegeTextArea.value="";
    document.activeElement.blur();

}


function startMeet(){
    hideDetails();
    unhideVideo();
    document.getElementsByTagName("BODY")[0].style.backgroundColor ='#121212';
}

function initialCSS(){
    
    mainContainer.classList.add('flexCol');
    document.getElementById('video-box').style.display='none';
    document.getElementById('chat-box').style.display='none';
    document.getElementsByTagName("BODY")[0].style.backgroundColor ='#202020';
}

function unhideVideo(){
    document.getElementById('video-box').style.display='flex';
    document.getElementById('chat-box').style.display='flex';
}

function hideDetails(){
    connectContainer.style.display = 'none';
}


function updateScroll(){
    const chats = document.getElementById('all-chats-id');
    console.log("running");
    chats.scrollTop = chats.scrollHeight - chats.clientHeight;

}


sendMessegeButton.addEventListener('click', onSend);
window.addEventListener('resize', handleResponsive , true);
sendMessegeTextArea.onkeypress = (event)=> {
     console.log(event.keyCode);
    if(event.keyCode==13){ event.preventDefault();
        onSend();}
};

setupConnection()



// // Responsive

function isEllipsisActive(e) {
    return (e.offsetWidth < e.scrollWidth);
}



function handleResponsive(event) {
    console.log(window.innerHeight + " "+ window.innerWidth);
    if(window.innerWidth<600)
    {
        handleResponsiveOverflow();  
    }
    else 
    {
        handleResponsiveUnderflow();
    }
}

function  handleResponsiveOverflow(){
    //offerAnswerBox.classList.pop();
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