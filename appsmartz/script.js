
let cameraRecElem = document.querySelector('#cameraRecord');
let recBtn = document.querySelector('.record-btn');
let startBtn = document.querySelector('.startBtn');
let countDown = document.querySelector('.countDown');
let startContainer = document.querySelector('.start-container');
let inProgressContainer = document.querySelector('.inprogress-container');
let saveVideoContainer = document.querySelector('.saveVideo-container');
let stopRecBtn =  document.querySelector('.stopRec');
let optionContainer = document.querySelector('.options-container');
let micBtn = document.querySelector('.mic-icon');
let homeBtn = document.querySelector('.ph-house');
var hideCamDiv = document.getElementById("hidecamera");

let closecamBtn =  document.querySelector('.closeCamera');
let mutemicBtn =  document.querySelector('.micaction');
let counting;
let recorder;
let chunks = [];

var overallRecordMedia
var micmute
var camStreamOverall
var livestream;
// Event listeners
startBtn.addEventListener('click', (e) => {
    startInterval();
    startContainer.classList.add('hide');
    optionContainer.classList.add('hide');
    inProgressContainer.classList.remove('hide');
    let micStatus = micBtn.classList.contains('mic-disabled');
    Array.from(optionContainer.children).forEach((elem)=>{
        if(elem.classList.contains('selected')){
            let optionNo = elem.dataset.option;
            if(optionNo == 0) cameraRecording(micStatus);
            else if(optionNo == 1) screenRecording(micStatus);
            else cameraPlusScreenRecording(micStatus);
        }
    });
});

mutemicBtn.addEventListener('click', (e) => {
    if(mutemicBtn.innerText === "Mute"){
        mutemicBtn.innerText = "Unmute";
        //for mute mic
        var mediaStreamTracks = micmute.getAudioTracks().forEach(function(track) {
            track.enabled = false;
        });
    }else{
        //for unmute mic
        mutemicBtn.innerText= "Mute";
        var mediaStreamTracks = micmute.getAudioTracks().forEach(function(track) {
            track.enabled = true;
        });
    }
});

closecamBtn.addEventListener('click', async (e) => {
    if(closecamBtn.innerText === "Close Camera"){
        closecamBtn.innerText = "Open Camera";
        var elementVar = document.getElementById("cameraRecord");
        elementVar.setAttribute("disablepictureinpicture", "disablepictureinpicture");
        camStreamOverall.getVideoTracks().forEach(function(track) {
          track.stop();
        });
        cameraRecElem.style.opacity="0"
        if (document.pictureInPictureElement !== null) {
            document.exitPictureInPicture();
        }
    }else{
        closecamBtn.innerText= "Close Camera";
        var elementVar = document.getElementById("cameraRecord");
        elementVar.removeAttribute("disablepictureinpicture", "disablepictureinpicture");
        const stream = await navigator.mediaDevices.getUserMedia({ video : true });
        cameraRecElem.srcObject = stream;
        camStreamOverall = stream
        cameraRecElem.style.opacity="1"
    }
});

stopRecBtn.addEventListener('click', (e) => {
    inProgressContainer.classList.add('hide');
    saveVideoContainer.classList.remove('hide');
    closecamBtn.innerText= "Close Camera";
    hideCamDiv.style.display = "none"
    var elementVar = document.getElementById("cameraRecord");
    elementVar.setAttribute("disablepictureinpicture", "disablepictureinpicture");
    recorder.stop();
    stopInterval();
    // clearInterval(intervalID);
});

optionContainer.addEventListener('click', (e) => {
    let targetElem = e.target.closest('.option');
    if(!targetElem) return;
    Array.from(optionContainer.children).forEach((elem) => elem.classList.remove('selected'));
    targetElem.classList.add('selected');
});

micBtn.addEventListener('click', (e) => {
    micBtn.classList.toggle('mic-disabled');
    if(micBtn.classList.contains('mic-disabled')) micBtn.classList.replace('ph-microphone', 'ph-microphone-slash');
    else micBtn.classList.replace('ph-microphone-slash', 'ph-microphone');
});

homeBtn.addEventListener('click', setDefaultUI);

document.querySelector('.saveBtn-container').addEventListener('click', (e) => {
    
})


// Functions

const pip = async function(pipStatus){
    if (!cameraRecElem.hasAttribute('isPip')) {
            await cameraRecElem.requestPictureInPicture();
            cameraRecElem.setAttribute('isPip', true);
            cameraRecElem.style.opacity="0"
            closecamBtn.style.display = 'none';
            cameraRecElem.addEventListener('leavepictureinpicture', event => {
                cameraRecElem.removeAttribute('isPip')
                cameraRecElem.style.opacity="1"
                closecamBtn.style.display = 'block';
            }, {
                once: true
            })
        } else {
            await document.exitPictureInPicture();
        }
}
const record = function(stream, pipStatus, stream2){
    recorder = new MediaRecorder(stream);
    recorder.addEventListener('start', (e) =>{
        chunks = [];
        if(pipStatus) cameraRecElem.requestPictureInPicture() && (cameraRecElem.style.opacity="0");
    });

    recorder.addEventListener('dataavailable', (e) =>{
        chunks.push(e.data);
    });

    overallRecordMedia = recorder
    // console.log('streamstream1',overallRecordMedia)
    livestream = stream;
    recorder.addEventListener('stop', (e) =>{
        stream.getTracks().forEach(track => track.stop());
        if(stream2) stream2.getTracks().forEach(track => track.stop());
        // console.log('streamstream2',stream)
        if(stream2) camStreamOverall.getTracks().forEach(function(track) {
          track.stop();
        });
        cameraRecElem.style.opacity="0"
        clearInterval(counting);
        setLink(chunks);
        if(pipStatus){
            if (document.pictureInPictureElement !== null) {
                document.exitPictureInPicture();
            }
            // document.exitPictureInPicture();
            cameraRecElem.style.opacity="0"
        } 
        else{
            if (document.pictureInPictureElement !== null) {
                document.exitPictureInPicture();
            }
            cameraRecElem.style.opacity="0"
        }
    });

    startCountDown();
    recorder.start();
}

// document.onclick= function(event) {
//     alert('clicked on');
// };

const cameraRecording = async function(micStatus){
    try{
        const stream = await navigator.mediaDevices.getUserMedia({
            video : true, 
            audio: micStatus ? false : true
        });
        cameraRecElem.srcObject = stream;
        record(stream, true);
    }
    catch(err){
        showError('Error accessing camera or microphone');
    }
};

const screenRecording = async function(micStatus){
    try{
        closecamBtn.classList.add('hide');
        closecamBtn.style.display = 'none';
        var elementVar = document.getElementById("cameraRecord");
        elementVar.setAttribute("disablepictureinpicture", "disablepictureinpicture");
        let stream = await navigator.mediaDevices.getDisplayMedia({ video : true });
        if(!micStatus) stream.addTrack(await getAudioTrack());
        micmute = stream //dec globally mic stream
        record(stream, false);
    }
    catch{
        showError('Error capturing screen or microphone');
    }
}

const cameraPlusScreenRecording = async function(micStatus){
    try{
        closecamBtn.classList.remove('hide');
        closecamBtn.style.display = 'block';
        var elementVar = document.getElementById("cameraRecord");
        elementVar.removeAttribute("disablepictureinpicture", "disablepictureinpicture");
        let screenStream = await navigator.mediaDevices.getDisplayMedia({ video : true });
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video : true, audio: true });
        cameraRecElem.srcObject = cameraStream;
        cameraRecElem.style.opacity="1"
        if(!micStatus) screenStream.addTrack(cameraStream.getAudioTracks()[0]);
        micmute = screenStream //dec globally mic stream
        camStreamOverall = cameraStream //getting camera stream media
        hideCamDiv.style.display = "block";
        record(screenStream, false, cameraStream);   
    }
    catch(err){
        if(err == "Error accessing microphone") showError(err);
        else showError('Error accessing camera or capturing screen');
    }
}

async function getAudioTrack(){
    try{
        let audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                noiseSuppression: true,
                echoCancellation: true
            }
        });
    
        let audioTrack = audioStream.getAudioTracks()[0];
        return audioTrack;
    }
    catch{
        return Promise.reject('Error accessing microphone');
    }
}

function setDefaultUI(){
    document.querySelector('.save-vid').src = '';
    document.querySelector('.saveBtnLink').setAttribute('href', '');
    countDown.innerHTML = '00:00';
    startContainer.classList.remove('hide');
    optionContainer.classList.remove('hide');
    inProgressContainer.classList.add('hide');
    saveVideoContainer.classList.add('hide');
}

function startCountDown(){
    let sec = 0;
    counting = setInterval(() => {
        sec++;
        let min = Math.floor(sec/60);
        countDown.innerHTML = (`${min >= 10 ? min : '0'+min}:${sec%60 >= 10 ? sec%60 : '0'+sec%60}`);
    }, 1000);
}

function setLink(chunks){
    let blob = new Blob(chunks, { type: 'video/mp4' } );
    let videoURL = URL.createObjectURL(blob);
    let a = document.querySelector('.saveBtnLink');
    a.setAttribute('href', videoURL);
    a.setAttribute('download', 'recorded_video.mp4');
    let saveVideo = document.querySelector('.save-vid');
    saveVideo.src = videoURL;
}

function showError(msg){
    setDefaultUI();
    let errorElem = document.querySelector('.error-cont');
    errorElem.innerText = msg;
    errorElem.classList.remove('hide');
    setTimeout(()=>errorElem.classList.add('hide'), 3000);
}

let interval;

function startInterval(){
    interval = setInterval(appendDateToBody, 'micro', 400);
    console.log("start interval");
}

function stopInterval() {
    clearInterval(interval);
    console.log('stop interval');
}

function appendDateToBody() {
    var currentstatus = true;
    if(livestream) {
        if (livestream.active == true) {
            livestream.getTracks().forEach((track) => {
                // console.log(track.readyState);
                if(track.readyState == "ended"){
                    currentstatus = false;
                    if (currentstatus == false) {
                        let stopRecBtn =  document.querySelector('.stopRec');
                        stopRecBtn.click();
                    }
                }
            });
        }
    }
}

// var currentstatus = true;
// intervalID = setInterval(function () {
//     if(livestream) {
//         if (livestream.active == true) {
//             livestream.getTracks().forEach((track) => {
//                 // console.log(track.readyState);
//                 if(track.readyState == "ended"){
//                 currentstatus = false;
//                 if (currentstatus == false) {
//                     let stopRecBtn =  document.querySelector('.stopRec');
//                     stopRecBtn.click();
//                 }
//             }
//             });
//         }else{
//             console.log(track.readyState);
//         }
//     }
// }, 'micro', 400);
