let cameraOn = false;
let stream = null;
let foods = [];

// -------------------------
// 카메라 켜기
// -------------------------
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

// -------------------------
// 카메라 끄기
// -------------------------
function stopCamera() {
    const video = document.getElementById("camera");
    const btn = document.getElementById("cameraBtn");

    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }

    video.srcObject = null;
    cameraOn = false;
    btn.textContent = "카메라 켜기";
    document.getElementById("captureBtn").disabled = true;
}

// -------------------------
// 촬영
// -------------------------
function captureImage() {
    const video = document.getElementById("camera");

    if (!cameraOn) {
        alert("먼저 카메라를 켜세요!");
        return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imgData = canvas.toDataURL("image/png");

    const list = document.getElementById("foodList");
    const li = document.createElement("li");
    li.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
            <img src="${imgData}" style="width:80px; border-radius:8px;">
            <span>촬영한 이미지</span>
        </div>
    `;
    list.appendChild(li);

    alert("촬영 완료!");
}

// -------------------------
// 촬영 삭제
// -------------------------
function clearCamera() {
    const video = document.getElementById("camera");

    video.srcObject = null;

    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }

    cameraOn = false;
    document.getElementById("cameraBtn").textContent = "카메라 켜기";
    document.getElementById("captureBtn").disabled = true;

    alert("촬영이 삭제되었습니다!");
}

// -------------------------
// D-day 계산
// -------------------------
function getDday(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);

    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry - today;
    const diffDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDay > 1) return `D-${diffDay}`;
    if (diffDay === 1) return "D-1 임박 ⚠️";
    if (diffDay === 0) return "D-0 오늘 ⚠️";
    return "유통기한 지남 ❌";
}

// -------------------------
// 상태 확인
// -------------------------
function showStatus() {
    const date = document.getElementById("expiryDate").value;

    if (!date) {
        alert("유통기한을 입력하세요!");
        return;
    }

    const status = getDday(date);
    document.getElementById("statusMessage").textContent = status;
}

// -------------------------
// 식품 추가
// -------------------------
async function addFood() {
    const foodNameInput = document.getElementById("foodName");
    const expiryDateInput = document.getElementById("expiryDate");

    const foodName = foodNameInput.value.trim();
    const expiryDate = expiryDateInput.value;

    if (!foodName || !expiryDate) {
        alert("식품 이름과 유통기한을 모두 입력하세요!");
        return;
    }

    // 알림 권한 요청
    await requestNotificationPermission();

    const food = {
        id: Date.now(),
        name: foodName,
        expiryDate: expiryDate,
        notified: false
    };

    foods.push(food);
    saveFoods();
    renderFoodList();

    // 오늘 날짜면 추가 직후 바로 알림 검사
    checkExpiryNotifications();

    foodNameInput.value = "";
    expiryDateInput.value = "";

    alert("식품이 추가되었습니다!");
}

// -------------------------
// 리스트 출력
// -------------------------
function renderFoodList() {
    const list = document.getElementById("foodList");
    list.innerHTML = "";

    foods.forEach(food => {
        const li = document.createElement("li");
        li.innerHTML = `
            <div class="food-info">
                <span class="food-name">${food.name}</span>
                <span class="food-date">유통기한: ${food.expiryDate}</span>
                <span class="food-dday">${getDday(food.expiryDate)}</span>
            </div>
            <button class="delete-btn" onclick="deleteFood(${food.id})">삭제</button>
        `;
        list.appendChild(li);
    });
}

// -------------------------
// 식품 삭제
// -------------------------
function deleteFood(id) {
    foods = foods.filter(food => food.id !== id);
    saveFoods();
    renderFoodList();
}

// -------------------------
// 저장 / 불러오기
// -------------------------
function saveFoods() {
    localStorage.setItem("foods", JSON.stringify(foods));
}

function loadFoods() {
    const saved = localStorage.getItem("foods");
    if (saved) {
        foods = JSON.parse(saved);
    }
}

// -------------------------
// 알림 권한 요청
// -------------------------
async function requestNotificationPermission() {
    if (!("Notification" in window)) {
        alert("이 브라우저는 알림을 지원하지 않습니다.");
        return false;
    }

    if (Notification.permission === "granted") {
        return true;
    }

    if (Notification.permission === "denied") {
        alert("브라우저에서 알림이 차단되어 있습니다. 사이트 설정에서 알림을 허용해주세요.");
        return false;
    }

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
        return true;
    } else {
        alert("알림 권한이 허용되지 않았습니다.");
        return false;
    }
}

// -------------------------
// 브라우저 알림 보내기
// -------------------------
function sendNotification(title, body) {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
        new Notification(title, { body });
    }
}

// -------------------------
// 유통기한 당일 알림 검사
// -------------------------
function checkExpiryNotifications() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let changed = false;

    foods.forEach(food => {
        const expiry = new Date(food.expiryDate);
        expiry.setHours(0, 0, 0, 0);

        if (expiry.getTime() === today.getTime() && !food.notified) {
            sendNotification(
                "유통기한 알림",
                `${food.name}의 유통기한이 오늘까지입니다!`
            );
            food.notified = true;
            changed = true;
        }
    });

    if (changed) {
        saveFoods();
        renderFoodList();
    }
}

// -------------------------
// 페이지 로드 시 실행
// -------------------------
window.addEventListener("load", async function () {
    const today = new Date();
    const formatted = today.toISOString().split("T")[0];
    const el = document.getElementById("todayDate");

    if (el) {
        el.textContent = `오늘 날짜: ${formatted}`;
    }

    loadFoods();
    renderFoodList();

    // 페이지 열 때도 알림 권한 확인
    await requestNotificationPermission();

    // 처음 한 번 검사
    checkExpiryNotifications();

    // 1분마다 다시 검사
    setInterval(checkExpiryNotifications, 60000);
});
