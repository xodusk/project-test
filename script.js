let cameraOn = false;
let stream = null;

// 📦 페이지 로드 시 데이터 불러오기
window.onload = function () {
    let foods = JSON.parse(localStorage.getItem("foods")) || [];

    foods.forEach(food => {
        displayFood(food.name, food.date);
    });
};

// ➕ 식품 추가
function addFood() {
    const name = document.getElementById("foodName").value;
    const date = document.getElementById("expiryDate").value;

    if (!name || !date) {
        alert("식품 이름과 유통기한을 모두 입력하세요!");
        return;
    }

    let foods = JSON.parse(localStorage.getItem("foods")) || [];

    foods.push({ name, date });

    localStorage.setItem("foods", JSON.stringify(foods));

    displayFood(name, date);

    alert("추가되었습니다!");

    document.getElementById("foodName").value = "";
    document.getElementById("expiryDate").value = "";
}

// 📋 화면 표시
function displayFood(name, date) {
    const list = document.getElementById("foodList");

    const li = document.createElement("li");
    li.textContent = name + " - " + date;

    list.appendChild(li);
}

// 📸 카메라 켜기 / 끄기 (토글)
function startCamera() {
    const video = document.getElementById("camera");
    const btn = document.getElementById("cameraBtn");

    // 👉 켜져 있으면 끄기
    if (cameraOn) {
        stopCamera();
        return;
    }

    // 👉 켜기
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("카메라를 지원하지 않는 브라우저입니다.");
        return;
    }

    navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
    })
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

// 📸 카메라 끄기
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

// 📷 촬영
function captureImage() {
    if (!cameraOn) {
        alert("먼저 카메라를 켜세요!");
        return;
    }

    alert("촬영 완료! (나중에 자동 인식 추가 예정)");

    // 🔥 촬영 후 자동 종료
    stopCamera();
}