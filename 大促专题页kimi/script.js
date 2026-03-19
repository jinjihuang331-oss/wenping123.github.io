/**
 * 限时大促专题页 - 交互脚本
 */

// ========================================
// 全局变量
// ========================================
let countdownInterval;
let buyerInterval;
let endTime;

// ========================================
// 初始化
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    initCountdown();
    initParticles();
    initBuyerCount();
    initTabs();
    initScrollAnimation();
    initCouponProgress();
});

// ========================================
// 倒计时功能
// ========================================
function initCountdown() {
    // 设置倒计时结束时间（8小时35分42秒后）
    endTime = new Date().getTime() + (8 * 60 * 60 + 35 * 60 + 42) * 1000;

    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
}

function updateCountdown() {
    const now = new Date().getTime();
    const distance = endTime - now;

    if (distance < 0) {
        clearInterval(countdownInterval);
        showEndedState();
        return;
    }

    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // 更新主倒计时
    document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');

    // 更新底部倒计时
    const bottomTimer = document.getElementById('bottomTimer');
    if (bottomTimer) {
        bottomTimer.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
}

function showEndedState() {
    document.getElementById('hours').textContent = '00';
    document.getElementById('minutes').textContent = '00';
    document.getElementById('seconds').textContent = '00';

    const countdownLabel = document.querySelector('.countdown-label');
    if (countdownLabel) {
        countdownLabel.textContent = '⏰ 活动已结束';
        countdownLabel.style.color = '#999';
    }

    // 禁用所有购买按钮
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.textContent = '已结束';
        btn.disabled = true;
        btn.style.background = '#999';
    });
}

// ========================================
// 粒子效果（主视觉背景）
// ========================================
function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
        createParticle(container);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';

    // 随机位置
    const x = Math.random() * 100;
    const y = Math.random() * 100;

    // 随机动画延迟
    const delay = Math.random() * 3;
    const duration = 2 + Math.random() * 2;

    particle.style.left = x + '%';
    particle.style.top = y + '%';
    particle.style.animationDelay = delay + 's';
    particle.style.animationDuration = duration + 's';

    // 随机大小
    const size = 3 + Math.random() * 5;
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';

    container.appendChild(particle);
}

// ========================================
// 购买人数动态更新
// ========================================
function initBuyerCount() {
    let count = 12580;
    const buyerElement = document.getElementById('buyerCount');
    const bottomCountElement = document.getElementById('bottomCount');

    buyerInterval = setInterval(() => {
        // 随机增加 1-5 人
        const increase = Math.floor(Math.random() * 5) + 1;
        count += increase;

        const formattedCount = count.toLocaleString();

        if (buyerElement) {
            buyerElement.textContent = formattedCount;
        }
        if (bottomCountElement) {
            bottomCountElement.textContent = formattedCount;
        }
    }, 3000);
}

// ========================================
// 优惠券领取
// ========================================
function claimCoupon(btn, amount) {
    const couponItem = btn.closest('.coupon-item');

    if (couponItem.classList.contains('claimed')) {
        showToast('您已经领取过该优惠券了');
        return;
    }

    // 添加领取动画
    btn.innerHTML = '<span class="loading">领取中...</span>';
    btn.disabled = true;

    setTimeout(() => {
        couponItem.classList.add('claimed');
        btn.textContent = '已领取';
        showToast(`🎉 成功领取 ¥${amount} 优惠券！`);

        // 更新进度条
        updateCouponProgress();
    }, 800);
}

function initCouponProgress() {
    const progressFill = document.getElementById('couponProgress');
    if (progressFill) {
        progressFill.style.width = '78%';
    }
}

function updateCouponProgress() {
    const progressFill = document.getElementById('couponProgress');
    const percentElement = document.getElementById('couponPercent');

    if (progressFill && percentElement) {
        let currentPercent = parseInt(percentElement.textContent);
        currentPercent = Math.min(currentPercent + 2, 100);

        progressFill.style.width = currentPercent + '%';
        percentElement.textContent = currentPercent;
    }
}

// ========================================
// 活动规则展开/收起
// ========================================
function toggleRules() {
    const content = document.getElementById('rulesContent');
    const toggle = document.getElementById('rulesToggle');

    if (content.classList.contains('show')) {
        content.classList.remove('show');
        toggle.textContent = '展开';
    } else {
        content.classList.add('show');
        toggle.textContent = '收起';
    }
}

// ========================================
// 标签切换（正在疯抢/即将开始）
// ========================================
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;

            // 切换按钮状态
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // 切换内容
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetTab) {
                    content.classList.add('active');
                }
            });
        });
    });
}

// ========================================
// 立即购买
// ========================================
function buyNow(btn) {
    // 添加点击效果
    createRipple(btn);

    // 按钮动画
    btn.innerHTML = '<span class="loading">抢购中...</span>';
    btn.disabled = true;

    setTimeout(() => {
        btn.innerHTML = '✓ 已加入购物车';
        btn.style.background = '#4CAF50';
        showToast('🎉 商品已成功加入购物车！');

        setTimeout(() => {
            btn.innerHTML = '立即抢购';
            btn.disabled = false;
            btn.style.background = '';
        }, 2000);
    }, 800);
}

// 创建波纹效果
function createRipple(btn) {
    const ripple = document.createElement('span');
    ripple.className = 'ripple';

    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';

    btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    btn.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
}

// ========================================
// 滚动到商品区
// ========================================
function scrollToProducts() {
    const productsSection = document.querySelector('.products-section');
    if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// ========================================
// 滚动动画
// ========================================
function initScrollAnimation() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // 为各区块添加滚动动画
    document.querySelectorAll('.coupon-item, .zone-card, .service-item').forEach(el => {
        el.classList.add('scroll-show');
        observer.observe(el);
    });
}

// ========================================
// Toast 提示
// ========================================
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// ========================================
// 设置提醒
// ========================================
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('remind-btn')) {
        createRipple(e.target);
        e.target.textContent = '✓ 已设置提醒';
        e.target.disabled = true;
        showToast('⏰ 我们会在开售前5分钟提醒您！');
    }
});

// ========================================
// 分区卡片点击
// ========================================
document.addEventListener('click', function(e) {
    const zoneCard = e.target.closest('.zone-card');
    if (zoneCard) {
        const zoneName = zoneCard.querySelector('h3').textContent;
        showToast(`🚀 即将跳转到${zoneName}...`);
    }
});

// ========================================
// 库存实时更新（模拟）
// ========================================
setInterval(() => {
    const overlays = document.querySelectorAll('.sold-overlay span');
    overlays.forEach(overlay => {
        const match = overlay.textContent.match(/(\d+)%/);
        if (match) {
            let percent = parseInt(match[1]);
            // 随机增加 0-3%
            const increase = Math.floor(Math.random() * 3);
            percent = Math.min(percent + increase, 100);

            if (percent >= 100) {
                overlay.textContent = '已抢光';
                overlay.parentElement.style.background = '#999';
            } else {
                overlay.textContent = `已抢 ${percent}%`;
            }
        }
    });
}, 5000);

// ========================================
// 页面可见性变化处理
// ========================================
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // 页面隐藏时，暂停部分动画以节省资源
        document.body.style.animationPlayState = 'paused';
    } else {
        document.body.style.animationPlayState = 'running';
    }
});

// ========================================
// 防止重复提交
// ========================================
let isSubmitting = false;

function preventDoubleSubmit(fn) {
    return function(...args) {
        if (isSubmitting) return;
        isSubmitting = true;

        fn.apply(this, args);

        setTimeout(() => {
            isSubmitting = false;
        }, 1000);
    };
}

// 为购买按钮添加防重复提交
window.buyNow = preventDoubleSubmit(window.buyNow);
