// ============================================================
//  科学函数计算器 - Scientific Function Calculator
//  Features: Shunting-yard algorithm, History, Themes, Graph
// ============================================================

(function () {
  'use strict';

  // ==================== Configuration ====================
  const CONFIG = {
    maxHistory: 50,
    graphRange: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
    toastDuration: 2000,
    displayPrecision: 12,
  };

  // ==================== Tokenizer ====================
  // Operator precedence (higher = higher precedence)
  const PRECEDENCE = {
    '+': 1, '-': 1,
    '*': 2, '/': 2, '%': 2,
    '^': 3,
  };

  const ASSOCIATIVITY = {
    '+': 'L', '-': 'L',
    '*': 'L', '/': 'L', '%': 'L',
    '^': 'R', // right-associative
  };

  // Functions (name -> arity)
  const FUNCTIONS = {
    sin: 1, cos: 1, tan: 1,
    asin: 1, acos: 1, atan: 1,
    log: 1, ln: 1,
    sqrt: 1, abs: 1, exp: 1,
    floor: 1, ceil: 1, fact: 1,
  };

  // Constants
  const CONSTANTS = {
    pi: Math.PI,
    e: Math.E,
  };

  /**
   * Tokenize an expression string into an array of tokens
   * Handles: numbers, operators, parentheses, functions, constants
   */
  function tokenize(expr) {
    const tokens = [];
    let i = 0;
    const len = expr.length;

    while (i < len) {
      const ch = expr[i];

      // Skip whitespace
      if (/\s/.test(ch)) { i++; continue; }

      // Number (including decimals and scientific notation)
      if (/[0-9.]/.test(ch)) {
        let num = '';
        while (i < len && /[0-9.]/.test(expr[i])) {
          num += expr[i++];
        }
        // Handle scientific notation (e.g., 1e-5)
        if (i < len && /[eE]/.test(expr[i])) {
          num += expr[i++];
          if (i < len && /[+-]/.test(expr[i])) num += expr[i++];
          while (i < len && /[0-9]/.test(expr[i])) {
            num += expr[i++];
          }
        }
        tokens.push({ type: 'number', value: parseFloat(num) });
        continue;
      }

      // Functions and constants (multi-char identifiers)
      if (/[a-zA-Z]/.test(ch)) {
        let ident = '';
        while (i < len && /[a-zA-Z]/.test(expr[i])) {
          ident += expr[i++];
        }
        const lower = ident.toLowerCase();
        if (FUNCTIONS.hasOwnProperty(lower)) {
          tokens.push({ type: 'function', value: lower });
        } else if (CONSTANTS.hasOwnProperty(lower)) {
          tokens.push({ type: 'number', value: CONSTANTS[lower] });
        } else {
          throw new Error(`未知标识符: ${ident}`);
        }
        continue;
      }

      // Operators
      if ('+-*/%^'.includes(ch)) {
        tokens.push({ type: 'operator', value: ch });
        i++;
        continue;
      }

      // Parentheses
      if (ch === '(') {
        tokens.push({ type: 'left-paren' });
        i++;
        continue;
      }
      if (ch === ')') {
        tokens.push({ type: 'right-paren' });
        i++;
        continue;
      }

      throw new Error(`无效字符: ${ch}`);
    }

    return tokens;
  }

  // ==================== Shunting-Yard Algorithm ====================
  /**
   * Convert infix tokens to Reverse Polish Notation (RPN)
   * Uses Dijkstra's Shunting-yard algorithm
   */
  function shuntingYard(tokens) {
    const output = [];
    const opStack = [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      switch (token.type) {
        case 'number':
          output.push(token);
          break;

        case 'function':
          opStack.push(token);
          break;

        case 'operator':
          while (opStack.length > 0) {
            const top = opStack[opStack.length - 1];
            if (top.type === 'function' ||
                (top.type === 'operator' &&
                 ((ASSOCIATIVITY[token.value] === 'L' &&
                   PRECEDENCE[token.value] <= PRECEDENCE[top.value]) ||
                  (ASSOCIATIVITY[token.value] === 'R' &&
                   PRECEDENCE[token.value] < PRECEDENCE[top.value])))) {
              output.push(opStack.pop());
            } else {
              break;
            }
          }
          opStack.push(token);
          break;

        case 'left-paren':
          opStack.push(token);
          break;

        case 'right-paren':
          while (opStack.length > 0 && opStack[opStack.length - 1].type !== 'left-paren') {
            output.push(opStack.pop());
          }
          if (opStack.length === 0) {
            throw new Error('括号不匹配: 缺少左括号');
          }
          opStack.pop(); // Remove left-paren
          // If there's a function on top of the stack, push to output
          if (opStack.length > 0 && opStack[opStack.length - 1].type === 'function') {
            output.push(opStack.pop());
          }
          break;
      }
    }

    // Pop remaining operators
    while (opStack.length > 0) {
      const top = opStack.pop();
      if (top.type === 'left-paren') {
        throw new Error('括号不匹配: 缺少右括号');
      }
      output.push(top);
    }

    return output;
  }

  // ==================== RPN Evaluator ====================
  /**
   * Evaluate an RPN token array
   */
  function evaluateRPN(rpn) {
    const stack = [];

    for (const token of rpn) {
      if (token.type === 'number') {
        stack.push(token.value);
        continue;
      }

      if (token.type === 'function') {
        const args = [];
        const arity = FUNCTIONS[token.value];
        for (let i = 0; i < arity; i++) {
          if (stack.length === 0) {
            throw new Error(`函数 ${token.value} 参数不足`);
          }
          args.unshift(stack.pop());
        }
        stack.push(applyFunction(token.value, args));
        continue;
      }

      if (token.type === 'operator') {
        if (stack.length < 2) {
          throw new Error(`运算符 ${token.value} 操作数不足`);
        }
        const b = stack.pop();
        const a = stack.pop();
        stack.push(applyOperator(token.value, a, b));
        continue;
      }
    }

    if (stack.length !== 1) {
      throw new Error('表达式无效');
    }

    return stack[0];
  }

  /**
   * Apply a binary operator
   */
  function applyOperator(op, a, b) {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/':
        if (b === 0) throw new Error('除数不能为零');
        return a / b;
      case '%':
        if (b === 0) throw new Error('模数不能为零');
        return a % b;
      case '^': return Math.pow(a, b);
      default:
        throw new Error(`未知运算符: ${op}`);
    }
  }

  /**
   * Apply a mathematical function
   */
  function applyFunction(name, args) {
    const [x] = args;
    switch (name) {
      case 'sin': return Math.sin(x);
      case 'cos': return Math.cos(x);
      case 'tan': return Math.tan(x);
      case 'asin':
        if (x < -1 || x > 1) throw new Error('asin 定义域: -1 <= x <= 1');
        return Math.asin(x);
      case 'acos':
        if (x < -1 || x > 1) throw new Error('acos 定义域: -1 <= x <= 1');
        return Math.acos(x);
      case 'atan': return Math.atan(x);
      case 'log': // log base 10
        if (x <= 0) throw new Error('log 定义域: x > 0');
        return Math.log10(x);
      case 'ln': // natural log
        if (x <= 0) throw new Error('ln 定义域: x > 0');
        return Math.log(x);
      case 'sqrt':
        if (x < 0) throw new Error('sqrt 定义域: x >= 0');
        return Math.sqrt(x);
      case 'abs': return Math.abs(x);
      case 'exp': return Math.exp(x);
      case 'floor': return Math.floor(x);
      case 'ceil': return Math.ceil(x);
      case 'fact':
        if (x < 0 || !Number.isInteger(x) || x > 170) {
          throw new Error('阶乘: 需要非负整数 (0-170)');
        }
        return factorial(x);
      default:
        throw new Error(`未知函数: ${name}`);
    }
  }

  /**
   * Factorial using iteration
   */
  function factorial(n) {
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  }

  // ==================== Expression Parser (Public API) ====================
  /**
   * Parse and evaluate a mathematical expression string
   * Returns the numeric result
   */
  function evaluate(expr) {
    const trimmed = expr.trim();
    if (!trimmed) throw new Error('表达式为空');

    const tokens = tokenize(trimmed);
    const rpn = shuntingYard(tokens);
    return evaluateRPN(rpn);
  }

  /**
   * Format a number for display (handle special cases)
   */
  function formatResult(value) {
    if (!isFinite(value)) {
      if (value > 0) return '∞ (无穷大)';
      if (value < 0) return '-∞ (负无穷)';
      return 'NaN';
    }
    // Round to avoid floating point artifacts like 0.30000000000000004
    const rounded = parseFloat(value.toPrecision(CONFIG.displayPrecision));
    // Use toFixed for clean display of integers
    if (Number.isInteger(rounded)) return rounded.toString();
    // Avoid excessive decimal places
    const str = rounded.toString();
    if (str.length > 15) {
      return rounded.toExponential(8);
    }
    return str;
  }

  // ==================== Graph Evaluator (for canvas plotting) ====================
  /**
   * Evaluate an expression with a variable x (for graphing)
   * Uses the same tokenizer but with x as a variable
   */
  function evaluateForGraph(expr, xVal) {
    // Replace 'x' with the numeric value before tokenizing
    const prepared = expr.replace(/x/g, `(${xVal})`);
    return evaluate(prepared);
  }

  // ==================== Calculator State ====================
  const state = {
    currentInput: '',
    currentResult: '0',
    shouldClear: false,  // Clear input on next digit after equals
    history: [],
    graphScale: 1,
    graphOffset: { x: 0, y: 0 },
  };

  // ==================== DOM References ====================
  const $ = (sel) => document.querySelector(sel);
  const expressionEl = $('#expression');
  const resultEl = $('#result');
  const keypadEl = $('#keypad');
  const historyPanel = $('#historyPanel');
  const historyList = $('#historyList');
  const graphPanel = $('#graphPanel');
  const graphCanvas = $('#graphCanvas');
  const graphInput = $('#graphInput');
  const graphInfo = $('#graphInfo');
  const themeSelect = $('#themeSelect');
  const toastEl = $('#toast');
  const toggleHistoryBtn = $('#toggleHistory');
  const toggleGraphBtn = $('#toggleGraph');

  // ==================== Display Update ====================
  function updateDisplay() {
    expressionEl.textContent = state.currentInput || '';
    resultEl.textContent = state.currentResult;
    resultEl.classList.toggle('error', state.currentResult.startsWith('错误') ||
      state.currentResult.includes('∞') || state.currentResult === 'NaN');
  }

  // ==================== Button Handling ====================
  function handleButton(btn) {
    const action = btn.dataset.action;
    const value = btn.dataset.value;

    if (action === 'clear') {
      state.currentInput = '';
      state.currentResult = '0';
      state.shouldClear = false;
      updateDisplay();
      return;
    }

    if (action === 'backspace') {
      if (state.currentInput.length > 0) {
        state.currentInput = state.currentInput.slice(0, -1);
        state.shouldClear = false;
        // Try live evaluation
        tryLiveEval();
      }
      return;
    }

    if (action === 'equals') {
      calculate();
      return;
    }

    if (action === 'percent') {
      try {
        const val = evaluate(state.currentInput || '0');
        state.currentInput = formatResult(val / 100);
        state.shouldClear = true;
        tryLiveEval();
      } catch (e) {
        showError(e.message);
      }
      return;
    }

    if (action === 'negate') {
      if (state.currentInput) {
        // Negate the current expression or append minus
        state.currentInput = `(-(${state.currentInput}))`;
        tryLiveEval();
      }
      return;
    }

    if (action === 'parenthesis') {
      state.currentInput += value;
      tryLiveEval();
      return;
    }

    if (action === 'pow') {
      state.currentInput += value;
      tryLiveEval();
      return;
    }

    // Numeric or value button
    if (value) {
      if (state.shouldClear) {
        state.currentInput = '';
        state.shouldClear = false;
      }
      state.currentInput += value;
      tryLiveEval();
    }
  }

  /**
   * Try to evaluate the current input live (for partial expressions that are complete)
   */
  function tryLiveEval() {
    updateDisplay();
    // Don't auto-evaluate incomplete expressions
  }

  /**
   * Perform calculation
   */
  function calculate() {
    const expr = state.currentInput;
    if (!expr) return;

    try {
      const result = evaluate(expr);
      const formatted = formatResult(result);

      // Add to history
      addToHistory(expr, formatted);

      state.currentResult = formatted;
      state.currentInput = formatted; // Allow chaining
      state.shouldClear = true;
      updateDisplay();
    } catch (e) {
      state.currentResult = `错误: ${e.message}`;
      updateDisplay();
      showToast(state.currentResult);
    }
  }

  // ==================== History ====================
  function addToHistory(expr, result) {
    const item = {
      expr,
      result,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    state.history.unshift(item);
    if (state.history.length > CONFIG.maxHistory) {
      state.history.pop();
    }
    renderHistory();
  }

  function renderHistory() {
    if (state.history.length === 0) {
      historyList.innerHTML = '<p class="empty-hint">暂无计算记录</p>';
      return;
    }

    historyList.innerHTML = state.history.map((item, i) => `
      <div class="history-item" data-index="${i}">
        <div class="history-expr">${escapeHtml(item.expr)}</div>
        <div class="history-result">= ${escapeHtml(item.result)}</div>
        <div class="history-time">${item.time}</div>
      </div>
    `).join('');

    // Click to reuse
    historyList.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.index);
        state.currentInput = state.history[idx].expr;
        state.shouldClear = false;
        updateDisplay();
      });
    });
  }

  function clearHistory() {
    state.history = [];
    renderHistory();
    showToast('历史记录已清除');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ==================== Toast ====================
  let toastTimer = null;
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, CONFIG.toastDuration);
  }

  // ==================== Graph (Canvas) ====================
  let graphCtx = null;

  function initGraph() {
    graphCtx = graphCanvas.getContext('2d');
    resizeCanvas();
    drawGraph();
  }

  function resizeCanvas() {
    const rect = graphCanvas.parentElement || graphCanvas;
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = graphCanvas.clientWidth;
    const displayHeight = graphCanvas.clientHeight;
    graphCanvas.width = displayWidth * dpr;
    graphCanvas.height = displayHeight * dpr;
    graphCtx.scale(dpr, dpr);
  }

  function drawGraph() {
    if (!graphCtx) return;

    const w = graphCanvas.clientWidth;
    const h = graphCanvas.clientHeight;
    const expr = graphInput.value.trim();

    // Get display range (affected by zoom/pan)
    const baseRange = 10 / state.graphScale;
    const range = {
      xMin: -baseRange + state.graphOffset.x,
      xMax: baseRange + state.graphOffset.x,
      yMin: -baseRange + state.graphOffset.y,
      yMax: baseRange + state.graphOffset.y,
    };

    // Clear
    graphCtx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue('--bg-input').trim() || '#12122a';
    graphCtx.fillRect(0, 0, w, h);

    // Draw grid
    drawGrid(w, h, range);

    // Draw axes
    drawAxes(w, h, range);

    // Draw function
    if (expr) {
      drawFunction(w, h, range, expr);
    }

    // Update info
    graphInfo.textContent = `X: [${range.xMin.toFixed(2)}, ${range.xMax.toFixed(2)}]  Y: [${range.yMin.toFixed(2)}, ${range.yMax.toFixed(2)}]`;
  }

  function drawGrid(w, h, range) {
    const gridColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--graph-grid').trim() || 'rgba(108,99,255,0.15)';
    graphCtx.strokeStyle = gridColor;
    graphCtx.lineWidth = 0.5;

    // Calculate grid spacing
    const xSpan = range.xMax - range.xMin;
    const ySpan = range.yMax - range.yMin;
    const xStep = getNiceStep(xSpan / 10);
    const yStep = getNiceStep(ySpan / 10);

    // Vertical lines
    for (let x = Math.ceil(range.xMin / xStep) * xStep; x <= range.xMax; x += xStep) {
      const px = mapX(x, range, w);
      graphCtx.beginPath();
      graphCtx.moveTo(px, 0);
      graphCtx.lineTo(px, h);
      graphCtx.stroke();
    }

    // Horizontal lines
    for (let y = Math.ceil(range.yMin / yStep) * yStep; y <= range.yMax; y += yStep) {
      const py = mapY(y, range, h);
      graphCtx.beginPath();
      graphCtx.moveTo(0, py);
      graphCtx.lineTo(w, py);
      graphCtx.stroke();
    }
  }

  function drawAxes(w, h, range) {
    const axisColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--graph-axis').trim() || 'rgba(108,99,255,0.5)';
    const textColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--text-muted').trim() || '#6a6a8a';

    graphCtx.strokeStyle = axisColor;
    graphCtx.lineWidth = 1.2;

    // X axis (y = 0)
    if (range.yMin <= 0 && range.yMax >= 0) {
      const y0 = mapY(0, range, h);
      graphCtx.beginPath();
      graphCtx.moveTo(0, y0);
      graphCtx.lineTo(w, y0);
      graphCtx.stroke();
    }

    // Y axis (x = 0)
    if (range.xMin <= 0 && range.xMax >= 0) {
      const x0 = mapX(0, range, w);
      graphCtx.beginPath();
      graphCtx.moveTo(x0, 0);
      graphCtx.lineTo(x0, h);
      graphCtx.stroke();
    }

    // Labels
    graphCtx.fillStyle = textColor;
    graphCtx.font = '10px ' + getComputedStyle(document.documentElement)
      .getPropertyValue('--font-mono').trim() || 'monospace';

    const xSpan = range.xMax - range.xMin;
    const ySpan = range.yMax - range.yMin;
    const xStep = getNiceStep(xSpan / 8);
    const yStep = getNiceStep(ySpan / 6);

    // X axis labels
    const y0 = Math.max(0, Math.min(h - 4, mapY(0, range, h)));
    for (let x = Math.ceil(range.xMin / xStep) * xStep; x <= range.xMax; x += xStep) {
      if (Math.abs(x) < xStep * 0.01) continue;
      const px = mapX(x, range, w);
      graphCtx.fillText(formatAxisLabel(x), px + 2, y0 + 12);
    }

    // Y axis labels
    const x0 = Math.max(20, Math.min(w - 4, mapX(0, range, w)));
    for (let y = Math.ceil(range.yMin / yStep) * yStep; y <= range.yMax; y += yStep) {
      if (Math.abs(y) < yStep * 0.01) continue;
      const py = mapY(y, range, h);
      graphCtx.fillText(formatAxisLabel(y), x0 + 4, py + 3);
    }
  }

  function drawFunction(w, h, range, expr) {
    const lineColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--graph-line').trim() || '#6c63ff';
    graphCtx.strokeStyle = lineColor;
    graphCtx.lineWidth = 2;
    graphCtx.beginPath();

    let started = false;
    const steps = w * 2; // 2 samples per pixel for smoothness
    const dx = (range.xMax - range.xMin) / steps;

    for (let i = 0; i <= steps; i++) {
      const x = range.xMin + i * dx;
      try {
        const y = evaluateForGraph(expr, x);
        if (!isFinite(y)) {
          started = false;
          continue;
        }
        const px = mapX(x, range, w);
        const py = mapY(y, range, h);

        if (!started) {
          graphCtx.moveTo(px, py);
          started = true;
        } else {
          graphCtx.lineTo(px, py);
        }
      } catch (e) {
        started = false;
      }
    }

    graphCtx.stroke();
  }

  // Coordinate mapping helpers
  function mapX(x, range, w) {
    return ((x - range.xMin) / (range.xMax - range.xMin)) * w;
  }

  function mapY(y, range, h) {
    return h - ((y - range.yMin) / (range.yMax - range.yMin)) * h;
  }

  /**
   * Get a "nice" step size for grid lines (1, 2, 5, 10, 20, 50, ...)
   */
  function getNiceStep(raw) {
    const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
    const normalized = raw / magnitude;
    if (normalized < 1.5) return magnitude;
    if (normalized < 3.5) return 2 * magnitude;
    if (normalized < 7.5) return 5 * magnitude;
    return 10 * magnitude;
  }

  function formatAxisLabel(val) {
    if (Math.abs(val) >= 1000 || (Math.abs(val) < 0.01 && val !== 0)) {
      return val.toExponential(0);
    }
    // Round to avoid ugly decimals
    return parseFloat(val.toPrecision(4)).toString();
  }

  function plotGraph() {
    const expr = graphInput.value.trim();
    if (!expr) {
      showToast('请输入函数表达式');
      return;
    }
    // Validate the expression
    try {
      evaluateForGraph(expr, 1);
    } catch (e) {
      showToast(`函数表达式无效: ${e.message}`);
      return;
    }
    drawGraph();
    showToast(`已绘制: y = ${expr}`);
  }

  function clearGraph() {
    graphInput.value = '';
    state.graphScale = 1;
    state.graphOffset = { x: 0, y: 0 };
    drawGraph();
    showToast('绘图已清除');
  }

  // ==================== Theme ====================
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('calc-theme', theme);
    // Redraw graph with new colors
    if (graphCtx) {
      resizeCanvas();
      drawGraph();
    }
  }

  // ==================== Panel Toggle ====================
  function togglePanel(panel, btn) {
    const isVisible = panel.classList.contains('visible');
    // Close other panels
    if (panel !== historyPanel) historyPanel.classList.remove('visible');
    if (panel !== graphPanel) graphPanel.classList.remove('visible');
    toggleHistoryBtn.classList.remove('active');
    toggleGraphBtn.classList.remove('active');

    if (isVisible) {
      panel.classList.remove('visible');
      btn.classList.remove('active');
    } else {
      panel.classList.add('visible');
      btn.classList.add('active');
      if (panel === graphPanel && graphCtx) {
        resizeCanvas();
        drawGraph();
      }
    }
  }

  // ==================== Keyboard Support ====================
  function handleKeyboard(e) {
    // Ignore if typing in the graph input
    if (e.target === graphInput) return;

    const key = e.key;

    // Numbers
    if (/^[0-9.]$/.test(key)) {
      e.preventDefault();
      appendInput(key);
      return;
    }

    // Operators
    const opMap = { '+': '+', '-': '-', '*': '*', '/': '/', '%': '%', '^': '^' };
    if (opMap.hasOwnProperty(key)) {
      e.preventDefault();
      appendInput(opMap[key]);
      return;
    }

    // Enter / = for equals
    if (key === 'Enter' || key === '=') {
      e.preventDefault();
      calculate();
      return;
    }

    // Backspace
    if (key === 'Backspace') {
      e.preventDefault();
      if (state.currentInput.length > 0) {
        state.currentInput = state.currentInput.slice(0, -1);
        updateDisplay();
      }
      return;
    }

    // Escape to clear
    if (key === 'Escape') {
      e.preventDefault();
      state.currentInput = '';
      state.currentResult = '0';
      state.shouldClear = false;
      updateDisplay();
      return;
    }

    // Parentheses
    if (key === '(') {
      e.preventDefault();
      appendInput('(');
      return;
    }
    if (key === ')') {
      e.preventDefault();
      appendInput(')');
      return;
    }

    // Delete for AC
    if (key === 'Delete') {
      e.preventDefault();
      state.currentInput = '';
      state.currentResult = '0';
      state.shouldClear = false;
      updateDisplay();
      return;
    }

    // Letter shortcuts for functions
    const fnMap = {
      's': 'sin(', 'c': 'cos(', 't': 'tan(',
      'l': 'log(', 'n': 'ln(', 'q': 'sqrt(',
      'p': 'pi', 'e': 'e',
    };
    if (fnMap.hasOwnProperty(key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      appendInput(fnMap[key]);
      return;
    }
  }

  function appendInput(val) {
    if (state.shouldClear) {
      state.currentInput = '';
      state.shouldClear = false;
    }
    state.currentInput += val;
    updateDisplay();
  }

  function showError(msg) {
    state.currentResult = `错误: ${msg}`;
    updateDisplay();
    showToast(state.currentResult);
  }

  // ==================== Event Bindings ====================
  function init() {
    // Keypad buttons
    keypadEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn');
      if (btn) handleButton(btn);
    });

    // Keyboard
    document.addEventListener('keydown', handleKeyboard);

    // Theme
    themeSelect.addEventListener('change', (e) => setTheme(e.target.value));

    // Load saved theme
    const savedTheme = localStorage.getItem('calc-theme') || 'dark';
    themeSelect.value = savedTheme;
    setTheme(savedTheme);

    // History toggle
    toggleHistoryBtn.addEventListener('click', () => togglePanel(historyPanel, toggleHistoryBtn));
    $('#clearHistory').addEventListener('click', clearHistory);

    // Graph toggle
    toggleGraphBtn.addEventListener('click', () => togglePanel(graphPanel, toggleGraphBtn));
    $('#plotBtn').addEventListener('click', plotGraph);
    $('#clearGraphBtn').addEventListener('click', clearGraph);
    graphInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') plotGraph();
    });

    // Graph zoom buttons
    document.querySelectorAll('[data-zoom]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.zoom;
        if (action === 'in') state.graphScale *= 1.5;
        else if (action === 'out') state.graphScale /= 1.5;
        else { state.graphScale = 1; state.graphOffset = { x: 0, y: 0 }; }
        drawGraph();
      });
    });

    // Graph canvas mouse drag for panning
    let isDragging = false;
    let lastMouse = { x: 0, y: 0 };

    graphCanvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      lastMouse = { x: e.clientX, y: e.clientY };
      graphCanvas.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - lastMouse.x;
      const dy = e.clientY - lastMouse.y;
      lastMouse = { x: e.clientX, y: e.clientY };

      const w = graphCanvas.clientWidth;
      const h = graphCanvas.clientHeight;
      const baseRange = 10 / state.graphScale;

      state.graphOffset.x -= (dx / w) * (baseRange * 2);
      state.graphOffset.y += (dy / h) * (baseRange * 2);
      drawGraph();
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
      graphCanvas.style.cursor = 'crosshair';
    });

    // Touch support for graph panning
    let lastTouch = { x: 0, y: 0 };
    graphCanvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    graphCanvas.addEventListener('touchmove', (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      e.preventDefault();
      const dx = e.touches[0].clientX - lastTouch.x;
      const dy = e.touches[0].clientY - lastTouch.y;
      lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };

      const w = graphCanvas.clientWidth;
      const h = graphCanvas.clientHeight;
      const baseRange = 10 / state.graphScale;

      state.graphOffset.x -= (dx / w) * (baseRange * 2);
      state.graphOffset.y += (dy / h) * (baseRange * 2);
      drawGraph();
    }, { passive: false });

    graphCanvas.addEventListener('touchend', () => {
      isDragging = false;
    });

    // Window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (graphCtx) {
          resizeCanvas();
          drawGraph();
        }
      }, 150);
    });

    // Initialize graph
    initGraph();
    renderHistory();
    updateDisplay();

    // Focus for keyboard input
    document.body.setAttribute('tabindex', '0');
    document.body.focus();
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
