// 圣多纳释放法APP - 主要逻辑
class SedonaReleaseApp {
    constructor() {
        this.currentStep = 0;
        this.selectedEmotions = [];
        this.selectedSensation = null;
        this.customSensationText = '';
        this.releaseData = {
            date: new Date(),
            emotions: [],
            sensations: [],
            responses: [],
            notes: ''
        };
        
        this.init();
    }

    init() {
        this.setupParticleBackground();
        this.initBackgroundMusic();
        this.bindEvents();
        this.loadUserData();
    }

    // 设置粒子背景
    setupParticleBackground() {
        const sketch = (p) => {
            let particles = [];
            
            p.setup = () => {
                const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
                canvas.parent('particle-container');
                
                // 创建粒子
                for (let i = 0; i < 50; i++) {
                    particles.push({
                        x: p.random(p.width),
                        y: p.random(p.height),
                        size: p.random(2, 8),
                        speedX: p.random(-0.5, 0.5),
                        speedY: p.random(-0.5, 0.5),
                        opacity: p.random(0.1, 0.3)
                    });
                }
            };
            
            p.draw = () => {
                p.clear();
                
                // 绘制粒子
                particles.forEach(particle => {
                    p.fill(232, 165, 152, particle.opacity * 255);
                    p.noStroke();
                    p.ellipse(particle.x, particle.y, particle.size);
                    
                    // 移动粒子
                    particle.x += particle.speedX;
                    particle.y += particle.speedY;
                    
                    // 边界检测
                    if (particle.x < 0 || particle.x > p.width) particle.speedX *= -1;
                    if (particle.y < 0 || particle.y > p.height) particle.speedY *= -1;
                });
            };
            
            p.windowResized = () => {
                p.resizeCanvas(p.windowWidth, p.windowHeight);
            };
        };
        
        new p5(sketch);
    }

    // 初始化背景音乐 - 已由 music.js 统一管理，这里只做UI同步
    initBackgroundMusic() {
        // music.js 已经处理了音乐播放，这里只需要同步UI
        this.musicControlBtn = document.getElementById('musicControlBtn');
        this.musicIcon = document.getElementById('musicIcon');
        
        // 如果 music.js 已经初始化，同步UI状态
        if (window.musicManager) {
            const musicEnabled = localStorage.getItem('backgroundMusicEnabled');
            const audio = document.getElementById('backgroundMusic');
            if (audio) {
                window.musicManager.updateUI(musicEnabled === 'true' && !audio.paused);
            }
        }
    }
    
    // 开始播放背景音乐
    startBackgroundMusic() {
        if (!this.backgroundMusic) return;
        
        const playPromise = this.backgroundMusic.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    this.updateMusicUI(true);
                    localStorage.setItem('backgroundMusicEnabled', 'true');
                })
                .catch(error => {
                    // 自动播放被阻止（浏览器策略）
                    console.log('音乐自动播放被阻止，需要用户交互:', error);
                    // 显示播放图标，等待用户点击按钮
                    this.updateMusicUI(false);
                });
        }
    }
    
    // 停止背景音乐
    stopBackgroundMusic() {
        if (!this.backgroundMusic) return;
        this.backgroundMusic.pause();
        this.backgroundMusic.currentTime = 0;
        this.updateMusicUI(false);
        localStorage.setItem('backgroundMusicEnabled', 'false');
    }
    
    // 切换音乐播放状态
    toggleBackgroundMusic() {
        if (!this.backgroundMusic) return;
        
        if (this.backgroundMusic.paused) {
            this.startBackgroundMusic();
        } else {
            this.stopBackgroundMusic();
        }
    }
    
    // 更新音乐控制UI
    updateMusicUI(isPlaying) {
        if (!this.musicControlBtn || !this.musicIcon) return;
        
        const playIcon = document.getElementById('playIcon');
        const pauseIcon = document.getElementById('pauseIcon');
        
        if (isPlaying) {
            this.musicControlBtn.classList.add('playing');
            this.musicIcon.classList.remove('muted');
            if (playIcon) playIcon.style.display = 'none';
            if (pauseIcon) pauseIcon.style.display = 'block';
            this.musicControlBtn.title = '暂停背景音乐';
            this.musicControlBtn.setAttribute('aria-label', '暂停背景音乐');
        } else {
            this.musicControlBtn.classList.remove('playing');
            // 只有在用户明确关闭音乐时才添加 muted 类
            const musicEnabled = localStorage.getItem('backgroundMusicEnabled');
            if (musicEnabled === 'false') {
                this.musicIcon.classList.add('muted');
            } else {
                this.musicIcon.classList.remove('muted');
            }
            if (playIcon) playIcon.style.display = 'block';
            if (pauseIcon) pauseIcon.style.display = 'none';
            this.musicControlBtn.title = '播放背景音乐';
            this.musicControlBtn.setAttribute('aria-label', '播放背景音乐');
        }
    }

    // 绑定事件
    bindEvents() {
        // 音乐控制按钮
        if (this.musicControlBtn) {
            this.musicControlBtn.addEventListener('click', () => {
                this.toggleBackgroundMusic();
            });
        }
        
        // 开始释放按钮
        document.getElementById('startReleaseBtn').addEventListener('click', () => {
            this.showEmotionSelection();
        });

        // 情绪卡片点击
        document.querySelectorAll('.emotion-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectEmotion(card);
            });
        });

        // 身体感受点击
        document.querySelectorAll('.body-sensation').forEach(sensation => {
            sensation.addEventListener('click', () => {
                this.selectSensation(sensation);
            });
        });

        // 开始释放按钮
        document.getElementById('beginReleaseBtn').addEventListener('click', () => {
            this.startReleaseProcess();
        });

        // 释放步骤响应按钮
        document.querySelectorAll('.response-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleResponse(btn.dataset.response);
            });
        });

        // 完成后的操作按钮
        document.getElementById('saveReleaseBtn').addEventListener('click', () => {
            this.saveReleaseRecord();
        });

        document.getElementById('newReleaseBtn').addEventListener('click', () => {
            this.resetToStart();
        });

        // 自定义情绪输入
        const customEmotionTextInput = document.getElementById('customEmotionText');
        if (customEmotionTextInput) {
            customEmotionTextInput.addEventListener('input', (e) => {
                this.customEmotionText = e.target.value;
                this.updateBeginButtonState();
            });
        }

        // 自定义身体感受输入
        const customSensationTextInput = document.getElementById('customSensationText');
        if (customSensationTextInput) {
            customSensationTextInput.addEventListener('input', (e) => {
                this.customSensationText = e.target.value;
                this.updateBeginButtonState();
            });
        }
    }

    // 显示情绪选择界面
    showEmotionSelection() {
        // 隐藏Hero区域
        document.getElementById('heroSection').style.display = 'none';
        
        const emotionSection = document.getElementById('emotionSection');
        emotionSection.classList.remove('hidden');
        
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        anime({
            targets: '#emotionSection',
            opacity: [0, 1],
            translateY: [30, 0],
            duration: 800,
            easing: 'easeOutQuart'
        });
    }

    // 选择情绪
    selectEmotion(card) {
        const emotion = card.dataset.emotion;
        
        if (emotion === 'custom') {
            document.getElementById('customEmotionInput').classList.toggle('hidden');
            if (!document.getElementById('customEmotionInput').classList.contains('hidden')) {
                document.getElementById('customEmotionText').focus();
            }
            return;
        }

        card.classList.toggle('selected');
        
        if (card.classList.contains('selected')) {
            this.selectedEmotions.push(emotion);
            anime({
                targets: card,
                scale: [1, 1.1, 1.05],
                duration: 300,
                easing: 'easeOutBack'
            });
        } else {
            this.selectedEmotions = this.selectedEmotions.filter(e => e !== emotion);
        }

        this.updateBeginButtonState();
    }

    // 选择身体感受
    selectSensation(sensation) {
        const sensationType = sensation.dataset.sensation;
        
        // 如果选择"其他感受"，显示自定义输入框
        if (sensationType === 'other') {
            const customInput = document.getElementById('customSensationInput');
            const customText = document.getElementById('customSensationText');
            
            if (customInput) {
                customInput.classList.toggle('hidden');
                if (!customInput.classList.contains('hidden') && customText) {
                    customText.focus();
                }
            }
            return;
        }
        
        document.querySelectorAll('.body-sensation').forEach(s => s.classList.remove('selected'));
        sensation.classList.add('selected');
        this.selectedSensation = sensationType;
        
        anime({
            targets: sensation,
            scale: [1, 1.1, 1],
            duration: 300,
            easing: 'easeOutBack'
        });

        this.updateBeginButtonState();
    }

    // 更新开始按钮状态
    updateBeginButtonState() {
        const beginBtn = document.getElementById('beginReleaseBtn');
        const hasEmotion = this.selectedEmotions.length > 0 || this.customEmotionText;
        const hasSensation = this.selectedSensation !== null || this.customSensationText.trim().length > 0;
        
        beginBtn.disabled = !(hasEmotion && hasSensation);
    }

    // 开始释放过程
    startReleaseProcess() {
        // 准备释放数据
        this.releaseData = {
            date: new Date(),
            emotions: this.selectedEmotions,
            customEmotion: this.customEmotionText,
            sensations: [this.selectedSensation || this.customSensationText],
            customSensation: this.customSensationText,
            responses: [],
            notes: ''
        };

        // 隐藏情绪选择，显示释放引导
        anime({
            targets: '#emotionSection',
            opacity: [1, 0],
            translateY: [0, -50],
            duration: 600,
            easing: 'easeInQuart',
            complete: () => {
                document.getElementById('emotionSection').classList.add('hidden');
                this.showReleaseSection();
            }
        });
    }

    // 显示释放引导界面
    showReleaseSection() {
        const releaseSection = document.getElementById('releaseSection');
        releaseSection.classList.remove('hidden');
        
        // 确保第一步显示
        document.querySelectorAll('.release-step').forEach(step => {
            step.classList.remove('active');
        });
        document.querySelector('[data-step="1"]').classList.add('active');
        
        anime({
            targets: '#releaseSection',
            opacity: [0, 1],
            duration: 600,
            easing: 'easeOutQuart'
        });

        this.currentStep = 1;
        this.updateProgress();
    }

    // 处理用户响应
    handleResponse(response) {
        // 保存响应
        this.releaseData.responses.push({
            step: this.currentStep,
            response: response
        });

        // 切换步骤
        const currentStepEl = document.querySelector(`[data-step="${this.currentStep}"]`);
        currentStepEl.classList.remove('active');
        
        if (this.currentStep < 4) {
            // 进入下一步
            this.currentStep++;
            const nextStepEl = document.querySelector(`[data-step="${this.currentStep}"]`);
            
            // 延迟一下让淡出完成
            setTimeout(() => {
                nextStepEl.classList.add('active');
            }, 100);
            
            this.updateProgress();
        } else {
            // 释放完成
            setTimeout(() => {
                this.completeRelease();
            }, 400);
        }
    }

    // 更新进度
    updateProgress() {
        // 进度指示器现在在每个步骤内部，无需单独更新
    }

    // 完成释放
    completeRelease() {
        // 隐藏释放引导，显示完成界面
        anime({
            targets: '#releaseSection',
            opacity: [1, 0],
            translateY: [0, -50],
            duration: 600,
            easing: 'easeInQuart',
            complete: () => {
                document.getElementById('releaseSection').classList.add('hidden');
                this.showCompletionSection();
            }
        });
    }

    // 显示完成界面
    showCompletionSection() {
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        document.getElementById('completionSection').classList.remove('hidden');
        
        anime({
            targets: '#completionSection',
            opacity: [0, 1],
            translateY: [50, 0],
            duration: 800,
            easing: 'easeOutQuart'
        });

        // 滚动到完成区域
        document.getElementById('completionSection').scrollIntoView({ 
            behavior: 'smooth',
            block: 'center'
        });

        // 庆祝动画
        this.celebrateCompletion();
    }

    // 庆祝完成动画
    celebrateCompletion() {
        // 创建粒子爆炸效果
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                this.createCelebrationParticle();
            }, i * 100);
        }
    }

    // 创建庆祝粒子
    createCelebrationParticle() {
        const particle = document.createElement('div');
        particle.innerHTML = ['✨', '🌟', '💫', '⭐'][Math.floor(Math.random() * 4)];
        particle.style.position = 'fixed';
        particle.style.left = Math.random() * window.innerWidth + 'px';
        particle.style.top = window.innerHeight + 'px';
        particle.style.fontSize = '24px';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '1000';
        
        document.body.appendChild(particle);
        
        anime({
            targets: particle,
            translateY: -window.innerHeight - 100,
            opacity: [1, 0],
            duration: 2000,
            easing: 'easeOutQuart',
            complete: () => {
                document.body.removeChild(particle);
            }
        });
    }

    // 保存释放记录
    saveReleaseRecord() {
        const notes = document.getElementById('releaseNotes').value;
        this.releaseData.notes = notes;
        const releaseId = Date.now();
        
        // 获取现有记录
        let releases = JSON.parse(localStorage.getItem('sedonaReleases') || '[]');
        
        // 添加新记录
        const releaseRecord = {
            ...this.releaseData,
            id: releaseId,
            timestamp: new Date().toISOString()
        };
        releases.push(releaseRecord);
        
        // 保存到本地存储
        localStorage.setItem('sedonaReleases', JSON.stringify(releases));
        
        // 同时创建日记条目
        this.createJournalEntry(releaseRecord);
        
        // 显示成功消息
        this.showSuccessMessage('记录已保存 📝');
        
        // 延迟后重置
        setTimeout(() => {
            this.resetToStart();
        }, 2000);
    }

    // 创建日记条目
    createJournalEntry(releaseRecord) {
        let journalEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
        
        // 从释放记录中提取情绪标签
        const emotions = releaseRecord.emotions || [];
        if (releaseRecord.customEmotion && !emotions.includes('custom')) {
            emotions.push('custom');
        }
        
        // 生成日记内容
        let content = '';
        if (releaseRecord.sensations && releaseRecord.sensations.length > 0) {
            content += `身体感受：${releaseRecord.sensations.join(', ')}\n\n`;
        }
        
        if (releaseRecord.responses && releaseRecord.responses.length > 0) {
            content += '释放过程：\n';
            releaseRecord.responses.forEach((response, index) => {
                const stepNames = ['接纳', '可能性', '意愿', '行动'];
                content += `${index + 1}. ${stepNames[index]}：${response.response}\n`;
            });
            content += '\n';
        }
        
        if (releaseRecord.notes) {
            content += `释放感悟：${releaseRecord.notes}`;
        }
        
        // 创建日记条目
        const journalEntry = {
            id: releaseRecord.id + '_journal', // 使用释放记录ID加后缀
            date: releaseRecord.date ? new Date(releaseRecord.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            emotions: emotions,
            content: content.trim() || '完成了一次情绪释放练习'
        };
        
        journalEntries.push(journalEntry);
        localStorage.setItem('journalEntries', JSON.stringify(journalEntries));
    }

    // 显示成功消息
    showSuccessMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.textContent = message;
        messageEl.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg z-50';
        
        document.body.appendChild(messageEl);
        
        anime({
            targets: messageEl,
            scale: [0, 1],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutBack',
            complete: () => {
                setTimeout(() => {
                    anime({
                        targets: messageEl,
                        scale: [1, 0],
                        opacity: [1, 0],
                        duration: 300,
                        easing: 'easeInBack',
                        complete: () => {
                            document.body.removeChild(messageEl);
                        }
                    });
                }, 1500);
            }
        });
    }

    // 重置到开始状态
    resetToStart() {
        // 重置数据
        this.currentStep = 0;
        this.selectedEmotions = [];
        this.selectedSensation = null;
        this.customEmotionText = '';
        this.customSensationText = '';
        this.releaseData = {
            date: new Date(),
            emotions: [],
            sensations: [],
            responses: [],
            notes: ''
        };

        // 重置UI
        document.querySelectorAll('.emotion-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelectorAll('.body-sensation').forEach(sensation => {
            sensation.classList.remove('selected');
        });
        document.getElementById('customEmotionInput').classList.add('hidden');
        document.getElementById('customEmotionText').value = '';
        document.getElementById('customSensationInput').classList.add('hidden');
        document.getElementById('customSensationText').value = '';
        document.getElementById('releaseNotes').value = '';

        // 显示Hero区域
        document.getElementById('heroSection').style.display = '';
        
        // 隐藏所有区域
        document.getElementById('emotionSection').classList.add('hidden');
        document.getElementById('releaseSection').classList.add('hidden');
        document.getElementById('completionSection').classList.add('hidden');

        // 重置释放步骤
        document.querySelectorAll('.release-step').forEach(step => {
            step.classList.remove('active');
        });
        document.querySelector('[data-step="1"]').classList.add('active');

        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // 显示hero区域
        anime({
            targets: '.hero-bg',
            opacity: [0, 1],
            duration: 800,
            easing: 'easeOutQuart'
        });
    }

    // 加载用户数据
    loadUserData() {
        const releases = JSON.parse(localStorage.getItem('sedonaReleases') || '[]');
        console.log(`已加载 ${releases.length} 条释放记录`);
        
        // 可以在这里添加更多数据加载逻辑
        // 比如用户偏好设置、统计数据等
    }
}

// 隐藏加载提示
function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 500);
    }
}

// 显示错误信息
function showError(message) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.innerHTML = `
            <div style="text-align: center; color: #DC2626;">
                <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
                <div style="font-size: 18px; margin-bottom: 10px;">加载失败</div>
                <div style="font-size: 14px; color: #6B7280;">${message}</div>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #F97316; color: white; border: none; border-radius: 8px; cursor: pointer;">重新加载</button>
            </div>
        `;
    }
}

// 检查关键资源是否加载成功
function checkResourcesLoaded() {
    // Tailwind CDN 不暴露全局变量，通过检查样式是否应用来判断
    // Anime.js 和 p5.js 应该暴露全局变量
    const checks = {
        anime: typeof anime !== 'undefined' || typeof window.anime !== 'undefined',
        p5: typeof p5 !== 'undefined' || typeof window.p5 !== 'undefined'
    };
    
    const failed = Object.entries(checks).filter(([name, loaded]) => !loaded);
    if (failed.length > 0) {
        console.warn('部分资源可能未加载:', failed.map(([name]) => name).join(', '));
        // 不立即显示错误，继续尝试初始化
    }
    return true; // 总是返回 true，让应用尝试初始化
}

// 初始化应用
function initApp() {
    try {
        // 检查资源（仅用于日志）
        checkResourcesLoaded();
        
        // 初始化应用
        new SedonaReleaseApp();
        
        // 延迟隐藏加载提示，确保页面渲染完成
        setTimeout(hideLoadingOverlay, 300);
    } catch (error) {
        console.error('应用初始化失败:', error);
        showError('应用初始化失败: ' + error.message);
    }
}

// 等待 DOM 和资源都加载完成
let appInitialized = false;

function tryInitApp() {
    if (appInitialized) return;
    appInitialized = true;
    initApp();
}

if (document.readyState === 'complete') {
    // 所有资源已加载完成
    tryInitApp();
} else if (document.readyState === 'interactive') {
    // DOM 已加载，但资源可能还在加载
    window.addEventListener('load', tryInitApp);
    // 超时保护：如果 load 事件不触发，3秒后强制初始化
    setTimeout(tryInitApp, 3000);
} else {
    // DOM 还在加载
    document.addEventListener('DOMContentLoaded', () => {
        window.addEventListener('load', tryInitApp);
        // 超时保护：如果 load 事件不触发，3秒后强制初始化
        setTimeout(tryInitApp, 3000);
    });
}

// 页面可见性变化时的处理（音乐控制已在 initBackgroundMusic 中处理）
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // 页面隐藏时暂停动画等
        console.log('页面隐藏');
    } else {
        // 页面显示时恢复
        console.log('页面显示');
    }
});

// 窗口大小变化时的处理
window.addEventListener('resize', () => {
    // 重新计算布局
    console.log('窗口大小变化');
});