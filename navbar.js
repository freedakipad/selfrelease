/**
 * 统一的导航栏组件
 * 自动识别当前页面并高亮对应链接
 */

(function() {
    'use strict';

    // 页面映射配置
    const pageMap = {
        'index.html': '释放',
        'journal.html': '日记',
        'wisdom.html': '智慧',
        'chat.html': '对话',
        'settings.html': '设置'
    };

    // 获取当前页面名称
    function getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        return filename;
    }

    // 生成导航栏 HTML
    function generateNavbar() {
        const currentPage = getCurrentPage();
        
        // 生成导航链接
        const navLinks = Object.entries(pageMap).map(([file, name]) => {
            const isActive = file === currentPage;
            const activeClass = isActive 
                ? 'text-gray-800 font-semibold text-base' 
                : 'text-gray-600 hover:text-orange-500 transition-colors text-base';
            
            return `<a href="${file}" class="${activeClass}">${name}</a>`;
        }).join('\n                    ');

        return `
    <!-- 导航栏 -->
    <nav id="topNav" class="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/20">
        <div class="max-w-6xl mx-auto px-6 py-3">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-orange-200 to-pink-200 flex items-center justify-center">
                        <span class="text-2xl">🕊️</span>
                    </div>
                    <h1 class="serif-font text-2xl font-bold text-gray-700">自在释放</h1>
                </div>
                <div class="hidden md:flex items-center space-x-8">
                    ${navLinks}
                </div>
                <div class="flex items-center space-x-3">
                    <!-- 帮助按钮 -->
                    <button id="helpBtn" title="使用帮助" aria-label="查看使用帮助" class="w-11 h-11 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-all shadow-md border border-orange-200">
                        <span class="text-xl">❓</span>
                    </button>
                    <!-- 音乐控制按钮 -->
                    <button id="musicControlBtn" title="背景音乐" aria-label="播放/暂停背景音乐">
                        <span id="musicIcon" class="text-gray-700">
                            <!-- 播放图标 -->
                            <svg id="playIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
                            </svg>
                            <!-- 暂停图标 -->
                            <svg id="pauseIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: none;">
                                <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
                                <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
                            </svg>
                        </span>
                    </button>
                </div>
            </div>
        </div>
    </nav>`;
    }

    // 添加导航栏样式
    function addNavbarStyles() {
        const styleId = 'navbar-styles';
        if (document.getElementById(styleId)) {
            return; // 样式已存在
        }

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
        /* 导航栏样式 - 统一组件样式，优先级最高 */
        nav#topNav {
            font-family: 'Noto Serif SC', 'Noto Sans SC', serif;
            font-size: 16px;
        }
        nav#topNav .serif-font {
            font-family: 'Ma Shan Zheng', cursive;
        }
        nav#topNav a {
            font-size: 16px;
        }
        nav.glass-effect {
            backdrop-filter: blur(10px);
            background: rgba(245, 241, 235, 0.8);
        }
        
        /* 音乐控制按钮 - 现代简约设计 */
        nav #musicControlBtn {
            position: relative;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(0, 0, 0, 0.08);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            cursor: pointer;
        }
        nav #musicControlBtn:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
            background: rgba(255, 255, 255, 1);
        }
        nav #musicControlBtn:active {
            transform: scale(0.95);
        }
        nav #musicControlBtn.playing {
            background: linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(236, 72, 153, 0.1));
            border-color: rgba(249, 115, 22, 0.3);
        }
        nav #musicControlBtn.playing::after {
            content: '';
            position: absolute;
            top: -3px;
            right: -3px;
            width: 10px;
            height: 10px;
            background: #10B981;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.95);
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.15); }
        }
        nav #musicIcon {
            width: 20px;
            height: 20px;
            transition: all 0.3s ease;
        }
        nav #musicIcon svg {
            width: 100%;
            height: 100%;
            fill: currentColor;
        }
        
        /* 移动端适配 */
        @media (max-width: 768px) {
            nav .flex.space-x-8 {
                display: none !important;
            }
            nav #musicControlBtn {
                width: 40px !important;
                height: 40px !important;
            }
            nav #musicIcon {
                width: 18px !important;
                height: 18px !important;
            }
        }
        
        /* 底部导航栏统一样式 */
        .mobile-nav {
            display: none;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(245, 241, 235, 0.95);
            backdrop-filter: blur(10px);
            border-top: 1px solid rgba(255,255,255,0.3);
            padding: 8px 0;
            z-index: 50;
            font-family: 'Noto Serif SC', 'Noto Sans SC', serif;
        }
        .mobile-nav a {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 8px 6px;
            color: #6B7280;
            font-size: 12px;
            text-decoration: none;
            transition: all 0.2s;
        }
        .mobile-nav a.active {
            color: #F97316;
        }
        .mobile-nav a:hover {
            color: #F97316;
        }
        @media (max-width: 768px) {
            .mobile-nav {
                display: flex !important;
            }
        }
        `;
        document.head.appendChild(style);
    }

    // 初始化导航栏
    function initNavbar() {
        // 添加样式
        addNavbarStyles();

        // 查找插入点（通常在 body 开始处）
        const body = document.body;
        if (!body) {
            console.error('Navbar: body element not found');
            return;
        }

        // 查找现有的导航栏并替换
        const existingNav = document.querySelector('nav#topNav, nav.fixed.top-0, nav.top-nav, nav[class*="glass-effect"]');
        if (existingNav) {
            existingNav.outerHTML = generateNavbar();
            // 绑定帮助按钮事件
            bindHelpButton();
            return;
        }

        // 查找注释标记并替换
        // 遍历 body 的所有子节点（包括注释节点）
        const bodyNodes = Array.from(body.childNodes);
        let commentFound = false;
        
        for (let i = 0; i < bodyNodes.length; i++) {
            const node = bodyNodes[i];
            
            // 检查是否是注释节点
            if (node.nodeType === Node.COMMENT_NODE) {
                const commentText = node.textContent || '';
                if (commentText.includes('导航栏将由 navbar.js') || commentText.includes('导航栏')) {
                    // 在注释位置插入导航栏
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = generateNavbar();
                    const navElement = tempDiv.firstElementChild;
                    
                    // 在注释节点之前插入导航栏
                    body.insertBefore(navElement, node);
                    // 移除注释节点
                    node.remove();
                    commentFound = true;
                    break;
                }
            }
        }
        
        // 如果没找到注释，直接插入到 body 开始处
        if (!commentFound) {
            body.insertAdjacentHTML('afterbegin', generateNavbar());
        }
        
        // 绑定帮助按钮事件
        bindHelpButton();
    }
    
    // 绑定帮助按钮事件
    function bindHelpButton() {
        const helpBtn = document.getElementById('helpBtn');
        const helpModal = document.getElementById('helpModal');
        const closeHelpBtn = document.getElementById('closeHelpBtn');
        
        if (!helpBtn) return;
        
        // 打开帮助弹窗
        helpBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (helpModal) {
                helpModal.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            }
        });
        
        // 关闭帮助弹窗
        if (closeHelpBtn) {
            closeHelpBtn.addEventListener('click', function() {
                helpModal.classList.add('hidden');
                document.body.style.overflow = '';
            });
        }
        
        // 点击背景关闭
        if (helpModal) {
            helpModal.addEventListener('click', function(e) {
                if (e.target === helpModal) {
                    helpModal.classList.add('hidden');
                    document.body.style.overflow = '';
                }
            });
        }
        
        // ESC 键关闭
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && helpModal && !helpModal.classList.contains('hidden')) {
                helpModal.classList.add('hidden');
                document.body.style.overflow = '';
            }
        });
    }

    // 确保在 DOM 完全加载后执行
    if (document.readyState === 'loading') {
        // 如果文档还在加载，等待 DOMContentLoaded
        document.addEventListener('DOMContentLoaded', function() {
            // 延迟一点确保所有节点都已解析
            setTimeout(initNavbar, 10);
        });
    } else {
        // 如果文档已经加载，立即执行，但也要延迟一点
        setTimeout(initNavbar, 10);
    }
    
    // 也监听 load 事件作为备用
    window.addEventListener('load', function() {
        // 检查是否已经有导航栏，如果没有则创建
        if (!document.getElementById('topNav')) {
            initNavbar();
        }
    });

})();

