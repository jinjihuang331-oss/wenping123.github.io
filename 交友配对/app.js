// ===== 模拟用户数据 =====
const users = [
    {
        id: 1,
        name: '小雨',
        age: 24,
        location: '上海市',
        distance: '2km',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop',
        photos: [
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop'
        ],
        tags: ['摄影', '旅行', '美食', '🐱 猫奴'],
        bio: '热爱摄影和旅行的90后女孩，喜欢探索城市的每一个角落。周末通常在咖啡馆度过，寻找好喝的拿铁。希望能遇到一个志同道合的你，一起发现生活的美好。',
        job: 'UI设计师',
        education: '本科',
        likeBack: true // 会互相匹配
    },
    {
        id: 2,
        name: '子轩',
        age: 27,
        location: '北京市',
        distance: '5km',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
        photos: [
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop'
        ],
        tags: ['健身', '篮球', '音乐', '🎸 吉他'],
        bio: '程序员一枚，平时喜欢健身和打篮球。周末会弹弹吉他放松心情。希望能找到一个阳光开朗的女生，一起分享生活中的点滴快乐。',
        job: '软件工程师',
        education: '硕士',
        likeBack: false
    },
    {
        id: 3,
        name: '梦琪',
        age: 23,
        location: '深圳市',
        distance: '3km',
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop',
        photos: [
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=400&h=400&fit=crop'
        ],
        tags: ['瑜伽', '阅读', '烘焙', '🍰 甜点控'],
        bio: '瑜伽爱好者，相信内外兼修才是真的美。喜欢阅读心理学书籍，正在学习烘焙。期待遇见一个成熟稳重、有责任心的你。',
        job: '心理咨询师',
        education: '硕士',
        likeBack: true
    },
    {
        id: 4,
        name: '浩然',
        age: 26,
        location: '杭州市',
        distance: '8km',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop',
        photos: [
            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop'
        ],
        tags: ['户外', '登山', '摄影', '🏔️ 探险家'],
        bio: '热爱大自然的户外达人，周末经常登山徒步。希望能找到同样喜欢户外运动的伙伴，一起探索山川湖海。',
        job: '产品经理',
        education: '本科',
        likeBack: false
    },
    {
        id: 5,
        name: '欣怡',
        age: 25,
        location: '广州市',
        distance: '4km',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop',
        photos: [
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1523264939339-c89f9dadde2e?w=400&h=400&fit=crop'
        ],
        tags: ['舞蹈', '电影', '探店', '🎬 影评人'],
        bio: '舞蹈老师一枚，喜欢看电影和探索城市里的美食店。性格活泼开朗，希望能遇到一个有趣的人，一起创造美好回忆。',
        job: '舞蹈老师',
        education: '本科',
        likeBack: false
    }
];

// ===== 应用状态 =====
let currentIndex = 0;
let currentCard = null;
let isDragging = false;
let startX = 0;
let currentX = 0;
let cardOffsetX = 0;
let cardOffsetY = 0;
let rotation = 0;

// ===== DOM 元素 =====
const cardsWrapper = document.getElementById('cardsWrapper');
const btnSkip = document.getElementById('btnSkip');
const btnLike = document.getElementById('btnLike');
const btnInfo = document.getElementById('btnInfo');
const detailModal = document.getElementById('detailModal');
const modalClose = document.getElementById('modalClose');
const modalBody = document.getElementById('modalBody');
const matchModal = document.getElementById('matchModal');
const btnSendMessage = document.getElementById('btnSendMessage');
const btnKeepSwiping = document.getElementById('btnKeepSwiping');
const matchPhotoLeft = document.getElementById('matchPhotoLeft');
const matchPhotoRight = document.getElementById('matchPhotoRight');

// ===== 初始化 =====
function init() {
    renderCards();
    bindEvents();
}

// ===== 渲染卡片 =====
function renderCards() {
    cardsWrapper.innerHTML = '';

    // 显示当前卡片和下两张卡片
    for (let i = 0; i < 3; i++) {
        const index = currentIndex + i;
        if (index >= users.length) break;

        const user = users[index];
        const card = createCard(user, i);
        cardsWrapper.appendChild(card);
    }

    updateCardPositions();
    setupCurrentCard();
}

// ===== 创建卡片 =====
function createCard(user, position) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.userId = user.id;
    card.dataset.position = position;

    card.innerHTML = `
        <div class="card-badge card-badge-like">喜欢</div>
        <div class="card-badge card-badge-skip">跳过</div>
        <img class="card-image" src="${user.avatar}" alt="${user.name}" loading="lazy">
        <div class="card-info">
            <div class="card-name">${user.name} <span class="card-age">${user.age}</span></div>
            <div class="card-location">
                📍 ${user.location} · ${user.distance}
            </div>
            <div class="card-tags">
                ${user.tags.slice(0, 3).map(tag => `<span class="card-tag">${tag}</span>`).join('')}
            </div>
        </div>
    `;

    return card;
}

// ===== 更新卡片位置 =====
function updateCardPositions() {
    const cards = cardsWrapper.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.classList.remove('card-top', 'card-middle', 'card-bottom');
        if (index === 0) card.classList.add('card-top');
        else if (index === 1) card.classList.add('card-middle');
        else if (index === 2) card.classList.add('card-bottom');
    });
}

// ===== 设置当前卡片交互 =====
function setupCurrentCard() {
    currentCard = cardsWrapper.querySelector('.card-top');
    if (!currentCard) {
        // 没有更多卡片
        showNoMoreCards();
        return;
    }

    // 添加触摸/鼠标事件
    currentCard.addEventListener('touchstart', handleDragStart, { passive: false });
    currentCard.addEventListener('mousedown', handleDragStart);
}

// ===== 拖拽开始 =====
function handleDragStart(e) {
    if (isDragging) return;

    isDragging = true;
    startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    currentX = startX;

    currentCard.style.transition = 'none';

    // 绑定移动和结束事件
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('touchend', handleDragEnd);
    document.addEventListener('mouseup', handleDragEnd);
}

// ===== 拖拽移动 =====
function handleDragMove(e) {
    if (!isDragging) return;
    e.preventDefault();

    const x = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const deltaX = x - startX;
    currentX = x;

    // 计算旋转角度
    rotation = deltaX * 0.05;

    // 限制垂直移动
    cardOffsetX = deltaX;
    cardOffsetY = Math.abs(deltaX) * 0.1;

    // 应用变换
    currentCard.style.transform = `translateX(${cardOffsetX}px) translateY(${cardOffsetY}px) rotate(${rotation}deg)`;

    // 更新徽章显示
    updateBadges(deltaX);
}

// ===== 更新徽章 =====
function updateBadges(deltaX) {
    const likeBadge = currentCard.querySelector('.card-badge-like');
    const skipBadge = currentCard.querySelector('.card-badge-skip');

    const threshold = 50;
    const opacity = Math.min(Math.abs(deltaX) / threshold, 1);

    if (deltaX > 0) {
        likeBadge.style.opacity = opacity;
        skipBadge.style.opacity = 0;
    } else if (deltaX < 0) {
        likeBadge.style.opacity = 0;
        skipBadge.style.opacity = opacity;
    } else {
        likeBadge.style.opacity = 0;
        skipBadge.style.opacity = 0;
    }
}

// ===== 拖拽结束 =====
function handleDragEnd(e) {
    if (!isDragging) return;
    isDragging = false;

    // 移除事件监听
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('touchend', handleDragEnd);
    document.removeEventListener('mouseup', handleDragEnd);

    const deltaX = currentX - startX;
    const threshold = 100;

    if (Math.abs(deltaX) > threshold) {
        // 滑动足够距离，执行喜欢/跳过
        if (deltaX > 0) {
            handleLike();
        } else {
            handleSkip();
        }
    } else {
        // 回弹到原位
        bounceBack();
    }
}

// ===== 回弹动画 =====
function bounceBack() {
    currentCard.classList.add('bounce-back');
    currentCard.style.transform = 'translateX(0) translateY(0) rotate(0deg)';

    // 隐藏徽章
    const badges = currentCard.querySelectorAll('.card-badge');
    badges.forEach(badge => badge.style.opacity = 0);

    setTimeout(() => {
        currentCard.classList.remove('bounce-back');
        currentCard.style.transition = '';
    }, 500);
}

// ===== 处理喜欢 =====
function handleLike() {
    const user = users[currentIndex];

    // 滑出动画
    currentCard.classList.add('bounce-back');
    currentCard.style.transform = 'translateX(150%) translateY(50px) rotate(30deg)';
    currentCard.style.opacity = '0';

    setTimeout(() => {
        if (user.likeBack) {
            showMatchModal(user);
        }
        nextCard();
    }, 300);
}

// ===== 处理跳过 =====
function handleSkip() {
    // 滑出动画
    currentCard.classList.add('bounce-back');
    currentCard.style.transform = 'translateX(-150%) translateY(50px) rotate(-30deg)';
    currentCard.style.opacity = '0';

    setTimeout(() => {
        nextCard();
    }, 300);
}

// ===== 下一张卡片 =====
function nextCard() {
    currentIndex++;

    // 移除当前卡片
    if (currentCard) {
        currentCard.remove();
    }

    // 检查是否还有卡片
    if (currentIndex >= users.length) {
        showNoMoreCards();
        return;
    }

    // 添加新卡片到底部
    const nextIndex = currentIndex + 2;
    if (nextIndex < users.length) {
        const newCard = createCard(users[nextIndex], 2);
        newCard.style.opacity = '0';
        cardsWrapper.appendChild(newCard);

        // 新卡片进入动画
        requestAnimationFrame(() => {
            newCard.classList.add('card-enter');
            setTimeout(() => {
                newCard.classList.remove('card-enter');
                newCard.style.opacity = '';
            }, 500);
        });
    }

    // 更新位置
    updateCardPositions();
    setupCurrentCard();
}

// ===== 显示没有更多卡片 =====
function showNoMoreCards() {
    cardsWrapper.innerHTML = `
        <div class="no-more-cards">
            <div class="no-more-icon">🎉</div>
            <h3>今日推荐已看完</h3>
            <p>明天再来看更多心动的人吧~</p>
        </div>
    `;
}

// ===== 显示用户详情 =====
function showDetail() {
    if (!currentCard) return;

    const userId = parseInt(currentCard.dataset.userId);
    const user = users.find(u => u.id === userId);
    if (!user) return;

    modalBody.innerHTML = `
        <div class="detail-header">
            <img class="detail-avatar" src="${user.avatar}" alt="${user.name}">
            <div class="detail-basic">
                <h2>${user.name}, ${user.age}</h2>
                <p>📍 ${user.location} · ${user.distance}</p>
                <p>💼 ${user.job}</p>
                <p>🎓 ${user.education}</p>
            </div>
        </div>

        <div class="detail-section">
            <h3>关于我</h3>
            <p>${user.bio}</p>
        </div>

        <div class="detail-section">
            <h3>兴趣爱好</h3>
            <div class="detail-tags">
                ${user.tags.map(tag => `<span class="detail-tag">${tag}</span>`).join('')}
            </div>
        </div>

        <div class="detail-section">
            <h3>照片</h3>
            <div class="detail-photos">
                ${user.photos.map(photo => `<img class="detail-photo" src="${photo}" alt="photo" loading="lazy">`).join('')}
            </div>
        </div>
    `;

    detailModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ===== 关闭详情弹窗 =====
function closeDetail() {
    detailModal.classList.remove('active');
    document.body.style.overflow = '';
}

// ===== 显示匹配成功弹窗 =====
function showMatchModal(user) {
    // 设置头像
    matchPhotoLeft.style.backgroundImage = 'url(https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop)';
    matchPhotoRight.style.backgroundImage = `url(${user.avatar})`;

    matchModal.classList.add('active');

    // 创建粒子效果
    createParticles();
}

// ===== 关闭匹配弹窗 =====
function closeMatchModal() {
    matchModal.classList.remove('active');
}

// ===== 创建粒子效果 =====
function createParticles() {
    const particles = document.createElement('div');
    particles.className = 'particles';

    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = '50%';
        particle.style.top = '50%';
        particle.style.animation = `particle-${i} 1s ease-out forwards`;

        const angle = (i / 20) * Math.PI * 2;
        const distance = 100 + Math.random() * 100;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;

        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);

        particles.appendChild(particle);
    }

    matchModal.querySelector('.match-content').appendChild(particles);

    // 清理粒子
    setTimeout(() => {
        particles.remove();
    }, 1000);
}

// ===== 绑定事件 =====
function bindEvents() {
    // 按钮事件
    btnSkip.addEventListener('click', () => {
        if (currentCard) {
            // 按钮动画
            currentCard.classList.add('bounce-back');
            currentCard.style.transform = 'translateX(-150%) translateY(50px) rotate(-30deg)';
            currentCard.style.opacity = '0';
            setTimeout(() => nextCard(), 300);
        }
    });

    btnLike.addEventListener('click', () => {
        if (currentCard) {
            // 按钮动画
            const user = users[currentIndex];
            currentCard.classList.add('bounce-back');
            currentCard.style.transform = 'translateX(150%) translateY(50px) rotate(30deg)';
            currentCard.style.opacity = '0';

            setTimeout(() => {
                if (user.likeBack) {
                    showMatchModal(user);
                }
                nextCard();
            }, 300);
        }
    });

    btnInfo.addEventListener('click', showDetail);

    // 弹窗事件
    modalClose.addEventListener('click', closeDetail);
    detailModal.addEventListener('click', (e) => {
        if (e.target === detailModal) closeDetail();
    });

    // 匹配弹窗事件
    btnSendMessage.addEventListener('click', () => {
        alert('开始聊天功能开发中...');
        closeMatchModal();
    });

    btnKeepSwiping.addEventListener('click', closeMatchModal);

    // 键盘事件
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (matchModal.classList.contains('active')) {
                closeMatchModal();
            } else if (detailModal.classList.contains('active')) {
                closeDetail();
            }
        }
        if (e.key === 'ArrowLeft' && currentCard) {
            btnSkip.click();
        }
        if (e.key === 'ArrowRight' && currentCard) {
            btnLike.click();
        }
    });
}

// ===== 添加粒子动画样式 =====
const style = document.createElement('style');
style.textContent = `
    @keyframes particle-0 { to { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 1; } }
`;
for (let i = 1; i < 20; i++) {
    style.textContent += `
        @keyframes particle-${i} { to { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 1; } }
    `;
}
style.textContent += `
    .no-more-cards {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        text-align: center;
        color: var(--text-light);
    }
    .no-more-icon {
        font-size: 64px;
        margin-bottom: 20px;
    }
    .no-more-cards h3 {
        font-size: 20px;
        color: var(--text-dark);
        margin-bottom: 8px;
    }
`;
document.head.appendChild(style);

// ===== 启动应用 =====
init();
