// ===== Pedometer Module =====
const pedometer = {
  supported: false,
  sensor: null,
  steps: 0,
  isTracking: false,
  goal: 10000,

  async init() {
    // Check for Pedometer / Generic Sensor API
    if ('Pedometer' in window) {
      this.supported = true;
    } else if ('GenericSensor' in window) {
      this.supported = true;
    }
    // Also check for step count via Activity Recognition on Android
    // or use a simple step estimation if available

    // Load saved steps for today
    const today = new Date().toISOString().split('T')[0];
    const saved = await dbGet('settings', 'steps_' + today);
    if (saved) {
      this.steps = saved.value || 0;
    }

    const goalSetting = await dbGet('settings', 'step_goal');
    if (goalSetting) {
      this.goal = goalSetting.value || 10000;
    }

    this.updateDisplay();
    this.showCard();
  },

  showCard() {
    const card = document.getElementById('pedometer-card');
    if (card) {
      card.style.display = '';
    }
  },

  async toggleTracking() {
    const btn = document.getElementById('btn-toggle-pedometer');

    if (this.isTracking) {
      this.stopTracking();
      btn.textContent = '开始';
      toast.show('计步器已停止', 'info');
    } else {
      const started = await this.startTracking();
      if (started) {
        btn.textContent = '停止';
        toast.show('计步器已启动', 'success');
      }
    }
  },

  async startTracking() {
    // Try Pedometer API first
    if ('Pedometer' in window) {
      try {
        this.sensor = new Pedometer({ frequency: 1000 });
        this.sensor.addEventListener('reading', () => {
          this.steps += this.sensor.stepCount || 0;
          this.updateDisplay();
          this.saveSteps();
        });
        this.sensor.start();
        this.isTracking = true;
        return true;
      } catch (e) {
        console.warn('Pedometer API failed:', e);
      }
    }

    // Try Generic Sensor API
    if ('LinearAccelerationSensor' in window) {
      try {
        this.sensor = new LinearAccelerationSensor({ frequency: 50 });
        let lastMagnitude = 0;
        let stepThreshold = 1.2;
        let lastStepTime = 0;

        this.sensor.addEventListener('reading', () => {
          const { x, y, z } = this.sensor;
          const magnitude = Math.sqrt(x * x + y * y + z * z);

          // Simple step detection via acceleration magnitude
          const now = Date.now();
          if (magnitude - lastMagnitude > stepThreshold &&
              magnitude > 9.5 && // above gravity baseline
              now - lastStepTime > 300) { // min 300ms between steps
            this.steps++;
            lastStepTime = now;
            this.updateDisplay();
            this.saveSteps();
          }
          lastMagnitude = magnitude;
        });

        this.sensor.start();
        this.isTracking = true;
        return true;
      } catch (e) {
        console.warn('LinearAccelerationSensor failed:', e);
      }
    }

    // Fallback: Enable manual step counting via motion events
    try {
      if ('DeviceMotionEvent' in window) {
        let lastAccel = { x: 0, y: 0, z: 0 };
        let lastStepTime = 0;
        this._motionHandler = (event) => {
          const accel = event.accelerationIncludingGravity || event.acceleration;
          if (!accel) return;

          const deltaX = Math.abs(accel.x - lastAccel.x);
          const deltaY = Math.abs(accel.y - lastAccel.y);
          const deltaZ = Math.abs(accel.z - lastAccel.z);

          const delta = deltaX + deltaY + deltaZ;
          const now = Date.now();

          if (delta > 6 && now - lastStepTime > 300) {
            this.steps++;
            lastStepTime = now;
            this.updateDisplay();
            this.saveSteps();
          }

          lastAccel = { x: accel.x || 0, y: accel.y || 0, z: accel.z || 0 };
        };

        // Request permission on iOS 13+
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
          try {
            const permission = await DeviceMotionEvent.requestPermission();
            if (permission === 'granted') {
              window.addEventListener('devicemotion', this._motionHandler);
              this.isTracking = true;
              return true;
            } else {
              toast.show('需要运动传感器权限', 'error');
              return false;
            }
          } catch (e) {
            toast.show('无法获取传感器权限', 'error');
            return false;
          }
        } else {
          window.addEventListener('devicemotion', this._motionHandler);
          this.isTracking = true;
          return true;
        }
      }
    } catch (e) {
      console.warn('DeviceMotion approach failed:', e);
    }

    // If nothing works, allow manual step input
    toast.show('设备不支持自动计步，可手动记录步数', 'info');
    this.enableManualCounting();
    return false;
  },

  enableManualCounting() {
    const card = document.querySelector('#pedometer-card .pedometer-display');
    if (!card || document.getElementById('manual-step-btn')) return;

    const manualBtn = document.createElement('button');
    manualBtn.id = 'manual-step-btn';
    manualBtn.className = 'btn-secondary';
    manualBtn.style.marginTop = '12px';
    manualBtn.style.gridArea = 'auto';
    manualBtn.textContent = '+ 手动添加步数';
    manualBtn.onclick = () => {
      const input = prompt('输入步数:');
      if (input && !isNaN(input) && parseInt(input) > 0) {
        this.steps += parseInt(input);
        this.updateDisplay();
        this.saveSteps();
        toast.show(`已添加 ${input} 步`, 'success');
      }
    };
    card.appendChild(manualBtn);

    // Also show input field
    const inputDiv = document.createElement('div');
    inputDiv.style.marginTop = '8px';
    inputDiv.innerHTML = `
      <input type="number" id="manual-step-input" placeholder="步数" min="1"
        style="width:100px;padding:8px;background:var(--bg-input);border:1px solid var(--border-color);color:var(--text-primary);border-radius:6px;font-size:0.9rem;">
      <button class="btn-primary" style="padding:8px 14px;margin-left:8px;font-size:0.8rem"
        onclick="pedometer.addManualSteps()">添加</button>
    `;
    manualBtn.after(inputDiv);
  },

  addManualSteps() {
    const input = document.getElementById('manual-step-input');
    if (input && input.value && !isNaN(input.value) && parseInt(input.value) > 0) {
      const steps = parseInt(input.value);
      this.steps += steps;
      this.updateDisplay();
      this.saveSteps();
      input.value = '';
      toast.show(`已添加 ${steps} 步`, 'success');
    }
  },

  stopTracking() {
    if (this.sensor) {
      this.sensor.stop();
      this.sensor = null;
    }
    if (this._motionHandler) {
      window.removeEventListener('devicemotion', this._motionHandler);
      this._motionHandler = null;
    }
    this.isTracking = false;
  },

  updateDisplay() {
    const stepCount = document.getElementById('step-count');
    const stepCalories = document.getElementById('step-calories');
    const stepDist = document.getElementById('step-distance-km');
    const stepRing = document.getElementById('step-ring-progress');
    const stepBadge = document.getElementById('step-badge');
    const goalInput = document.getElementById('step-goal-input');

    if (stepCount) stepCount.textContent = this.steps.toLocaleString();

    // Estimate: ~0.04 cal per step, ~0.0007 km per step (avg stride 0.7m)
    const calories = Math.round(this.steps * 0.04);
    const distance = (this.steps * 0.0007).toFixed(2);

    if (stepCalories) stepCalories.textContent = calories;
    if (stepDist) stepDist.textContent = distance;
    if (goalInput) goalInput.value = this.goal;

    // Update ring progress
    if (stepRing) {
      const circumference = 339.292; // 2 * PI * 54
      const progress = Math.min(1, this.steps / this.goal);
      const offset = circumference - (progress * circumference);
      stepRing.style.strokeDashoffset = offset;
    }

    // Update badge
    if (stepBadge) {
      if (this.steps > 0) {
        stepBadge.style.display = '';
        stepBadge.textContent = this.steps > 9999 ? (this.steps / 1000).toFixed(1) + 'k' : this.steps;
      }
    }
  },

  async saveSteps() {
    const today = new Date().toISOString().split('T')[0];
    await dbPut('settings', { key: 'steps_' + today, value: this.steps });
  },

  async saveGoal() {
    const input = document.getElementById('step-goal-input');
    if (input) {
      this.goal = parseInt(input.value) || 10000;
      await dbPut('settings', { key: 'step_goal', value: this.goal });
      this.updateDisplay();
      toast.show('步数目标已更新', 'success');
    }
  }
};
