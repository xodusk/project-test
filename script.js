JavaScript
let cameraOn = false;
let stream = null;

// 📦 페이지 로드 시 데이터 불러오기
window.onload = function () {
    let foods = JSON.parse(localStorage.getItem("foods")) || [];
    foods.forEach((food, index) => {
        displayFood(food.name, food.date, index);
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

    // 화면 새로고침 대신 리스트 초기화 후 다시 그리기 (인덱스 관리를 위해)
    refreshList();

    document.getElementById("foodName").value = "";
    document.getElementById("expiryDate").value = "";
}

// 📋 리스트 새로고침 (삭제/추가 시 인덱스 동기화)
function refreshList() {
    const list = document.getElementById("foodList");
    list.innerHTML = ""; // 기존 리스트 비우기
    let foods = JSON.parse(localStorage.getItem("foods")) || [];
    foods.forEach((food, index) => {
        displayFood(food.name, food.date, index);
    });
}

// 🖼️ 화면 표시 (삭제 버튼 추가)
function displayFood(name, date, index) {
    const list = document.getElementById("foodList");

    const li = document.createElement("li");
    li.innerHTML = `
        <span>${name} - ${date}</span>
        <button onclick="deleteFood(${index})" style="background-color: #ff4d4d; margin-left: 10px; padding: 5px 10px;">삭제</button>
    `;

    list.appendChild(li);
}

// ❌ 식품 삭제
function deleteFood(index) {
    if (confirm("정말 삭제하시겠습니까?")) {
        let foods = JSON.parse(localStorage.getItem("foods")) || [];
        foods.splice(index, 1); // 해당 인덱스의 아이템 삭제
        localStorage.setItem("foods", JSON.stringify(foods));
        refreshList(); // 화면 업데이트
    }
}

// --- 카메라 관련 함수들 (기존과 동일) ---
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

function captureImage() {
    if (!cameraOn) return alert("먼저 카메라를 켜세요!");
    alert("촬영 완료!");
    stopCamera();
}