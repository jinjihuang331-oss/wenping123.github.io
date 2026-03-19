// 秒杀模块核心逻辑

// ==================== 配置参数 ====================
const CONFIG = {
    // 秒杀开始时间（这里设置为当前时间后10秒，方便测试）
    get SALE_START_TIME() {
        return new Date().getTime() + 10 * 1000; // 10秒后
    },
    // 秒杀结束时间（开始时间后30分钟）
    SALE_DURATION: 30 * 60 * 1000, // 30分钟

    // 库存配置
    TOTAL_STOCK: 1000,

    // 限购配置
    LIMIT_PER_USER: 2,

    // 抢购成功概率（0-1）
    SUCCESS_RATE: 0.7
};

// ==================== 状态管理 ====================
const state = {
    currentTime: new Date().getTime(),
    saleStarted: false,
    saleEnded: false,
    purchaseCount: 1,
    stockRemaining: 220,
    stockSold: 780,
    userBoughtCount: 0, // 用户已购买数量
    isProcessing: false
};

// ==================== DOM 元素引用 ====================
const elements = {
    // 倒计时
    countdownLabel: document.getElementById('countdownLabel'),
    days: document.getElementById('days'),
    hours: document.getElementById('hours'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds'),

    // 库存
    stockPercent: document.getElementById('stockPercent'),
    progressFill: document.getElementById('progressFill'),
    soldCount: document.getElementById('soldCount'),
    remainCount: document.getElementById('remainCount'),

    // 限购
    limitNum: document.getElementById('limitNum'),
    qtyInput: document.getElementById('qtyInput'),
    decreaseBtn: document.getElementById('decreaseBtn'),
    increaseBtn: document.getElementById('increaseBtn'),
    limitTip: document.getElementById('limitTip'),

    // 按钮
    flashBtn: document.getElementById('flashBtn'),
    btnText: document.querySelector('.btn-text'),
    btnSubtext: document.querySelector('.btn-subtext'),

    // 弹窗
    modalOverlay: document.getElementById('modalOverlay'),
    modalIcon: document.getElementById('modalIcon'),
    modalTitle: document.getElementById('modalTitle'),
    modalMessage: document.getElementById('modalMessage'),
    modalBtn: document.getElementById('modalBtn')
};

// ==================== 工具函数 ====================

// 格式化数字，不足两位补0
const padZero = (num) => num.toString().padStart(2, '0');

// 计算倒计时
function calculateCountdown(targetTime) {
    const now = new Date().getTime();
    const diff = targetTime - now;

    if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, expired: false };
}

// ==================== 更新UI函数 ====================

// 更新倒计时显示
function updateCountdownDisplay() {
    let targetTime;
    let labelText;

    if (!state.saleStarted) {
        targetTime = CONFIG.SALE_START_TIME;
        labelText = '距离秒杀开始';
    } else if (!state.saleEnded) {
        targetTime = CONFIG.SALE_START_TIME + CONFIG.SALE_DURATION;
        labelText = '距离秒杀结束';
    } else {
        elements.countdownLabel.textContent = '秒杀已结束';
        elements.days.textContent = '00';
        elements.hours.textContent = '00';
        elements.minutes.textContent = '00';
        elements.seconds.textContent = '00';
        return;
    }

    const countdown = calculateCountdown(targetTime);

    elements.countdownLabel.textContent = labelText;
    elements.days.textContent = padZero(countdown.days);
    elements.hours.textContent = padZero(countdown.hours);
    elements.minutes.textContent = padZero(countdown.minutes);
    elements.seconds.textContent = padZero(countdown.seconds);

    return countdown.expired;
}

// 更新库存显示
function updateStockDisplay() {
    const total = CONFIG.TOTAL_STOCK;
    const sold = state.stockSold;
    const remaining = state.stockRemaining;
    const percent = Math.round((sold / total) * 100);

    elements.stockPercent.textContent = `${percent}%`;
    elements.progressFill.style.width = `${percent}%`;
    elements.soldCount.textContent = sold;
    elements.remainCount.textContent = remaining;
}

// 更新限购提示
function updateLimitTip() {
    const remainingLimit = CONFIG.LIMIT_PER_USER - state.userBoughtCount;
    const canBuy = Math.min(remainingLimit, state.stockRemaining);

    elements.limitNum.textContent = CONFIG.LIMIT_PER_USER;
    elements.qtyInput.max = canBuy;

    // 限制数量选择器的最大值
    if (state.purchaseCount > canBuy) {
        state.purchaseCount = canBuy > 0 ? canBuy : 1;
        elements.qtyInput.value = state.purchaseCount;
    }

    // 更新提示文字
    if (state.saleStarted && !state.saleEnded) {
        if (state.stockRemaining <= 0) {
            elements.limitTip.textContent = '商品已售罄';
            elements.limitTip.style.color = '#636e72';
        } else if (remainingLimit <= 0) {
            elements.limitTip.textContent = '您已达购买上限';
            elements.limitTip.style.color = '#636e72';
        } else {
            elements.limitTip.textContent = `您还可购买 ${remainingLimit} 件`;
            elements.limitTip.style.color = '#ff4757';
        }
    }
}

// 更新按钮状态
function updateButtonState() {
    const btn = elements.flashBtn;
    const canPurchase = state.stockRemaining > 0 &&
                        CONFIG.LIMIT_PER_USER - state.userBoughtCount > 0;

    if (state.saleEnded) {
        btn.className = 'flash-btn disabled';
        btn.disabled = true;
        elements.btnText.textContent = '已结束';
        elements.btnSubtext.textContent = '期待下次活动';
    } else if (!state.saleStarted) {
        btn.className = 'flash-btn disabled';
        btn.disabled = true;
        elements.btnText.textContent = '即将开始';
        elements.btnSubtext.textContent = '请稍后再来';
    } else if (state.stockRemaining <= 0) {
        btn.className = 'flash-btn disabled';
        btn.disabled = true;
        elements.btnText.textContent = '已售罄';
        elements.btnSubtext.textContent = '来晚了一步';
    } else if (state.userBoughtCount >= CONFIG.LIMIT_PER_USER) {
        btn.className = 'flash-btn disabled';
        btn.disabled = true;
        elements.btnText.textContent = '已达上限';
        elements.btnSubtext.textContent = '您已购买上限数量';
    } else if (state.isProcessing) {
        btn.className = 'flash-btn processing';
        btn.disabled = true;
        elements.btnText.textContent = '抢购中...';
        elements.btnSubtext.textContent = '正在处理您的请求';
    } else {
        btn.className = 'flash-btn';
        btn.disabled = false;
        elements.btnText.textContent = '立即抢购';
        elements.btnSubtext.textContent = `限购${CONFIG.LIMIT_PER_USER}件，库存紧张`;
    }
}

// 更新数量选择器状态
function updateQuantitySelector() {
    const maxAllowed = Math.min(
        CONFIG.LIMIT_PER_USER - state.userBoughtCount,
        state.stockRemaining
    );

    elements.decreaseBtn.disabled = state.purchaseCount <= 1 || !state.saleStarted || state.saleEnded;
    elements.increaseBtn.disabled = state.purchaseCount >= maxAllowed || !state.saleStarted || state.saleEnded;
}

// ==================== 弹窗功能 ====================

// 显示弹窗
function showModal(type, title, message) {
    const icons = {
        success: '🎉',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    elements.modalIcon.textContent = icons[type] || icons.info;
    elements.modalTitle.textContent = title;
    elements.modalMessage.textContent = message;
    elements.modalOverlay.classList.add('show');

    // 根据类型改变按钮颜色
    if (type === 'success') {
        elements.modalBtn.style.background = 'linear-gradient(90deg, #00b894 0%, #00cec9 100%)';
    } else if (type === 'error') {
        elements.modalBtn.style.background = 'linear-gradient(90deg, #ff4757 0%, #ff6b81 100%)';
    } else {
        elements.modalBtn.style.background = 'linear-gradient(90deg, #0984e3 0%, #74b9ff 100%)';
    }
}

// 关闭弹窗
function closeModal() {
    elements.modalOverlay.classList.remove('show');
}

// ==================== 业务逻辑 ====================

// 秒杀状态检查
function checkSaleStatus() {
    const now = new Date().getTime();

    // 检查是否开始
    if (!state.saleStarted && now >= CONFIG.SALE_START_TIME) {
        state.saleStarted = true;
        // 启用数量选择
        elements.decreaseBtn.disabled = false;
        elements.increaseBtn.disabled = false;
    }

    // 检查是否结束
    if (state.saleStarted && now >= CONFIG.SALE_START_TIME + CONFIG.SALE_DURATION) {
        state.saleEnded = true;
    }
}

// 模拟库存变化
function simulateStockChange() {
    if (state.saleStarted && !state.saleEnded && state.stockRemaining > 0) {
        // 随机增加已售数量
        if (Math.random() < 0.3) {
            const increment = Math.floor(Math.random() * 3) + 1;
            state.stockSold = Math.min(state.stockSold + increment, CONFIG.TOTAL_STOCK);
            state.stockRemaining = Math.max(CONFIG.TOTAL_STOCK - state.stockSold, 0);
            updateStockDisplay();
        }
    }
}

// 执行抢购
async function handlePurchase() {
    if (state.isProcessing) return;

    // 校验限购
    const maxAllowed = CONFIG.LIMIT_PER_USER - state.userBoughtCount;
    if (state.purchaseCount > maxAllowed) {
        showModal('warning', '超出限购', `每人限购${CONFIG.LIMIT_PER_USER}件，您还能购买${maxAllowed}件`);
        return;
    }

    // 校验库存
    if (state.purchaseCount > state.stockRemaining) {
        showModal('warning', '库存不足', '抱歉，商品库存不足，请减少购买数量或选择其他商品');
        return;
    }

    // 开始抢购
    state.isProcessing = true;
    updateButtonState();

    // 模拟网络请求延迟
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 模拟抢购结果
    const isSuccess = Math.random() < CONFIG.SUCCESS_RATE;

    if (isSuccess) {
        // 抢购成功
        state.userBoughtCount += state.purchaseCount;
        state.stockSold += state.purchaseCount;
        state.stockRemaining -= state.purchaseCount;

        updateStockDisplay();
        updateLimitTip();
        showModal(
            'success',
            '抢购成功！',
            `恭喜您成功抢购 ${state.purchaseCount} 件商品，请在15分钟内完成支付`
        );

        // 重置购买数量
        state.purchaseCount = 1;
        elements.qtyInput.value = 1;
    } else {
        // 抢购失败
        showModal(
            'error',
            '抢购失败',
            '手慢了一步，商品已被抢光，请刷新页面查看最新库存'
        );
    }

    state.isProcessing = false;
    updateButtonState();
    updateQuantitySelector();
}

// 数量调整
function changeQuantity(delta) {
    const maxAllowed = Math.min(
        CONFIG.LIMIT_PER_USER - state.userBoughtCount,
        state.stockRemaining
    );
    const newValue = state.purchaseCount + delta;

    if (newValue >= 1 && newValue <= maxAllowed) {
        state.purchaseCount = newValue;
        elements.qtyInput.value = newValue;
        updateQuantitySelector();
    } else if (newValue > maxAllowed) {
        // 超出限购或库存，显示提示
        if (maxAllowed >= CONFIG.LIMIT_PER_USER - state.userBoughtCount) {
            showModal('warning', '超出限购', `每人限购${CONFIG.LIMIT_PER_USER}件，您还能购买${maxAllowed}件`);
        } else {
            showModal('warning', '库存不足', '商品库存不足，无法继续增加');
        }
    }
}

// ==================== 事件绑定 ====================

function bindEvents() {
    // 数量调整按钮
    elements.decreaseBtn.addEventListener('click', () => changeQuantity(-1));
    elements.increaseBtn.addEventListener('click', () => changeQuantity(1));

    // 抢购按钮
    elements.flashBtn.addEventListener('click', handlePurchase);

    // 弹窗关闭
    elements.modalBtn.addEventListener('click', closeModal);
    elements.modalOverlay.addEventListener('click', (e) => {
        if (e.target === elements.modalOverlay) {
            closeModal();
        }
    });

    // 键盘事件
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// ==================== 初始化与定时器 ====================

// 初始化
function init() {
    elements.limitNum.textContent = CONFIG.LIMIT_PER_USER;
    bindEvents();

    // 启动倒计时定时器
    setInterval(() => {
        checkSaleStatus();
        updateCountdownDisplay();
        updateButtonState();
        updateQuantitySelector();
        updateLimitTip();
    }, 1000);

    // 模拟库存变化定时器
    setInterval(simulateStockChange, 3000);

    // 初始更新
    checkSaleStatus();
    updateCountdownDisplay();
    updateStockDisplay();
    updateButtonState();
    updateQuantitySelector();
    updateLimitTip();

    console.log('🚀 秒杀模块已初始化');
    console.log('⏰ 秒杀开始时间:', new Date(CONFIG.SALE_START_TIME).toLocaleString());
    console.log('📦 总库存:', CONFIG.TOTAL_STOCK);
    console.log('🛒 限购数量:', CONFIG.LIMIT_PER_USER);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
