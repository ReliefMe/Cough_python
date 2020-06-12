//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var bgumStream; //stream from getUserMedia()
var brec; //Recorder.js object
var binput; //MediaStreamAudioSourceNode we'll be recording

// shim for AudioContext when it's not avb. 
var bAudioContext = window.AudioContext || window.webkitAudioContext;
var baudioContext //audio context to help us record

var brecordButton = document.getElementById("recordBreathButton");

let breath_timer;

//add events to those 2 buttons
brecordButton.addEventListener("click", startBreathRecording);

function startBreathRecording() {
	document.getElementById('bulb_breath').style.display = 'inline-block';
	document.querySelector('#recordButton').disabled = true;

	// console.log("recordButton clicked");
	breath_timer = setTimeout(stopBreathRecording, 13000);

	var constraints = {
		audio: true,
		video: false
	}

	brecordButton.disabled = true;

	navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
		console.log("getUserMedia() success, stream created, initializing Recorder.js ...");

		/*
			create an audio context after getUserMedia is called
			sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
			the sampleRate defaults to the one set in your OS for your playback device
		*/
		baudioContext = new AudioContext();

		/*  assign to bgumStream for later use  */
		bgumStream = stream;

		/* use the stream */
		binput = baudioContext.createMediaStreamSource(stream);

		/* 
			Create the Recorder object and configure to record mono sound (1 channel)
			Recording 2 channels  will double the file size
		*/
		brec = new Recorder(binput, {
			numChannels: 1
		})

		//start the recording process
		brec.record()

		console.log("Recording started");

	}).catch(function (err) {
		//enable the record button if getUserMedia() fails
		brecordButton.disabled = false;
		document.querySelector('#recordButton').disabled = coughHasRecorded ? true : false;
	});
}


function stopBreathRecording() {
	// Setting some states and values
	document.getElementById('bulb_breath').style.display = 'none';
	document.querySelector('#recordButton').disabled = coughHasRecorded ? true : false;
	clearTimeout(breath_timer);

	//tell the recorder to stop the recording
	brec.stop();

	//stop microphone access
	bgumStream.getAudioTracks()[0].stop();

	//create the wav blob and pass it on to createDownloadLink
	brec.exportWAV(createBreathDownloadLink);
}

function createBreathDownloadLink(blob) {

	var url = URL.createObjectURL(blob);
	var au = document.createElement('audio');
	var li = document.createElement('li');

	//add controls to the <audio> element
	au.controls = true;
	au.src = url;
	au.id = "breath-audio";

	//add the new audio element to li
	li.appendChild(au);

	// ! setting recorded state
	breathHasRecorded = true;

	//add the li element to the ol
	recordingsBreathList.appendChild(li);
	brecordButton.disabled = true;
	document.querySelector('#del-breath').style.display = 'inline-block';
}

// Adding delete cough event on button click
document.querySelector('#del-breath').addEventListener('click', () => {
	let li = document.querySelector('#recordingsBreathList li');

	// ! setting recorded state
	breathHasRecorded = false;

	li.remove();
	brecordButton.disabled = false;
	document.querySelector('#del-breath').style.display = 'none';
});