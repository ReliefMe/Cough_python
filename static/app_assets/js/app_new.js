//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; //stream from getUserMedia()
var rec; //Recorder.js object
var input; //MediaStreamAudioSourceNode we'll be recording

// shim for AudioContext when it's not avb. 
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext //audio context to help us record

var recordButton = document.getElementById("recordButton");

let timer;

//add events to those 2 buttons
recordButton.addEventListener("click", startRecording);

function startRecording() {
	document.getElementById('bulb').style.display = 'inline-block';
	document.querySelector('#recordBreathButton').disabled = true;

	console.log("recordButton clicked");
	timer = setTimeout(stopRecording, 13000);
	/*
		Simple constraints object, for more advanced audio features see
		https://addpipe.com/blog/audio-constraints-getusermedia/
	*/

	var constraints = {
		audio: true,
		video: false
	}

	/*
    	Disable the record button until we get a success or fail from getUserMedia() 
	*/

	recordButton.disabled = true;

	/*
    	We're using the standard promise based getUserMedia() 
    	https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
	*/

	navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
		console.log("getUserMedia() success, stream created, initializing Recorder.js ...");

		/*
			create an audio context after getUserMedia is called
			sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
			the sampleRate defaults to the one set in your OS for your playback device
		*/
		audioContext = new AudioContext();

		/*  assign to gumStream for later use  */
		gumStream = stream;

		/* use the stream */
		input = audioContext.createMediaStreamSource(stream);

		/* 
			Create the Recorder object and configure to record mono sound (1 channel)
			Recording 2 channels  will double the file size
		*/
		rec = new Recorder(input, {
			numChannels: 1
		})

		//start the recording process
		rec.record()

		console.log("Recording started");

	}).catch(function (err) {
		//enable the record button if getUserMedia() fails
		document.querySelector('#recordBreathButton').disabled = breathHasRecorded ? true : false;
		recordButton.disabled = false;
	});
}


function stopRecording() {
	document.getElementById('bulb').style.display = 'none';
	document.querySelector('#recordBreathButton').disabled = breathHasRecorded ? true : false;
	clearTimeout(timer);

	//disable the stop button, enable the record too allow for new recordings

	//tell the recorder to stop the recording
	rec.stop();

	//stop microphone access
	gumStream.getAudioTracks()[0].stop();

	//create the wav blob and pass it on to createDownloadLink
	rec.exportWAV(createDownloadLink);
}

function createDownloadLink(blob) {

	var url = URL.createObjectURL(blob);
	var au = document.createElement('audio');
	var li = document.createElement('li');

	//add controls to the <audio> element
	au.controls = true;
	au.src = url;
	au.id = "cough-audio";

	//add the new audio element to li
	li.appendChild(au);

	// ! setting recorded state
	coughHasRecorded = true;

	//add the li element to the ol
	recordingsList.appendChild(li);
	recordButton.disabled = true;
	document.querySelector('#del-cough').style.display = 'inline-block';
}

// Adding delete cough event on button click
document.querySelector('#del-cough').addEventListener('click', () => {
	let li = document.querySelector('#recordingsList li');

	// ! setting recorded state
	coughHasRecorded = false;

	li.remove();
	recordButton.disabled = false;
	document.querySelector('#del-cough').style.display = 'none';
});