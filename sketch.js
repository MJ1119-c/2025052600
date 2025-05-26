let video;
let facemesh;
let predictions = [];
let imgOpen, imgClose;

function preload() {
  imgOpen = loadImage('00.png');
  imgClose = loadImage('01.png');
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

function modelReady() {
  // 模型載入完成
}

function draw() {
  image(video, 0, 0, width, height);

  if (predictions.length > 0) {
    const keypoints = predictions[0].scaledMesh;

    // 嘴巴開合判斷（第13和14點）
    const [x1, y1] = keypoints[13];
    const [x2, y2] = keypoints[14];
    let mouthOpen = dist(x1, y1, x2, y2) > 20;

    // 以鼻子（168點）為中心，眼距決定面罩大小
    const [cx, cy] = keypoints[168];
    const [lx, ly] = keypoints[33];  // 左眼角
    const [rx, ry] = keypoints[263]; // 右眼角
    let maskW = dist(lx, ly, rx, ry) * 2; // 面罩寬
    let maskH = maskW * (imgOpen.height / imgOpen.width); // 面罩高，依圖片比例

    // 選擇圖片
    let maskImg = mouthOpen ? imgOpen : imgClose;

    // 畫面罩（中心對齊鼻子）
    imageMode(CENTER);
    image(maskImg, cx, cy, maskW, maskH);
    imageMode(CORNER);
  }
}
