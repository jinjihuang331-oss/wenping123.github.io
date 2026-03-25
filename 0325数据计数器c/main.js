;(function () {
  'use strict'

  // 上面三个示列计数器，页面加载 0.3s 后开始滚动
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      document.querySelectorAll('.rolling-counter').forEach(el => {
        const rc = el._rc
        if (rc) rc.start()
      })
    }, 300)
  })

  // ── 控制面板 ──────────────────────────────────────────
  const $ = id => document.getElementById(id)

  function getCustomCounter() {
    const el = $('customCounter')
    return el && el._rc
  }

  $('btnRun').addEventListener('click', () => {
    const rc = getCustomCounter()
    if (!rc) return
    const from      = Number($('fromVal').value)
    const to        = Number($('toVal').value)
    const speed     = Number($('speedVal').value)
    const decimals  = Number($('decimalsVal').value)
    const separator = $('separatorVal').value === 'true'
    const easing    = $('easingVal').value

    rc.update({ decimals, separator, easing })
    rc.start(to, from, speed)
  })

  $('btnReset').addEventListener('click', () => {
    const rc = getCustomCounter()
    if (!rc) return
    const from = Number($('fromVal').value)
    rc.update({ from, to: from })
    rc._render(from)
  })

  $('btnRandom').addEventListener('click', () => {
    const randomVal = Math.round(Math.random() * 10000000) / 100
    $('toVal').value = randomVal
    const rc = getCustomCounter()
    if (!rc) return
    const from      = Number($('fromVal').value)
    const speed     = Number($('speedVal').value)
    const decimals  = Number($('decimalsVal').value)
    const separator = $('separatorVal').value === 'true'
    const easing    = $('easingVal').value

    rc.update({ decimals, separator, easing })
    rc.start(randomVal, from, speed)
  })
})()
