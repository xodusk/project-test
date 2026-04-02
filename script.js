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


// 📅 D-day 계산 함수
function getDday(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);

    today.setHours(0,0,0,0);
    expiry.setHours(0,0,0,0);

    const diffTime = expiry - today;
    const diffDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDay > 1) return `D-${diffDay}`;
    if (diffDay === 1) return "D-1 임박 ⚠️";
    if (diffDay === 0) return "D-0 오늘 ⚠️";
    return "유통기한 지남 ❌";
}

// 📢 상태 표시 함수
function showStatus() {
    const date = document.getElementById("expiryDate").value;

    if (!date) {
        alert("유통기한을 입력하세요!");
        return;
    }

    const status = getDday(date);
    document.getElementById("statusMessage").textContent = status;
}

// 📆 오늘 날짜 표시 (기존 onload에 추가용)
window.addEventListener("load", function () {
    const today = new Date();
    const formatted = today.toISOString().split("T")[0];
    const el = document.getElementById("todayDate");
    if (el) {
        el.textContent = `오늘 날짜: ${formatted}`;
    }
});// 📅 D-day 계산 함수
function getDday(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);

    today.setHours(0,0,0,0);
    expiry.setHours(0,0,0,0);

    const diffTime = expiry - today;
    const diffDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDay > 1) return `D-${diffDay}`;
    if (diffDay === 1) return "D-1 임박 ⚠️";
    if (diffDay === 0) return "D-0 오늘 ⚠️";
    return "유통기한 지남 ❌";
}

// 📢 상태 표시 함수
function showStatus() {
    const date = document.getElementById("expiryDate").value;

    if (!date) {
        alert("유통기한을 입력하세요!");
        return;
    }

    const status = getDday(date);
    document.getElementById("statusMessage").textContent = status;
}

// 📆 오늘 날짜 표시 (기존 onload에 추가용)
window.addEventListener("load", function () {
    const today = new Date();
    const formatted = today.toISOString().split("T")[0];
    const el = document.getElementById("todayDate");
    if (el) {
        el.textContent = `오늘 날짜: ${formatted}`;
    }
});

// 📸 촬영 내용 삭제 (카메라 초기화)
function clearCamera() {
    const video = document.getElementById("camera");

    // 영상 비우기
    video.srcObject = null;

    // 스트림 종료
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }

    cameraOn = false;

    // 버튼 상태 초기화
    document.getElementById("cameraBtn").textContent = "카메라 켜기";
    document.getElementById("captureBtn").disabled = true;

    alert("촬영이 삭제되었습니다!");
}
