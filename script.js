const itemsList = document.getElementById('items-list');
const addItemBtn = document.getElementById('add-item-btn');
const startBtn = document.getElementById('start-btn');
const spinBtn = document.getElementById('spin-btn');
const resetBtn = document.getElementById('reset-btn');
const totalProbabilitySpan = document.getElementById('current-total');
const errorMessage = document.getElementById('error-message');
const settingsArea = document.getElementById('settings-area');
const rouletteArea = document.getElementById('roulette-area');
const rouletteWheel = document.getElementById('roulette-wheel');
const resultDisplay = document.getElementById('result-display');
const finalResultText = document.getElementById('final-result');

let rouletteItems = [];
let isSpinning = false;

// 初期項目の追加
document.addEventListener('DOMContentLoaded', () => {
    addItem('当たり', 50);
    addItem('ハズレ', 50);
    updateTotalProbability();
});

// 項目入力フィールドを生成する関数 (省略)
function addItem(name = '', probability = '') {
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('item-input-group');
    itemDiv.innerHTML = `
        <input type="text" class="item-name" value="${name}" placeholder="項目名" required>
        <input type="number" class="item-prob" value="${probability}" placeholder="確率 (%)" min="1" required>
        <button type="button" class="remove-item-btn">×</button>
    `;
    itemsList.appendChild(itemDiv);

    itemDiv.querySelector('.remove-item-btn').addEventListener('click', () => {
        if (itemsList.children.length > 1) {
            itemsList.removeChild(itemDiv);
            updateTotalProbability();
        } else {
            alert('項目は最低1つ必要です。');
        }
    });

    itemDiv.querySelector('.item-prob').addEventListener('input', updateTotalProbability);
}

// 合計確率を更新し、100%チェックを行う関数 (省略)
function updateTotalProbability() {
    let total = 0;
    const itemProbInputs = document.querySelectorAll('.item-prob');
    
    itemProbInputs.forEach(input => {
        const prob = parseInt(input.value);
        if (!isNaN(prob) && prob > 0) {
            total += prob;
        }
    });
    
    totalProbabilitySpan.textContent = total;
    
    if (total > 100) {
        totalProbabilitySpan.style.color = '#cc0000';
        errorMessage.textContent = 'エラー: 合計確率が100%を超えています。';
        startBtn.disabled = true;
    } else if (total < 100) {
        totalProbabilitySpan.style.color = '#e7a000';
        errorMessage.textContent = '警告: 合計確率が100%未満です。';
        startBtn.disabled = false;
    } else {
        totalProbabilitySpan.style.color = '#38761d';
        errorMessage.textContent = '';
        startBtn.disabled = false;
    }
}

// 画面切り替えと設定保存 (省略)
addItemBtn.addEventListener('click', () => addItem());

startBtn.addEventListener('click', () => {
    const itemInputs = document.querySelectorAll('.item-input-group');
    let totalProb = 0;
    let newItems = [];
    let hasError = false;

    itemInputs.forEach(group => {
        const nameInput = group.querySelector('.item-name');
        const probInput = group.querySelector('.item-prob');
        
        const name = nameInput.value.trim();
        const probability = parseInt(probInput.value);

        if (name === "" || isNaN(probability) || probability <= 0) {
            hasError = true;
            return;
        }
        
        totalProb += probability;
        newItems.push({ name, probability });
    });

    if (hasError) {
        errorMessage.textContent = 'エラー: 項目名または確率が正しく入力されていません。';
        return;
    }
    
    if (totalProb > 100) {
        return; 
    }
    
    if (totalProb < 100) {
        if (!confirm('合計確率が100%未満です。このまま進みますか？')) {
            return;
        }
    }

    rouletteItems = newItems;
    setupRouletteWheel();
    
    settingsArea.classList.add('hidden');
    rouletteArea.classList.remove('hidden');
    document.getElementById('roulette-title').textContent = `合計 ${totalProb}% で抽選！`;
    resultDisplay.classList.add('hidden');
});

resetBtn.addEventListener('click', () => {
    rouletteArea.classList.add('hidden');
    settingsArea.classList.remove('hidden');
    rouletteWheel.style.transform = 'rotate(-90deg)'; 
});

// セグメントの色を循環させる (省略)
function getColor(index) {
    const colors = ['#FF6F61', '#6B5B95', '#88B04B', '#F7CAC9', '#92A8D1', '#CC99C9', '#66D2D6'];
    return colors[index % colors.length];
}

// --- ルーレット描画ロジック (conic-gradient方式に修正) ---
function setupRouletteWheel() {
    rouletteWheel.innerHTML = '';
    
    let currentAngle = 0;
    const totalProbForDrawing = rouletteItems.reduce((sum, item) => sum + item.probability, 0);

    if (totalProbForDrawing === 0) return;

    let gradientString = 'conic-gradient(';
    let textElements = [];

    rouletteItems.forEach((item, index) => {
        const angle = (item.probability / totalProbForDrawing) * 360;
        const color = getColor(index);
        
        // conic-gradientの文字列を生成
        if (index > 0) {
            gradientString += `, `;
        }
        gradientString += `${color} ${currentAngle}deg ${currentAngle + angle}deg`;

        // テキスト要素を作成
        const textElement = document.createElement('div');
        textElement.classList.add('segment-text');
        textElement.textContent = item.name;
        
        // テキストを中央から放射状に配置するための計算
        const textRotation = currentAngle + (angle / 2); // セグメントの中央角度
        
        // ★テキストの回転を修正★
        textElement.style.transform = `
            rotate(${textRotation}deg)
            translateY(-50%) 
            translateX(100px) 
            rotate(90deg) /* テキスト自体を水平に近く戻す回転を90度に調整 */
        `;
        
        textElements.push(textElement);
        
        currentAngle += angle;
    });
    
    gradientString += ')';

    // 背景にグラデーションを適用し、テキストをルーレットに追加
    rouletteWheel.style.background = gradientString;
    textElements.forEach(el => rouletteWheel.appendChild(el));
    
    // ルーレットの初期位置を修正 (マーカーが左側に来るように -90度回転)
    rouletteWheel.style.transform = `rotate(-90deg)`;
}


// --- 抽選ロジック (省略) ---
function getResult() {
    const totalProb = rouletteItems.reduce((sum, item) => sum + item.probability, 0);
    const randomNumber = Math.random() * totalProb;
    let cumulativeProb = 0;
    
    for (const item of rouletteItems) {
        cumulativeProb += item.probability;
        if (randomNumber <= cumulativeProb) {
            return item;
        }
    }
    return rouletteItems[0]; 
}

function spinRoulette() {
    if (isSpinning) return;
    isSpinning = true;
    spinBtn.disabled = true;
    resetBtn.disabled = true;
    resultDisplay.classList.add('hidden');
    
    const resultItem = getResult();
    
    let targetAngle = 0;
    let cumulativeAngle = 0;
    const totalProbForDrawing = rouletteItems.reduce((sum, item) => sum + item.probability, 0);
    
    for (const item of rouletteItems) {
        const angle = (item.probability / totalProbForDrawing) * 360;
        
        if (item.name === resultItem.name) {
            const randomOffset = Math.random() * (angle - 10) + 5; 
            const stopPositionAngle = cumulativeAngle + randomOffset;

            const fullSpins = 7 * 360; 
            targetAngle = fullSpins + (360 - stopPositionAngle); 

            break;
        }
        cumulativeAngle += angle;
    }
    
    rouletteWheel.style.transition = 'transform 6s cubic-bezier(0.25, 0.1, 0.25, 1)'; 
    rouletteWheel.style.transform = `rotate(${targetAngle}deg)`; // 時計回り(+)
    
    setTimeout(() => {
        isSpinning = false;
        spinBtn.disabled = false;
        resetBtn.disabled = false;
        
        finalResultText.textContent = resultItem.name;
        resultDisplay.classList.remove('hidden');
        
        rouletteWheel.style.transition = 'none';
        const normalizedAngle = targetAngle % 360;
        rouletteWheel.style.transform = `rotate(${normalizedAngle - 90}deg)`; 
        
    }, 6100); 
}

spinBtn.addEventListener('click', spinRoulette);
