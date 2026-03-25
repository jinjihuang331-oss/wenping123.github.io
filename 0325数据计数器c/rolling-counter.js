/**
 * RollingCounter - 数字滚动计数器组件
 *
 * 配置项：
 *   from       {number}  起始值，默认 0
 *   to         {number}  目标值，默认 0
 *   speed      {number}  动画时长(ms)，默认 2000
 *   decimals   {number}  保留小数位，默认 0
 *   separator  {boolean} 千分位分隔，默认 true
 *   easing     {string}  缓动函数名，默认 'easeOutExpo'
 *   prefix     {string}  前缀文字，默认 ''
 *   suffix     {string}  后缀文字，默认 ''
 */

;(function () {
  'use strict'

  // ── 缓动函数集合 ──────────────────────────────────────
  const EASINGS = {
    linear: t => t,
    easeOutCubic: t => 1 - Math.pow(1 - t, 3),
    easeOutExpo: t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    easeInOutQuad: t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  }

  // ── 内部辅助 ──────────────────────────────────────────

  /** 将数字格式化为千分位 + 保留小数 */
  function formatNumber(num, decimals, useSeparator) {
    const fixed = Math.abs(num).toFixed(decimals)
    if (!useSeparator) {
      return (num < 0 ? '-' : '') + fixed
    }
    const [intPart, decPart] = fixed.split('.')
    const separated = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return (num < 0 ? '-' : '') + separated + (decPart !== undefined ? '.' + decPart : '')
  }

  /** 创建单个数字位的 span 元素 */
  function createDigitSpan(container) {
    const span = document.createElement('span')
    span.className = 'rc-digit'
    span.textContent = '0'
    container.appendChild(span)
    return span
  }

  // ── RollingCounter 类 ────────────────────────────────

  class RollingCounter {
    /**
     * @param {HTMLElement} el   容器元素
     * @param {Object}      opts 覆盖配置（优先于 data-* 属性）
     */
    constructor(el, opts = {}) {
      this.el = el
      this._readAttrs(opts)

      // 构建 DOM
      this.el.classList.add('rc-wrapper')
      if (this.prefix) {
        this._prefixEl = document.createElement('span')
        this._prefixEl.className = 'rc-prefix'
        this._prefixEl.textContent = this.prefix
        this.el.appendChild(this._prefixEl)
      }

      this._digitsContainer = document.createElement('span')
      this._digitsContainer.className = 'rc-digits'
      this.el.appendChild(this._digitsContainer)

      if (this.suffix) {
        this._suffixEl = document.createElement('span')
        this._suffixEl.className = 'rc-suffix'
        this._suffixEl.textContent = this.suffix
        this.el.appendChild(this._suffixEl)
      }

      this._digits    = []   // <span>[]
      this._rafId     = null
      this._currentVal = this.from

      // 初始渲染
      this._render(this.from)
    }

    /* ---- 读取配置 ---- */
    _readAttrs(opts) {
      const d = this.el.dataset
      this.from      = opts.from      ?? Number(d.from)      ?? 0
      this.to        = opts.to        ?? Number(d.to)        ?? 0
      this.speed     = opts.speed     ?? Number(d.speed)     ?? 2000
      this.decimals  = opts.decimals  ?? Number(d.decimals)  ?? 0
      this.separator = opts.separator ?? (d.separator !== 'false')
      this.easing    = opts.easing    ?? d.easing            ?? 'easeOutExpo'
      this.prefix    = opts.prefix    ?? d.prefix            ?? ''
      this.suffix    = opts.suffix    ?? d.suffix            ?? ''
    }

    /* ---- 将数值拆成字符列表并渲染 ---- */
    _render(val) {
      const str = formatNumber(val, this.decimals, this.separator)
      // 拆成单个字符（包括逗号、小数点、负号）
      const chars = [...str]

      // 确保 span 数量足够
      while (this._digits.length < chars.length) {
        createDigitSpan(this._digitsContainer)
      }
      // 多余的隐藏
      for (let i = 0; i < this._digits.length; i++) {
        const span = this._digits[i]
        if (i < chars.length) {
          span.style.display = ''
          // 仅当内容变化时更新（避免不必要的重排）
          if (span.textContent !== chars[i]) {
            // 数字变化时添加渐变动画
            if (/\d/.test(chars[i]) && /\d/.test(span.textContent)) {
              span.classList.remove('rc-flash')
              // 触发 reflow 重新播放动画
              void span.offsetWidth
              span.classList.add('rc-flash')
            }
            span.textContent = chars[i]
          }
        } else {
          span.style.display = 'none'
        }
      }
    }

    /* ---- 开始滚动动画 ---- */
    start(to, from, speed) {
      // 停掉上一轮
      this.stop()

      this.from = from ?? this._currentVal
      this.to   = to   ?? this.to
      this.speed = speed ?? this.speed

      const startTime = performance.now()
      const delta     = this.to - this.from
      const easeFn    = EASINGS[this.easing] || EASINGS.easeOutExpo

      const tick = (now) => {
        const elapsed = now - startTime
        const progress = Math.min(elapsed / this.speed, 1)
        const easedVal = easeFn(progress)
        this._currentVal = this.from + delta * easedVal
        this._render(this._currentVal)

        if (progress < 1) {
          this._rafId = requestAnimationFrame(tick)
        } else {
          this._currentVal = this.to
          this._render(this.to)
          this._rafId = null
          this.el.dispatchEvent(new CustomEvent('rollend', { detail: this.to }))
        }
      }

      this._rafId = requestAnimationFrame(tick)
      return this
    }

    /* 停止动画 */
    stop() {
      if (this._rafId) {
        cancelAnimationFrame(this._rafId)
        this._rafId = null
      }
      return this
    }

    /* 重置到起始值 */
    reset() {
      this.stop()
      this._currentVal = this.from
      this._render(this.from)
      return this
    }

    /* 即时更新配置并重渲染 */
    update(opts) {
      this.stop()
      this._readAttrs({ ...opts, from: opts.from ?? this._currentVal })
      this._render(this._currentVal)
      return this
    }

    /* 获取当前值 */
    get value() {
      return this._currentVal
    }
  }

  // ── 自动初始化 ----
  function autoInit() {
    document.querySelectorAll('.rolling-counter').forEach(el => {
      if (!el._rc) el._rc = new RollingCounter(el)
    })
  }

  // DOM Ready 时自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit)
  } else {
    autoInit()
  }

  // 暴露到全局
  window.RollingCounter = RollingCounter
})()
