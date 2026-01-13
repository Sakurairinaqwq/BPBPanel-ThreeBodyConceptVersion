# 📡 RED COAST BASE PANEL (BPB-Worker-Panel Concept)

> **"不要回答！不要回答！不要回答！"**
>
> ...除非你是系统管理员。

![Version](https://img.shields.io/badge/Version-4.11-red) ![Status](https://img.shields.io/badge/Status-Monitoring-success) ![Clearance](https://img.shields.io/badge/Clearance-Commander-critical)

## 🌌 项目简介 | Transmission

**Red Coast Base Panel** 是一个为 BPB-Worker-Panel 设计的概念前端界面。它抛弃了现代 Web 开发中那些臃肿的框架（因为它们太容易被智子锁死），回归纯粹的 **HTML5 + CSS3 + Vanilla JS**。

本项目的核心设计理念是 **“危机感”**。每一个像素都散发着对三体文明即将到来的焦虑，以及红岸基地在寒风中矗立的冷峻美学。

### 核心特性 | Capabilities

* **🖥️ 沉浸式 CRT 视觉体验**：自带复古扫描线与屏幕微光，仿佛置身于80年代的大兴安岭雷达峰。
* **🌍 多语言支持 (i18n)**：
    * 🇬🇧 English (UN Standard)
    * 🇨🇳 中文 (红岸基地内部通迅)
    * 🇷🇺 Русский (苏维埃特供)
    * 🇮🇷 فارسی (波斯语 RTL 布局支持)
* **👁️ 智子盲区构建**：包含一个倒计时遮罩动画，用于模拟“建立智子盲区”的过程（其实只是个 CSS 动画，别当真）。
* **🛡️ 响应式布局**：无论是基地的主控大屏，还是通过手机秘密访问，界面都能完美适配。
* **⚡ 极简代码**：无 `npm install`，无 `webpack`，无依赖地狱。只有纯粹的代码。

## 📂 文件结构 | File System

```text
/RED-COAST-BASE
│
├── index.html      # 系统的躯壳 (Structure)
├── style.css       # 系统的灵魂 (Aesthetics & CRT Effects)
├── script.js       # 系统的神经 (Logic & Translations)
└── README.md       # 你现在正在看的这份绝密文档

```

## 🚀 快速启动 | Ignition

由于本项目未使用任何构建工具（为了防止智子通过量子纠缠干扰编译过程），部署极其简单：

1. **下载代码**：克隆本仓库或下载压缩包。
2. **本地运行**：直接双击 `index.html` 在浏览器中打开。
3. **部署**：将其上传到任何支持静态页面的服务器（Nginx, GitHub Pages, Cloudflare Pages... 或你藏在山洞里的私有服务器）。

## ⚙️ 配置说明 | Calibration

虽然这只是一个 UI 概念演示，但你可以通过修改代码自定义一些参数：

* **修改默认语言**：
在 `script.js` 的 `initLanguage()` 函数中，将 default 改为你喜欢的语言代码。
* **调整 CRT 强度**：
在 `style.css` 中找到 `body::after`，调整 `background` 的透明度，可以减轻或增强扫描线效果（为了保护指挥官的视力，建议适度）。
* **端口映射**：
在 `script.js` 顶部的 `tlsPorts` 和 `httpPorts` 数组中修改显示的端口列表。

## ⚠️ 警告 | Warning

* **仅供娱乐**：本面板目前仅为**前端概念演示**（Mockup）。所有的“Ping”、“扫描”、“连接”都是虚假的动画效果。请勿将其误认为真实的黑客工具或科学边界的通讯设备。
* **光敏癫痫警告**：界面包含闪烁效果和高对比度色彩。

## 🤝 贡献 | Join ETO

如果你想改进这个界面：

1. Fork 本项目。
2. 提交你的代码（Commit）。
3. 发起 Pull Request（请附带你的物理学信仰声明）。

---

<div align="center">
<p><i>消灭人类暴政，世界属于三体。</i></p>
<p>Made with 🩸 and 💻 by the Engineering Dept. of Red Coast Base.</p>
</div>

```
