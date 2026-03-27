// ============================================
// Scientific Calculator - Core Engine
// Implements Shunting-yard algorithm + RPN evaluator
// ============================================

(function () {
    'use strict';

    // --- State ---
    let currentInput = '';
    let displayExpr = '';
    let lastResult = null;
    let angleMode = 'rad'; // 'rad' or 'deg'
    const MAX_HISTORY = 50;
    let history = [];

    // --- DOM Elements ---
    const expressionEl = document.getElementById('expression');
    const resultEl = document.getElementById('result');
    const historyList = document.getElementById('history-list');
    const themeSelect = document.getElementById('theme-select');
    const clearHistoryBtn = document.getElementById('clear-history');

    // --- Tokenizer ---

    // Token types
    const TT = {
        NUMBER: 'NUMBER',
        OPERATOR: 'OPERATOR',
        FUNCTION: 'FUNCTION',
        LPAREN: 'LPAREN',
        RPAREN: 'RPAREN',
        COMMA: 'COMMA',
        UNARY_MINUS: 'UNARY_MINUS',
        CONSTANT: 'CONSTANT',
        EOF: 'EOF'
    };

    // Operator definitions: precedence, associativity, #args
    const OPERATORS = {
        '^': { prec: 7, assoc: 'right', args: 2 },
        '*': { prec: 5, assoc: 'left', args: 2 },
        '/': { prec: 5, assoc: 'left', args: 2 },
        '+': { prec: 3, assoc: 'left', args: 2 },
        '-': { prec: 3, assoc: 'left', args: 2 },
    };

    // Function definitions
    const FUNCTIONS = {
        'sin': 1, 'cos': 1, 'tan': 1,
        'asin': 1, 'acos': 1, 'atan': 1,
        'log': 1, 'ln': 1,
        'sqrt': 1, 'abs': 1, 'exp': 1,
        'ceil': 1, 'floor': 1, 'round': 1,
        'fact': 1,  // factorial
    };

    const CONSTANTS = {
        'pi': Math.PI,
        'e': Math.E,
    };

    /**
     * Tokenize the raw input string into an array of tokens.
     */
    function tokenize(raw) {
        const tokens = [];
        let i = 0;
        let prevTokenType = null;

        while (i < raw.length) {
            const ch = raw[i];

            // Skip whitespace
            if (/\s/.test(ch)) { i++; continue; }

            // Number: digits, decimal point, optional scientific notation
            if (/\d/.test(ch) || (ch === '.' && i + 1 < raw.length && /\d/.test(raw[i + 1]))) {
                let num = '';
                while (i < raw.length && (/\d/.test(raw[i]) || raw[i] === '.')) {
                    num += raw[i++];
                }
                // Scientific notation: 1e5, 1.2E-3
                if (i < raw.length && /[eE]/.test(raw[i])) {
                    num += raw[i++];
                    if (i < raw.length && /[+-]/.test(raw[i])) {
                        num += raw[i++];
                    }
                    while (i < raw.length && /\d/.test(raw[i])) {
                        num += raw[i++];
                    }
                }
                tokens.push({ type: TT.NUMBER, value: parseFloat(num) });
                prevTokenType = TT.NUMBER;
                continue;
            }

            // Function name: letters followed by '('
            if (/[a-zA-Z]/.test(ch)) {
                let name = '';
                while (i < raw.length && /[a-zA-Z]/.test(raw[i])) {
                    name += raw[i++];
                }
                // Check if it's a known function
                if (name.toLowerCase() in FUNCTIONS) {
                    tokens.push({ type: TT.FUNCTION, value: name.toLowerCase() });
                    prevTokenType = TT.FUNCTION;
                    continue;
                }
                // Check if it's a constant
                const lowName = name.toLowerCase();
                if (lowName in CONSTANTS) {
                    tokens.push({ type: TT.CONSTANT, value: lowName });
                    prevTokenType = TT.CONSTANT;
                    continue;
                }
                throw new Error(`未知标识符: ${name}`);
            }

            // Operators
            if (ch === '^' || ch === '*' || ch === '/' || ch === '+' || ch === '-') {
                // Detect unary minus: if '-' appears at start, after '(', or after operator
                if (ch === '-' &&
                    (prevTokenType === null ||
                     prevTokenType === TT.OPERATOR ||
                     prevTokenType === TT.UNARY_MINUS ||
                     prevTokenType === TT.LPAREN ||
                     prevTokenType === TT.COMMA ||
                     prevTokenType === TT.FUNCTION)) {
                    tokens.push({ type: TT.UNARY_MINUS, value: 'neg' });
                    prevTokenType = TT.UNARY_MINUS;
                } else {
                    tokens.push({ type: TT.OPERATOR, value: ch });
                    prevTokenType = TT.OPERATOR;
                }
                i++;
                continue;
            }

            // Parentheses
            if (ch === '(') {
                tokens.push({ type: TT.LPAREN, value: '(' });
                prevTokenType = TT.LPAREN;
                i++; continue;
            }
            if (ch === ')') {
                tokens.push({ type: TT.RPAREN, value: ')' });
                prevTokenType = TT.RPAREN;
                i++; continue;
            }
            // Comma (for future multi-arg functions)
            if (ch === ',') {
                tokens.push({ type: TT.COMMA, value: ',' });
                prevTokenType = TT.COMMA;
                i++; continue;
            }

            throw new Error(`无法识别的字符: ${ch}`);
        }

        tokens.push({ type: TT.EOF, value: null });
        return tokens;
    }

    // --- Shunting-yard Algorithm ---

    /**
     * Convert infix token stream to Reverse Polish Notation (RPN).
     */
    function shuntingYard(tokens) {
        const output = [];
        const opStack = [];

        for (const token of tokens) {
            switch (token.type) {
                case TT.NUMBER:
                case TT.CONSTANT:
                    output.push(token);
                    break;

                case TT.FUNCTION:
                    opStack.push(token);
                    break;

                case TT.UNARY_MINUS:
                    opStack.push(token);
                    break;

                case TT.OPERATOR:
                    while (opStack.length > 0) {
                        const top = opStack[opStack.length - 1];
                        if (top.type === TT.OPERATOR &&
                            ((OPERATORS[top.value].assoc === 'left' &&
                              OPERATORS[top.value].prec >= OPERATORS[token.value].prec) ||
                             (OPERATORS[top.value].assoc === 'right' &&
                              OPERATORS[top.value].prec > OPERATORS[token.value].prec))) {
                            output.push(opStack.pop());
                        } else {
                            break;
                        }
                    }
                    opStack.push(token);
                    break;

                case TT.LPAREN:
                    opStack.push(token);
                    break;

                case TT.RPAREN:
                    while (opStack.length > 0 && opStack[opStack.length - 1].type !== TT.LPAREN) {
                        output.push(opStack.pop());
                    }
                    if (opStack.length === 0) {
                        throw new Error('括号不匹配');
                    }
                    opStack.pop(); // discard '('
                    // If top of stack is a function, pop it
                    if (opStack.length > 0 && opStack[opStack.length - 1].type === TT.FUNCTION) {
                        output.push(opStack.pop());
                    }
                    break;

                case TT.COMMA:
                    while (opStack.length > 0 && opStack[opStack.length - 1].type !== TT.LPAREN) {
                        output.push(opStack.pop());
                    }
                    if (opStack.length === 0) {
                        throw Error('函数参数间缺少括号');
                    }
                    break;
            }
        }

        // Pop remaining operators
        while (opStack.length > 0) {
            const top = opStack.pop();
            if (top.type === TT.LPAREN || top.type === TT.RPAREN) {
                throw new Error('括号不匹配');
            }
            output.push(top);
        }

        return output;
    }

    // --- RPN Evaluator ---

    /**
     * Evaluate RPN token array and return the numeric result.
     */
    function evaluateRPN(rpn) {
        const stack = [];

        for (const token of rpn) {
            switch (token.type) {
                case TT.NUMBER:
                    stack.push(token.value);
                    break;

                case TT.CONSTANT:
                    stack.push(CONSTANTS[token.value]);
                    break;

                case TT.UNARY_MINUS:
                    if (stack.length < 1) throw new Error('表达式无效');
                    stack.push(-stack.pop());
                    break;

                case TT.OPERATOR: {
                    const op = OPERATORS[token.value];
                    if (stack.length < op.args) throw new Error('运算符参数不足');
                    const b = stack.pop();
                    const a = stack.pop();
                    let result;
                    switch (token.value) {
                        case '+': result = a + b; break;
                        case '-': result = a - b; break;
                        case '*': result = a * b; break;
                        case '/':
                            if (b === 0) throw new Error('除数不能为零');
                            result = a / b;
                            break;
                        case '^': result = Math.pow(a, b); break;
                    }
                    stack.push(result);
                    break;
                }

                case TT.FUNCTION: {
                    const argc = FUNCTIONS[token.value];
                    if (stack.length < argc) throw new Error(`函数 ${token.value} 参数不足`);
                    const args = [];
                    for (let j = 0; j < argc; j++) {
                        args.unshift(stack.pop());
                    }
                    const val = args[0];
                    let result;
                    switch (token.value) {
                        case 'sin':
                            result = angleMode === 'deg' ? Math.sin(val * Math.PI / 180) : Math.sin(val);
                            break;
                        case 'cos':
                            result = angleMode === 'deg' ? Math.cos(val * Math.PI / 180) : Math.cos(val);
                            break;
                        case 'tan':
                            result = angleMode === 'deg' ? Math.tan(val * Math.PI / 180) : Math.tan(val);
                            if (!isFinite(result)) throw new Error('tan 的值未定义');
                            break;
                        case 'asin':
                            if (val < -1 || val > 1) throw new Error('asin 定义域: [-1, 1]');
                            result = Math.asin(val);
                            if (angleMode === 'deg') result = result * 180 / Math.PI;
                            break;
                        case 'acos':
                            if (val < -1 || val > 1) throw new Error('acos 定义域: [-1, 1]');
                            result = Math.acos(val);
                            if (angleMode === 'deg') result = result * 180 / Math.PI;
                            break;
                        case 'atan':
                            result = Math.atan(val);
                            if (angleMode === 'deg') result = result * 180 / Math.PI;
                            break;
                        case 'log':
                            if (val <= 0) throw new Error('log 定义域: (0, +∞)');
                            result = Math.log10(val);
                            break;
                        case 'ln':
                            if (val <= 0) throw new Error('ln 定义域: (0, +∞)');
                            result = Math.log(val);
                            break;
                        case 'sqrt':
                            if (val < 0) throw new Error('sqrt 不能对负数开方');
                            result = Math.sqrt(val);
                            break;
                        case 'abs':
                            result = Math.abs(val);
                            break;
                        case 'exp':
                            result = Math.exp(val);
                            break;
                        case 'ceil':
                            result = Math.ceil(val);
                            break;
                        case 'floor':
                            result = Math.floor(val);
                            break;
                        case 'round':
                            result = Math.round(val);
                            break;
                        case 'fact':
                            if (val < 0 || val !== Math.floor(val)) throw new Error('阶乘需非负整数');
                            if (val > 170) throw new Error('阶乘值过大');
                            result = factorial(val);
                            break;
                        default:
                            throw new Error(`未知函数: ${token.value}`);
                    }
                    stack.push(result);
                    break;
                }
            }
        }

        if (stack.length !== 1) throw new Error('表达式无效');
        return stack[0];
    }

    // --- Helpers ---

    function factorial(n) {
        if (n <= 1) return 1;
        let r = 1;
        for (let i = 2; i <= n; i++) r *= i;
        return r;
    }

    function formatResult(num) {
        if (!isFinite(num)) return isNaN(num) ? 'NaN' : (num > 0 ? '∞' : '-∞');
        // Avoid scientific notation for reasonable numbers
        if (Math.abs(num) >= 1e15 || (Math.abs(num) < 1e-10 && num !== 0)) {
            return num.toExponential(6);
        }
        // Round to avoid floating point artifacts
        const rounded = Math.round(num * 1e12) / 1e12;
        return rounded.toString();
    }

    // --- Main Evaluate ---

    function evaluate(expr) {
        if (!expr.trim()) return null;
        const tokens = tokenize(expr);
        const rpn = shuntingYard(tokens);
        return evaluateRPN(rpn);
    }

    // --- UI Logic ---

    function updateDisplay() {
        expressionEl.textContent = displayExpr || '';
        resultEl.textContent = currentInput || '0';
        resultEl.classList.remove('error');
    }

    function showError(msg) {
        resultEl.textContent = msg;
        resultEl.classList.add('error');
    }

    function appendToInput(val) {
        // Prevent multiple decimal points in the same number segment
        if (val === '.') {
            // Simple check: find last operator or paren
            const lastOpIdx = Math.max(
                currentInput.lastIndexOf('+'),
                currentInput.lastIndexOf('-'),
                currentInput.lastIndexOf('*'),
                currentInput.lastIndexOf('/'),
                currentInput.lastIndexOf('^'),
                currentInput.lastIndexOf('('),
                currentInput.lastIndexOf(',')
            );
            const afterLastOp = currentInput.substring(lastOpIdx + 1);
            if (afterLastOp.includes('.')) return;
        }
        currentInput += val;
        updateDisplay();
    }

    function handleAction(action) {
        switch (action) {
            case 'clear':
                currentInput = '';
                displayExpr = '';
                lastResult = null;
                updateDisplay();
                break;

            case 'backspace':
                currentInput = currentInput.slice(0, -1);
                updateDisplay();
                break;

            case 'equals':
                if (!currentInput.trim()) return;
                try {
                    const result = evaluate(currentInput);
                    const formatted = formatResult(result);
                    displayExpr = currentInput;
                    currentInput = formatted;
                    lastResult = result;
                    addToHistory(displayExpr, formatted);
                    updateDisplay();
                } catch (e) {
                    showError(e.message);
                    setTimeout(updateDisplay, 2000);
                }
                break;

            case 'open-paren':
                appendToInput('(');
                break;

            case 'close-paren':
                appendToInput(')');
                break;

            case 'pi':
                appendToInput('pi');
                break;

            case 'e':
                appendToInput('e');
                break;

            case 'sqrt':
                appendToInput('sqrt(');
                break;

            case 'pow':
                if (currentInput && !isNaN(currentInput.slice(-1))) {
                    appendToInput('^2');
                } else {
                    appendToInput('^2');
                }
                break;

            case 'abs':
                appendToInput('abs(');
                break;

            case 'sin':
            case 'cos':
            case 'tan':
            case 'asin':
            case 'acos':
            case 'atan':
            case 'log':
            case 'ln':
            case 'exp':
            case 'fact':
                appendToInput(action + '(');
                break;

            case 'deg':
                angleMode = 'deg';
                break;

            case 'rad':
                angleMode = 'rad';
                break;

            default:
                // Numbers and basic operators
                appendToInput(action);
                break;
        }
    }

    // --- History ---

    function addToHistory(expr, result) {
        history.unshift({ expr, result, time: new Date() });
        if (history.length > MAX_HISTORY) history.pop();
        renderHistory();
    }

    function renderHistory() {
        if (history.length === 0) {
            historyList.innerHTML = '<div class="empty-state">暂无计算历史</div>';
            return;
        }
        historyList.innerHTML = history.map((item, i) => `
            <div class="history-item" data-index="${i}">
                <div class="history-expr">${escapeHtml(item.expr)}</div>
                <div class="history-result">${escapeHtml(item.result)}</div>
                <div class="history-time">${formatTime(item.time)}</div>
            </div>
        `).join('');
    }

    function formatTime(d) {
        const pad = n => String(n).padStart(2, '0');
        return `${d.getHours()}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }

    function escapeHtml(s) {
        const div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    // --- Theme ---

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('calc-theme', theme);
    }

    // --- Event Handlers ---

    // Button clicks
    document.querySelectorAll('.btn[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
            handleAction(btn.dataset.action);
            // Give focus back to keep keyboard shortcuts working
            document.body.focus();
        });
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        // Don't capture when typing in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        const key = e.key;

        // Digits and basic operators
        if (/^[0-9.+\-*/^()]$/.test(key)) {
            e.preventDefault();
            appendToInput(key);
            return;
        }

        // Enter / =
        if (key === 'Enter' || key === '=') {
            e.preventDefault();
            handleAction('equals');
            return;
        }

        // Backspace
        if (key === 'Backspace') {
            e.preventDefault();
            handleAction('backspace');
            return;
        }

        // Escape / C / Delete
        if (key === 'Escape' || key === 'c' || key === 'C' || key === 'Delete') {
            e.preventDefault();
            handleAction('clear');
            return;
        }

        // Function keys
        const funcMap = {
            's': 'sin(', 'c': 'cos(', 't': 'tan(',
            'l': 'log(', 'n': 'ln(',
        };
        if (funcMap[key]) {
            e.preventDefault();
            appendToInput(funcMap[key]);
            return;
        }

        // Square root
        if (key === 'r' || key === 'R') {
            e.preventDefault();
            appendToInput('sqrt(');
            return;
        }
    });

    // History item click
    historyList.addEventListener('click', (e) => {
        const item = e.target.closest('.history-item');
        if (!item) return;
        const idx = parseInt(item.dataset.index);
        if (history[idx]) {
            currentInput = history[idx].result;
            displayExpr = '';
            updateDisplay();
        }
    });

    // Theme change
    themeSelect.addEventListener('change', () => {
        setTheme(themeSelect.value);
    });

    // Clear history
    clearHistoryBtn.addEventListener('click', () => {
        history = [];
        renderHistory();
    });

    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab + '-panel').classList.add('active');
        });
    });

    // Restore theme from localStorage
    const savedTheme = localStorage.getItem('calc-theme');
    if (savedTheme) {
        setTheme(savedTheme);
        themeSelect.value = savedTheme;
    }

    // Initialize display
    updateDisplay();
    renderHistory();

    // Export for use by grapher.js
    window.Calculator = {
        evaluate,
        formatResult,
        tokenize,
        shuntingYard,
        angleMode: () => angleMode,
    };

})();
