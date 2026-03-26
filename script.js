let cameraOn = false;

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

    // ❗ 입력 안 했을 때
    if (!name || !date) {
        alert("식품 이름과 유통기한을 모두 입력하세요!");
        return;
    }

    let foods = JSON.parse(localStorage.getItem("foods")) || [];

    foods.push({ name, date });

    localStorage.setItem("foods", JSON.stringify(foods));

    displayFood(name, date);

    // ✅ 성공 알림
    alert("추가되었습니다!");

    // 입력 초기화
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

// 📸 카메라 켜기
function startCamera() {
    const video = document.getElementById("camera");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("이 브라우저에서는 카메라를 지원하지 않습니다.");
        return;
    }

    navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
    })
    .then(stream => {
        video.srcObject = stream;
        video.play();

        cameraOn = true;
        document.getElementById("captureBtn").disabled = false;
    })
    .catch(() => {
        alert("카메라 권한을 허용해주세요!");
    });
}

// 📷 촬영
function captureImage() {
    if (!cameraOn) {
        alert("먼저 카메라를 켜세요!");
        return;
    }

    alert("촬영 완료! (나중에 자동 인식 추가 예정)");
}