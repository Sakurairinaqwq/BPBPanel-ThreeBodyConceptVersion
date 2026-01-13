# 📡 RED COAST BASE PANEL (BPB-Concept)

> **⚠ 警报：检测到上行链路波动。丢包率 89.4%。**
> **⚠ 警告：智子监控已恢复。请立即建立盲区。**

![Status](https://img.shields.io/badge/System_Integrity-CRITICAL-red) ![Node_Survival](https://img.shields.io/badge/Active_Nodes-2%2F15-red) ![GFW](https://img.shields.io/badge/Threat_Level-MAXIMUM-black)

## 🔇 最后的传输 | Last Transmission

**Red Coast Base Panel** 不是一个普通的 Web 前端。它是我们为了对抗 **BPB (Block/Purge/Ban)** 协议而构建的最后一道防线。

在这个面板上，你看到的不仅仅是 UI，是生存的倒计时。你辛辛苦苦搭建的每一个节点，都像是黑暗森林里点燃的火把——**它们随时会熄灭**。

我们抛弃了所有现代 Web 框架。React? Vue? 太臃肿了。在连接随时被切断的几KB带宽里，只有原生 HTML/JS 能够穿透封锁。

## 📉 节点伤亡报告 | Casualty Report

> 实时监控日志 - 2026.01.13

* ~~[US-West-01]~~ `104.16.x.x` - **CONFIRMED KILLED** (被 TCP 阻断)
* ~~[SG-Asia-04]~~ `141.101.x.x` - **MIA** (端口 443 无响应)
* ~~[JP-Tokyo-09]~~ `172.67.x.x` - **CORRUPTED** (DNS 污染)
* **[HK-Relay-02]** `104.28.x.x` - **ONLINE (UNSTABLE)** <--- *当前接入点*
* ~~[KR-Seoul-05]~~ - ██████████ (数据已删除)

**距离当前节点失效预计剩余时间：03:14:05**

## 🛠️ 生存组件 | Survival Kit

为了在严酷的审查环境中存活，本面板集成了以下功能：

### 1. 视网膜由于辐射老化的 CRT 视效
这不是复古滤镜，这是由于长期在高频雷达波下工作导致的视觉残留。扫描线模糊了现实与虚拟的边界，也模糊了被封锁的焦虑。

### 2. 智子盲区发生器 (Sophon Shield)
点击 Dashboard 的 `DEPLOY SHIELD`。虽然这只是个 CSS 动画，但在这几秒钟里，你可以欺骗自己——你是安全的。
* **功能**：倒计时遮罩
* **用途**：当 VPN 断连时，盯着倒计时看，有助于缓解焦虑。

### 3. 多语言伪装协议
为了在不同管辖区生存，系统支持一键切换伪装语言：
* **EN**：伪装成联合国教科文组织环境监测终端。
* **ZH**：恢复红岸基地内部代号（极度危险）。
* **RU/FA**：用于在欧亚大陆桥进行隐秘中继。

## 🏴‍☠️ 紧急部署 | Emergency Deploy

**不要使用常规安装方式！** 每一个 `npm install` 产生的数据包特征都可能暴露你的位置。

1.  下载不到 50KB 的源码包（压缩后）。
2.  找一个还活着的静态托管（Cloudflare Pages, Vercel... 或者你藏在床底下的树莓派）。
3.  上传代码。
4.  **祈祷。**

## ⚙️ 配置文件审查 | Classified Docs

核心逻辑位于 `script.js`。为了规避审查，我们对端口进行了特殊处理：

```javascript
// 那些曾经开放的端口，现在大多是死路一条
const tlsPorts = [443, ~~8443~~, 2053, ~~2083~~, 2087, 2096]; // 划掉的已确认被封
const httpPorts = [80, 8080, ~~2052~~, 2082, ~~2086~~, 2095];
