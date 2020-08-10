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