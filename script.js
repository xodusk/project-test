let cameraOn = false;
let stream = null;
let foods = [];
let mode = null;
let lastCapturedImage = null;

// -------------------------
function startBarcodeMode() {
    mode = "barcode";
    startCamera();
    alert("바코드를 촬영하세요");
}

function startOcrMode() {
    mode = "ocr";
    startCamera();
    alert("유통기한을 촬영하세요");
}

// -------------------------
function startCamera() {
    if (cameraOn) return;

    const video = document.getElementById("camera");

    navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
        }
    })
    .then(s => {
        stream = s;
        video.srcObject = stream;
        cameraOn = true;
        document.getElementById("captureBtn").disabled = false;
    })
    .catch(() => {
        alert("카메라 권한 허용 필요!");
    });
}

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
function captureImage() {
    if (!cameraOn || !mode) {
        alert("스캔 모드를 선택하세요!");
        return;
    }

    const video = document.getElementById("camera");
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 🔥 이미지 전처리 (개선된 필터)
    ctx.filter = "contrast(150%) brightness(110%) grayscale(100%)";
    ctx.drawImage(video, 0, 0);

    // 🔥 👉 여기 추가 (핵심)
    const imageData = canvas.toDataURL();

    // 미리보기 표시
    document.getElementById("preview").src = imageData;

    // 리스트에 저장하기 위한 이미지
    lastCapturedImage = imageData;

    // -------------------------
    // 📌 바코드
    // -------------------------
    if (mode === "barcode") {
        const codeReader = new ZXing.BrowserBarcodeReader();

        const image = new Image();
        image.src = imageData; // 🔥 canvas.toDataURL() 대신 변수 사용

        image.onload = () => {
            codeReader.decodeFromImageElement(image)
                .then(result => {
                    const barcode = result.text;

                    fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
                        .then(res => res.json())
                        .then(data => {
                            if (data.status === 1 && data.product.product_name) {
                                document.getElementById("foodName").value =
                                    data.product.product_name;
                                alert("상품명 자동 입력 완료!");
                            } else {
                                document.getElementById("foodName").value = barcode;
                                alert("상품 정보 없음");
                            }
                        });
                })
                .catch(() => alert("바코드 인식 실패"));
        };
    }

    // -------------------------
    // 📌 OCR (기존 그대로 유지)
    // -------------------------
    else if (mode === "ocr") {
        const status = document.getElementById("statusMessage");
        status.textContent = "🔍 분석 중...";

        Tesseract.recognize(canvas, 'eng+kor')
            .then(result => {
                let text = result.data.text;
                text = text.replace(/\s/g, "");

                const matches = text.match(
                    /\d{2,4}[.\-\/년]\d{1,2}[.\-\/월]\d{1,2}/g
                );

                if (matches) {
                    status.innerHTML = "날짜 선택:<br>";

                    matches.forEach(date => {
                        const btn = document.createElement("button");
                        btn.textContent = date;

                        btn.onclick = () => {
                            const clean = date
                                .replace(/년|월/g, "-")
                                .replace(/[.\//]/g, "-")
                                .split("-")
                                .map((v, i) => i === 0 ? v : v.padStart(2, "0"))
                                .join("-");

                            document.getElementById("expiryDate").value = clean;
                            status.innerHTML = "";
                        };

                        status.appendChild(btn);
                    });
                } else {
                    alert("유통기한 인식 실패");
                    status.textContent = "";
                }
            });
    }

    stopCamera();
}

// -------------------------
function clearCamera() {
    stopCamera();
}

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


async function fetchRecipes(ingredients) {
    const apiKey = "YOUR_API_KEY"; // ← 여기에 키 넣기

    const res = await fetch(
        `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredients.join(",")}&number=5&apiKey=${apiKey}`
    );

    return await res.json();
}


async function showRecipes() {
    const ingredients = getUrgentIngredients();

    if (ingredients.length === 0) {
        alert("임박한 재료가 없습니다");
        return;
    }

    const recipes = await fetchRecipes(ingredients);

    const list = document.getElementById("recipeList");
    list.innerHTML = "";

    recipes.forEach(r => {
        const li = document.createElement("li");

        li.innerHTML = `
            <div style="display:flex; gap:10px; align-items:center;">
                <img src="${r.image}" style="width:80px; height:80px; border-radius:10px;">
                <div>
                    <div>${r.title}</div>
                    <button onclick="window.open('${r.sourceUrl}')">레시피 보기</button>
                </div>
            </div>
        `;

        list.appendChild(li);
    });
}







function getDiffDays(date) {
    const today = new Date();
    today.setHours(0,0,0,0);

    const d = new Date(date);
    d.setHours(0,0,0,0);

    return Math.ceil((d - today) / (1000*60*60*24));
}

function getUrgentIngredients() {
    return foods
        .filter(f => getDiffDays(f.expiryDate) <= 2) // 임박 식품만
        .map(f => f.name);
}

// -------------------------
function addFood() {
    const name = foodName.value.trim();
    const date = expiryDate.value;

    if (!name || !date) return alert("입력 필요");

    foods.push({
        id: Date.now(),
        name,
        expiryDate: date,
        image: lastCapturedImage || null // 🔥 추가된 부분
    });

    localStorage.setItem("foods", JSON.stringify(foods));
    renderFoodList();

    foodName.value = "";
    expiryDate.value = "";

    lastCapturedImage = null; // 🔥 추가: 다음 입력을 위해 초기화
    document.getElementById("preview").src = ""; // 🔥 미리보기 초기화
}

// -------------------------
function renderFoodList() {
    const validList = document.getElementById("validList");
    const expiredList = document.getElementById("expiredList");

    validList.innerHTML = "";
    expiredList.innerHTML = "";

    let sortedFoods = [...foods];

sortedFoods.sort((a, b) => {
    const today = new Date();
    today.setHours(0,0,0,0);

    const aDate = new Date(a.expiryDate);
    const bDate = new Date(b.expiryDate);

    aDate.setHours(0,0,0,0);
    bDate.setHours(0,0,0,0);

    const aDiff = Math.ceil((aDate - today) / (1000*60*60*24));
    const bDiff = Math.ceil((bDate - today) / (1000*60*60*24));

    // 🔥 1. 만료된 건 무조건 아래
    if (aDiff < 0 && bDiff >= 0) return 1;
    if (aDiff >= 0 && bDiff < 0) return -1;

    // 🔥 2. 나머지는 임박 순
    return aDiff - bDiff;
});

    sortedFoods.forEach(food => {
        const li = document.createElement("li");

        const dday = getDday(food.expiryDate);

        let color = "black";
        if (dday.includes("지남")) color = "red";
        else if (dday.includes("임박") || dday.includes("오늘")) color = "orange";

        li.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                ${food.image ? `<img src="${food.image}" style="width:50px; height:50px; border-radius:8px; object-fit:cover;">` : ""}

                <div class="food-info" style="color:${color}">
                    <span class="food-name">${food.name}</span>
                    <span class="food-date">${food.expiryDate}</span>
                    <span class="food-dday">${dday}</span>
                </div>
            </div>
        <button class="delete-btn" onclick="deleteFood(${food.id})">삭제</button>
        `;

    // 🔥 여기서 분류 (수정)
    const today = new Date();
    today.setHours(0,0,0,0);

    const expiry = new Date(food.expiryDate);
    expiry.setHours(0,0,0,0);

    const diff = Math.ceil((expiry - today) / (1000*60*60*24));

    if (diff < 0) {
        expiredList.appendChild(li);
    } else {
        validList.appendChild(li);
    }
        });
    }

function deleteFood(id) {
    foods = foods.filter(f => f.id !== id);
    localStorage.setItem("foods", JSON.stringify(foods));
    renderFoodList();
}

// -------------------------
window.onload = () => {
    const saved = localStorage.getItem("foods");
    if (saved) foods = JSON.parse(saved);

    document.getElementById("todayDate").textContent =
        "오늘 날짜: " + new Date().toISOString().split("T")[0];

    renderFoodList();
};

// -------------------------
// 🔥 알림 관련 기능 추가
// -------------------------

// 1. 알림 권한 요청
async function requestNotificationPermission() {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") {
        await Notification.requestPermission();
    }
}

// 2. 모바일(서비스 워커)용 알림 전송 함수
async function sendNotification(title, body) {
    if (Notification.permission === "granted" && 'serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        registration.showNotification(title, {
            body: body,
            icon: 'https://cdn-icons-png.flaticon.com/512/1554/1554401.png', // 앱 아이콘 경로
            vibrate: [200, 100, 200]
        });
    }
}

// 3. 유통기한 체크해서 알림 띄우기
function checkExpiryNotifications() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let isModified = false;

    foods.forEach(food => {
        const expiry = new Date(food.expiryDate);
        expiry.setHours(0, 0, 0, 0);

        // 오늘이 만료일이고, 아직 알림을 안 보낸(notified: false) 식품이라면
        if (expiry.getTime() === today.getTime() && !food.notified) {
            sendNotification("유통기한 임박 ⚠️", `${food.name}의 유통기한이 오늘까지입니다!`);
            food.notified = true; // 알림 발송 완료 처리
            isModified = true;
        }
    });

    // 변경된 상태(알림 발송 여부)를 로컬스토리지에 다시 저장
    if (isModified) {
        localStorage.setItem("foods", JSON.stringify(foods));
    }
}
window.onload = async () => {
    const saved = localStorage.getItem("foods");
    if (saved) foods = JSON.parse(saved);

    document.getElementById("todayDate").textContent =
        "오늘 날짜: " + new Date().toISOString().split("T")[0];

    renderFoodList();

    // 🔥 앱 실행 시 권한 요청 및 알림 체크
    await requestNotificationPermission();
    checkExpiryNotifications();

    // 🔥 앱을 켜놓고 있을 때 1분마다 주기적으로 체크 (선택사항)
    setInterval(checkExpiryNotifications, 60000);
};
