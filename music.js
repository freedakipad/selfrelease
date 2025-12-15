// 跨页面背景音乐管理
class BackgroundMusicManager {
    constructor() {
        this.audio = null;
        this.isInitialized = false;
        this.init();
    }

    init() {
        // 等待 DOM 加载完成后获取 audio 元素
        const initAudio = () => {
            const audio = document.getElementById('backgroundMusic');
            if (!audio) {
                return;
            }
            this.audio = audio;
            
            // 音频元素准备好后，继续初始化
            this.continueInit();
        };
        
        // 等待 DOM 完全加载
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAudio);
        } else {
            // DOM 已经加载完成
            initAudio();
        }
    }
    
    continueInit() {
        if (!this.audio) return;

        // 设置音量
        this.audio.volume = 0.3;
        
        // 先恢复播放位置（第一次）
        this.restorePlaybackPosition();
        
        // 检查是否应该继续播放（从其他页面切换过来）
        const shouldContinue = localStorage.getItem('musicShouldContinue');
        const musicEnabled = localStorage.getItem('backgroundMusicEnabled');
        
        // 如果从其他页面切换过来且音乐应该继续，确保播放
        if (shouldContinue === 'true' && (musicEnabled === null || musicEnabled === 'true')) {
            localStorage.removeItem('musicShouldContinue'); // 清除标记
        }
        
        // 加载播放状态 - 默认启用音乐或从其他页面切换过来
        const shouldPlay = shouldContinue === 'true' || musicEnabled === null || musicEnabled === 'true';
        
        if (shouldPlay) {
            // 尝试立即播放
            const tryPlay = () => {
                // 监听多个加载事件，尽快恢复播放
                let hasStarted = false;
                
                // 1. 元数据加载完成 - 最早可以设置 currentTime
                this.audio.addEventListener('loadedmetadata', () => {
                    if (!hasStarted) {
                        this.restorePlaybackPosition();
                    }
                }, { once: true });
                
                // 2. 数据加载完成 - 可以开始播放
                this.audio.addEventListener('loadeddata', () => {
                    if (!hasStarted) {
                        hasStarted = true;
                        this.restorePlaybackPosition();
                        this.start();
                    }
                }, { once: true });
                
                // 3. 足够数据可播放 - 确保开始播放
                this.audio.addEventListener('canplay', () => {
                    if (!hasStarted) {
                        hasStarted = true;
                        this.restorePlaybackPosition();
                        this.start();
                    }
                }, { once: true });
                
                // 立即加载音频
                this.audio.load();
            };
            
            // 如果 body 已存在，立即尝试
            if (document.body) {
                tryPlay();
            } else {
                // 等待 body 加载
                document.addEventListener('DOMContentLoaded', tryPlay);
            }
        } else {
            this.updateUI(false);
        }

        // 监听播放进度，频繁保存位置
        let lastSaveTime = 0;
        this.audio.addEventListener('timeupdate', () => {
            if (!this.audio.paused) {
                const now = Date.now();
                // 每200毫秒保存一次，避免过于频繁
                if (now - lastSaveTime > 200) {
                    localStorage.setItem('musicCurrentTime', this.audio.currentTime.toString());
                    lastSaveTime = now;
                }
            }
        });

        // 页面卸载前保存状态
        window.addEventListener('beforeunload', () => {
            this.saveState();
            // 如果音乐正在播放，标记应该继续
            if (!this.audio.paused) {
                localStorage.setItem('musicShouldContinue', 'true');
            }
        });
        
        // 页面隐藏时也保存状态（更可靠）
        window.addEventListener('pagehide', () => {
            this.saveState();
            if (!this.audio.paused) {
                localStorage.setItem('musicShouldContinue', 'true');
            }
        });
        
        // 监听页面切换（通过链接点击）- 保存状态以便新页面恢复
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (link && link.href && !link.target && link.href.startsWith(window.location.origin)) {
                // 保存当前播放状态和位置
                this.saveState();
                // 标记音乐应该继续播放
                if (!this.audio.paused) {
                    localStorage.setItem('musicShouldContinue', 'true');
                }
            }
        }, true);

        // 页面可见性变化时处理 - 切换页面时保持播放
        document.addEventListener('visibilitychange', () => {
            const musicEnabled = localStorage.getItem('backgroundMusicEnabled');
            if (musicEnabled === 'true' || musicEnabled === null) {
                if (document.hidden) {
                    // 页面隐藏时保存状态，但不暂停（让音乐继续播放）
                    this.saveState();
                } else {
                    // 页面显示时恢复播放位置和状态
                    this.restorePlaybackPosition();
                    // 确保音乐继续播放
                    if (this.audio.paused) {
                        this.audio.play().catch(() => {});
                    }
                }
            }
        });

        // 监听页面加载完成，确保音乐继续播放
        if (document.readyState === 'complete') {
            this.ensurePlaying();
        } else {
            window.addEventListener('load', () => {
                this.ensurePlaying();
            });
        }

        this.isInitialized = true;
    }

    ensurePlaying() {
        const musicEnabled = localStorage.getItem('backgroundMusicEnabled');
        const shouldContinue = localStorage.getItem('musicShouldContinue');
        const shouldPlay = shouldContinue === 'true' || musicEnabled === null || musicEnabled === 'true';
        
        if (shouldPlay && this.audio && this.audio.paused) {
            // 如果应该播放但暂停了，恢复播放
            this.restorePlaybackPosition();
            this.start();
        }
    }

    restorePlaybackPosition() {
        const savedTime = localStorage.getItem('musicCurrentTime');
        if (savedTime && this.audio) {
            const time = parseFloat(savedTime) || 0;
            console.log(`[Music] 尝试恢复播放位置: ${time.toFixed(2)}秒`);
            
            const setTime = () => {
                try {
                    // 确保时间在有效范围内
                    if (time > 0 && (this.audio.duration === Infinity || time < this.audio.duration)) {
                        this.audio.currentTime = time;
                        console.log(`[Music] 播放位置已设置为: ${time.toFixed(2)}秒`);
                    }
                } catch (e) {
                    console.log(`[Music] 设置播放位置失败，稍后重试...`);
                    // 如果设置失败，稍后再试
                    setTimeout(() => {
                        try {
                            this.audio.currentTime = time;
                            console.log(`[Music] 重试成功，播放位置: ${time.toFixed(2)}秒`);
                        } catch (err) {
                            console.log(`[Music] 重试失败`);
                        }
                    }, 100);
                }
            };
            
            // 如果音频已加载元数据，立即设置
            if (this.audio.readyState >= 1) {
                setTime();
            } else {
                // 否则等待元数据加载
                this.audio.addEventListener('loadedmetadata', setTime, { once: true });
            }
        }
    }

    saveState() {
        if (this.audio) {
            localStorage.setItem('musicCurrentTime', this.audio.currentTime.toString());
            localStorage.setItem('musicPaused', this.audio.paused.toString());
        }
    }

    start() {
        if (!this.audio) {
            return;
        }
        
        // 确保播放位置已恢复
        this.restorePlaybackPosition();
        
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    localStorage.setItem('backgroundMusicEnabled', 'true');
                    this.updateUI(true);
                })
                .catch(() => {
                    // 自动播放被阻止，尝试用户交互后播放
                    this.updateUI(false);
                    // 监听用户交互，然后尝试播放
                    const tryPlayOnInteraction = () => {
                        this.restorePlaybackPosition();
                        this.audio.play().then(() => {
                            localStorage.setItem('backgroundMusicEnabled', 'true');
                            this.updateUI(true);
                        }).catch(() => {});
                        document.removeEventListener('click', tryPlayOnInteraction);
                        document.removeEventListener('touchstart', tryPlayOnInteraction);
                    };
                    document.addEventListener('click', tryPlayOnInteraction, { once: true });
                    document.addEventListener('touchstart', tryPlayOnInteraction, { once: true });
                });
        }
    }

    stop() {
        if (!this.audio) return;
        console.log('[Music] 停止播放，暂停音频');
        this.audio.pause();
        localStorage.setItem('backgroundMusicEnabled', 'false');
        localStorage.setItem('musicShouldContinue', 'false');
        this.updateUI(false);
        console.log('[Music] 音频已暂停');
    }

    toggle() {
        if (!this.audio) {
            console.log('[Music] toggle() 失败: audio 元素不存在');
            return;
        }
        console.log('[Music] toggle() 被调用, 当前状态: paused =', this.audio.paused);
        if (this.audio.paused) {
            console.log('[Music] 开始播放...');
            this.start();
        } else {
            console.log('[Music] 暂停播放...');
            this.stop();
        }
    }

    updateUI(isPlaying) {
        const btn = document.getElementById('musicControlBtn');
        const playIcon = document.getElementById('playIcon');
        const pauseIcon = document.getElementById('pauseIcon');
        
        if (!btn) return;

        if (isPlaying) {
            btn.classList.add('playing');
            if (playIcon) playIcon.style.display = 'none';
            if (pauseIcon) pauseIcon.style.display = 'block';
            btn.title = '暂停背景音乐';
        } else {
            btn.classList.remove('playing');
            if (playIcon) playIcon.style.display = 'block';
            if (pauseIcon) pauseIcon.style.display = 'none';
            btn.title = '播放背景音乐';
        }
    }
}

// 全局音乐管理器实例
let musicManager;
window.musicManager = null; // 暴露到全局，方便其他脚本访问

// 立即初始化音乐管理器，不等待 DOMContentLoaded
(function initMusicManager() {
    // 如果已经初始化，直接返回
    if (window.musicManager) {
        return;
    }
    
    // 创建音乐管理器实例
    musicManager = new BackgroundMusicManager();
    window.musicManager = musicManager;
    
    // 等待 DOM 加载完成后绑定按钮和更新UI
    function bindMusicControls() {
        // 使用事件委托，监听整个 document 的点击事件
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('#musicControlBtn');
            if (btn) {
                console.log('[Music] 音乐按钮被点击');
                e.preventDefault();
                e.stopPropagation();
                if (musicManager) {
                    musicManager.toggle();
                } else {
                    console.log('[Music] musicManager 不存在');
                }
            }
        }, true);
        
        // 延迟检查按钮是否存在并初始化UI
        const checkButton = () => {
            const musicBtn = document.getElementById('musicControlBtn');
            console.log('[Music] 查找音乐按钮:', musicBtn ? '找到' : '未找到');
            
            // 初始化UI状态
            const musicEnabled = localStorage.getItem('backgroundMusicEnabled');
            const audio = document.getElementById('backgroundMusic');
            if (musicManager && audio) {
                musicManager.updateUI(musicEnabled === 'true' && !audio.paused);
            }
        };
        
        // 多次检查，确保按钮被创建后能初始化UI
        setTimeout(checkButton, 100);
        setTimeout(checkButton, 500);
        setTimeout(checkButton, 1000);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindMusicControls);
    } else {
        bindMusicControls();
    }
})();

