let cameraOn = false;
let stream = null;
let foods = [];
let mode = null; // 🔥 추가 (barcode / ocr)

// -------------------------
// 모드 선택
// -------------------------
function setMode(selectedMode) {
    mode = selectedMode;

    document.getElementById("barcodeBtn").classList.remove("active");
    document.getElementById("ocrBtn").classList.remove("active");

    if (mode === "barcode") {
        document.getElementById("barcodeBtn").classList.add("active");
        alert("바코드 스캔 모드입니다");
    } else {
        document.getElementById("ocrBtn").classList.add("active");
        alert("유통기한 스캔 모드입니다");
    }
}

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
// 촬영 (🔥 핵심 수정)
// -------------------------
function captureImage() {
    const video = document.getElementById("camera");

    if (!cameraOn) {
        alert("먼저 카메라를 켜세요!");
        return;
    }

    if (!mode) {
        alert("먼저 모드를 선택하세요!");
        return;
    }

    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // 🔥 바코드 모드
    if (mode === "barcode") {
        const codeReader = new ZXing.BrowserBarcodeReader();

        codeReader.decodeFromCanvas(canvas)
            .then(result => {
                console.log("바코드:", result.text);

                // 👉 실제는 API 연결 가능
                document.getElementById("foodName").value = "상품명(예시)";

                alert("상품명 자동 입력 완료!");
            })
            .catch(() => {
                alert("바코드 인식 실패 😢");
            });
    }

    // 🔥 OCR 모드
    else if (mode === "ocr") {
        document.getElementById("statusMessage").textContent = "🔍 분석 중...";

        Tesseract.recognize(canvas, 'eng')
            .then(result => {
                const text = result.data.text;
                console.log(text);

                const dateMatch = text.match(/\d{4}[.\-\/]\d{2}[.\-\/]\d{2}/);

                if (dateMatch) {
                    document.getElementById("expiryDate").value = dateMatch[0];
                    alert("유통기한 자동 입력 완료!");
                } else {
                    alert("유통기한 인식 실패 😢");
                }

                document.getElementById("statusMessage").textContent = "";
            });
    }

    stopCamera();
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
// 알림 관련
// -------------------------
async function requestNotificationPermission() {
    if (!("Notification" in window)) return false;

    if (Notification.permission === "granted") return true;

    if (Notification.permission === "denied") return false;

    const permission = await Notification.requestPermission();
    return permission === "granted";
}

function sendNotification(title, body) {
    if (Notification.permission === "granted") {
        new Notification(title, { body });
    }
}

function checkExpiryNotifications() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let changed = false;

    foods.forEach(food => {
        const expiry = new Date(food.expiryDate);
        expiry.setHours(0, 0, 0, 0);

        if (expiry.getTime() === today.getTime() && !food.notified) {
            sendNotification("유통기한 알림", `${food.name}의 유통기한이 오늘까지입니다!`);
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
// 페이지 로드
// -------------------------
window.addEventListener("load", async function () {
    const today = new Date();
    const formatted = today.toISOString().split("T")[0];

    document.getElementById("todayDate").textContent = `오늘 날짜: ${formatted}`;

    loadFoods();
    renderFoodList();

    await requestNotificationPermission();

    checkExpiryNotifications();
    setInterval(checkExpiryNotifications, 60000);
});
