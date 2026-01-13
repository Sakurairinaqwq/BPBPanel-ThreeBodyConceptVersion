/**
 * Red Coast Base - Core Logic (v4.11)
 * * Handles UI interactions, Web Audio API synthesis, Audio Visualization,
 * and translation switching.
 * * Note: Audio features require a user interaction (click) to initialize
 * due to browser autoplay policies.
 */

let currentLang = 'en';

/* --- CLASS: SoundFX ---
   Uses Web Audio API to synthesize UI sounds (beeps, alarms) 
   without needing external assets. Lightweight and fast.
*/
class SoundFX {
    constructor() {
        this.ctx = null;
        this.enabled = false;
    }

    // Initialize AudioContext on first user interaction
    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.enabled = true;
        }
        // Browser might suspend context if created before interaction
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Basic oscillator tone generator
    playTone(freq, type, duration, vol = 0.1) {
        if (!this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type; // 'sine', 'square', 'sawtooth', 'triangle'
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        // Exponential fade out to avoid clicking sounds
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // Preset sounds
    hover() { this.playTone(800, 'sine', 0.05, 0.02); } 
    click() { this.playTone(300, 'square', 0.1, 0.05); } 
    type() { this.playTone(600, 'triangle', 0.03, 0.01); } 
    error() { this.playTone(150, 'sawtooth', 0.3, 0.1); } 
    
    // Siren alarm for Easter Egg
    alarm() {
        if (!this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        // Frequency sweep up and down
        osc.frequency.linearRampToValueAtTime(880, this.ctx.currentTime + 0.5);
        osc.frequency.linearRampToValueAtTime(440, this.ctx.currentTime + 1.0);
        
        gain.gain.value = 0.2;
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 1.0);
    }
}
const sfx = new SoundFX();

/* --- CLASS: AudioDeck ---
   Handles the background music and the canvas visualizer.
   IMPORTANT: Fails on file:// protocol due to CORS. Needs local server.
*/
class AudioDeck {
    constructor() {
        this.audio = new Audio();
        // Point to local file. Ensure this path exists!
        this.audio.src = 'music/main.mp3'; 
        this.audio.loop = true; 
        
        // Audio API nodes
        this.context = null;
        this.analyser = null;
        this.source = null;
        this.isPlaying = false;
        
        // Visualizer Canvas
        this.canvas = document.getElementById('music-visualizer');
        this.canvasCtx = this.canvas ? this.canvas.getContext('2d') : null;
        this.dataArray = null;
        this.animationId = null;
        this.audio.volume = 0.4;
        
        this.audio.addEventListener('ended', () => {
            if(!this.audio.loop) this.stopVisualizer();
        });
    }

    initContext() {
        if (!this.context) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.context = new AudioContext();
            this.analyser = this.context.createAnalyser();
            this.analyser.fftSize = 64; // Low resolution for that retro chunky look
            
            // Wrap in try-catch to handle re-initialization errors
            try {
                this.source = this.context.createMediaElementSource(this.audio);
                this.source.connect(this.analyser);
                this.analyser.connect(this.context.destination);
            } catch (e) {
                console.log("Audio source already connected, ignoring.");
            }
            
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        }
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
    }

    toggle() {
        sfx.click(); 
        const btn = document.getElementById('music-toggle');
        const trackName = document.getElementById('track-name');
        
        if (this.isPlaying) {
            // Pause
            this.audio.pause();
            this.isPlaying = false;
            btn.innerHTML = '<i class="fas fa-play"></i>';
            btn.classList.remove('playing');
            trackName.innerText = "SIGNAL PAUSED";
            trackName.style.color = "var(--text-dim)";
            
            // Stop loop and clear canvas
            cancelAnimationFrame(this.animationId);
            if(this.canvasCtx) {
                this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.canvasCtx.fillStyle = '#000';
                this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
        } else {
            // Play
            this.initContext();
            this.audio.play().then(() => {
                this.isPlaying = true;
                btn.innerHTML = '<i class="fas fa-stop"></i>';
                btn.classList.add('playing');
                trackName.innerText = "RECEIVING: MAIN_SEQUENCE";
                trackName.style.color = "var(--primary)";
                this.draw(); 
            }).catch(e => {
                console.error("Signal lost:", e);
                // Usually happens if file is missing or CORS blocks it
                trackName.innerText = "ERR: CHECK CONSOLE / CORS";
                trackName.style.color = "var(--warning)";
                sfx.error();
            });
        }
    }

    setVolume(val) {
        this.audio.volume = val;
    }

    // Render loop for the visualizer
    draw() {
        if (!this.isPlaying) return;
        this.animationId = requestAnimationFrame(() => this.draw());
        this.analyser.getByteFrequencyData(this.dataArray);
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        const barWidth = (width / this.dataArray.length) * 2.5;
        let barHeight;
        let x = 0;

        // Clear previous frame
        this.canvasCtx.fillStyle = '#000';
        this.canvasCtx.fillRect(0, 0, width, height);

        // Draw bars
        for(let i = 0; i < this.dataArray.length; i++) {
            barHeight = this.dataArray[i] / 2; 
            // Color gradient logic: Red -> slightly lighter Red
            const r = 239; 
            const g = 68 + (i * 5); 
            const b = 68;
            this.canvasCtx.fillStyle = `rgb(${r},${g},${b})`;
            this.canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);
            x += barWidth + 1; 
        }
    }
}
const audioDeck = new AudioDeck();

/* --- Localization Data --- */
const translations = {
    en: {
        app_title: "RED COAST",
        login_subtitle: "ETO NODE MANAGEMENT SYSTEM v4.11",
        login_btn: "INITIALIZE",
        login_hint: "WARNING: UNAUTHORIZED ACCESS WILL BE BROADCASTED.",
        menu_dashboard: "Command Center",
        menu_protocols: "Vectors & Ports",
        menu_general: "Base Settings",
        menu_fragment: "Fragment (Sophon)",
        menu_warp: "Curvature Drive",
        menu_routing: "Wallfacer Logic",
        menu_chain: "Relay Chain",
        menu_scanner: "Forest Scan",
        menu_kv: "Memory Core",
        music_title: "BG SIGNAL",
        user_admin: "Commander",
        user_online: "Status: Monitoring",
        dashboard_desc: "MONITORING DARK FOREST STATUS.",
        btn_refresh_ip: "PING COORDS",
        card_ai_title: "SOPHON BLIND ZONE",
        card_ai_desc: "Create random noise to confuse Sophon surveillance.",
        btn_run_obfuscate: "DEPLOY SHIELD",
        card_ip_title: "CURRENT COORDS",
        status_checking: "CALCULATING...",
        card_status_title: "NODE INTEGRITY",
        label_cpu: "CPU LOAD",
        label_requests: "INCOMING",
        card_actions_title: "QUICK DEPLOY",
        btn_copy_sub: "COPY ACCESS KEY",
        btn_export_clash: "EXPORT CONFIG",
        btn_save: "COMMIT CHANGES",
        card_enabled_protocols: "ACTIVE VECTORS",
        toggle_vless: "VLESS VECTOR",
        toggle_trojan: "TROJAN HORSE",
        desc_tls_ports: "SECURE PORTS (TLS)",
        desc_http_ports: "OPEN PORTS (HTTP)",
        card_dns: "DNS RESOLUTION",
        label_remote_dns: "REMOTE DNS",
        label_local_dns: "LOCAL DNS",
        toggle_fakedns: "FAKE DNS MASK",
        card_network: "NETWORK TOPOLOGY",
        label_proxy_ip: "CLEAN IP (JUMP POINT)",
        desc_proxy_ip: "Safe jump point.",
        toggle_ipv6: "IPv6 SUPPORT",
        toggle_ech: "ECH (ENCRYPTED HELLO)",
        label_length: "LENGTH (MIN-MAX)",
        label_interval: "INTERVAL (MS)",
        label_packets: "PACKET TYPE",
        card_warp_account: "DRIVE ACCOUNT",
        label_warp_key: "LICENSE KEY",
        label_warp_endpoint: "ENDPOINT",
        card_warp_pro: "NOISE INJECTION",
        label_noise_mode: "UDP NOISE",
        label_noise_apply: "APPLY TO",
        card_predefined_rules: "PRESET RULES",
        toggle_ads: "BLOCK ADS",
        toggle_quic: "BLOCK QUIC",
        toggle_cn: "BYPASS CN",
        toggle_google_ai: "BYPASS GOOGLE AI",
        card_custom_rules: "CUSTOM VECTORS",
        label_custom_bypass: "BYPASS LIST",
        label_custom_block: "BLOCK LIST",
        toggle_enable_chain: "ENABLE CHAIN PROXY",
        label_protocol: "PROTOCOL",
        label_server: "SERVER",
        label_port: "PORT",
        label_username: "USER / UUID",
        label_password: "PASSWORD",
        label_max_latency: "MAX LATENCY",
        label_scan_threads: "THREADS",
        toggle_auto_apply: "AUTO-LOCK BEST",
        btn_start_scan: "INITIATE SCAN",
        card_scan_log: "SCAN LOGS",
        btn_force_write: "FORCE WRITE",
        overlay_sophon: "SOPHON INTERFERENCE",
        msg_login_success: "ACCESS GRANTED.",
        msg_obfuscated: "BLIND ZONE ESTABLISHED.",
        msg_ip_applied: "COORDS LOCKED: ",
        msg_copy: "KEY COPIED.",
        msg_download: "CONFIG EXPORTED.",
        msg_kv_warn: "WARNING: CORE INTEGRITY RISK.",
        msg_save: "CHANGES COMMITTED.",
        msg_reboot: "RECONFIGURING NEURAL LINK..."
    },
    zh: {
        app_title: "红岸基地",
        login_subtitle: "ETO 节点管理系统 v4.11",
        login_btn: "接入系统",
        login_hint: "警告：非法入侵将被广播坐标。",
        menu_dashboard: "作战中心",
        menu_protocols: "通讯矢量",
        menu_general: "基础参数",
        menu_fragment: "智子碎片",
        menu_warp: "曲率驱动",
        menu_routing: "面壁计划",
        menu_chain: "中继链路",
        menu_scanner: "黑暗森林探测",
        menu_kv: "记忆核心",
        music_title: "监听信号 (BGM)",
        user_admin: "指挥官",
        user_online: "状态：监控中",
        dashboard_desc: "当前黑暗森林威慑度监测。",
        btn_refresh_ip: "刷新坐标",
        card_ai_title: "智子盲区构建",
        card_ai_desc: "生成随机噪音以干扰智子全天候监控。",
        btn_run_obfuscate: "展开盲区",
        card_ip_title: "当前坐标",
        status_checking: "计算中...",
        card_status_title: "节点完整性",
        label_cpu: "算力负载",
        label_requests: "接收信号",
        card_actions_title: "快速部署",
        btn_copy_sub: "复制密钥",
        btn_export_clash: "导出配置",
        btn_save: "提交更改",
        card_enabled_protocols: "激活协议",
        toggle_vless: "VLESS 矢量",
        toggle_trojan: "特洛伊木马",
        desc_tls_ports: "加密信道 (TLS)",
        desc_http_ports: "开放信道 (HTTP)",
        card_dns: "DNS 解析",
        label_remote_dns: "远程 DNS",
        label_local_dns: "本地 DNS",
        toggle_fakedns: "虚假 DNS 掩码",
        card_network: "网络拓扑",
        label_proxy_ip: "安全跳板 (IP)",
        desc_proxy_ip: "使用纯净 IP 进行流量规避。",
        toggle_ipv6: "IPv6 协议",
        toggle_ech: "ECH (加密问候)",
        label_length: "切片长度",
        label_interval: "发射间隔",
        label_packets: "数据包类型",
        card_warp_account: "驱动账号",
        label_warp_key: "许可密钥",
        label_warp_endpoint: "端点坐标",
        card_warp_pro: "噪音注入",
        label_noise_mode: "UDP 噪音",
        label_noise_apply: "应用范围",
        card_predefined_rules: "预设法则",
        toggle_ads: "拦截商业洗脑",
        toggle_quic: "拦截 QUIC",
        toggle_cn: "绕过中国 (CN)",
        toggle_google_ai: "屏蔽谷歌 AI",
        card_custom_rules: "自定义法则",
        label_custom_bypass: "白名单 (生存)",
        label_custom_block: "黑名单 (清理)",
        toggle_enable_chain: "启用链路中继",
        label_protocol: "协议",
        label_server: "服务器坐标",
        label_port: "端口",
        label_username: "身份 ID",
        label_password: "口令",
        label_max_latency: "最大延迟",
        label_scan_threads: "探测线程",
        toggle_auto_apply: "自动锁定最佳坐标",
        btn_start_scan: "启动探测",
        card_scan_log: "探测日志",
        btn_force_write: "强制重写",
        overlay_sophon: "智子干扰",
        msg_login_success: "身份验证通过。",
        msg_obfuscated: "智子盲区已建立。",
        msg_ip_applied: "坐标已锁定: ",
        msg_copy: "密钥已复制。",
        msg_download: "配置已导出。",
        msg_kv_warn: "警告：底层数据修改有风险。",
        msg_save: "更改已提交。",
        msg_reboot: "神经连接重组中..."
    },
    ru: {
        app_title: "КРАСНЫЙ БЕРЕГ",
        login_subtitle: "СИСТЕМА ETO v4.11",
        login_btn: "ЗАПУСК",
        login_hint: "ВНИМАНИЕ: НЕСАНКЦИОНИРОВАННЫЙ ДОСТУП.",
        menu_dashboard: "Командный центр",
        menu_protocols: "Векторы",
        menu_general: "Базовые",
        menu_fragment: "Софон",
        menu_warp: "Искривление",
        menu_routing: "Логика",
        menu_chain: "Ретранслятор",
        menu_scanner: "Сканер леса",
        menu_kv: "Ядро памяти",
        music_title: "СИГНАЛ (BGM)",
        user_admin: "Командир",
        user_online: "Мониторинг",
        dashboard_desc: "СТАТУС ТЕМНОГО ЛЕСА.",
        btn_refresh_ip: "ПИНГ",
        card_ai_title: "СЛЕПАЯ ЗОНА",
        card_ai_desc: "Создать шум для софонов.",
        btn_run_obfuscate: "РАЗВЕРНУТЬ ЩИТ",
        card_ip_title: "КООРДИНАТЫ",
        status_checking: "РАСЧЕТ...",
        card_status_title: "ЦЕЛОСТНОСТЬ",
        label_cpu: "ЗАГРУЗКА CPU",
        label_requests: "СИГНАЛЫ",
        card_actions_title: "БЫСТРЫЙ ЗАПУСК",
        btn_copy_sub: "КОПИРОВАТЬ",
        btn_export_clash: "ЭКСПОРТ",
        btn_save: "СОХРАНИТЬ",
        card_enabled_protocols: "АКТИВНЫЕ ВЕКТОРЫ",
        toggle_vless: "ВЕКТОР VLESS",
        toggle_trojan: "ТРОЯНСКИЙ КОНЬ",
        desc_tls_ports: "Защищенные порты",
        desc_http_ports: "Открытые порты",
        card_dns: "DNS",
        label_remote_dns: "УДАЛЕННЫЙ DNS",
        label_local_dns: "ЛОКАЛЬНЫЙ DNS",
        toggle_fakedns: "Маска DNS",
        card_network: "ТОПОЛОГИЯ",
        label_proxy_ip: "ЧИСТЫЙ IP",
        desc_proxy_ip: "Безопасный прыжок.",
        toggle_ipv6: "IPv6",
        toggle_ech: "ECH (ШИФР)",
        label_length: "ДЛИНА",
        label_interval: "ИНТЕРВАЛ",
        label_packets: "ПАКЕТЫ",
        card_warp_account: "АККАУНТ",
        label_warp_key: "КЛЮЧ",
        label_warp_endpoint: "ТОЧКА ВХОДА",
        card_warp_pro: "ШУМ",
        label_noise_mode: "РЕЖИМ ШУМА",
        label_noise_apply: "ПРИМЕНИТЬ К",
        card_predefined_rules: "ПРАВИЛА",
        toggle_ads: "БЛОК РЕКЛАМЫ",
        toggle_quic: "БЛОК QUIC",
        toggle_cn: "ОБХОД CN",
        toggle_google_ai: "ОБХОД AI",
        card_custom_rules: "СВОИ ВЕКТОРЫ",
        label_custom_bypass: "БЕЛЫЙ СПИСОК",
        label_custom_block: "ЧЕРНЫЙ СПИСОК",
        toggle_enable_chain: "ЦЕПОЧКА",
        label_protocol: "ПРОТОКОЛ",
        label_server: "СЕРВЕР",
        label_port: "ПОРТ",
        label_username: "ID",
        label_password: "ПАРОЛЬ",
        label_max_latency: "МАКС. ЗАДЕРЖКА",
        label_scan_threads: "ПОТОКИ",
        toggle_auto_apply: "АВТО-ЗАХВАТ",
        btn_start_scan: "НАЧАТЬ СКАН",
        card_scan_log: "ЛОГ",
        btn_force_write: "ЗАПИСАТЬ",
        overlay_sophon: "ВМЕШАТЕЛЬСТВО",
        msg_login_success: "ДОСТУП РАЗРЕШЕН.",
        msg_obfuscated: "ЗОНА СОЗДАНА.",
        msg_ip_applied: "КООРДИНАТЫ: ",
        msg_copy: "СКОПИРОВАНО.",
        msg_download: "ЭКСПОРТИРОВАНО.",
        msg_kv_warn: "РИСК ЦЕЛОСТНОСТИ.",
        msg_save: "СОХРАНЕНО.",
        msg_reboot: "ПЕРЕЗАГРУЗКА..."
    },
    fa: {
        app_title: "ساحل قرمز",
        login_subtitle: "سیستم مدیریت ETO v4.11",
        login_btn: "شروع سیستم",
        login_hint: "هشدار: دسترسی غیرمجاز ردیابی می‌شود.",
        menu_dashboard: "مرکز فرماندهی",
        menu_protocols: "بردارها",
        menu_general: "تنظیمات پایه",
        menu_fragment: "سوفون",
        menu_warp: "درایو انحنا",
        menu_routing: "منطق دیوارگزین",
        menu_chain: "زنجیره رله",
        menu_scanner: "اسکن جنگل تاریک",
        menu_kv: "هسته حافظه",
        music_title: "سیگنال پس‌زمینه",
        user_admin: "فرمانده",
        user_online: "وضعیت: نظارت",
        dashboard_desc: "نظارت بر وضعیت جنگل تاریک.",
        btn_refresh_ip: "بروزرسانی مختصات",
        card_ai_title: "منطقه کور سوفون",
        card_ai_desc: "ایجاد نویز برای گیج کردن سوفون.",
        btn_run_obfuscate: "استقرار سپر",
        card_ip_title: "مختصات فعلی",
        status_checking: "محاسبه...",
        card_status_title: "یکپارچگی گره",
        label_cpu: "بار پردازشی",
        label_requests: "سیگنال ورودی",
        card_actions_title: "استقرار سریع",
        btn_copy_sub: "کپی کلید",
        btn_export_clash: "خروجی پیکربندی",
        btn_save: "ثبت تغییرات",
        card_enabled_protocols: "بردارهای فعال",
        toggle_vless: "بردار VLESS",
        toggle_trojan: "اسب تروجان",
        desc_tls_ports: "کانال‌های امن (TLS)",
        desc_http_ports: "کانال‌های باز (HTTP)",
        card_dns: "تحلیل DNS",
        label_remote_dns: "DNS راه دور",
        label_local_dns: "DNS محلی",
        toggle_fakedns: "ماسک DNS جعلی",
        card_network: "توپولوژی شبکه",
        label_proxy_ip: "IP تمیز",
        desc_proxy_ip: "نقطه پرش امن.",
        toggle_ipv6: "پشتیبانی IPv6",
        toggle_ech: "ECH (رمزنگاری)",
        label_length: "طول",
        label_interval: "فاصله",
        label_packets: "نوع بسته",
        card_warp_account: "حساب درایو",
        label_warp_key: "کلید مجوز",
        label_warp_endpoint: "نقطه پایان",
        card_warp_pro: "تزریق نویز",
        label_noise_mode: "نویز UDP",
        label_noise_apply: "اعمال روی",
        card_predefined_rules: "قوانین پیش‌فرض",
        toggle_ads: "مسدودسازی تبلیغات",
        toggle_quic: "مسدودسازی QUIC",
        toggle_cn: "دور زدن چین",
        toggle_google_ai: "دور زدن هوش مصنوعی",
        card_custom_rules: "بردارهای شخصی",
        label_custom_bypass: "لیست سفید",
        label_custom_block: "لیست سیاه",
        toggle_enable_chain: "فعالسازی زنجیره",
        label_protocol: "پروتکل",
        label_server: "سرور",
        label_port: "پورت",
        label_username: "شناسه",
        label_password: "رمز",
        label_max_latency: "حداکثر تاخیر",
        label_scan_threads: "رشته‌ها",
        toggle_auto_apply: "قفل خودکار بهترین",
        btn_start_scan: "شروع اسکن",
        card_scan_log: "لاگ اسکن",
        btn_force_write: "بازنویسی اجباری",
        overlay_sophon: "تداخل سوفون",
        msg_login_success: "دسترسی تایید شد.",
        msg_obfuscated: "منطقه کور ایجاد شد.",
        msg_ip_applied: "مختصات قفل شد: ",
        msg_copy: "کلید کپی شد.",
        msg_download: "پیکربندی صادر شد.",
        msg_kv_warn: "هشدار: خطر یکپارچگی هسته.",
        msg_save: "تغییرات ثبت شد.",
        msg_reboot: "پیکربندی مجدد..."
    }
};

const tlsPorts = [443, 8443, 2053, 2083, 2087, 2096];
const httpPorts = [80, 8080, 2052, 2082, 2086, 2095];

/* --- Initialization --- */
document.addEventListener('DOMContentLoaded', () => {
    renderPorts();
    initLanguage();
    
    // Global Event Listener for SoundFX
    // Attach click sound to interactive elements
    document.body.addEventListener('click', (e) => {
        if (e.target.closest('.btn') || e.target.closest('.nav-item') || e.target.closest('.port-tag') || e.target.closest('.switch')) {
            sfx.click();
        }
    });

    // Debounced Hover Sound
    let hoverTimeout;
    document.body.addEventListener('mouseover', (e) => {
        if (e.target.closest('.btn') || e.target.closest('.nav-item')) {
            if(!hoverTimeout) {
                sfx.hover();
                hoverTimeout = setTimeout(() => hoverTimeout = null, 100);
            }
        }
    });
});

/* --- Navigation & UI Logic --- */

function nav(pageId, el) {
    sfx.click();
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
    document.getElementById(pageId).classList.add('active');
    // Auto-close sidebar on mobile
    if(window.innerWidth < 768) document.getElementById('sidebar').classList.remove('open');
}

function toggleMenu() {
    sfx.click();
    document.getElementById('sidebar').classList.toggle('open');
}

/* --- Language Switching Logic --- */

function initLanguage() {
    let storedLang = localStorage.getItem('bpb_lang');
    if (!storedLang) storedLang = 'en';
    currentLang = storedLang;
    const selector = document.getElementById('lang-selector');
    if(selector) selector.value = storedLang;
    applyLanguage(storedLang);
}

// Handles the transition animation + direction swap
function changeLanguage(lang) {
    sfx.click();
    sfx.playTone(100, 'sawtooth', 0.5); 

    const mask = document.getElementById('reboot-mask');
    const msg = document.getElementById('reboot-msg');
    const texts = translations[lang] || translations['en'];
    
    msg.innerText = texts.msg_reboot || "RECONFIGURING...";
    mask.classList.add('active');

    // Delay swap to hide ugly DOM changes behind mask
    setTimeout(() => {
        localStorage.setItem('bpb_lang', lang);
        currentLang = lang;
        applyLanguage(lang);
        
        // Unmask
        setTimeout(() => {
            mask.classList.remove('active');
            sfx.playTone(600, 'sine', 0.2); 
        }, 600);
    }, 400);
}

// Swaps text content and sets RTL class
function applyLanguage(lang) {
    if (lang === 'fa') document.body.classList.add('rtl');
    else document.body.classList.remove('rtl');

    const texts = translations[lang] || translations['en'];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (texts[key]) {
            if(el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
                el.placeholder = texts[key];
            } else {
                el.innerText = texts[key];
            }
        }
    });
}

/* --- Simulation Logic --- */

function login() {
    // Initialize AudioContext on first major user interaction
    sfx.init();
    sfx.click();
    
    // Prepare the music visualizer context
    audioDeck.initContext();

    const overlay = document.getElementById('login-page');
    const btn = overlay.querySelector('button');
    const texts = translations[currentLang];
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    // Fake "Handshake" sounds
    sfx.playTone(200, 'square', 0.1);
    setTimeout(() => sfx.playTone(400, 'square', 0.1), 100);
    setTimeout(() => sfx.playTone(800, 'square', 0.1), 200);

    setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
            document.getElementById('app-container').style.opacity = '1';
            refreshStatus();
            toast(texts.msg_login_success, 'success');
        }, 500);
    }, 800);
}

function renderPorts() {
    const tls = document.getElementById('tls-ports');
    const http = document.getElementById('http-ports');
    if (!tls || !http) return; 

    tls.innerHTML = ''; http.innerHTML = '';

    // Generate clickable port tags
    tlsPorts.forEach(p => {
        let div = document.createElement('div');
        div.className = "port-tag active";
        div.innerText = p;
        div.onclick = function() { 
            sfx.click();
            this.classList.toggle('active'); 
        };
        tls.appendChild(div);
    });
    httpPorts.forEach(p => {
        let div = document.createElement('div');
        div.className = "port-tag";
        div.innerText = p;
        div.onclick = function() { 
            sfx.click();
            this.classList.toggle('active'); 
        };
        http.appendChild(div);
    });
}

function refreshStatus() {
    sfx.click();
    const ip = document.getElementById('dash-ip');
    const loc = document.getElementById('dash-loc');
    ip.innerText = "...";
    setTimeout(() => {
        sfx.playTone(800, 'sine', 0.1);
        ip.innerText = "104.28.11.1";
        loc.innerText = "CLOUDFLARE SECURE NET";
    }, 800);
}

function deploySophonShield() {
    sfx.click();
    const overlay = document.getElementById('countdown-overlay');
    const timer = document.getElementById('countdown-timer');
    const texts = translations[currentLang];
    overlay.style.display = 'flex';
    
    let ms = 3000;
    const int = setInterval(() => {
        ms -= 37;
        let date = new Date(ms);
        timer.innerText = date.toISOString().substr(14, 9);
        if (ms % 100 < 40) sfx.playTone(200, 'square', 0.05);

        if(ms <= 0) {
            clearInterval(int);
            overlay.style.display = 'none';
            toast(texts.msg_obfuscated, "success");
            sfx.playTone(1200, 'sine', 0.5); 
        }
    }, 37);
}

// Simulates old terminal typing
function typeWriterLog(text, element, color) {
    const line = document.createElement('div');
    if (color) line.style.color = color;
    line.classList.add('cursor-blink'); 
    element.appendChild(line);
    
    let i = 0;
    const interval = setInterval(() => {
        line.textContent += text.charAt(i);
        i++;
        sfx.type(); 
        element.scrollTop = element.scrollHeight; 
        if (i >= text.length) {
            clearInterval(interval);
            line.classList.remove('cursor-blink'); 
        }
    }, 30); 
}

function startScan(btn) {
    sfx.click();
    const log = document.getElementById('scan-log');
    const autoApply = document.getElementById('auto-apply-scan').checked;
    const texts = translations[currentLang];

    // Handle Abort
    if (btn.innerText.includes("STOP") || btn.innerText.includes("ABORT")) {
        clearInterval(window.scanInt);
        btn.innerHTML = `<i class="fas fa-crosshairs"></i> <span data-i18n="btn_start_scan">${texts.btn_start_scan}</span>`;
        btn.className = "btn btn-primary";
        typeWriterLog("> ABORTED.", log, 'var(--warning)');
        return;
    }

    // Start Scan
    btn.innerHTML = '<i class="fas fa-stop"></i> STOP';
    btn.className = "btn btn-danger"; 
    log.innerHTML = ''; 
    typeWriterLog("> INITIALIZING DARK FOREST SCAN...", log);

    let count = 0;
    let bestIp = '';
    let bestLat = 999;

    // Fake delay then loop
    setTimeout(() => {
        window.scanInt = setInterval(() => {
            count++;
            const ip = `104.${16 + Math.floor(Math.random()*10)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
            const lat = Math.floor(Math.random()*400);
            const color = lat < 150 ? 'var(--success)' : 'var(--text-dim)';
            
            typeWriterLog(`> ${ip} [${lat}ms]`, log, color);

            if (lat < bestLat) { bestLat = lat; bestIp = ip; }

            // Finish after 8 tries
            if (count >= 8) {
                clearInterval(window.scanInt);
                btn.innerHTML = `<i class="fas fa-crosshairs"></i> <span data-i18n="btn_start_scan">${texts.btn_start_scan}</span>`;
                btn.className = "btn btn-primary";
                setTimeout(() => {
                     typeWriterLog(`> TARGET LOCKED: ${bestIp}`, log, 'var(--primary)');
                     sfx.playTone(1000, 'sine', 0.5);
                     if (autoApply) {
                        document.getElementById('general-proxy-ip').value = bestIp;
                        toast(texts.msg_ip_applied + bestIp, 'success');
                    }
                }, 500);
            }
        }, 400); 
    }, 1000);
}

/* --- Helper Actions --- */

function save() {
    sfx.click();
    const texts = translations[currentLang];
    toast(texts.msg_save);
}
function copyKey() {
    sfx.click();
    const texts = translations[currentLang];
    toast(texts.msg_copy, 'success');
}
function exportConfig() {
    sfx.click();
    const texts = translations[currentLang];
    toast(texts.msg_download, 'success');
}
function toggleChain() {
    sfx.click();
    const div = document.getElementById('chain-options');
    div.style.display = document.getElementById('chain-toggle').checked ? 'block' : 'none';
}

function toast(msg, type='info') {
    sfx.playTone(600, 'sine', 0.1); 
    const box = document.getElementById('toast-box');
    const t = document.createElement('div');
    t.className = 'toast';
    if (type === 'success') t.style.borderColor = 'var(--success)';
    if (type === 'warning') t.style.borderColor = 'var(--warning)';
    
    t.innerHTML = `<i class="fas fa-terminal"></i> ${msg}`;
    box.appendChild(t);
    
    // CSS Transition Hack
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => {
        t.classList.remove('show');
        setTimeout(() => t.remove(), 300);
    }, 3000);
}

/* --- Easter Egg: Do Not Answer --- */
let eggCounter = 0;
function triggerEasterEgg() {
    sfx.click();
    eggCounter++;
    
    if (eggCounter < 5) {
        sfx.error();
        toast(`AUTH LEVEL 4 REQUIRED. (${eggCounter}/5)`, 'warning');
    } else {
        // Trigger Event
        const modal = document.getElementById('dna-modal');
        modal.style.display = 'flex';
        
        let alarmInterval = setInterval(() => {
            sfx.alarm();
        }, 1000);

        // Crash Sim
        setTimeout(() => {
            clearInterval(alarmInterval);
            document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#000;color:red;font-family:monospace;">SYSTEM FAILURE: SIGNAL BROADCASTED.</div>';
            sfx.playTone(50, 'sawtooth', 2.0); 
        }, 5000);
    }
}