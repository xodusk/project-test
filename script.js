let cameraOn = false;
let stream = null;
let foods = [];
let mode = null;

// -------------------------
// 🔥 상품명 스캔 (바코드)
// -------------------------
function startBarcodeMode() {
    mode = "barcode";
    startCamera();
    alert("바코드를 스캔해주세요");
}

// -------------------------
// 🔥 유통기한 스캔 (OCR)
// -------------------------
function startOcrMode() {
    mode = "ocr";
    startCamera();
    alert("유통기한을 촬영해주세요");
}

// -------------------------
// 카메라 켜기
// -------------------------
function startCamera() {
    if (cameraOn) return;

    const video = document.getElementById("camera");

    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(s => {
            stream = s;
            video.srcObject = stream;
            video.play();
            cameraOn = true;
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
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }

    document.getElementById("camera").srcObject = null;
    cameraOn = false;
    document.getElementById("captureBtn").disabled = true;
}

// -------------------------
// 촬영
// -------------------------
function captureImage() {
    const video = document.getElementById("camera");

    if (!cameraOn) {
        alert("먼저 스캔 버튼을 눌러주세요!");
        return;
    }

    if (!mode) {
        alert("스캔 모드를 선택하세요!");
        return;
    }

    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // 🔥 바코드
    if (mode === "barcode") {
        const codeReader = new ZXing.BrowserBarcodeReader();

        codeReader.decodeFromCanvas(canvas)
            .then(result => {
                console.log(result.text);
                document.getElementById("foodName").value = "상품명(예시)";
                alert("상품명 자동 입력 완료!");
            })
            .catch(() => {
                alert("바코드 인식 실패 😢");
            });
    }

    // 🔥 OCR
    else if (mode === "ocr") {
        document.getElementById("statusMessage").textContent = "🔍 분석 중...";

        Tesseract.recognize(canvas, 'eng')
            .then(result => {
                const text = result.data.text;
                console.log(text);

                const match = text.match(/\d{4}[.\-\/]\d{2}[.\-\/]\d{2}/);

                if (match) {
                    document.getElementById("expiryDate").value = match[0];
                    alert("유통기한 입력 완료!");
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
    stopCamera();
    alert("촬영이 삭제되었습니다!");
}

// -------------------------
// D-day
// -------------------------
function getDday(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);

    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    const diff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (diff > 1) return `D-${diff}`;
    if (diff === 1) return "D-1 임박 ⚠️";
    if (diff === 0) return "D-0 오늘 ⚠️";
    return "❌ 만료됨 (빠른 시일 내에 처리하세요)";
}

// -------------------------
// 식품 추가
// -------------------------
async function addFood() {
    const name = document.getElementById("foodName").value.trim();
    const date = document.getElementById("expiryDate").value;

    if (!name || !date) {
        alert("모두 입력하세요!");
        return;
    }

    await requestNotificationPermission();

    const food = {
        id: Date.now(),
        name,
        expiryDate: date,
        notified: false
    };

    foods.push(food);
    saveFoods();
    renderFoodList();
    checkExpiryNotifications();

    document.getElementById("foodName").value = "";
    document.getElementById("expiryDate").value = "";

    alert("추가 완료!");
}

// -------------------------
// 리스트
// -------------------------
function renderFoodList() {
    const list = document.getElementById("foodList");
    list.innerHTML = "";

    let sortedFoods = [...foods];

    // 🔥 정렬 (임박 → 아래 → 만료 맨 아래)
    sortedFoods.sort((a, b) => {
        const today = new Date();
        today.setHours(0,0,0,0);

        const aDate = new Date(a.expiryDate);
        const bDate = new Date(b.expiryDate);

        aDate.setHours(0,0,0,0);
        bDate.setHours(0,0,0,0);

        const aDiff = Math.ceil((aDate - today) / (1000*60*60*24));
        const bDiff = Math.ceil((bDate - today) / (1000*60*60*24));

        // ❌ 만료된 건 아래로
        if (aDiff < 0 && bDiff >= 0) return 1;
        if (aDiff >= 0 && bDiff < 0) return -1;

        // ⏳ 임박한 순 (작을수록 위)
        return aDiff - bDiff;
    });

    let expiredSection = false;

    sortedFoods.forEach(food => {
        const li = document.createElement("li");

        const dday = getDday(food.expiryDate);

        // 🔥 만료 구분선 추가
        if (dday.includes("지남") && !expiredSection) {
            const divider = document.createElement("li");
            divider.innerHTML = "<hr><strong>❌ 유통기한 지난 식품</strong>";
            list.appendChild(divider);
            expiredSection = true;
        }

        // 🔥 색상 처리
        let color = "black";
        if (dday.includes("지남")) color = "red";
        else if (dday.includes("임박") || dday.includes("오늘")) color = "orange";

        li.innerHTML = `
            <div class="food-info" style="color:${color}">
                <span class="food-name">${food.name}</span>
                <span class="food-date">${food.expiryDate}</span>
                <span class="food-dday">${dday}</span>
            </div>
            <button class="delete-btn" onclick="deleteFood(${food.id})">삭제</button>
        `;

        list.appendChild(li);
    });
}

function deleteFood(id) {
    foods = foods.filter(f => f.id !== id);
    saveFoods();
    renderFoodList();
}

// -------------------------
function saveFoods() {
    localStorage.setItem("foods", JSON.stringify(foods));
}

function loadFoods() {
    const saved = localStorage.getItem("foods");
    if (saved) foods = JSON.parse(saved);
}

// -------------------------
async function requestNotificationPermission() {
    if (!("Notification" in window)) return;

    if (Notification.permission !== "granted") {
        await Notification.requestPermission();
    }
}

function sendNotification(title, body) {
    if (Notification.permission === "granted") {
        new Notification(title, { body });
    }
}

function checkExpiryNotifications() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    foods.forEach(food => {
        const expiry = new Date(food.expiryDate);
        expiry.setHours(0, 0, 0, 0);

        if (expiry.getTime() === today.getTime() && !food.notified) {
            sendNotification("유통기한 알림", `${food.name} 오늘까지!`);
            food.notified = true;
        }
    });

    saveFoods();
}

// -------------------------
window.addEventListener("load", async () => {
    document.getElementById("todayDate").textContent =
        "오늘 날짜: " + new Date().toISOString().split("T")[0];

    loadFoods();
    renderFoodList();

    await requestNotificationPermission();
    checkExpiryNotifications();

    setInterval(checkExpiryNotifications, 60000);
});
