let cameraOn = false;
let stream = null;
let foods = [];
let mode = null;

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

    // 🔥 이미지 전처리
    ctx.filter = "contrast(200%) brightness(150%)";
    ctx.drawImage(video, 0, 0);

    // -------------------------
    // 📌 바코드
    // -------------------------
    if (mode === "barcode") {
        const codeReader = new ZXing.BrowserBarcodeReader();

        const image = new Image();
        image.src = canvas.toDataURL();

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
    // 📌 OCR
    // -------------------------
    else if (mode === "ocr") {
        const status = document.getElementById("statusMessage");
        status.textContent = "🔍 분석 중...";

        Tesseract.recognize(canvas, 'eng+kor')
            .then(result => {
                let text = result.data.text;
                text = text.replace(/\s/g, "");

                // 🔥 다양한 날짜 형식 대응
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
                                .replace(/[.\//]/g, "-");

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

// -------------------------
function addFood() {
    const name = foodName.value.trim();
    const date = expiryDate.value;

    if (!name || !date) return alert("입력 필요");

    foods.push({ id: Date.now(), name, expiryDate: date });

    localStorage.setItem("foods", JSON.stringify(foods));
    renderFoodList();

    foodName.value = "";
    expiryDate.value = "";
}

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
