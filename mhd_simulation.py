"""
磁流体力学 (MHD) 2D 模拟实验
==============================
基于 Navier-Stokes 方程 + 磁感应方程的简化二维不可压缩 MHD 模拟。
使用有限差分法 + 投影法求解，支持实时交互与多模式可视化。

操作说明:
  鼠标左键拖动 - 施加外力推动流体
  鼠标右键拖动 - 注入带电示踪流体
  ↑ / ↓       - 增减外部磁场强度
  ← / →       - 旋转外部磁场方向
  V            - 切换可视化模式
  Space        - 暂停 / 继续
  R            - 重置模拟
  H            - 显示帮助面板
  +/-          - 增减模拟速度
"""

import sys
import math
import numpy as np
import pygame

# ============================================================
# 配置常量
# ============================================================
WINDOW_WIDTH = 1200
WINDOW_HEIGHT = 900
SIM_WIDTH = 1200
SIM_HEIGHT = 900
FPS_TARGET = 60

# 默认网格分辨率
DEFAULT_NX = 120
DEFAULT_NY = 90


# ============================================================
# 辅助函数 - 科学配色映射 (inferno 风格)
# ============================================================
def lerp_color(c0, c1, t):
    t = max(0.0, min(1.0, t))
    return (
        int(c0[0] + (c1[0] - c0[0]) * t),
        int(c0[1] + (c1[1] - c0[1]) * t),
        int(c0[2] + (c1[2] - c0[2]) * t),
    )


def inferno_colormap(t):
    """0..1 → inferno 风格 RGB"""
    t = max(0.0, min(1.0, t))
    stops = [
        (0.000, (0, 0, 4)),
        (0.130, (40, 11, 84)),
        (0.250, (101, 21, 110)),
        (0.380, (159, 42, 99)),
        (0.500, (212, 72, 66)),
        (0.630, (245, 125, 21)),
        (0.750, (250, 193, 39)),
        (0.880, (226, 240, 103)),
        (1.000, (252, 255, 164)),
    ]
    for i in range(len(stops) - 1):
        t0, c0 = stops[i]
        t1, c1 = stops[i + 1]
        if t <= t1:
            return lerp_color(c0, c1, (t - t0) / (t1 - t0))
    return stops[-1][1]


def plasma_colormap(t):
    t = max(0.0, min(1.0, t))
    stops = [
        (0.000, (13, 8, 135)),
        (0.130, (75, 3, 161)),
        (0.250, (126, 3, 168)),
        (0.380, (168, 34, 150)),
        (0.500, (203, 70, 121)),
        (0.630, (229, 107, 93)),
        (0.750, (248, 148, 65)),
        (0.880, (253, 195, 40)),
        (1.000, (240, 249, 33)),
    ]
    for i in range(len(stops) - 1):
        t0, c0 = stops[i]
        t1, c1 = stops[i + 1]
        if t <= t1:
            return lerp_color(c0, c1, (t - t0) / (t1 - t0))
    return stops[-1][1]


def coolwarm_colormap(t):
    t = max(0.0, min(1.0, t))
    stops = [
        (0.000, (59, 76, 192)),
        (0.250, (102, 146, 224)),
        (0.500, (220, 220, 220)),
        (0.750, (221, 142, 107)),
        (1.000, (180, 4, 38)),
    ]
    for i in range(len(stops) - 1):
        t0, c0 = stops[i]
        t1, c1 = stops[i + 1]
        if t <= t1:
            return lerp_color(c0, c1, (t - t0) / (t1 - t0))
    return stops[-1][1]


# ============================================================
# Grid 类
# ============================================================
class Grid:
    def __init__(self, nx, ny, width, height):
        self.nx = nx
        self.ny = ny
        self.width = width
        self.height = height
        self.dx = width / nx
        self.dy = height / ny

        self.u = np.zeros((ny, nx), dtype=np.float64)  # x 方向速度
        self.v = np.zeros((ny, nx), dtype=np.float64)  # y 方向速度
        self.u_prev = np.zeros_like(self.u)
        self.v_prev = np.zeros_like(self.v)

        self.Bx = np.zeros((ny, nx), dtype=np.float64)  # x 方向磁场
        self.By = np.zeros((ny, nx), dtype=np.float64)  # y 方向磁场

        self.p = np.zeros((ny, nx), dtype=np.float64)  # 压力
        self.dye = np.zeros((ny, nx), dtype=np.float64)  # 示踪染料浓度

    def idx(self, world_x, world_y):
        gx = world_x / self.dx
        gy = world_y / self.dy
        return gx, gy


# ============================================================
# FluidSolver - 流体求解器 (投影法)
# ============================================================
class FluidSolver:
    def __init__(self, grid, viscosity=0.0001, dt=0.4):
        self.grid = grid
        self.viscosity = viscosity
        self.dt = dt

    def step(self):
        g = self.grid
        u, v = g.u, g.v

        # 1. 保存旧速度
        g.u_prev[:] = u
        g.v_prev[:] = v

        # 2. 半拉格朗日平流
        u_new = self._advect(g.u, g.u, g.v)
        v_new = self._advect(g.v, g.u, g.v)
        u[:] = u_new
        v[:] = v_new

        # 3. 平流染料
        g.dye[:] = self._advect(g.dye, g.u, g.v)
        g.dye *= 0.999  # 轻微衰减

        # 4. 扩散 (唯一拉普拉斯)
        self._diffuse(g.u, g.u_prev, self.viscosity)
        self._diffuse(g.v, g.v_prev, self.viscosity)

        # 5. 投影 (强制不可压缩 ∇·v = 0)
        self._project(g.u, g.v, g.p)

    def _advect(self, field, u, v):
        g = self.grid
        ny, nx = field.shape
        i_arr = np.arange(ny)[:, None]
        j_arr = np.arange(nx)[None, :]

        # 回溯粒子位置
        x = j_arr.astype(np.float64) - self.dt * u
        y = i_arr.astype(np.float64) - self.dt * v

        # 边界钳制
        x = np.clip(x, 0.5, nx - 1.5)
        y = np.clip(y, 0.5, ny - 1.5)

        # 双线性插值
        j0 = np.floor(x).astype(int)
        i0 = np.floor(y).astype(int)
        j1 = j0 + 1
        i1 = i0 + 1

        sx = x - j0
        sy = y - i0

        j0 = np.clip(j0, 0, nx - 1)
        j1 = np.clip(j1, 0, nx - 1)
        i0 = np.clip(i0, 0, ny - 1)
        i1 = np.clip(i1, 0, ny - 1)

        result = (
            (1 - sy) * (1 - sx) * field[i0, j0]
            + (1 - sy) * sx * field[i0, j1]
            + sy * (1 - sx) * field[i1, j0]
            + sy * sx * field[i1, j1]
        )
        return result

    def _diffuse(self, x, x0, diff):
        """隐式扩散 - Jacobi 迭代"""
        a = self.dt * diff * self.grid.nx * self.grid.ny
        if a < 1e-12:
            x[:] = x0
            return
        for _ in range(20):
            x[1:-1, 1:-1] = (
                x0[1:-1, 1:-1]
                + a
                * (
                    x[1:-1, 2:]
                    + x[1:-1, :-2]
                    + x[2:, 1:-1]
                    + x[:-2, 1:-1]
                )
            ) / (1 + 4 * a)
            self._set_boundary(x)

    def _project(self, u, v, p):
        """压力投影 - 使速度场无散度"""
        g = self.grid
        ny, nx = g.ny, g.nx

        # 计算散度
        div = np.zeros((ny, nx))
        div[1:-1, 1:-1] = -0.5 * (
            (u[1:-1, 2:] - u[1:-1, :-2]) / nx
            + (v[2:, 1:-1] - v[:-2, 1:-1]) / ny
        )
        p[:] = 0

        # Jacobi 迭代求解泊松方程
        for _ in range(40):
            p[1:-1, 1:-1] = (
                div[1:-1, 1:-1]
                + p[1:-1, 2:]
                + p[1:-1, :-2]
                + p[2:, 1:-1]
                + p[:-2, 1:-1]
            ) / 4.0
            self._set_boundary(p)

        # 修正速度
        u[1:-1, 1:-1] -= 0.5 * nx * (p[1:-1, 2:] - p[1:-1, :-2])
        v[1:-1, 1:-1] -= 0.5 * ny * (p[2:, 1:-1] - p[:-2, 1:-1])
        self._set_boundary(u)
        self._set_boundary(v)

    def _set_boundary(self, field):
        """设置边界条件 (无滑移墙壁)"""
        field[0, :] = -field[1, :]
        field[-1, :] = -field[-2, :]
        field[:, 0] = -field[:, 1]
        field[:, -1] = -field[:, -2]
        # 角点
        field[0, 0] = 0.5 * (field[1, 0] + field[0, 1])
        field[0, -1] = 0.5 * (field[1, -1] + field[0, -2])
        field[-1, 0] = 0.5 * (field[-2, 0] + field[-1, 1])
        field[-1, -1] = 0.5 * (field[-2, -1] + field[-1, -2])


# ============================================================
# MagneticFieldSolver - 磁场求解器
# ============================================================
class MagneticFieldSolver:
    def __init__(self, grid, magnetic_diffusivity=0.0001, lorentz_coeff=5.0):
        self.grid = grid
        self.eta = magnetic_diffusivity  # 磁扩散系数
        self.lorentz_coeff = lorentz_coeff  # 洛伦兹力系数
        self.ext_strength = 0.5  # 外加磁场强度
        self.ext_angle = 0.0  # 外加磁场方向 (弧度)

    def step(self, fluid_solver):
        g = self.grid
        dt = fluid_solver.dt

        # 1. 计算外磁场
        ext_bx = self.ext_strength * math.cos(self.ext_angle)
        ext_by = self.ext_strength * math.sin(self.ext_angle)

        # 2. 平流总磁场 (自身 + 外磁场)
        total_bx = g.Bx + ext_bx
        total_by = g.By + ext_by
        g.Bx = self._advect(total_bx, g.u, g.v, dt) - ext_bx
        g.By = self._advect(total_by, g.u, g.v, dt) - ext_by

        # 3. 磁扩散
        Bx_tmp = g.Bx.copy()
        By_tmp = g.By.copy()
        self._diffuse_field(g.Bx, Bx_tmp, self.eta, dt)
        self._diffuse_field(g.By, By_tmp, self.eta, dt)

        # 4. 散度清除 (∇·B = 0)
        self._divergence_cleaning()

        # 5. 计算洛伦兹力并施加到流体
        self._apply_lorentz_force(g, dt)

    def _advect(self, field, u, v, dt):
        g = self.grid
        ny, nx = field.shape
        i_arr = np.arange(ny)[:, None]
        j_arr = np.arange(nx)[None, :]

        x = j_arr.astype(np.float64) - dt * u
        y = i_arr.astype(np.float64) - dt * v

        x = np.clip(x, 0.5, nx - 1.5)
        y = np.clip(y, 0.5, ny - 1.5)

        j0 = np.floor(x).astype(int)
        i0 = np.floor(y).astype(int)
        j1 = j0 + 1
        i1 = i0 + 1

        sx = x - j0
        sy = y - i0

        j0 = np.clip(j0, 0, nx - 1)
        j1 = np.clip(j1, 0, nx - 1)
        i0 = np.clip(i0, 0, ny - 1)
        i1 = np.clip(i1, 0, ny - 1)

        return (
            (1 - sy) * (1 - sx) * field[i0, j0]
            + (1 - sy) * sx * field[i0, j1]
            + sy * (1 - sx) * field[i1, j0]
            + sy * sx * field[i1, j1]
        )

    def _diffuse_field(self, x, x0, diff, dt):
        a = dt * diff * self.grid.nx * self.grid.ny
        if a < 1e-12:
            x[:] = x0
            return
        for _ in range(10):
            x[1:-1, 1:-1] = (
                x0[1:-1, 1:-1]
                + a * (x[1:-1, 2:] + x[1:-1, :-2] + x[2:, 1:-1] + x[:-2, 1:-1])
            ) / (1 + 4 * a)
            self._neumann_boundary(x)

    def _divergence_cleaning(self):
        """散度清除：将磁场投影到无散度空间"""
        g = self.grid
        ny, nx = g.ny, g.nx

        div = np.zeros((ny, nx))
        div[1:-1, 1:-1] = (
            (g.Bx[1:-1, 2:] - g.Bx[1:-1, :-2])
            + (g.By[2:, 1:-1] - g.By[:-2, 1:-1])
        ) * 0.5

        p = np.zeros((ny, nx))
        for _ in range(20):
            p[1:-1, 1:-1] = (
                div[1:-1, 1:-1]
                + p[1:-1, 2:]
                + p[1:-1, :-2]
                + p[2:, 1:-1]
                + p[:-2, 1:-1]
            ) / 4.0
            self._neumann_boundary(p)

        g.Bx[1:-1, 1:-1] -= 0.5 * (p[1:-1, 2:] - p[1:-1, :-2])
        g.By[1:-1, 1:-1] -= 0.5 * (p[2:, 1:-1] - p[:-2, 1:-1])

    def _apply_lorentz_force(self, g, dt):
        """
        洛伦兹力: F = J × B
        J = (∇ × B) ẑ = (∂By/∂x - ∂Bx/∂y) ẑ
        在 2D 中: J = ∂By/∂x - ∂Bx/∂y
        F_x = J * By, F_y = -J * Bx
        """
        ext_bx = self.ext_strength * math.cos(self.ext_angle)
        ext_by = self.ext_strength * math.sin(self.ext_angle)
        total_bx = g.Bx + ext_bx
        total_by = g.By + ext_by

        # 电流密度 J = ∂By/∂x - ∂Bx/∂y
        J = np.zeros((g.ny, g.nx))
        J[1:-1, 1:-1] = (
            (total_by[1:-1, 2:] - total_by[1:-1, :-2])
            - (total_bx[2:, 1:-1] - total_bx[:-2, 1:-1])
        ) * 0.5

        # 洛伦兹力
        fx = J * total_by * self.lorentz_coeff
        fy = -J * total_bx * self.lorentz_coeff

        g.u += fx * dt
        g.v += fy * dt

    def _neumann_boundary(self, field):
        """Neumann 边界 (法向导数为零)"""
        field[0, :] = field[1, :]
        field[-1, :] = field[-2, :]
        field[:, 0] = field[:, 1]
        field[:, -1] = field[:, -2]


# ============================================================
# ParticleSystem - 粒子系统
# ============================================================
class Particle:
    __slots__ = ["x", "y", "life", "max_life", "vx", "vy"]

    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.life = 0
        self.max_life = np.random.randint(200, 500)
        self.vx = 0.0
        self.vy = 0.0


class ParticleSystem:
    def __init__(self, grid, num_particles=500):
        self.grid = grid
        self.num_particles = num_particles
        self.particles = []
        self._init_particles()

    def _init_particles(self):
        self.particles = []
        for _ in range(self.num_particles):
            x = np.random.uniform(5, self.grid.width - 5)
            y = np.random.uniform(5, self.grid.height - 5)
            self.particles.append(Particle(x, y))

    def reset(self):
        self._init_particles()

    def update(self, u, v, dt):
        g = self.grid
        to_remove = []
        for idx, p in enumerate(self.particles):
            # 双线性插值获取速度
            gx = p.x / g.dx
            gy = p.y / g.dy

            gi = int(gy)
            gj = int(gx)
            if gi < 0 or gi >= g.ny - 1 or gj < 0 or gj >= g.nx - 1:
                to_remove.append(idx)
                continue

            fx = gx - gj
            fy = gy - gi

            vx = (
                (1 - fy) * (1 - fx) * u[gi, gj]
                + (1 - fy) * fx * u[gi, gj + 1]
                + fy * (1 - fx) * u[gi + 1, gj]
                + fy * fx * u[gi + 1, gj + 1]
            )
            vy = (
                (1 - fy) * (1 - fx) * v[gi, gj]
                + (1 - fy) * fx * v[gi, gj + 1]
                + fy * (1 - fx) * v[gi + 1, gj]
                + fy * fx * v[gi + 1, gj + 1]
            )

            p.vx = vx
            p.vy = vy
            p.x += vx * dt * g.dx
            p.y += vy * dt * g.dy
            p.life += 1

            # 边界检查或生命结束
            if (
                p.x < 1
                or p.x > g.width - 1
                or p.y < 1
                or p.y > g.height - 1
                or p.life > p.max_life
            ):
                to_remove.append(idx)

        # 重生粒子
        for idx in reversed(to_remove):
            self.particles[idx] = Particle(
                np.random.uniform(5, g.width - 5),
                np.random.uniform(5, g.height - 5),
            )

    def inject(self, x, y, count=5, spread=15):
        """在指定位置注入粒子"""
        g = self.grid
        for _ in range(count):
            px = x + np.random.randn() * spread
            py = y + np.random.randn() * spread
            if 1 < px < g.width - 1 and 1 < py < g.height - 1:
                self.particles.append(Particle(px, py))
        # 维持粒子数量
        while len(self.particles) > self.num_particles * 1.5:
            self.particles.pop(0)


# ============================================================
# Renderer - 渲染器
# ============================================================
VIS_PARTICLES = 0
VIS_VELOCITY = 1
VIS_MAGNETIC = 2
VIS_VORTICITY = 3
VIS_NAMES = ["粒子模式", "速度场模式", "磁场模式", "涡度模式"]


class Renderer:
    def __init__(self, screen, grid):
        self.screen = screen
        self.grid = grid
        self.vis_mode = VIS_PARTICLES
        self.font = pygame.font.SysFont("monospace", 16, bold=True)
        self.font_large = pygame.font.SysFont("monospace", 18, bold=True)
        self.font_help = pygame.font.SysFont("monospace", 15)
        self.show_help = False
        self.arrow_surface = None

    def render(self, grid, particles, mag_solver, fps, sim_speed):
        self.screen.fill((5, 5, 15))

        if self.vis_mode == VIS_PARTICLES:
            self._render_particles(grid, particles, mag_solver)
        elif self.vis_mode == VIS_VELOCITY:
            self._render_velocity_field(grid)
        elif self.vis_mode == VIS_MAGNETIC:
            self._render_magnetic_field(grid, mag_solver)
        elif self.vis_mode == VIS_VORTICITY:
            self._render_vorticity(grid)

        self._render_hud(grid, mag_solver, fps, sim_speed)

        if self.show_help:
            self._render_help()

    def _render_particles(self, grid, particle_sys, mag_solver):
        # 渲染染料场作为背景
        self._render_dye(grid)

        # 渲染粒子
        u, v = grid.u, grid.v
        for p in particle_sys.particles:
            speed = math.sqrt(p.vx * p.vx + p.vy * p.vy)
            t = min(1.0, speed * 3.0)

            # 混合 inferno 和 plasma 配色
            alpha = (p.life % 60) / 60.0
            if int(p.life / 60) % 2 == 0:
                color = inferno_colormap(t)
            else:
                color = plasma_colormap(t)

            # 生命周期渐隐
            life_ratio = 1.0 - p.life / p.max_life
            life_ratio = max(0.0, life_ratio)
            color = lerp_color((5, 5, 15), color, 0.3 + 0.7 * life_ratio)

            size = max(1, int(1 + t * 2))
            px, py = int(p.x), int(p.y)
            if 0 <= px < self.screen.get_width() and 0 <= py < self.screen.get_height():
                pygame.draw.circle(self.screen, color, (px, py), size)

    def _render_dye(self, grid):
        """将染料场渲染为半透明背景"""
        dye = grid.dye
        max_dye = np.max(np.abs(dye))
        if max_dye < 0.01:
            return

        ny, nx = grid.ny, grid.nx
        step_x = max(1, nx // 60)
        step_y = max(1, ny // 45)

        for i in range(0, ny, step_y):
            for j in range(0, nx, step_x):
                val = abs(dye[i, j]) / (max_dye + 0.001)
                if val < 0.02:
                    continue
                color = plasma_colormap(min(1.0, val))
                # 混合到背景
                alpha = val * 0.4
                bg = (5, 5, 15)
                color = lerp_color(bg, color, alpha)
                px = int(j * grid.dx)
                py = int(i * grid.dy)
                w = max(1, int(step_x * grid.dx))
                h = max(1, int(step_y * grid.dy))
                pygame.draw.rect(self.screen, color, (px, py, w, h))

    def _render_velocity_field(self, grid):
        ny, nx = grid.ny, grid.nx
        u, v = grid.u, grid.v

        speed = np.sqrt(u * u + v * v)
        max_speed = max(np.max(speed), 0.001)

        # 渲染速度场热力图
        step_x = max(1, nx // 120)
        step_y = max(1, ny // 90)

        for i in range(0, ny, step_y):
            for j in range(0, nx, step_x):
                t = min(1.0, speed[i, j] / max_speed)
                color = inferno_colormap(t)
                px = int(j * grid.dx)
                py = int(i * grid.dy)
                w = max(1, int(step_x * grid.dx))
                h = max(1, int(step_y * grid.dy))
                pygame.draw.rect(self.screen, color, (px, py, w, h))

        # 渲染方向箭头
        arrow_step_x = max(1, nx // 25)
        arrow_step_y = max(1, ny // 18)

        for i in range(arrow_step_y, ny - arrow_step_y, arrow_step_y):
            for j in range(arrow_step_x, nx - arrow_step_x, arrow_step_x):
                px = int(j * grid.dx)
                py = int(i * grid.dy)
                s = speed[i, j]
                if s < 0.001:
                    continue

                scale = min(20, s / max_speed * 30)
                ex = px + int(u[i, j] / max_speed * scale)
                ey = py + int(v[i, j] / max_speed * scale)

                t = min(1.0, s / max_speed)
                color = (
                    int(255 * t),
                    int(255 * (1 - t * 0.5)),
                    int(255 * (1 - t)),
                )
                pygame.draw.line(self.screen, color, (px, py), (ex, ey), 1)
                # 箭头头部
                if scale > 3:
                    angle = math.atan2(ey - py, ex - px)
                    a1 = angle + 2.5
                    a2 = angle - 2.5
                    sz = 4
                    pygame.draw.line(
                        self.screen,
                        color,
                        (ex, ey),
                        (ex - int(sz * math.cos(a1)), ey - int(sz * math.sin(a1))),
                        1,
                    )
                    pygame.draw.line(
                        self.screen,
                        color,
                        (ex, ey),
                        (ex - int(sz * math.cos(a2)), ey - int(sz * math.sin(a2))),
                        1,
                    )

    def _render_magnetic_field(self, grid, mag_solver):
        ny, nx = grid.ny, grid.nx

        ext_bx = mag_solver.ext_strength * math.cos(mag_solver.ext_angle)
        ext_by = mag_solver.ext_strength * math.sin(mag_solver.ext_angle)
        total_bx = grid.Bx + ext_bx
        total_by = grid.By + ext_by

        B_mag = np.sqrt(total_bx ** 2 + total_by ** 2)
        max_b = max(np.max(B_mag), 0.001)

        # 渲染磁场强度热力图
        step_x = max(1, nx // 120)
        step_y = max(1, ny // 90)

        for i in range(0, ny, step_y):
            for j in range(0, nx, step_x):
                t = min(1.0, B_mag[i, j] / max_b)
                color = coolwarm_colormap(t)
                px = int(j * grid.dx)
                py = int(i * grid.dy)
                w = max(1, int(step_x * grid.dx))
                h = max(1, int(step_y * grid.dy))
                pygame.draw.rect(self.screen, color, (px, py, w, h))

        # 渲染磁力线箭头
        arrow_step_x = max(1, nx // 20)
        arrow_step_y = max(1, ny // 15)

        for i in range(arrow_step_y, ny - arrow_step_y, arrow_step_y):
            for j in range(arrow_step_x, nx - arrow_step_x, arrow_step_x):
                px = int(j * grid.dx)
                py = int(i * grid.dy)
                bm = B_mag[i, j]
                if bm < 0.001:
                    continue

                scale = min(25, bm / max_b * 35)
                ex = px + int(total_bx[i, j] / max_b * scale)
                ey = py + int(total_by[i, j] / max_b * scale)

                t = min(1.0, bm / max_b)
                color = (
                    int(50 + 180 * t),
                    int(180 + 75 * t),
                    255,
                )
                pygame.draw.line(self.screen, color, (px, py), (ex, ey), 1)
                # 箭头
                if scale > 3:
                    angle = math.atan2(ey - py, ex - px)
                    a1 = angle + 2.5
                    a2 = angle - 2.5
                    sz = 5
                    pygame.draw.line(
                        self.screen,
                        color,
                        (ex, ey),
                        (ex - int(sz * math.cos(a1)), ey - int(sz * math.sin(a1))),
                        1,
                    )
                    pygame.draw.line(
                        self.screen,
                        color,
                        (ex, ey),
                        (ex - int(sz * math.cos(a2)), ey - int(sz * math.sin(a2))),
                        1,
                    )

    def _render_vorticity(self, grid):
        ny, nx = grid.ny, grid.nx
        u, v = grid.u, grid.v

        # 计算涡度 ω = ∂v/∂x - ∂u/∂y
        vorticity = np.zeros((ny, nx))
        vorticity[1:-1, 1:-1] = (
            (v[1:-1, 2:] - v[1:-1, :-2])
            - (u[2:, 1:-1] - u[:-2, 1:-1])
        ) * 0.5

        max_vort = max(np.max(np.abs(vorticity)), 0.001)

        step_x = max(1, nx // 120)
        step_y = max(1, ny // 90)

        for i in range(0, ny, step_y):
            for j in range(0, nx, step_x):
                t = (vorticity[i, j] / max_vort + 1) * 0.5  # 映射到 0..1
                color = coolwarm_colormap(t)
                px = int(j * grid.dx)
                py = int(i * grid.dy)
                w = max(1, int(step_x * grid.dx))
                h = max(1, int(step_y * grid.dy))
                pygame.draw.rect(self.screen, color, (px, py, w, h))

    def _render_hud(self, grid, mag_solver, fps, sim_speed):
        u_max = np.max(np.abs(grid.u))
        v_max = np.max(np.abs(grid.v))
        B_max = np.max(np.sqrt(grid.Bx ** 2 + grid.By ** 2))

        lines = [
            f"FPS: {fps:.0f}  速度: x{sim_speed:.1f}",
            f"网格: {grid.nx}x{grid.ny}",
            f"模式: {VIS_NAMES[self.vis_mode]}",
            f"外磁场: {mag_solver.ext_strength:.2f}  方向: {math.degrees(mag_solver.ext_angle):.0f}°",
            f"|v|_max: {u_max:.3f}  |B|_max: {B_max:.3f}",
        ]

        y = 10
        # 半透明背景
        panel_h = len(lines) * 22 + 10
        panel_w = 420
        s = pygame.Surface((panel_w, panel_h), pygame.SRCALPHA)
        s.fill((0, 0, 0, 140))
        self.screen.blit(s, (8, 5))

        for line in lines:
            text = self.font.render(line, True, (200, 220, 255))
            self.screen.blit(text, (15, y))
            y += 22

    def _render_help(self):
        lines = [
            "=== 磁流体力学 MHD 模拟 ===",
            "",
            "鼠标左键拖动  - 施加外力推动流体",
            "鼠标右键拖动  - 注入带电示踪流体",
            "↑ / ↓         - 增 / 减外部磁场强度",
            "← / →         - 逆 / 顺时针旋转磁场方向",
            "V              - 切换可视化模式",
            "Space          - 暂停 / 继续",
            "R              - 重置模拟",
            "+/-            - 增减模拟速度",
            "H              - 显示/隐藏帮助",
            "Esc            - 退出",
        ]

        panel_w = 420
        panel_h = len(lines) * 24 + 20
        x = (WINDOW_WIDTH - panel_w) // 2
        y = (WINDOW_HEIGHT - panel_h) // 2

        s = pygame.Surface((panel_w, panel_h), pygame.SRCALPHA)
        s.fill((0, 0, 30, 200))
        self.screen.blit(s, (x, y))

        ty = y + 10
        for line in lines:
            if line.startswith("==="):
                color = (100, 200, 255)
            else:
                color = (200, 210, 230)
            text = self.font_help.render(line, True, color)
            tx = x + (panel_w - text.get_width()) // 2
            self.screen.blit(text, (tx, ty))
            ty += 24


# ============================================================
# InteractionSystem - 交互系统
# ============================================================
class InteractionSystem:
    def __init__(self, grid):
        self.grid = grid
        self.left_dragging = False
        self.right_dragging = False
        self.last_mouse = None
        self.force_radius = 8.0
        self.force_strength = 5.0

    def handle_event(self, event):
        if event.type == pygame.MOUSEBUTTONDOWN:
            if event.button == 1:
                self.left_dragging = True
                self.last_mouse = event.pos
            elif event.button == 3:
                self.right_dragging = True
                self.last_mouse = event.pos
        elif event.type == pygame.MOUSEBUTTONUP:
            if event.button == 1:
                self.left_dragging = False
            elif event.button == 3:
                self.right_dragging = False
            self.last_mouse = None
        elif event.type == pygame.MOUSEMOTION:
            if self.left_dragging and self.last_mouse:
                self._apply_force(event.pos)
            elif self.right_dragging and self.last_mouse:
                self._inject_dye(event.pos)
            self.last_mouse = event.pos

    def _apply_force(self, pos):
        g = self.grid
        mx, my = pos
        lx, ly = self.last_mouse

        dx_world = (mx - lx)
        dy_world = (my - ly)

        gx = mx / g.dx
        gy = my / g.dy

        radius = self.force_radius
        jimin = int(max(0, gx - radius))
        jmax = int(min(g.nx, gx + radius))
        iimin = int(max(0, gy - radius))
        imax = int(min(g.ny, gy + radius))

        for i in range(iimin, imax):
            for j in range(jimin, jmax):
                dist = math.sqrt((j - gx) ** 2 + (i - gy) ** 2)
                if dist < radius:
                    falloff = 1.0 - dist / radius
                    g.u[i, j] += dx_world * self.force_strength * falloff
                    g.v[i, j] += dy_world * self.force_strength * falloff

    def _inject_dye(self, pos):
        g = self.grid
        mx, my = pos

        gx = mx / g.dx
        gy = my / g.dy

        radius = self.force_radius
        jimin = int(max(0, gx - radius))
        jmax = int(min(g.nx, gx + radius))
        iimin = int(max(0, gy - radius))
        imax = int(min(g.ny, gy + radius))

        for i in range(iimin, imax):
            for j in range(jimin, jmax):
                dist = math.sqrt((j - gx) ** 2 + (i - gy) ** 2)
                if dist < radius:
                    falloff = 1.0 - dist / radius
                    g.dye[i, j] += falloff * 2.0
                    # 注入磁扰动
                    g.Bx[i, j] += falloff * 0.05 * (np.random.random() - 0.5)
                    g.By[i, j] += falloff * 0.05 * (np.random.random() - 0.5)


# ============================================================
# Simulation - 主模拟控制器
# ============================================================
class Simulation:
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
        pygame.display.set_caption("磁流体力学 (MHD) 2D 模拟实验")
        self.clock = pygame.time.Clock()

        self.nx = DEFAULT_NX
        self.ny = DEFAULT_NY

        self.sim_speed = 1.0
        self.paused = False
        self.running = True
        self.fps = 60.0

        self._init_simulation()

    def _init_simulation(self):
        self.grid = Grid(self.nx, self.ny, SIM_WIDTH, SIM_HEIGHT)
        self.fluid_solver = FluidSolver(self.grid, viscosity=0.0001, dt=0.4)
        self.mag_solver = MagneticFieldSolver(
            self.grid, magnetic_diffusivity=0.0001, lorentz_coeff=5.0
        )
        self.particle_sys = ParticleSystem(self.grid, num_particles=500)
        self.renderer = Renderer(self.screen, self.grid)
        self.interaction = InteractionSystem(self.grid)
        self._add_initial_perturbation()

    def _add_initial_perturbation(self):
        """添加初始扰动使模拟一启动就有动态"""
        g = self.grid
        cx, cy = g.nx // 2, g.ny // 2

        y_arr, x_arr = np.mgrid[0 : g.ny, 0 : g.nx]

        # 多个涡旋初始条件
        for _ in range(4):
            ox = np.random.randint(g.nx // 4, 3 * g.nx // 4)
            oy = np.random.randint(g.ny // 4, 3 * g.ny // 4)
            sigma = np.random.uniform(5, 15)
            strength = np.random.uniform(-0.3, 0.3)

            dx = x_arr - ox
            dy = y_arr - oy
            r2 = dx * dx + dy * dy

            g.u += strength * -dy * np.exp(-r2 / (2 * sigma * sigma))
            g.v += strength * dx * np.exp(-r2 / (2 * sigma * sigma))

        # 初始染料
        g.dye[g.ny // 4 : 3 * g.ny // 4, g.nx // 4 : 3 * g.nx // 4] = np.random.uniform(
            0.2, 0.8, (g.ny // 2, g.nx // 2)
        )

    def resize_grid(self, new_nx, new_ny):
        self.nx = max(40, min(200, new_nx))
        self.ny = max(30, min(150, new_ny))
        self._init_simulation()

    def run(self):
        while self.running:
            self._handle_events()
            if not self.paused:
                steps = max(1, int(self.sim_speed))
                for _ in range(steps):
                    self._step()
            self._render()
            self.clock.tick(FPS_TARGET)
            self.fps = self.clock.get_fps()

        pygame.quit()
        sys.exit()

    def _handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            elif event.type == pygame.KEYDOWN:
                self._handle_keydown(event)
            self.interaction.handle_event(event)

    def _handle_keydown(self, event):
        if event.key == pygame.K_ESCAPE:
            self.running = False
        elif event.key == pygame.K_SPACE:
            self.paused = not self.paused
        elif event.key == pygame.K_r:
            self._init_simulation()
        elif event.key == pygame.K_h:
            self.renderer.show_help = not self.renderer.show_help
        elif event.key == pygame.K_v:
            self.renderer.vis_mode = (self.renderer.vis_mode + 1) % 4
        elif event.key == pygame.K_UP:
            self.mag_solver.ext_strength = min(
                3.0, self.mag_solver.ext_strength + 0.05
            )
        elif event.key == pygame.K_DOWN:
            self.mag_solver.ext_strength = max(
                0.0, self.mag_solver.ext_strength - 0.05
            )
        elif event.key == pygame.K_LEFT:
            self.mag_solver.ext_angle += math.radians(10)
        elif event.key == pygame.K_RIGHT:
            self.mag_solver.ext_angle -= math.radians(10)
        elif event.key in (pygame.K_PLUS, pygame.K_EQUALS, pygame.K_KP_PLUS):
            self.sim_speed = min(5.0, self.sim_speed + 0.25)
        elif event.key in (pygame.K_MINUS, pygame.K_KP_MINUS):
            self.sim_speed = max(0.25, self.sim_speed - 0.25)

    def _step(self):
        # 右键拖拽时注入粒子
        if self.interaction.right_dragging and self.interaction.last_mouse:
            mx, my = self.interaction.last_mouse
            self.particle_sys.inject(mx, my, count=3, spread=20)

        self.fluid_solver.step()
        self.mag_solver.step(self.fluid_solver)
        self.particle_sys.update(self.grid.u, self.grid.v, self.fluid_solver.dt)

    def _render(self):
        self.renderer.render(
            self.grid, self.particle_sys, self.mag_solver, self.fps, self.sim_speed
        )
        pygame.display.flip()


# ============================================================
# 入口
# ============================================================
if __name__ == "__main__":
    sim = Simulation()
    sim.run()
