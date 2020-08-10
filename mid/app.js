let startAndStopBtn = document.getElementById('startAndStop');
let recognizeBtn = document.getElementById('Recognize');
let screenshotsBtn = document.getElementById('Screenshots');
let speakBtn = document.getElementById('Speak');

let videoInput = document.getElementById('videoInput');
let canvasOutput = document.getElementById('canvasOutput');
let canvasContext = canvasOutput.getContext('2d');

let streaming = false, isRecognize = false, isScreenshots = false;
let src, dst, cap;

let utils = new Utils('errorMessage');

window.addEventListener('load', eventWindowLoaded, false);
let canvasApp;
function eventWindowLoaded() {
    canvasApp = new CanvasApp('canvasOutput'); //包含整個Canvas應用程序
}

//.setAttribute('disabled', null);.removeAttribute('disabled');
screenshotsBtn.addEventListener('click', () => {
    if (isScreenshots) {
        isScreenshots = false;
        screenshotsBtn.innerText = 'Screenshots';
        canvasOutput.removeAttribute('class', 'cursor-crosshair');
    } else {
        isScreenshots = true;
        screenshotsBtn.innerText = 'Continue';
        canvasOutput.setAttribute('class', 'cursor-crosshair');
        canvasApp.setImg();
    }
    canvasApp.setDraw(isScreenshots);

});

recognizeBtn.addEventListener('click', () => {
    try {
        document.getElementById('RecognizeDiv').style.display = "block";

        let progressText = document.getElementById('ProgressText');
        let recognizeText = document.getElementById('recognizeText');
        let recognizeProgressBar = new Utils.ProgressBar("myBar");
        recognizeProgressBar.init();

        // var rect = {startX:0,startY:0,w:canvasOutput.width,h:canvasOutput.height};
        // if(isRecognize){rect = canvasApp.getRect();}

        var imgData = canvasApp.getImgData();//canvasContext.getImageData(rect.startX, rect.startY, rect.w, rect.h);
        isRecognize = true;
        //https://github.com/tesseract-ocr/tesseract/wiki/Data-Files
        //Chinese-Traditional'chi_tra',Chinese-Simplified'chi_sim',English'eng',Japanese'jpn',German'deu'

        var options = {
            lang: document.getElementById("language").value,
        };
        console.log(options);
        // console.log(rect);
        // document.getElementById('canvasImg').src = canvasOutput.toDataURL();
        recognizeText.innerHTML = '';
        Tesseract.recognize(imgData, options)
            .progress(function (message) {
                // console.log('progress is: ', message);
                progressText.innerHTML = message.status.capitalize();
                if (message.status == 'recognizing text') {
                    recognizeProgressBar.runTo(message.progress * 100);
                    if (message.progress == 1) { isRecognize = false; }
                }
            }).then(function (result) {
                console.log('result is: ', result);
                progressText.innerHTML = '';
                // let recognizeText = document.getElementById('recognizeText');
                recognizeText.innerText = result.text;
            });
    } catch (err) {
        utils.printError(err);
    }
});

startAndStopBtn.addEventListener('click', () => {
    if (!streaming) {
        utils.clearError();
        utils.startCamera('qvga', onVideoStarted, 'videoInput');
    } else {
        utils.stopCamera();
        onVideoStopped();
    }
});

function onVideoStarted() {
    streaming = true;
    startAndStop.innerText = 'Stop';
    CameraRun();

    recognizeBtn.removeAttribute('disabled');
    screenshotsBtn.removeAttribute('disabled');
    isScreenshots = false;
    // videoInput.width = videoInput.videoWidth;
    // videoInput.height = videoInput.videoHeight;
}

function onVideoStopped() {
    streaming = false;
    startAndStop.innerText = 'Start';
    canvasContext.clearRect(0, 0, canvasOutput.width, canvasOutput.height);

    recognizeBtn.setAttribute('disabled', null);
    screenshotsBtn.setAttribute('disabled', null);
    isScreenshots = false;
    screenshotsBtn.innerText = 'Screenshots';
    canvasApp.setDraw(false);
}
function onOpenCvReady() { 
    document.getElementById('status').innerHTML = 'Ready.';
    startAndStop.removeAttribute('disabled');
    initCode();
    setTimeout(showPage, 1000);
}
function showPage() {
    document.getElementById("loader").style.display = "none";
    document.getElementById("myDiv").style.display = "block";
    handleResize(); // First draw
}
function initCode() {
    cap = new cv.VideoCapture(videoInput);
    dst = new cv.Mat(videoInput.height, videoInput.width, cv.CV_8UC1);
    src = new cv.Mat(videoInput.height, videoInput.width, cv.CV_8UC4);
}



var lowRange = new Utils.RangeSliders("LowRange");
lowRange.init("LowRangeValue");
var highRange = new Utils.RangeSliders("HighRange");
highRange.init("HighRangeValue");

const FPS = 50;
function CameraRun() {
    isRecognize = false;
    function processVideo() {
        try {
            if (!streaming) {
                // clean and stop.
                src.delete();
                dst.delete();
                src = new cv.Mat(videoInput.height, videoInput.width, cv.CV_8UC4);
                dst = new cv.Mat(videoInput.height, videoInput.width, cv.CV_8UC1);
                return;
            }
            let begin = Date.now();
            // start processing.
            if (!isRecognize && !isScreenshots) {
                Video2Image();
            }
            // schedule the next one.
            let delay = 1000 / FPS - (Date.now() - begin);
            // console.log(begin,delay);
            setTimeout(processVideo, delay);
        } catch (err) {
            utils.printError(err);
        }
    };
    function Video2Image() {
        var selector = document.querySelector('input[name="radio"]:checked');
        if(selector){
            cap.read(src);
            // console.log(src);
            console.log(selector.value);
            switch (selector.value) {
                case 'Color':
                    dst = src.clone();
                    break;
                case 'GrayScale':
                    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
                    // cv.threshold(src, dst, 177, 200, cv.THRESH_BINARY);
                    break;
                case 'BlackAndWhite':
                    var lowValue = lowRange.getValue();
                    var highValue = highRange.getValue();
                    // console.log("l:"+lowValue,"h:"+highValue);
                    // cv.Canny(src, dst, lowValue, highValue, 3, false);
                    let low = new cv.Mat(src.rows, src.cols, src.type(), [lowValue, lowValue, lowValue, 0]);
                    let high = new cv.Mat(src.rows, src.cols, src.type(), [highValue, highValue, highValue, 255]);
                    cv.inRange(src, low, high, dst);
                    low.delete(); high.delete();
                    break;
                default:
                    break;
            }
        }
        
        let dsize = new cv.Size(canvasOutput.width, canvasOutput.height);
        cv.resize(dst, dst, dsize);
        utils.showImage('canvasOutput', dst); // cv.imshow('canvasOutput', dst);
        
        canvasApp.setImg();
    }
    // schedule the first one.
    setTimeout(processVideo, 0);
}

window.addEventListener("resize", handleResize);
function handleResize() {
    videoInput.style.display = "block";

    var w = videoInput.clientWidth - videoInput.clientLeft;
    // var h = w * 0.75;
    canvasOutput.width = w;
    canvasOutput.height = w * 0.75;

    canvasContext.fillStyle="#666666";
    canvasContext.fillRect(0,0,canvasOutput.width,canvasOutput.height); 

    videoInput.style.display = "none";
    // console.log(canvasOutput.width,canvasOutput.height);
}

var speech = new Utils.SpeechSyn('voice');
//Chinese-Traditional'chi_tra',Chinese-Simplified'chi_sim',English'eng',Japanese'jpn',German'deu'
// console.log(speech.isSupport());'zh-TW';,'zh','en','ja-JP'
speech.loadVoices('en');
// Chrome loads voices asynchronously.
window.speechSynthesis.onvoiceschanged = function (e) {
    speech.loadVoices('en');
    // speech.speak('Life is like music. It must be composed by ear, feeling and instinct, not by rule.');
};

function selectLeng() {
    var language = document.getElementById("language");
    var speak = { 'eng': 'en', 'chi_tra': 'zh', 'chi_sim': 'zh', 'jpn': 'ja' };
    var lang = speak[language.value];
    speech.clearVoices();
    speech.loadVoices(lang);
    // console.log(language.value);
    // console.log(lang);
}

speakBtn.addEventListener('click', () => {
    let recognizeText = document.getElementById('recognizeText');
    // console.log(recognizeText.innerText);
    // speech.stop();
    speech.speak(recognizeText.innerText);
});