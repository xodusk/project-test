let cameraOn = false;
let stream = null;

// 카메라 켜기
function startCamera() {
    const video = document.getElementById("camera");
    const btn = document.getElementById("cameraBtn");

    if (cameraOn) {
        stopCamera();
        return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("카메라를 지원하지 않는 브라우저입니다.");
        return;
    }

    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(s => {
            stream = s;
            video.srcObject = stream;
            video.play();
            cameraOn = true;
            btn.textContent = "카메라 끄기";
            document.getElementById("captureBtn").disabled = false;
        })
        .catch(() => {
            alert("카메라 권한을 허용해주세요!");
        });
}

// 카메라 끄기
function stopCamera() {
    const video = document.getElementById("camera");
    const btn = document.getElementById("cameraBtn");
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
    cameraOn = false;
    btn.textContent = "카메라 켜기";
    document.getElementById("captureBtn").disabled = true;
}

// 촬영
function captureImage() {
    const video = document.getElementById("camera");

    if (!cameraOn) return alert("먼저 카메라를 켜세요!");

    // 캔버스 생성
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 이미지 데이터 URL 생성
    const imgData = canvas.toDataURL("image/png");

    // 리스트에 이미지 표시
    const list = document.getElementById("foodList");
    const li = document.createElement("li");
    li.innerHTML = `<img src="${imgData}" style="width: 80px; margin-right: 10px; border-radius: 8px;"> <span>촬영한 이미지</span>`;
    list.appendChild(li);

    alert("촬영 완료!");
}
