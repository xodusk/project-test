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
        alert("모두 입력하세요!");
        return;
    }

    let foods = JSON.parse(localStorage.getItem("foods")) || [];

    foods.push({ name, date });

    localStorage.setItem("foods", JSON.stringify(foods));

    displayFood(name, date);
}

// 📋 화면에 표시
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
        video: { facingMode: "environment" } // 📱 후면 카메라
    })
    .then(stream => {
        video.srcObject = stream;
        video.play();
    })
    .catch(error => {
        console.error(error);

        if (error.name === "NotAllowedError") {
            alert("카메라 권한을 허용해주세요!");
        } else {
            alert("카메라 실행 실패");
        }
    });
}

// 📷 촬영 (현재는 틀만)
function captureImage() {
    alert("촬영 완료! (나중에 OCR/AI 연결 예정)");
}