import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonLabel, IonIcon } from '@ionic/angular/standalone';
import { Category, DrawingUtils, FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { addIcons } from 'ionicons';
import { fingerPrint, close } from 'ionicons/icons';
// Category: a classification of a detected object or feature
// DrawingUtils: utility functions for drawing on a canvas
// FaceLandmarker: a machine learning model for facial landmark detection
// FilesetResolver: a utility class for resolving file paths for ML models



@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonLabel, IonIcon,],
})
export class HomePage {

  // ML Model and properties (WASM & Model provided by Google, you can place your own).
  faceLandmarker!: FaceLandmarker;
  wasmUrl: string = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
  modelAssetPath: string = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
  // Native elements and types we need to interact to later.
  video!: HTMLVideoElement;
  canvasElement!: HTMLCanvasElement;
  canvasCtx!: CanvasRenderingContext2D;
  // A state to toggle functionality.
  tracking: boolean = false;
  // A challenge state for the user.
  userDidBlink: boolean = false;

   async ngOnInit(): Promise<void> {
    this.faceLandmarker = await FaceLandmarker.createFromOptions(await FilesetResolver.forVisionTasks(this.wasmUrl), {
      baseOptions: { modelAssetPath: this.modelAssetPath, delegate: "GPU" },
      outputFaceBlendshapes: true, // We will draw the face mesh in canvas.
      runningMode: "VIDEO",
    }); // When FaceLandmarker is ready, you'll see in the console: Graph successfully started running.
  }

  async ngAfterViewInit(): Promise<void> {
    this.video = document.getElementById("user-video") as HTMLVideoElement;
    this.canvasElement = document.getElementById("user-canvas") as HTMLCanvasElement;
    this.canvasCtx = this.canvasElement.getContext("2d") as CanvasRenderingContext2D;
  }

  toggleTracking = () => (this.tracking = !this.tracking, this.tracking ? this.startTracking() : this.stopTracking());

  startTracking() {
    // Check if we can access user media api.
    (!(!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) || !this.faceLandmarker) && (console.warn("user media or ml model is not available"), false);
    // Everything is ready to go!
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => (this.video.srcObject = stream, this.video.addEventListener("loadeddata", predictWebcam)));
    let lastVideoTime = -1; let results: any = undefined; const drawingUtils = new DrawingUtils(this.canvasCtx!);
    let predictWebcam = async () => {
      // // Resize the canvas to match the video size.
      // this.canvasElement.width = this.video.videoWidth; this.canvasElement.height = this.video.videoHeight;
      const radio = this.video.videoHeight / this.video.videoWidth;
      // this.video.style.width = videoWidth + "px";
      // this.video.style.height = videoWidth * radio + "px";
      this.canvasElement.style.width = this.video.videoWidth + "px";
      this.canvasElement.style.height = this.video.videoWidth * radio + "px";
      this.canvasElement.width = this.video.videoWidth;
      this.canvasElement.height = this.video.videoHeight;
      // Send the video frame to the model.
      lastVideoTime !== this.video.currentTime && (lastVideoTime = this.video.currentTime, results = this.faceLandmarker.detectForVideo(this.video, Date.now()));
      // Draw the results on the canvas (comment this out to improve performance or add even more markers like mouth, etc).
      if (results.faceLandmarks) for (const landmarks of results.faceLandmarks) {
        // console.log(landmarks);
        // console.log(FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE);
        // this.canvasCtx.beginPath();
        // this.canvasCtx.moveTo(0, 0);
        // this.canvasCtx.lineTo(300, 150);
        // this.canvasCtx.stroke();
        for(var i = 0; i < FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE.length; i++) {
          var startArray = FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE[i].start
          var endArray = FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE[i].end

          var startPoint = landmarks[startArray]
          var endPoint = landmarks[endArray]

          // console.log(startPoint)
          // console.log(endPoint)
          // this.canvasCtx.lineWidth = 10;
          this.canvasCtx.beginPath();
          this.canvasCtx.moveTo((startPoint.x * this.video.videoWidth), (startPoint.y * this.video.videoHeight));
          this.canvasCtx.lineTo((endPoint.x * this.video.videoWidth), (endPoint.y * this.video.videoHeight));
          this.canvasCtx.strokeStyle = "red";
          this.canvasCtx.stroke();
        }
        // drawingUtils.drawConnectors(
        //   landmarks,
        //   FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
        //   { color: "#FF3030" }
        // );
        // drawingUtils.drawConnectors(
        //   landmarks,
        //   FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
        //   { color: "#30FF30" }
        // );

      };
      // Check if the user blinked (you can customize this to expect a smile, etc). Let's assume there is only one face.
      // if (results.faceLandmarks && results.faceBlendshapes && results.faceBlendshapes[0] && results.faceBlendshapes![0].categories?.find(
      //   (shape: Category) => shape?.categoryName == "eyeBlinkRight")?.score > 0.4) (this.userDidBlink = true, console.log('Blink Blink'));
      // Call this function again to keep predicting when the browser is ready.
      this.tracking == true && window.requestAnimationFrame(predictWebcam);
    }
  }

  stopTracking() { // Stop and clear the video & canvas
    this.tracking = false; (this.video.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    this.video.srcObject = null; this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
  }


  constructor() {
    addIcons({ fingerPrint, close });
  }
}
