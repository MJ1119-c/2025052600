let video;
let facemesh;
let predictions = [];
let maskOpen, maskClose;

function preload() {
  maskOpen = loadImage('00.png');
  maskClose = loadImage('01.png');
}

function setup() {
  createCanvas(640, 480).position(
    (windowWidth - 640) / 2,
    (windowHeight - 480) / 2
  );
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  facemesh = ml5.facemesh(video, modelReady);
  facemesh.on('predict', results => {
    predictions = results;
  });
}

function modelReady() {}

function draw() {
  image(video, 0, 0, width, height);

  fill(0, 255, 0);
  noStroke();
  textSize(24);
  text("faces: " + predictions.length, 10, 30);

  if (predictions.length > 0) {
    const keypoints = predictions[0].scaledMesh;

    // 嘴巴開合判斷（第13和14點）
    const [mx1, my1] = keypoints[13];
    const [mx2, my2] = keypoints[14];
    let mouthOpen = dist(mx1, my1, mx2, my2) > 20;

    // 以鼻子（168點）為中心，眼距決定面罩大小
    const [cx, cy] = keypoints[168];
    const [lx, ly] = keypoints[33];
    const [rx, ry] = keypoints[263];
    let maskW = dist(lx, ly, rx, ry) * 2.2;
    let maskH = maskW * (maskOpen.height / maskOpen.width);

    let maskImg = mouthOpen ? maskOpen : maskClose;

    imageMode(CENTER);
    image(maskImg, cx, cy, maskW, maskH);
    imageMode(CORNER);

    // 只在第94點畫紅色圓
    const [x, y] = keypoints[94];
    noFill();
    stroke(255, 0, 0);
    strokeWeight(4);
    ellipse(x, y, 100, 100);
  }
}
