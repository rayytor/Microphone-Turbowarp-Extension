(function(Scratch) {
  'use strict';

  class MicRecorder {
    constructor(runtime) {
      this.runtime = runtime; 
      this.mediaRecorder = null;
      this.chunks = [];
      this.recordings = [];
      this.audioElement = null;

      this.stageOverlay = null;
      this.startTime = null;
      this.timerInterval = null;

      // Hook into stop events
      if (runtime) {
        runtime.on('PROJECT_STOP_ALL', this.handleStopAll.bind(this));
      }
    }

    getInfo() {
      return {
        id: 'micRecorder',
        name: 'Microphone Recorder',
        color1: '#ff0000',
        color2: '#D10000',
        color3: '#A30000',
        blocks: [
          { opcode: 'startRecording', blockType: Scratch.BlockType.COMMAND, text: 'start microphone recording' },
          { opcode: 'stopRecording', blockType: Scratch.BlockType.COMMAND, text: 'stop microphone recording' },
          { opcode: 'playLastRecording', blockType: Scratch.BlockType.COMMAND, text: 'play last recording' },
          { opcode: 'stopPlayback', blockType: Scratch.BlockType.COMMAND, text: 'stop playback' }
        ]
      };
    }

    async startRecording() {
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorder = new MediaRecorder(stream);
        this.chunks = [];

        this.mediaRecorder.ondataavailable = e => {
          if (e.data.size > 0) this.chunks.push(e.data);
        };

        this.mediaRecorder.start();
        this.startTime = Date.now();
        this.addStageOverlay();
      } catch (err) {
        alert('Microphone error: ' + err);
      }
    }

    stopRecording() {
      if (!this.mediaRecorder || (this.mediaRecorder.state !== 'recording' && this.mediaRecorder.state !== 'paused')) return;

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'audio/webm' });
        this.chunks = [];
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        this.mediaRecorder = null;

        const audio = new Audio(URL.createObjectURL(blob));
        this.recordings.push({ blob, audio });
        this.audioElement = audio;

        this.removeStageOverlay();
      };

      this.mediaRecorder.stop();
    }

    playLastRecording() {
      if (!this.audioElement) return;
      this.audioElement.play();
    }

    stopPlayback() {
      if (!this.audioElement) return;
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }

    addStageOverlay() {
      if (this.stageOverlay) return;

      const overlay = document.createElement('div');
      overlay.style.position = 'absolute';
      overlay.style.top = '40px';
      overlay.style.left = '50%';
      overlay.style.transform = 'translateX(-50%)';
      overlay.style.padding = '10px 20px';
      overlay.style.background = 'rgba(255,0,0,0.85)';
      overlay.style.color = 'white';
      overlay.style.fontFamily = 'Arial, sans-serif';
      overlay.style.fontSize = '18px';
      overlay.style.fontWeight = 'bold';
      overlay.style.borderRadius = '8px';
      overlay.style.textAlign = 'center';
      overlay.style.zIndex = '9999';
      overlay.innerHTML = `<div>Recording: 0s</div><div style="margin-top:5px; width:200px; height:10px; background:#a30000; border-radius:5px;"><div id="progressBar" style="height:100%; width:0%; background:#ff0000; border-radius:5px;"></div></div>`;

      document.body.appendChild(overlay);
      this.stageOverlay = overlay;

      const progressBar = overlay.querySelector('#progressBar');

      this.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        overlay.firstChild.innerText = `Recording: ${elapsed}s`;
        const progressPercent = Math.min(elapsed / 60 * 100, 100);
        progressBar.style.width = `${progressPercent}%`;
      }, 250);
    }

    removeStageOverlay() {
      if (this.stageOverlay) document.body.removeChild(this.stageOverlay);
      this.stageOverlay = null;
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Handle TurboWarp/Scratch stop button
    handleStopAll() {
      if (this.mediaRecorder && (this.mediaRecorder.state === 'recording' || this.mediaRecorder.state === 'paused')) {
        this.stopRecording();
      }
    }
  }

  Scratch.extensions.register(new MicRecorder());
})(Scratch);
