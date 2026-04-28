let cameraOn = false;
let stream = null;
let foods = [];
let mode = null;
let lastCapturedImage = null;
let scanInterval = null;

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
        video: { facingMode: "environment" }
    })
    .then(s => {
        stream = s;
        video.srcObject = stream;
        cameraOn = true;

        startAutoScan(); // 🔥 여기 추가
    })
    .catch(() => alert("카메라 권한 필요"));
}
function startAutoScan() {
    const video = document.getElementById("camera");
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    scanInterval = setInterval(() => {
        if (!cameraOn || !mode) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const w = canvas.width;
        const h = canvas.height;

        const cropW = w * 0.7;
        const cropH = h * 0.25;

        const x = (w - cropW) / 2;
        const y = (h - cropH) / 2;
        // 🔥 drawImage 전에!
        if (mode === "barcode") {
            ctx.filter = "contrast(150%) brightness(110%) grayscale(100%)";
        } else if (mode === "ocr") {
            ctx.filter = "grayscale(100%) contrast(220%) brightness(130%)";
        }
        ctx.drawImage(video, x, y, cropW, cropH, 0, 0, w, h);

        const imageData = canvas.toDataURL();

        document.getElementById("preview").src = imageData;
        lastCapturedImage = imageData;

        if (mode === "barcode") {
            const codeReader = new ZXing.BrowserBarcodeReader();
            const img = new Image();
            img.src = imageData;

            img.onload = () => {
                codeReader.decodeFromImageElement(img)
                    .then(result => {
                        clearInterval(scanInterval);

                        fetch(`https://world.openfoodfacts.org/api/v0/product/${result.text}.json`)
                            .then(res => res.json())
                            .then(data => {
                                document.getElementById("foodName").value =
                                    data.product?.product_name || result.text;

                                alert("상품명 자동 인식 완료!");
                                stopCamera();
                            });
                    })
                    .catch(() => {});
            };
        }

        else if (mode === "ocr") {

            Tesseract.recognize(canvas, 'eng+kor')
                .then(result => {
                    let text = result.data.text.replace(/\s/g, "");

                    const match = text.match(
                        /\d{2,4}[.\-\/년]\d{1,2}[.\-\/월]\d{1,2}/
                    );

                    if (match) {
                        clearInterval(scanInterval);

                        const clean = match[0]
                            .replace(/년|월/g, "-")
                            .replace(/[.\//]/g, "-")
                            .split("-")
                            .map((v, i) => i === 0 ? v : v.padStart(2, "0"))
                            .join("-");

                        document.getElementById("expiryDate").value = clean;

                        alert("유통기한 자동 인식 완료!");
                        stopCamera();
                    }
                })
                .catch(() => {});
        }

    }, 800);
}
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }

    if (scanInterval) {
        clearInterval(scanInterval);
        scanInterval = null;
    }

    document.getElementById("camera").srcObject = null;
    cameraOn = false;

}


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


function clearRecipeCache() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith("recipe_"));
    keys.forEach(k => localStorage.removeItem(k));
    alert("캐시 초기화 완료! 다시 레시피 추천을 눌러주세요.");
}

async function showRecipes() {
    const ingredients = getUrgentIngredients();

    if (ingredients.length === 0) {
        alert("임박한 재료가 없습니다");
        return;
    }

    const list = document.getElementById("recipeList");
    list.innerHTML = "<li>🔍 레시피 검색 중...</li>";

    try {
        const apiKey = "afbed4806429490c832c5515e243e548";
        const today = new Date().toISOString().split("T")[0];
        list.innerHTML = "";

        for (const ingredient of ingredients) {

            // 재료 이름 한글 번역
            let koreanIngredient = ingredient;
            try {
                const ingRes = await fetch(
                    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(ingredient)}&langpair=en|ko`
                );
                const ingData = await ingRes.json();
                koreanIngredient = ingData.responseData.translatedText;
            } catch (e) {
                koreanIngredient = ingredient;
            }

            // 섹션 제목
            const sectionTitle = document.createElement("li");
            sectionTitle.innerHTML = `<strong>🥬 ${koreanIngredient}으로 만들 수 있는 레시피</strong>`;
            sectionTitle.style.cssText = "background:#f0f9f0; padding:10px; border-radius:10px; margin-top:15px; list-style:none;";
            list.appendChild(sectionTitle);

            // 캐시 확인 (오늘 날짜 기준 - 포인트 절약)
            const cacheKey = `recipe_${ingredient}_${today}`;
            let recipes = null;
            try {
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    recipes = JSON.parse(cached);
                } else {
                    // 재료별로 따로 검색 (각 3개씩)
                    const res = await fetch(
                        `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredient}&number=3&apiKey=${apiKey}`
                    );
                    if (!res.ok) throw new Error(`API 오류: ${res.status}`);
                    recipes = await res.json();
                    if (Array.isArray(recipes)) {
                        localStorage.setItem(cacheKey, JSON.stringify(recipes));
                    }
                }
            } catch (e) {
                const errorLi = document.createElement("li");
                errorLi.textContent = `❌ 오류: ${e.message}`;
                list.appendChild(errorLi);
                continue;
            }

            if (!Array.isArray(recipes) || recipes.length === 0) {
                const emptyLi = document.createElement("li");
                emptyLi.textContent = "레시피를 찾지 못했습니다.";
                emptyLi.style.cssText = "color:#999; font-size:14px; padding:8px;";
                list.appendChild(emptyLi);
                continue;
            }

            for (const r of recipes) {
                const li = document.createElement("li");
                const recipeUrl = `https://spoonacular.com/recipes/${r.title.replace(/ /g, '-')}-${r.id}`;

                let koreanTitle = r.title;
                try {
                    const translateRes = await fetch(
                        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(r.title)}&langpair=en|ko`
                    );
                    const translateData = await translateRes.json();
                    koreanTitle = translateData.responseData.translatedText;
                } catch (e) {
                    koreanTitle = r.title;
                }

                li.innerHTML = `
                    <div style="display:flex; gap:10px; align-items:center;">
                        <img src="${r.image}" style="width:80px; height:80px; border-radius:10px;">
                        <div>
                            <div>${koreanTitle}</div>
                            <div style="font-size:12px; color:#999;">${r.title}</div>
                            <button onclick="window.open('${recipeUrl}')">레시피 보기</button>
                        </div>
                    </div>
                `;
                list.appendChild(li);
            }
        }

    } catch (err) {
        list.innerHTML = `<li>❌ 오류 발생: ${err.message}</li>`;
    }
}



function getDiffDays(date) {
    const today = new Date();
    today.setHours(0,0,0,0);

    const d = new Date(date);
    d.setHours(0,0,0,0);

    return Math.ceil((d - today) / (1000*60*60*24));
}

// 한글 → 영어 번역 테이블
const foodTranslations = {
    "계란": "egg", "달걀": "egg",
    "우유": "milk",
    "두부": "tofu",
    "돼지고기": "pork", "삼겹살": "pork",
    "닭고기": "chicken", "닭가슴살": "chicken breast",
    "소고기": "beef",
    "양파": "onion", "마늘": "garlic",
    "감자": "potato", "고구마": "sweet potato",
    "당근": "carrot", "오이": "cucumber",
    "토마토": "tomato", "버섯": "mushroom",
    "시금치": "spinach", "배추": "cabbage",
    "밥": "rice", "라면": "ramen",
    "치즈": "cheese", "버터": "butter",
    "요거트": "yogurt", "햄": "ham",
    "소시지": "sausage", "참치": "tuna",
    "연어": "salmon", "새우": "shrimp",
};

function getUrgentIngredients() {
    return foods
        .filter(f => getDiffDays(f.expiryDate) <= 2)
        .map(f => {
            const translated = foodTranslations[f.name.trim()];
            return translated || f.name; // 번역 없으면 원래 이름 사용
        });
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
