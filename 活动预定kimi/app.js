/**
 * 活动预订系统
 * Event Booking System
 */

// 应用主对象
const app = {
    // 当前视图状态
    currentView: 'calendar',
    currentMonth: new Date(),
    selectedDate: null,
    selectedEvent: null,
    selectedSeats: [],

    // 用户时区
    userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

    // 模拟数据 - 活动
    events: [],

    // 模拟数据 - 预订
    bookings: [],

    // 座位价格配置
    seatPrices: {
        'VIP': 880,
        'A区': 580,
        'B区': 380,
        'C区': 180
    },

    // 初始化
    init() {
        this.generateMockData();
        this.loadBookingsFromStorage();
        this.renderCalendar();
        this.updateCalendarMonth();
        this.setupEventListeners();
    },

    // 生成模拟数据
    generateMockData() {
        const categories = ['音乐会', '体育', '戏剧', '展览', '会议'];
        const venues = ['北京国家体育馆', '上海大剧院', '广州体育馆', '深圳湾体育中心'];
        const eventNames = {
            '音乐会': ['2024新年音乐会', '周杰伦世界巡演', '古典音乐之夜', '爵士音乐节'],
            '体育': ['NBA中国赛', '中超联赛', 'CBA总决赛', '网球公开赛'],
            '戏剧': ['哈姆雷特', '雷雨', '茶馆', '牡丹亭'],
            '展览': ['印象派画展', '科技创新展', '古董收藏展', '摄影艺术展'],
            '会议': ['互联网技术峰会', '创业者大会', '人工智能论坛', '设计思维工作坊']
        };

        // 生成未来30天的活动
        const today = new Date();
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);

            // 每天随机生成1-3个活动
            const numEvents = Math.floor(Math.random() * 3) + 1;

            for (let j = 0; j < numEvents; j++) {
                const category = categories[Math.floor(Math.random() * categories.length)];
                const venue = venues[Math.floor(Math.random() * venues.length)];
                const names = eventNames[category];
                const name = names[Math.floor(Math.random() * names.length)];

                // 设置时间（带时区信息）
                const hour = 18 + Math.floor(Math.random() * 4); // 18:00 - 22:00
                const eventDate = new Date(date);
                eventDate.setHours(hour, 0, 0, 0);

                // 生成座位图
                const seats = this.generateSeatMap();

                this.events.push({
                    id: `event-${Date.now()}-${i}-${j}`,
                    name: name,
                    category: category,
                    venue: venue,
                    date: eventDate.toISOString(),
                    timezone: 'Asia/Shanghai',
                    duration: 120 + Math.floor(Math.random() * 60), // 120-180分钟
                    seats: seats,
                    description: `${category}活动，在${venue}举行`,
                    image: null
                });
            }
        }
    },

    // 生成座位图
    generateSeatMap() {
        const seats = [];
        const sections = [
            { name: 'VIP', rows: 4, cols: 10, startY: 280 },
            { name: 'A区', rows: 6, cols: 12, startY: 200 },
            { name: 'B区', rows: 6, cols: 14, startY: 120 },
            { name: 'C区', rows: 5, cols: 16, startY: 50 }
        ];

        sections.forEach(section => {
            const sectionWidth = section.cols * 35 + (section.cols - 1) * 5;
            const startX = (600 - sectionWidth) / 2;

            for (let row = 0; row < section.rows; row++) {
                for (let col = 0; col < section.cols; col++) {
                    // 随机设置一些座位已售
                    const isOccupied = Math.random() < 0.3;

                    seats.push({
                        id: `${section.name}-${row + 1}-${col + 1}`,
                        section: section.name,
                        row: row + 1,
                        number: col + 1,
                        x: startX + col * 40,
                        y: section.startY - row * 35,
                        status: isOccupied ? 'occupied' : 'available',
                        price: this.seatPrices[section.name]
                    });
                }
            }
        });

        return seats;
    },

    // 从本地存储加载预订
    loadBookingsFromStorage() {
        const saved = localStorage.getItem('myBookings');
        if (saved) {
            this.bookings = JSON.parse(saved);
        }
    },

    // 保存预订到本地存储
    saveBookingsToStorage() {
        localStorage.setItem('myBookings', JSON.stringify(this.bookings));
    },

    // 设置事件监听
    setupEventListeners() {
        // 筛选器事件
        document.getElementById('filter-date')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('filter-venue')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('filter-category')?.addEventListener('change', () => this.applyFilters());
    },

    // 渲染日历
    renderCalendar() {
        const grid = document.getElementById('calendar-grid');
        if (!grid) return;

        grid.innerHTML = '';

        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();

        // 获取当月第一天
        const firstDay = new Date(year, month, 1);
        // 获取当月最后一天
        const lastDay = new Date(year, month + 1, 0);

        // 获取第一天是星期几
        const startDayOfWeek = firstDay.getDay();
        // 获取当月天数
        const daysInMonth = lastDay.getDate();

        // 上个月的日期
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const day = prevMonthLastDay - i;
            const cell = this.createCalendarCell(day, true);
            grid.appendChild(cell);
        }

        // 当月日期
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday = date.toDateString() === today.toDateString();

            // 检查当天是否有活动
            const hasEvents = this.events.some(event => {
                const eventDate = new Date(event.date);
                return eventDate.toDateString() === date.toDateString();
            });

            const cell = this.createCalendarCell(day, false, isToday, hasEvents, date);
            grid.appendChild(cell);
        }

        // 下个月的日期
        const remainingCells = 42 - (startDayOfWeek + daysInMonth);
        for (let day = 1; day <= remainingCells; day++) {
            const cell = this.createCalendarCell(day, true);
            grid.appendChild(cell);
        }
    },

    // 创建日历单元格
    createCalendarCell(day, isOtherMonth, isToday = false, hasEvents = false, date = null) {
        const cell = document.createElement('div');
        cell.className = `calendar-cell ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${hasEvents ? 'has-events' : ''}`;

        const dateNumber = document.createElement('div');
        dateNumber.className = 'date-number';
        dateNumber.textContent = day;
        cell.appendChild(dateNumber);

        if (date && !isOtherMonth) {
            cell.addEventListener('click', () => this.showEventsForDate(date));
        }

        return cell;
    },

    // 更新日历月份显示
    updateCalendarMonth() {
        const monthElement = document.getElementById('calendar-month');
        if (monthElement) {
            const year = this.currentMonth.getFullYear();
            const month = this.currentMonth.getMonth() + 1;
            monthElement.textContent = `${year}年${month}月`;
        }
    },

    // 上一个月
    previousMonth() {
        this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
        this.renderCalendar();
        this.updateCalendarMonth();
    },

    // 下一个月
    nextMonth() {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
        this.renderCalendar();
        this.updateCalendarMonth();
    },

    // 应用筛选
    applyFilters() {
        this.renderCalendar();
    },

    // 获取筛选后的活动
    getFilteredEvents(date = null) {
        const dateFilter = document.getElementById('filter-date')?.value;
        const venueFilter = document.getElementById('filter-venue')?.value;
        const categoryFilter = document.getElementById('filter-category')?.value;

        return this.events.filter(event => {
            const eventDate = new Date(event.date);

            // 日期筛选
            if (date) {
                if (eventDate.toDateString() !== date.toDateString()) return false;
            } else if (dateFilter) {
                const filterDate = new Date(dateFilter);
                if (eventDate.toDateString() !== filterDate.toDateString()) return false;
            }

            // 场地筛选
            if (venueFilter && event.venue !== venueFilter) return false;

            // 类别筛选
            if (categoryFilter && event.category !== categoryFilter) return false;

            return true;
        });
    },

    // 显示指定日期的活动
    showEventsForDate(date) {
        this.selectedDate = date;
        const events = this.getFilteredEvents(date);

        document.getElementById('calendar-view').classList.add('hidden');
        document.getElementById('events-list-view').classList.remove('hidden');
        document.getElementById('seat-selection-view').classList.add('hidden');

        const dateElement = document.getElementById('events-list-date');
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        dateElement.textContent = date.toLocaleDateString('zh-CN', options);

        const listContainer = document.getElementById('events-list');
        listContainer.innerHTML = '';

        if (events.length === 0) {
            listContainer.innerHTML = `
                <div class="text-center py-12">
                    <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <p class="text-gray-500">该日期暂无活动</p>
                </div>
            `;
            return;
        }

        events.forEach(event => {
            const eventCard = this.createEventCard(event);
            listContainer.appendChild(eventCard);
        });
    },

    // 创建活动卡片
    createEventCard(event) {
        const card = document.createElement('div');
        card.className = 'event-card bg-white rounded-lg shadow p-6 cursor-pointer';

        const eventDate = new Date(event.date);
        const timeString = eventDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

        // 转换时区显示
        const localTime = this.convertToLocalTime(event.date, event.timezone);

        // 计算剩余座位
        const availableSeats = event.seats.filter(s => s.status === 'available').length;

        // 获取类别徽章样式
        const badgeClass = this.getCategoryBadgeClass(event.category);

        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="badge ${badgeClass}">${event.category}</span>
                        <span class="text-sm text-gray-500">${timeString}</span>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900 mb-2">${event.name}</h3>
                    <p class="text-gray-600 mb-2">${event.venue}</p>
                    <p class="text-sm text-gray-500">本地时间: ${localTime}</p>
                    <p class="text-sm text-gray-500">时长: ${event.duration}分钟</p>
                </div>
                <div class="text-right">
                    <p class="text-lg font-semibold text-indigo-600">¥${this.seatPrices['C区']}起</p>
                    <p class="text-sm text-gray-500 mt-1">剩余 ${availableSeats} 个座位</p>
                    <button class="mt-3 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition">
                        选择座位
                    </button>
                </div>
            </div>
        `;

        card.addEventListener('click', () => this.showSeatSelection(event));

        return card;
    },

    // 获取类别徽章样式
    getCategoryBadgeClass(category) {
        const classes = {
            '音乐会': 'badge-concert',
            '体育': 'badge-sports',
            '戏剧': 'badge-theater',
            '展览': 'badge-exhibition',
            '会议': 'badge-conference'
        };
        return classes[category] || 'bg-gray-100 text-gray-800';
    },

    // 转换时区时间
    convertToLocalTime(dateString, sourceTimezone) {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            timeZone: this.userTimezone,
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // 显示座位选择
    showSeatSelection(event) {
        this.selectedEvent = event;
        this.selectedSeats = [];

        document.getElementById('events-list-view').classList.add('hidden');
        document.getElementById('seat-selection-view').classList.remove('hidden');

        // 更新活动详情
        const eventDate = new Date(event.date);
        const localTime = this.convertToLocalTime(event.date, event.timezone);

        document.getElementById('event-details').innerHTML = `
            <h2 class="text-2xl font-bold text-gray-900">${event.name}</h2>
            <div class="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                <span class="flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    ${eventDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <span class="flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    ${eventDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} (本地: ${localTime})
                </span>
                <span class="flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    ${event.venue}
                </span>
            </div>
        `;

        this.renderSeatMap(event);
        this.updateBookingSummary();
    },

    // 渲染座位图
    renderSeatMap(event) {
        const svg = document.getElementById('seat-map');
        svg.innerHTML = '';

        // 添加舞台
        const stage = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        stage.setAttribute('x', '200');
        stage.setAttribute('y', '10');
        stage.setAttribute('width', '200');
        stage.setAttribute('height', '30');
        stage.setAttribute('rx', '5');
        stage.setAttribute('class', 'stage');
        svg.appendChild(stage);

        const stageLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        stageLabel.setAttribute('x', '300');
        stageLabel.setAttribute('y', '30');
        stageLabel.setAttribute('class', 'stage-label');
        stageLabel.textContent = '舞台';
        svg.appendChild(stageLabel);

        // 添加区域标签
        const sections = ['VIP', 'A区', 'B区', 'C区'];
        sections.forEach((section, index) => {
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', '50');
            label.setAttribute('y', 280 - index * 80 + 10);
            label.setAttribute('fill', '#6b7280');
            label.setAttribute('font-size', '12');
            label.setAttribute('font-weight', 'bold');
            label.textContent = `${section} (¥${this.seatPrices[section]})`;
            svg.appendChild(label);
        });

        // 添加座位
        event.seats.forEach(seat => {
            const seatGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            seatGroup.setAttribute('class', 'seat-group');

            const seatRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            seatRect.setAttribute('x', seat.x);
            seatRect.setAttribute('y', seat.y);
            seatRect.setAttribute('width', '25');
            seatRect.setAttribute('height', '20');
            seatRect.setAttribute('rx', '3');
            seatRect.setAttribute('class', `seat ${seat.status}`);
            seatRect.setAttribute('data-seat-id', seat.id);

            if (seat.status !== 'occupied') {
                seatRect.addEventListener('click', () => this.toggleSeat(seat));
            }

            const seatLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            seatLabel.setAttribute('x', seat.x + 12.5);
            seatLabel.setAttribute('y', seat.y + 14);
            seatLabel.setAttribute('class', 'seat-label');
            seatLabel.setAttribute('text-anchor', 'middle');
            seatLabel.textContent = seat.number;

            seatGroup.appendChild(seatRect);
            seatGroup.appendChild(seatLabel);
            svg.appendChild(seatGroup);
        });
    },

    // 切换座位选择
    toggleSeat(seat) {
        const index = this.selectedSeats.findIndex(s => s.id === seat.id);

        if (index > -1) {
            this.selectedSeats.splice(index, 1);
        } else {
            if (this.selectedSeats.length >= 6) {
                alert('最多只能选择6个座位');
                return;
            }
            this.selectedSeats.push(seat);
        }

        // 更新座位视觉状态
        const seatElement = document.querySelector(`[data-seat-id="${seat.id}"]`);
        if (seatElement) {
            if (index > -1) {
                seatElement.classList.remove('selected');
                seatElement.classList.add('available');
            } else {
                seatElement.classList.remove('available');
                seatElement.classList.add('selected');
            }
        }

        this.updateBookingSummary();
    },

    // 更新预订摘要
    updateBookingSummary() {
        const summary = document.getElementById('booking-summary');
        const totalPrice = document.getElementById('total-price');
        const confirmBtn = document.getElementById('confirm-booking-btn');

        if (this.selectedSeats.length === 0) {
            summary.innerHTML = '<p class="text-gray-600">请选择座位</p>';
            totalPrice.textContent = '¥0';
            confirmBtn.disabled = true;
            return;
        }

        // 按区域分组
        const grouped = this.selectedSeats.reduce((acc, seat) => {
            if (!acc[seat.section]) {
                acc[seat.section] = [];
            }
            acc[seat.section].push(seat);
            return acc;
        }, {});

        let html = '';
        let total = 0;

        for (const [section, seats] of Object.entries(grouped)) {
            const price = this.seatPrices[section];
            const subtotal = price * seats.length;
            total += subtotal;

            html += `
                <div class="flex justify-between items-center py-1">
                    <span>${section} x${seats.length}</span>
                    <span class="font-medium">¥${subtotal}</span>
                </div>
            `;
        }

        summary.innerHTML = html;
        totalPrice.textContent = `¥${total}`;
        confirmBtn.disabled = false;
    },

    // 确认预订
    confirmBooking() {
        if (this.selectedSeats.length === 0) return;

        // 创建预订记录
        const booking = {
            id: `booking-${Date.now()}`,
            eventId: this.selectedEvent.id,
            eventName: this.selectedEvent.name,
            eventDate: this.selectedEvent.date,
            eventVenue: this.selectedEvent.venue,
            seats: this.selectedSeats.map(s => ({ ...s })),
            totalPrice: this.selectedSeats.reduce((sum, s) => sum + s.price, 0),
            bookingTime: new Date().toISOString(),
            timezone: this.userTimezone
        };

        // 更新活动座位状态
        this.selectedSeats.forEach(seat => {
            const eventSeat = this.selectedEvent.seats.find(s => s.id === seat.id);
            if (eventSeat) {
                eventSeat.status = 'occupied';
            }
        });

        // 保存预订
        this.bookings.push(booking);
        this.saveBookingsToStorage();

        // 显示门票
        this.showTicket(booking);
    },

    // 显示门票
    showTicket(booking) {
        const modal = document.getElementById('ticket-modal');
        const ticketContent = document.getElementById('ticket-content');
        const qrContainer = document.getElementById('qrcode-container');

        const eventDate = new Date(booking.eventDate);
        const seatInfo = booking.seats.map(s => `${s.section} ${s.row}排${s.number}号`).join(', ');

        ticketContent.innerHTML = `
            <div class="ticket">
                <div class="ticket-header">
                    <h4 class="text-lg font-bold">${booking.eventName}</h4>
                    <p class="text-sm opacity-80">${booking.eventVenue}</p>
                </div>
                <div class="ticket-body">
                    <div class="ticket-row">
                        <div>
                            <p class="ticket-label">日期</p>
                            <p class="ticket-value">${eventDate.toLocaleDateString('zh-CN')}</p>
                        </div>
                        <div>
                            <p class="ticket-label">时间</p>
                            <p class="ticket-value">${eventDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                    <div class="ticket-row">
                        <div>
                            <p class="ticket-label">座位</p>
                            <p class="ticket-value">${seatInfo}</p>
                        </div>
                        <div>
                            <p class="ticket-label">总价</p>
                            <p class="ticket-value">¥${booking.totalPrice}</p>
                        </div>
                    </div>
                    <div class="mt-4 pt-3 border-t border-white border-opacity-30">
                        <p class="text-xs opacity-70">订单号: ${booking.id}</p>
                    </div>
                </div>
            </div>
        `;

        // 生成二维码
        qrContainer.innerHTML = '';
        new QRCode(qrContainer, {
            text: JSON.stringify({
                bookingId: booking.id,
                event: booking.eventName,
                seats: booking.seats.length,
                timestamp: booking.bookingTime
            }),
            width: 150,
            height: 150,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
        });

        // 设置邮件提醒链接
        const emailSubject = encodeURIComponent(`活动提醒: ${booking.eventName}`);
        const emailBody = encodeURIComponent(`
您好！

这是您的活动预订提醒：

活动: ${booking.eventName}
日期: ${eventDate.toLocaleDateString('zh-CN')}
时间: ${eventDate.toLocaleTimeString('zh-CN')}
场地: ${booking.eventVenue}
座位: ${seatInfo}
订单号: ${booking.id}

请保存此邮件并准时参加活动。
        `);

        document.getElementById('email-reminder-link').href = `mailto:?subject=${emailSubject}&body=${emailBody}`;

        modal.classList.remove('hidden');
    },

    // 关闭门票模态框
    closeTicketModal() {
        document.getElementById('ticket-modal').classList.add('hidden');
        this.selectedSeats = [];
        this.showCalendarView();
    },

    // 显示日历视图
    showCalendarView() {
        this.hideAllViews();
        document.getElementById('calendar-view').classList.remove('hidden');
        this.currentView = 'calendar';
        this.updateNavButtons();
        this.renderCalendar();
    },

    // 显示活动列表视图
    showEventsListView() {
        this.hideAllViews();
        document.getElementById('events-list-view').classList.remove('hidden');
        this.currentView = 'events-list';
    },

    // 显示管理员仪表盘
    showAdminDashboard() {
        this.hideAllViews();
        document.getElementById('admin-dashboard').classList.remove('hidden');
        this.currentView = 'admin';
        this.updateNavButtons();
        this.renderAdminDashboard();
    },

    // 渲染管理员仪表盘
    renderAdminDashboard() {
        // 计算统计数据
        const totalEvents = this.events.length;
        const totalBookings = this.bookings.length;
        const totalRevenue = this.bookings.reduce((sum, b) => sum + b.totalPrice, 0);

        const today = new Date().toDateString();
        const todayBookings = this.bookings.filter(b => {
            return new Date(b.bookingTime).toDateString() === today;
        }).length;

        // 更新统计卡片
        document.getElementById('admin-total-events').textContent = totalEvents;
        document.getElementById('admin-total-bookings').textContent = totalBookings;
        document.getElementById('admin-total-revenue').textContent = `¥${totalRevenue.toLocaleString()}`;
        document.getElementById('admin-today-bookings').textContent = todayBookings;

        // 渲染活动统计表格
        const tbody = document.getElementById('admin-events-table');
        tbody.innerHTML = '';

        this.events.forEach(event => {
            const eventBookings = this.bookings.filter(b => b.eventId === event.id);
            const soldSeats = eventBookings.reduce((sum, b) => sum + b.seats.length, 0);
            const totalSeats = event.seats.length;
            const occupancyRate = totalSeats > 0 ? (soldSeats / totalSeats * 100).toFixed(1) : 0;
            const revenue = eventBookings.reduce((sum, b) => sum + b.totalPrice, 0);

            const row = document.createElement('tr');
            row.className = 'table-row';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${event.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${new Date(event.date).toLocaleDateString('zh-CN')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${event.venue}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${soldSeats} / ${totalSeats}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div class="flex items-center">
                        <div class="progress-bar w-24 mr-2">
                            <div class="progress-bar-fill" style="width: ${occupancyRate}%"></div>
                        </div>
                        <span>${occupancyRate}%</span>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">¥${revenue.toLocaleString()}</td>
            `;
            tbody.appendChild(row);
        });
    },

    // 显示我的预订
    showMyBookings() {
        this.hideAllViews();
        document.getElementById('my-bookings-view').classList.remove('hidden');
        this.currentView = 'my-bookings';
        this.updateNavButtons();
        this.renderMyBookings();
    },

    // 渲染我的预订
    renderMyBookings() {
        const container = document.getElementById('my-bookings-list');
        container.innerHTML = '';

        if (this.bookings.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 bg-white rounded-lg shadow">
                    <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                    <p class="text-gray-500">暂无预订记录</p>
                    <button onclick="app.showCalendarView()" class="mt-4 text-indigo-600 hover:text-indigo-800">
                        去预订活动
                    </button>
                </div>
            `;
            return;
        }

        // 按时间倒序排列
        const sortedBookings = [...this.bookings].sort((a, b) =>
            new Date(b.bookingTime) - new Date(a.bookingTime)
        );

        sortedBookings.forEach(booking => {
            const eventDate = new Date(booking.eventDate);
            const bookingDate = new Date(booking.bookingTime);
            const seatInfo = booking.seats.map(s => `${s.section} ${s.row}排${s.number}号`).join(', ');

            const card = document.createElement('div');
            card.className = 'booking-card bg-white rounded-lg shadow p-6';
            card.innerHTML = `
                <div class="flex flex-col md:flex-row justify-between gap-4">
                    <div class="flex-1">
                        <h3 class="text-xl font-semibold text-gray-900">${booking.eventName}</h3>
                        <div class="mt-2 space-y-1 text-sm text-gray-600">
                            <p class="flex items-center">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                ${eventDate.toLocaleDateString('zh-CN')} ${eventDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p class="flex items-center">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                                ${booking.eventVenue}
                            </p>
                            <p class="flex items-center">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path>
                                </svg>
                                ${seatInfo}
                            </p>
                        </div>
                        <p class="mt-3 text-xs text-gray-400">
                            预订时间: ${bookingDate.toLocaleString('zh-CN')} | 订单号: ${booking.id}
                        </p>
                    </div>
                    <div class="flex flex-col justify-between items-end">
                        <span class="text-xl font-bold text-indigo-600">¥${booking.totalPrice}</span>
                        <button onclick="app.showTicketById('${booking.id}')" class="mt-2 text-indigo-600 hover:text-indigo-800 text-sm">
                            查看门票
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    },

    // 通过ID显示门票
    showTicketById(bookingId) {
        const booking = this.bookings.find(b => b.id === bookingId);
        if (booking) {
            this.showTicket(booking);
        }
    },

    // 隐藏所有视图
    hideAllViews() {
        document.querySelectorAll('.view-section').forEach(view => {
            view.classList.add('hidden');
        });
    },

    // 更新导航按钮状态
    updateNavButtons() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeBtn = {
            'calendar': document.querySelector('.nav-btn[onclick="app.showCalendarView()"]'),
            'admin': document.querySelector('.nav-btn[onclick="app.showAdminDashboard()"]'),
            'my-bookings': document.querySelector('.nav-btn[onclick="app.showMyBookings()"]')
        }[this.currentView];

        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
