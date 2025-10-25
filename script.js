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

// 項目入力フィールドを生成する関数
function addItem(name = '', probability = '') {
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('item-input-group');
    itemDiv.innerHTML = `
        <input type="text" class="item-name" value="${name}" placeholder="項目名" required>
        <input type="number" class="item-prob" value="${probability}" placeholder="確率 (%)" min="1" required>
        <button type="button" class="remove-item-btn">×</button>
    `;
    itemsList.appendChild(itemDiv);

    // イベントリスナー設定
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

// 合計確率を更新し、100%チェックを行う関数
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

// --- 画面切り替えと設定保存 ---

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
        // すでに updateTotalProbability でチェック済みだが、念のため
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
    rouletteWheel.style.transform = 'rotate(0deg)'; // ルーレットをリセット
});

// --- ルーレット描画ロジック ---

function setupRouletteWheel() {
    rouletteWheel.innerHTML = '';
    const totalAngle = 360;
    let currentAngle = 0;
    
    // 合計確率が100%未満でも、描画は合計値に基づいて行う
    const totalProbForDrawing = rouletteItems.reduce((sum, item) => sum + item.probability, 0);

    // 項目がない場合は処理しない
    if (totalProbForDrawing === 0) return;

    rouletteItems.forEach((item, index) => {
        // 描画用の角度を計算 (全体に対する割合)
        const angle = (item.probability / totalProbForDrawing) * totalAngle;
        const color = getColor(index);

        const segment = document.createElement('div');
        segment.classList.add('segment');
        // segmentのスタイル設定
        segment.style.backgroundColor = color;
        segment.style.transform = `rotate(${currentAngle}deg) skewY(-${90 - angle}deg)`;
        segment.style.zIndex = index + 1;
        segment.dataset.name = item.name;

        // テキスト要素を作成し、セグメントの中央に配置
        const textElement = document.createElement('div');
        textElement.classList.add('segment-text');
        textElement.textContent = item.name;
        // テキストを垂直に保ち、セグメントの真ん中に配置するための調整
        const textRotation = currentAngle + (angle / 2);
        
        textElement.style.transform = `
            rotate(${textRotation}deg) 
            translateY(-50%) 
            translateX(75px) 
            rotate(${-textRotation}deg)
        `;
        
        // テキストをZ-indexで手前に持ってくる
        textElement.style.zIndex = rouletteItems.length + 10; 
        
        rouletteWheel.appendChild(segment);
        rouletteWheel.appendChild(textElement);
        
        currentAngle += angle;
    });
}

// セグメントの色を循環させる
function getColor(index) {
    const colors = ['#FF6F61', '#6B5B95', '#88B04B', '#F7CAC9', '#92A8D1', '#CC99C9', '#66D2D6'];
    return colors[index % colors.length];
}


// --- 抽選ロジック ---

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
    // 合計が100%未満の場合、最後の項目が返されるか、あるいはnullになる可能性があるが、
    // 描画ロジックと合わせてここではフェールセーフとして最初の項目を返す
    return rouletteItems[0]; 
}

function spinRoulette() {
    if (isSpinning) return;
    isSpinning = true;
    spinBtn.disabled = true;
    resetBtn.disabled = true;
    resultDisplay.classList.add('hidden');
    
    const resultItem = getResult();
    
    // 角度計算
    let targetAngle = 0;
    let cumulativeProb = 0;
    const totalProbForDrawing = rouletteItems.reduce((sum, item) => sum + item.probability, 0);
    
    // 停止セグメントの開始角度と終了角度を計算 (時計回り)
    for (const item of rouletteItems) {
        const angle = (item.probability / totalProbForDrawing) * 360;
        
        if (item.name === resultItem.name) {
            // マーカーは常に上向き(0度)なので、ルーレットを回転させる
            // 停止位置をセグメントの「中央」に合わせる (中央角度は start + angle/2)
            const centerAngle = cumulativeProb + (angle / 2);
            
            // ルーレットの回転は反時計回り (マイナス)
            // 停止角度は、マーカー(0度)とセグメント中央が合う角度
            // 最終的な回転を - (360 * 回転数 + 停止位置) にする
            
            // 停止位置を約 270度 (時計の9時方向) に合わせると見やすい
            const markerOffset = 270; 
            
            // ランダムな停止位置をセグメント内で設定 (見た目のバリエーション用)
            // 停止位置をセグメント内のどこかにランダムに調整
            const randomOffset = Math.random() * (angle - 10) + 5; // セグメントの端から5度内側
            const stopPosition = cumulativeProb + randomOffset;

            // 最終停止角度（反時計回り）
            // 大量の回転 (3~5周) + 最終停止位置
            const fullSpins = 5 * 360;
            targetAngle = fullSpins + markerOffset - stopPosition; 
            
            break;
        }
        cumulativeProb += angle;
    }
    
    // CSSアニメーションをトリガー
    rouletteWheel.style.transition = 'transform 5s cubic-bezier(0.25, 0.1, 0.25, 1)'; // イージングを調整して自然に減速
    rouletteWheel.style.transform = `rotate(${-targetAngle}deg)`;
    
    // 停止後に結果を表示
    setTimeout(() => {
        isSpinning = false;
        spinBtn.disabled = false;
        resetBtn.disabled = false;
        
        finalResultText.textContent = resultItem.name;
        resultDisplay.classList.remove('hidden');
        
        // アニメーションの初期化（次回スムーズに動かすため）
        rouletteWheel.style.transition = 'none';
        // 角度を0に戻すことで、次回はスムーズに新しい回転が始まる (見た目の回転を維持しつつCSSプロパティをリセット)
        const normalizedAngle = targetAngle % 360;
        rouletteWheel.style.transform = `rotate(${-normalizedAngle}deg)`;
        
    }, 5100); // アニメーション時間 + 少しの余裕
}

spinBtn.addEventListener('click', spinRoulette);
