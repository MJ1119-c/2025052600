let video;
let facemesh;
let handpose;
let predictions = [];
let handPredictions = [];
let gesture = "none"; // stone, paper, scissors

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

  handpose = ml5.handpose(video, handReady);
  handpose.on('predict', results => {
    handPredictions = results;
    if (handPredictions.length > 0) {
      gesture = detectGesture(handPredictions[0].landmarks);
    }
  });
}

function modelReady() {}
function handReady() {}

function draw() {
  image(video, 0, 0, width, height);

  // Debug: 顯示偵測到的臉部數量
  fill(0, 255, 0);
  noStroke();
  textSize(24);
  text("faces: " + predictions.length, 10, 30);

  if (predictions.length > 0) {
    const keypoints = predictions[0].scaledMesh;

    // 嘴巴開合判斷（第13和14點）
    const [mx1, my1] = keypoints[13];
    const [mx2, my2] = keypoints[14];
    let mouthOpen = dist(mx1, my1, mx2, my2) > 20; // 20可依實際情況調整

    // 以鼻子（168點）為中心，眼距決定面罩大小
    const [cx, cy] = keypoints[168];
    const [lx, ly] = keypoints[33];  // 左眼角
    const [rx, ry] = keypoints[263]; // 右眼角
    let maskW = dist(lx, ly, rx, ry) * 2.2; // 面罩寬，2.2可微調
    let maskH = maskW * (maskOpen.height / maskOpen.width); // 面罩高，依圖片比例

    // 選擇圖片
    let maskImg = mouthOpen ? maskOpen : maskClose;

    // 畫面罩（中心對齊鼻子）
    imageMode(CENTER);
    image(maskImg, cx, cy, maskW, maskH);
    imageMode(CORNER);

    // Debug: 顯示鼻子座標
    const [nx, ny] = keypoints[94];
    fill(255, 255, 0);
    noStroke();
    ellipse(nx, ny, 10, 10); // 在鼻子畫一個小黃點

    // 顯示辨識到的手勢字幕
    if (gesture === "stone" || gesture === "scissors" || gesture === "paper") {
      fill(255, 0, 0);
      noStroke();
      textSize(48);
      textAlign(CENTER, TOP);
      let label = "";
      if (gesture === "stone") label = "石頭";
      if (gesture === "scissors") label = "剪刀";
      if (gesture === "paper") label = "布";
      text(label, width / 2, 40);
    }

    let x, y;
    if (gesture === "stone") {
      [x, y] = keypoints[10]; // 額頭
    } else if (gesture === "scissors") {
      [x, y] = keypoints[234]; // 左臉頰
    } else if (gesture === "paper") {
      [x, y] = keypoints[152]; // 下巴
    } else {
      [x, y] = keypoints[19]; // 預設在keypoint 19（鼻樑上方）
    }
    noFill();
    stroke(255, 0, 0);
    strokeWeight(12);
    ellipse(x, y, 60, 60);
  }
}

// 簡單手勢辨識：根據手指伸展情況判斷剪刀石頭布
function detectGesture(landmarks) {
  // 取得每根手指的指尖與掌心距離
  // landmarks: [21][x, y, z]
  // 指尖: 8(食), 12(中), 16(無), 20(小)
  // 掌心: 0
  const palm = landmarks[0];
  const tips = [8, 12, 16, 20].map(i => landmarks[i]);
  const dists = tips.map(tip => dist(palm[0], palm[1], tip[0], tip[1]));

  // 判斷規則（簡化版）：
  // 石頭：所有手指都彎曲（距離小於40）
  // 布：所有手指都伸直（距離大於80）
  // 剪刀：食指與中指伸直，其餘彎曲
  if (dists.every(d => d < 40)) return "stone";
  if (dists.every(d => d > 80)) return "paper";
  if (dists[0] > 80 && dists[1] > 80 && dists[2] < 40 && dists[3] < 40) return "scissors";
  return "none";
}
