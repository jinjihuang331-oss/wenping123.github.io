// ============================================
// Function Grapher - Canvas-based plotting
// ============================================

(function () {
    'use strict';

    const canvas = document.getElementById('graph-canvas');
    const ctx = canvas.getContext('2d');
    const graphInput = document.getElementById('graph-input');
    const graphDrawBtn = document.getElementById('graph-draw-btn');
    const coordsEl = document.getElementById('graph-coords');
    const xminInput = document.getElementById('graph-xmin');
    const xmaxInput = document.getElementById('graph-xmax');
    const yminInput = document.getElementById('graph-ymin');
    const ymaxInput = document.getElementById('graph-ymax');

    // Get theme colors from CSS variables
    function getThemeColor(varName) {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }

    let graphState = {
        xmin: -10, xmax: 10,
        ymin: -5, ymax: 5,
        expression: 'sin(x)',
        hovered: null,
    };

    /**
     * Evaluate expression for a given x value.
     * Returns null if undefined/error.
     */
    function evalExpression(expr, xVal) {
        try {
            // Replace 'x' with the numeric value, then evaluate using calculator engine
            const replaced = expr.replace(/x/g, `(${xVal})`);
            const result = window.Calculator.evaluate(replaced);
            if (result === null || !isFinite(result)) return null;
            return result;
        } catch (e) {
            return null;
        }
    }

    /**
     * Convert data coordinates to canvas pixel coordinates.
     */
    function dataToPixel(x, y) {
        const w = canvas.width;
        const h = canvas.height;
        const px = ((x - graphState.xmin) / (graphState.xmax - graphState.xmin)) * w;
        const py = h - ((y - graphState.ymin) / (graphState.ymax - graphState.ymin)) * h;
        return { x: px, y: py };
    }

    /**
     * Convert canvas pixel coordinates to data coordinates.
     */
    function pixelToData(px, py) {
        const w = canvas.width;
        const h = canvas.height;
        const x = graphState.xmin + (px / w) * (graphState.xmax - graphState.xmin);
        const y = graphState.ymin + ((h - py) / h) * (graphState.ymax - graphState.ymin);
        return { x, y };
    }

    /**
     * Set canvas size to match container.
     */
    function resizeCanvas() {
        const container = canvas.parentElement;
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = 300 * dpr; // Fixed height
        canvas.style.height = '300px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /**
     * Draw the graph.
     */
    function drawGraph() {
        resizeCanvas();

        const w = canvas.width / (window.devicePixelRatio || 1);
        const h = canvas.height / (window.devicePixelRatio || 1);

        // Clear
        ctx.fillStyle = getThemeColor('--graph-bg') || '#fafbfc';
        ctx.fillRect(0, 0, w, h);

        const expr = graphState.expression.trim();
        if (!expr) {
            ctx.fillStyle = getThemeColor('--text-muted') || '#999';
            ctx.font = '14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('请输入函数表达式', w / 2, h / 2);
            return;
        }

        // Grid
        ctx.strokeStyle = getThemeColor('--graph-grid') || '#e0e0e0';
        ctx.lineWidth = 0.5;
        drawGrid(w, h);

        // Axes
        ctx.strokeStyle = getThemeColor('--graph-axis') || '#bbb';
        ctx.lineWidth = 1;
        drawAxes(w, h);

        // Function curve
        ctx.strokeStyle = getThemeColor('--graph-line') || '#4a6cf7';
        ctx.lineWidth = 2;
        ctx.beginPath();

        let started = false;
        const steps = Math.max(500, w * 2);
        const dx = (graphState.xmax - graphState.xmin) / steps;

        for (let i = 0; i <= steps; i++) {
            const x = graphState.xmin + i * dx;
            const y = evalExpression(expr, x);

            if (y === null) {
                if (started) {
                    ctx.stroke();
                    ctx.beginPath();
                    started = false;
                }
                continue;
            }

            const p = dataToPixel(x, y);

            // Clip to canvas
            if (p.y < -1000 || p.y > h + 1000) {
                if (started) {
                    ctx.stroke();
                    ctx.beginPath();
                    started = false;
                }
                continue;
            }

            if (!started) {
                ctx.moveTo(p.x, p.y);
                started = true;
            } else {
                ctx.lineTo(p.x, p.y);
            }
        }
        ctx.stroke();
    }

    /**
     * Draw grid lines.
     */
    function drawGrid(w, h) {
        const xRange = graphState.xmax - graphState.xmin;
        const yRange = graphState.ymax - graphState.ymin;

        // Choose grid spacing
        const xStep = niceStep(xRange);
        const yStep = niceStep(yRange);

        // Vertical grid lines
        for (let x = Math.ceil(graphState.xmin / xStep) * xStep; x <= graphState.xmax; x += xStep) {
            const p = dataToPixel(x, 0);
            ctx.beginPath();
            ctx.moveTo(p.x, 0);
            ctx.lineTo(p.x, h);
            ctx.stroke();
        }

        // Horizontal grid lines
        for (let y = Math.ceil(graphState.ymin / yStep) * yStep; y <= graphState.ymax; y += yStep) {
            const p = dataToPixel(0, y);
            ctx.beginPath();
            ctx.moveTo(0, p.y);
            ctx.lineTo(w, p.y);
            ctx.stroke();
        }
    }

    /**
     * Draw axes and labels.
     */
    function drawAxes(w, h) {
        const xRange = graphState.xmax - graphState.xmin;
        const yRange = graphState.ymax - graphState.ymin;
        const xStep = niceStep(xRange);
        const yStep = niceStep(yRange);

        ctx.font = '11px monospace';
        ctx.fillStyle = getThemeColor('--text-secondary') || '#555';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // X axis
        const origin = dataToPixel(0, 0);
        if (origin.y >= 0 && origin.y <= h) {
            ctx.beginPath();
            ctx.moveTo(0, origin.y);
            ctx.lineTo(w, origin.y);
            ctx.stroke();
        }

        // Y axis
        if (origin.x >= 0 && origin.x <= w) {
            ctx.beginPath();
            ctx.moveTo(origin.x, 0);
            ctx.lineTo(origin.x, h);
            ctx.stroke();
        }

        // X axis labels
        ctx.textBaseline = 'top';
        for (let x = Math.ceil(graphState.xmin / xStep) * xStep; x <= graphState.xmax; x += xStep) {
            if (Math.abs(x) < 1e-10) continue;
            const p = dataToPixel(x, 0);
            const labelY = Math.min(Math.max(origin.y + 4, 4), h - 16);
            ctx.fillText(formatAxisLabel(x), p.x, labelY);
        }

        // Y axis labels
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let y = Math.ceil(graphState.ymin / yStep) * yStep; y <= graphState.ymax; y += yStep) {
            if (Math.abs(y) < 1e-10) continue;
            const p = dataToPixel(0, y);
            const labelX = Math.min(Math.max(origin.x - 4, 30), w - 4);
            ctx.fillText(formatAxisLabel(y), labelX, p.y);
        }

        // Origin label
        if (origin.x >= 0 && origin.x <= w && origin.y >= 0 && origin.y <= h) {
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';
            ctx.fillText('0', origin.x - 4, origin.y + 4);
        }
    }

    /**
     * Pick a "nice" step size for grid/labels.
     */
    function niceStep(range) {
        const rough = range / 8;
        const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
        const normalized = rough / magnitude;
        let nice;
        if (normalized < 1.5) nice = 1;
        else if (normalized < 3) nice = 2;
        else if (normalized < 7) nice = 5;
        else nice = 10;
        return nice * magnitude;
    }

    function formatAxisLabel(val) {
        if (Math.abs(val) >= 1000 || (Math.abs(val) < 0.01 && val !== 0)) {
            return val.toExponential(1);
        }
        // Round to avoid floating point artifacts
        return Math.round(val * 1e10) / 1e10;
    }

    /**
     * Handle mouse move for coordinate display.
     */
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const px = (e.clientX - rect.left) * dpr;
        const py = (e.clientY - rect.top) * dpr;
        const data = pixelToData(px, py);
        graphState.hovered = data;

        const yVal = evalExpression(graphState.expression, data.x);
        const yStr = yVal !== null ? yVal.toFixed(4) : 'undefined';
        coordsEl.textContent = `x: ${data.x.toFixed(2)}, y: ${yStr}`;
    });

    canvas.addEventListener('mouseleave', () => {
        graphState.hovered = null;
        coordsEl.textContent = '';
    });

    // --- Controls ---

    graphDrawBtn.addEventListener('click', () => {
        graphState.expression = graphInput.value;
        graphState.xmin = parseFloat(xminInput.value) || -10;
        graphState.xmax = parseFloat(xmaxInput.value) || 10;
        graphState.ymin = parseFloat(yminInput.value) || -5;
        graphState.ymax = parseFloat(ymaxInput.value) || 5;
        drawGraph();
    });

    // Draw on Enter in input
    graphInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            graphDrawBtn.click();
        }
    });

    // Redraw when range inputs change
    [xminInput, xmaxInput, yminInput, ymaxInput].forEach(input => {
        input.addEventListener('change', () => {
            graphState.xmin = parseFloat(xminInput.value) || -10;
            graphState.xmax = parseFloat(xmaxInput.value) || 10;
            graphState.ymin = parseFloat(yminInput.value) || -5;
            graphState.ymax = parseFloat(ymaxInput.value) || 5;
            drawGraph();
        });
    });

    // Resize on window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(drawGraph, 150);
    });

    // Theme change redraw
    const themeSelect = document.getElementById('theme-select');
    themeSelect.addEventListener('change', () => {
        setTimeout(drawGraph, 50);
    });

    // Initial draw
    drawGraph();

    // Redraw when switching to grapher tab
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            if (tab.dataset.tab === 'grapher') {
                setTimeout(drawGraph, 50);
            }
        });
    });

})();
