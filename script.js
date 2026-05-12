// 전역 변수
// --------------------------
let foods = [];
let stream = null;

const video = document.getElementById("camera");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const foodInput = document.getElementById("foodName");
const expiryInput = document.getElementById("expiryDate");

const validList = document.getElementById("validList");
const expiredList = document.getElementById("expiredList");

const statusMessage = document.getElementById("statusMessage");

// ==========================
// 앱 시작
// ==========================
window.onload = () => {

    loadFoods();

    renderFoods();

    updateTodayDate();
};


// ==========================
// 오늘 날짜 표시
// ==========================
function updateTodayDate() {

    const today = new Date();

    document.getElementById("todayDate").innerText =
        `📅 오늘 날짜 : ${today.toLocaleDateString()}`;
}


// ==========================
// 탭 전환
// ==========================
function switchTab(tabName, btn) {

    document.querySelectorAll(".tab-content")
        .forEach(tab => {
            tab.style.display = "none";
        });

    document.querySelectorAll(".tab-btn")
        .forEach(button => {
            button.classList.remove("active");
        });

    document.getElementById(`tab-${tabName}`)
        .style.display = "block";

    btn.classList.add("active");
}


// ==========================
// 음식 추가
// ==========================
function addFood() {

    const name = foodInput.value.trim();

    const expiry = expiryInput.value;

    if (!name || !expiry) {

        alert("식품명과 유통기한을 입력해주세요");

        return;
    }

    foods.push({
        name,
        expiry
    });

    saveFoods();

    renderFoods();

    foodInput.value = "";
    expiryInput.value = "";

    statusMessage.innerText =
        "✅ 음식 등록 완료!";
}


// ==========================
// 음식 삭제
// ==========================
function deleteFood(index) {

    foods.splice(index, 1);

    saveFoods();

    renderFoods();
}


// ==========================
// 음식 렌더링
// ==========================
function renderFoods() {

    validList.innerHTML = "";
    expiredList.innerHTML = "";

    const today = new Date();

    foods.sort((a, b) =>
        new Date(a.expiry) - new Date(b.expiry)
    );

    foods.forEach((food, index) => {

        const expiryDate = new Date(food.expiry);

        const diffTime =
            expiryDate - today;

        const diffDays =
            Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const li =
            document.createElement("li");

        // 임박 음식
        if (diffDays <= 1 && diffDays >= 0) {
            li.classList.add("urgent");
        }

        // 지난 음식
        if (diffDays < 0) {
            li.classList.add("expired");
        }

        li.innerHTML = `
            <div class="food-info">

                <span class="food-name">
                    ${food.name}
                </span>

                <span class="food-date">
                    유통기한 :
                    ${food.expiry}
                </span>

                <span class="food-dday">
                    ${
                        diffDays >= 0
                        ? `D-${diffDays}`
                        : `${Math.abs(diffDays)}일 지남`
                    }
                </span>

            </div>

            <button class="delete-btn"
                onclick="deleteFood(${index})">
                삭제
            </button>
        `;

        if (diffDays >= 0) {

            validList.appendChild(li);

        } else {

            expiredList.appendChild(li);
        }
    });

    // 빈 화면 UX
    if (foods.length === 0) {

        validList.innerHTML = `
            <p class="empty-message">
                🥲 등록된 음식이 없어요
            </p>
        `;
    }
}


// ==========================
// localStorage 저장
// ==========================
function saveFoods() {

    localStorage.setItem(
        "foods",
        JSON.stringify(foods)
    );
}


// ==========================
// localStorage 불러오기
// ==========================
function loadFoods() {

    const saved =
        localStorage.getItem("foods");

    if (saved) {

        foods = JSON.parse(saved);
    }
}


// ==========================
// 📷 카메라 시작
// ==========================
async function startCamera() {

    try {

        stream =
            await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment"
                }
            });

        video.srcObject = stream;

        statusMessage.innerText =
            "📷 카메라 시작";

    } catch (e) {

        console.error(e);

        alert("카메라 접근 실패");
    }
}


// ==========================
// 📷 카메라 종료
// ==========================
function clearCamera() {

    if (stream) {

        stream.getTracks()
            .forEach(track => track.stop());

        video.srcObject = null;

        statusMessage.innerText =
            "📷 카메라 종료";
    }
}


// ==========================
// 🤖 자동 인식
// 한번 촬영 → 바코드 + 날짜
// ==========================
async function captureAll() {

    statusMessage.innerText =
        "🤖 자동 인식 중...";

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0);

    // 동시에 분석
    const barcodeResult =
        await scanBarcode(canvas);

    const expiryResult =
        await scanExpiry(canvas);

    // 상품명 입력
    if (barcodeResult) {

        foodInput.value =
            barcodeResult;
    }

    // 날짜 입력
    if (expiryResult) {

        expiryInput.value =
            expiryResult;
    }

    // 결과 처리
    if (barcodeResult && expiryResult) {

        statusMessage.innerText =
            "✅ 상품명과 유통기한 인식 완료!";

    } else if (barcodeResult && !expiryResult) {

        statusMessage.innerText =
            "📅 날짜만 다시 찍어주세요";

    } else if (!barcodeResult && expiryResult) {

        statusMessage.innerText =
            "📦 바코드만 다시 찍어주세요";

    } else {

        statusMessage.innerText =
            "❌ 인식 실패. 다시 촬영해주세요";
    }
}


// ==========================
// 📦 바코드만 다시 인식
// ==========================
async function rescanFoodName() {

    statusMessage.innerText =
        "📦 바코드 다시 인식 중...";

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0);

    const barcodeResult =
        await scanBarcode(canvas);

    if (barcodeResult) {

        foodInput.value =
            barcodeResult;

        statusMessage.innerText =
            "✅ 바코드 인식 완료";

    } else {

        statusMessage.innerText =
            "❌ 바코드 인식 실패";
    }
}


// ==========================
// 📅 날짜만 다시 인식
// ==========================
async function rescanExpiryDate() {

    statusMessage.innerText =
        "📅 날짜 다시 인식 중...";

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0);

    const expiryResult =
        await scanExpiry(canvas);

    if (expiryResult) {

        expiryInput.value =
            expiryResult;

        statusMessage.innerText =
            "✅ 날짜 인식 완료";

    } else {

        statusMessage.innerText =
            "❌ 날짜 인식 실패";
    }
}


// ==========================
// 🔍 바코드 인식
// ==========================
async function scanBarcode(canvasElement) {

    try {

        const codeReader =
            new ZXing.BrowserMultiFormatReader();

        const result =
            await codeReader.decodeFromCanvas(
                canvasElement
            );

        return result.text;

    } catch (e) {

        console.log("바코드 인식 실패");

        return null;
    }
}


// ==========================
// 🔍 OCR 날짜 인식
// ==========================
async function scanExpiry(canvasElement) {

    try {

        const result =
            await Tesseract.recognize(
                canvasElement,
                "eng"
            );

        const text =
            result.data.text;

        console.log(text);

        // 날짜 패턴
        const regex =
            /\d{4}[.\-/]\d{2}[.\-/]\d{2}/;

        const match =
            text.match(regex);

        if (!match) {

            return null;
        }

        // 형식 통일
        return match[0]
            .replaceAll(".", "-")
            .replaceAll("/", "-");

    } catch (e) {

        console.log("OCR 실패");

        return null;
    }
}


// ==========================
// 🍳 레시피 추천
// ==========================
function showRecipes() {

    const recipeList =
        document.getElementById("recipeList");

    recipeList.innerHTML = "";

    if (foods.length === 0) {

        recipeList.innerHTML =
            "<p>재료가 없습니다</p>";

        return;
    }

    foods.forEach(food => {

        const li =
            document.createElement("li");

        li.innerHTML = `
            🥘 ${food.name} 활용 레시피 추천
        `;

        recipeList.appendChild(li);
    });
}


// ==========================
// 🗑 레시피 캐시 초기화
// ==========================
function clearRecipeCache() {

    document.getElementById("recipeList")
        .innerHTML = "";

    alert("레시피 캐시 초기화 완료");
}
