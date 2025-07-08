import tkinter as tk
from tkinter import ttk
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from matplotlib.patches import Rectangle
import sympy

# --- アプリケーションのメインクラス ---
class IntegralVisualizerApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("定積分の面積解釈アプリ")
        self.geometry("800x650")

        # --- 変数の初期化 ---
        self.func_str = "x**2"  # 表示する関数式
        self.a = 0.0  # 積分範囲の下限
        self.b = 2.0  # 積分範囲の上限
        
        # 数値計算用の関数と、記号計算用のシンボル・関数を準備
        self.x_sym = sympy.Symbol('x')
        self.func_sym = sympy.sympify(self.func_str)
        self.func_np = sympy.lambdify(self.x_sym, self.func_sym, 'numpy')

        # GUIウィジェット用の変数を設定
        self.n_rects = tk.IntVar(value=10)
        self.riemann_method = tk.StringVar(value="mid") # "left", "right", "mid"

        # --- 正確な積分値の計算 (初回のみ) ---
        self.exact_integral_val = sympy.integrate(self.func_sym, (self.x_sym, self.a, self.b)).evalf()

        self._create_widgets()
        self._update_plot()

    def _create_widgets(self):
        # --- メインフレームの作成 ---
        main_frame = ttk.Frame(self, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)

        # --- Matplotlib のグラフを描画するキャンバス ---
        self.fig = plt.figure(figsize=(7, 5))
        self.ax = self.fig.add_subplot(1, 1, 1)
        self.canvas = FigureCanvasTkAgg(self.fig, master=main_frame)
        self.canvas.get_tk_widget().pack(fill=tk.BOTH, expand=True)

        # --- コントロール用のフレーム ---
        control_frame = ttk.Frame(main_frame, padding="10")
        control_frame.pack(fill=tk.X)

        # --- 短冊の数を制御するスライダー ---
        ttk.Label(control_frame, text="短冊の数 (n):").pack(side=tk.LEFT, padx=5)
        n_slider = ttk.Scale(control_frame, from_=1, to=200, orient=tk.HORIZONTAL,
                             variable=self.n_rects, command=lambda event: self._update_plot())
        n_slider.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=5)
        self.n_label = ttk.Label(control_frame, text=f"{self.n_rects.get()}", width=4)
        self.n_label.pack(side=tk.LEFT, padx=5)

        # --- リーマン和の種類を選択するラジオボタン ---
        method_frame = ttk.LabelFrame(control_frame, text="リーマン和の種類")
        method_frame.pack(side=tk.LEFT, padx=20)
        ttk.Radiobutton(method_frame, text="左端", variable=self.riemann_method, value="left", command=self._update_plot).pack(side=tk.LEFT)
        ttk.Radiobutton(method_frame, text="中点", variable=self.riemann_method, value="mid", command=self._update_plot).pack(side=tk.LEFT)
        ttk.Radiobutton(method_frame, text="右端", variable=self.riemann_method, value="right", command=self._update_plot).pack(side=tk.LEFT)
        
        # --- 面積表示用のラベル ---
        info_frame = ttk.Frame(main_frame, padding=(0, 10))
        info_frame.pack(fill=tk.X)
        self.riemann_sum_label = ttk.Label(info_frame, text="リーマン和の面積: ", font=("Helvetica", 12))
        self.riemann_sum_label.pack(anchor=tk.W)
        self.exact_integral_label = ttk.Label(info_frame, text=f"正確な定積分の値: {self.exact_integral_val:.6f}", font=("Helvetica", 12))
        self.exact_integral_label.pack(anchor=tk.W)
        self.error_label = ttk.Label(info_frame, text="誤差: ", font=("Helvetica", 12))
        self.error_label.pack(anchor=tk.W)

    def _update_plot(self):
        n = self.n_rects.get()
        self.n_label.config(text=f"{n}") # スライダー横の数値ラベルを更新

        # --- 描画エリアをクリア ---
        self.ax.clear()

        # 1. 関数のグラフを描画
        x_vals = np.linspace(self.a, self.b, 400)
        y_vals = self.func_np(x_vals)
        self.ax.plot(x_vals, y_vals, 'b-', linewidth=2, label=f"$y = {sympy.latex(self.func_sym)}$")
        
        # 積分範囲を薄く塗りつぶし
        self.ax.fill_between(x_vals, y_vals, alpha=0.1, color='blue')

        # 2. 短冊（長方形）を描画
        delta_x = (self.b - self.a) / n
        riemann_sum = 0

        for i in range(n):
            # 短冊のx座標を計算
            x_i_left = self.a + i * delta_x
            x_i_right = x_i_left + delta_x

            # リーマン和の種類に応じて高さを決定
            method = self.riemann_method.get()
            if method == "left":
                sample_x = x_i_left
            elif method == "right":
                sample_x = x_i_right
            else: # "mid"
                sample_x = (x_i_left + x_i_right) / 2
            
            height = self.func_np(sample_x)
            
            # 負の高さを扱えるように調整
            rect_y = min(0, height)
            rect_height = abs(height)

            # 短冊を描画
            rect = Rectangle((x_i_left, rect_y), delta_x, height,
                             edgecolor='black', facecolor='cyan', alpha=0.6)
            self.ax.add_patch(rect)
            
            # 短冊の面積を加算
            riemann_sum += height * delta_x

        # 3. 面積の表示を更新
        error = abs(riemann_sum - self.exact_integral_val)
        self.riemann_sum_label.config(text=f"リーマン和の面積: {riemann_sum:.6f}")
        self.error_label.config(text=f"誤差: {error:.6f}")

        # --- グラフの体裁を整える ---
        self.ax.set_title(f"リーマン和 (n={n}, 方法: {self.riemann_method.get()})")
        self.ax.set_xlabel("x")
        self.ax.set_ylabel("y")
        # 積分範囲の境界線を破線で描画
        self.ax.axvline(x=self.a, color='gray', linestyle='--')
        self.ax.axvline(x=self.b, color='gray', linestyle='--')
        self.ax.grid(True, linestyle=':', alpha=0.6)
        self.ax.legend()
        self.ax.axhline(0, color='black', linewidth=0.5) # x軸

        # --- キャンバスを再描画 ---
        self.canvas.draw()


if __name__ == "__main__":
    app = IntegralVisualizerApp()
    app.mainloop()
