function Utils(errorOutputId) { // eslint-disable-line no-unused-vars
    let self = this;
    this.errorOutput = document.getElementById(errorOutputId);

    const OPENCV_URL = './opencv.js';
    this.loadOpenCv = function (onloadCallback) {
        let script = document.createElement('script');
        script.setAttribute('async', '');
        script.setAttribute('type', 'text/javascript');
        script.addEventListener('load', () => {
            console.log(cv.getBuildInformation());
            onloadCallback();
        });
        script.addEventListener('error', () => {
            self.printError('Failed to load ' + OPENCV_URL);
        });
        script.src = OPENCV_URL;
        let node = document.getElementsByTagName('script')[0];
        node.parentNode.insertBefore(script, node);
    };

    this.createFileFromUrl = function (path, url, callback) {
        let request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';
        request.onload = function (ev) {
            if (request.readyState === 4) {
                if (request.status === 200) {
                    let data = new Uint8Array(request.response);
                    cv.FS_createDataFile('/', path, data, true, false, false);
                    callback();
                } else {
                    self.printError('Failed to load ' + url + ' status: ' + request.status);
                }
            }
        };
        request.send();
    };

    this.loadImageToCanvas = function (url, cavansId) {
        let canvas = document.getElementById(cavansId);
        let ctx = canvas.getContext('2d');
        let img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function () {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0, img.width, img.height);
        };
        img.src = url;
    };

    this.showImage = function (canvas_id, mat) {
        var data = mat.data; // output is a Uint8Array that aliases directly into the Emscripten heap

        var channels = mat.channels();
        var channelSize = mat.elemSize1();

        var canvas = document.getElementById(canvas_id);

        var ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        canvas.width = mat.cols;
        canvas.height = mat.rows;

        var imdata = ctx.createImageData(mat.cols, mat.rows);

        for (var i = 0, j = 0; i < data.length; i += channels, j += 4) {
            imdata.data[j] = data[i];
            imdata.data[j + 1] = data[i + 1 % channels];
            imdata.data[j + 2] = data[i + 2 % channels];
            imdata.data[j + 3] = 255;
        }
        ctx.putImageData(imdata, 0, 0);
    }

    this.executeCode = function (textAreaId) {
        try {
            this.clearError();
            let code = document.getElementById(textAreaId).value;
            eval(code);
        } catch (err) {
            this.printError(err);
        }
    };

    this.showError = function (err) {
        var errAlert = document.createElement('div');
        errAlert.setAttribute('class', 'alert');

        var closebtn = document.createElement('span');
        closebtn.setAttribute('class', 'closebtn');
        closebtn.setAttribute('onclick', 'var div = this.parentElement;div.style.opacity = "0";setTimeout(function(){ div.style.display = "none"; }, 600);');
        closebtn.innerHTML = '&times;';
        errAlert.appendChild(closebtn);

        var t = document.createElement('span');
        t.innerHTML = err;
        errAlert.appendChild(t);
        this.errorOutput.appendChild(errAlert);
    };

    this.clearError = function () {
        this.errorOutput.innerHTML = '';
    };

    this.printError = function (err) {
        if (typeof err === 'undefined') {
            err = '';
        } else if (typeof err === 'number') {
            if (!isNaN(err)) {
                if (typeof cv !== 'undefined') {
                    err = 'Exception: ' + cv.exceptionFromPtr(err).msg;
                }
            }
        } else if (typeof err === 'string') {
            let ptr = Number(err.split(' ')[0]);
            if (!isNaN(ptr)) {
                if (typeof cv !== 'undefined') {
                    err = 'Exception: ' + cv.exceptionFromPtr(ptr).msg;
                }
            }
        } else if (err instanceof Error) {
            err = err.stack.replace(/\n/g, '<br>');
        }
        var n = err.indexOf(":") + 1;
        var e_title = err.substring(0, n);
        var e = err.substring(n + 1);
        this.showError("<strong>" + e_title + "</strong> " + e);
        //console.error(err);
    };

    this.loadCode = function (scriptId, textAreaId) {
        let scriptNode = document.getElementById(scriptId);
        let textArea = document.getElementById(textAreaId);
        if (scriptNode.type !== 'text/code-snippet') {
            throw Error('Unknown code snippet type');
        }
        textArea.value = scriptNode.text.replace(/^\n/, '');
    };

    this.addFileInputHandler = function (fileInputId, canvasId) {
        let inputElement = document.getElementById(fileInputId);
        inputElement.addEventListener('change', (e) => {
            let files = e.target.files;
            if (files.length > 0) {
                let imgUrl = URL.createObjectURL(files[0]);
                self.loadImageToCanvas(imgUrl, canvasId);
            }
        }, false);
    };

    function onVideoCanPlay() {
        if (self.onCameraStartedCallback) {
            self.onCameraStartedCallback(self.stream, self.video);
        }
    };

    this.startCamera = function (resolution, callback, videoId) {
        const constraints = {
            'qvga': { width: { exact: 320 }, height: { exact: 240 } },
            'vga': { width: { exact: 640 }, height: { exact: 480 } }
        };
        let video = document.getElementById(videoId);
        if (!video) {
            video = document.createElement('video');
        }

        let videoConstraint = constraints[resolution];
        if (!videoConstraint) {
            videoConstraint = true;
        }

        navigator.mediaDevices.getUserMedia({ video: videoConstraint, audio: false })
            .then(function (stream) {
                video.srcObject = stream;
                video.play();
                self.video = video;
                self.stream = stream;
                self.onCameraStartedCallback = callback;
                video.addEventListener('canplay', onVideoCanPlay, false);
            })
            .catch(function (err) {
                self.printError('Camera Error: ' + err.name + ' ' + err.message);
            });
    };

    this.stopCamera = function () {
        if (this.video) {
            this.video.pause();
            this.video.srcObject = null;
            this.video.removeEventListener('canplay', onVideoCanPlay);
        }
        if (this.stream) {
            this.stream.getVideoTracks()[0].stop();
        }
    };
};

Utils.RangeSliders = function (rangeSlidersId) {
    let self = this;
    this.rangeSliders = document.getElementById(rangeSlidersId);

    this.init = function (valueId) {
        var rangeValue = document.getElementById(valueId);
        rangeValue.innerHTML = this.rangeSliders.value;
        this.rangeSliders.oninput = function () {
            rangeValue.innerHTML = this.value;
        }
    };

    this.getValue = function () {
        return parseFloat(this.rangeSliders.value);
    }
};

Utils.ProgressBar = function (progressBarId) {
    let self = this;
    this.progressBarId = progressBarId;
    this.progressBar = document.getElementById(progressBarId);

    this.init = function () {
        this.progressBar.style.width = '0%';
        this.progressBar.innerHTML = '0%';
    };

    this.runTo = function (end) {
        var progressBar = document.getElementById(this.progressBarId);
        var id = setInterval(frame, 10);
        var width = parseInt(this.progressBar.style.width);
        function frame() {
            if (width >= end || width >= 100) {
                clearInterval(id);
                return true;
            } else {
                width++;
                progressBar.style.width = width + '%';
                progressBar.innerHTML = width + '%';
            }
        }
    };
};

String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

Utils.SpeechSyn = function (voiceSelect_id) {
    let self = this;
    this.voiceSelect_id = voiceSelect_id;
    this.isSupport = function () { return ('speechSynthesis' in window); }
    // Fetch the list of voices and populate the voice options.
    this.clearVoices = function () {
        document.getElementById(voiceSelect_id).innerHTML = '';
    }
    this.loadVoices = function (lang) {
        // Fetch the available voices.
        //return voice.lang == 'zh-TW';,'zh','en','ja-JP'
        var isFilter = lang === undefined ? false : true;
        var voices = speechSynthesis.getVoices();
        if (isFilter) {
            voices = speechSynthesis.getVoices().filter(function (voice) {
                return voice.lang.search(lang) != -1;
            });
        }
        // console.log(voices);

        // Loop through each of the voices.
        voices.forEach(function (voice, i) {
            // Create a new option element.
            var option = document.createElement('option');
            // Set the options value and text.
            option.value = voice.name;
            option.innerHTML = voice.name;
            var voiceSelect = document.getElementById(voiceSelect_id);
            // Add the option to the voice selector.
            voiceSelect.appendChild(option);
        });
    }
    // Create a new utterance for the specified text and add it to
    // the queue.
    this.speak = function (text) {
        // Create a new instance of SpeechSynthesisUtterance.
        var voiceSelect = document.getElementById(voiceSelect_id);
        var msg = new SpeechSynthesisUtterance();

        // Set the text.
        msg.text = text;

        // Set the attributes.
        // msg.volume = parseFloat(volumeInput.value);
        // msg.rate = parseFloat(rateInput.value);
        // msg.pitch = parseFloat(pitchInput.value);

        // If a voice has been selected, find the voice and set the
        // utterance instance's voice attribute.
        if (voiceSelect.value) {
            msg.voice = speechSynthesis.getVoices().filter(function (voice) { return voice.name == voiceSelect.value; })[0];
        }

        // Queue this utterance.
        window.speechSynthesis.speak(msg);
    }

    this.stop = function () {
        window.speechSynthesis.cancel();
    }

}



function canvasSupport(e) {
    return !!e.getContext;
}
function CanvasApp(canvas_id) {
    let self = this;
    var myCanvas = document.getElementById(canvas_id);

    if (!canvasSupport(myCanvas)) {
        return;
    }

    var ctx = myCanvas.getContext('2d');

    myCanvas.addEventListener('mousedown', mouseDown, false);
    myCanvas.addEventListener('mouseup', mouseUp, false);
    myCanvas.addEventListener('mousemove', mouseMove, false);

    myCanvas.addEventListener('touchstart',touchStart, false);
    myCanvas.addEventListener('touchmove',touchMove, false);
    myCanvas.addEventListener('touchend',touchEnd, false);

    var rect = {},
        drag = false,
        isDraw = false;
    var imgData;

    this.setImg = function(){
        imgData = ctx.getImageData(0, 0, myCanvas.width, myCanvas.height);
        rect = {startX:0,startY:0,w:myCanvas.width,h:myCanvas.height};
    }
    this.getRect = function(){
        if(rect.w < 0){
            // console.log(rect);
            rect.w = -rect.w;
            rect.startX -= rect.w;
        }
        if(rect.h < 0){
            // console.log(rect);
            rect.h = -rect.h;
            rect.startY -= rect.h;
        }
        return rect;
    }
    this.setDraw = function(d){
        isDraw = d;
    }
    this.getImgData = function(){
        rect = this.getRect();
        console.log(rect);
        ctx.putImageData(imgData, 0, 0);
        var img = ctx.getImageData(rect.startX, rect.startY, rect.w, rect.h);
        drawRect("stroke");
        return img;
    }

    function mouseDown(e) {
        if (isDraw){
            ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
            ctx.putImageData(imgData, 0, 0);
            rect.startX = e.pageX - this.offsetLeft - 10;
            rect.startY = e.pageY - this.offsetTop - 10;
            ctx.moveTo(e.pageX - this.offsetX, e.pageY - this.offsetY);
        }
        drag = true;
    }

    function mouseUp() {
        drag = false;
    }

    function mouseMove(e) {
        if (isDraw && drag) {
            rect.w = (e.pageX - this.offsetLeft - 10) - rect.startX;
            rect.h = (e.pageY - this.offsetTop - 10) - rect.startY;
            ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
            ctx.putImageData(imgData, 0, 0);
            drawRect("stroke");
        }
    }
    // var x, y;
    function touchStart(e){
        var touch = e.targetTouches[0];
        if (isDraw){
            // x = window.pageXOffset,y = window.pageYOffset;
            ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
            ctx.putImageData(imgData, 0, 0);
            rect.startX = touch.pageX - this.offsetLeft - 10;
            rect.startY = touch.pageY - this.offsetTop - 10;
            ctx.moveTo(touch.pageX - this.offsetX, touch.pageY - this.offsetY);
            e.preventDefault();
        }
        drag = true;
    }

    function touchEnd(e){
        drag = false;
    }
    
    function touchMove(e){
        var touch = e.targetTouches[0];
        
        if (isDraw && drag) {
            rect.w = (touch.pageX - this.offsetLeft - 10) - rect.startX;
            rect.h = (touch.pageY - this.offsetTop - 10) - rect.startY;
            ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
            ctx.putImageData(imgData, 0, 0);
            drawRect("stroke");
            // window.scrollTo(x,y);
            // ctx.moveTo(touch.pageX-this.offsetX,touch.pageY-this.offsetY);
        }
    }

    function drawRect(style) {
        ctx.fillStyle = "#93fff638";
        ctx.strokeStyle = '#0099cc';
        if (style === "fill") {
            ctx.fillRect(rect.startX, rect.startY, rect.w, rect.h);
        }
        if (style === "stroke") {
            ctx.strokeRect(rect.startX, rect.startY, rect.w, rect.h);
        }
    }
}

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
            // console.log(selector.value);
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
