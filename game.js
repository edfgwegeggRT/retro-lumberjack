class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;

        // Check if we've just reset the game
        const isReset = sessionStorage.getItem('just_reset');
        if (isReset) {
            // Clear the flag
            sessionStorage.removeItem('just_reset');
            // Force reset all localStorage data to make sure it's truly gone
            localStorage.clear();
        }
        
        // Load saved state or use defaults
        const savedState = JSON.parse(localStorage.getItem('gameState')) || {};
        this.money = savedState.money || 0;
        this.skillLevel = savedState.skillLevel || 0;
        this.moneyMultiplier = savedState.moneyMultiplier || 1;
        
        // Initialize shop first to load upgrades
        this.shop = new Shop(this);
        
        // Update skill level and money multiplier based on shop upgrades
        if (this.shop && this.shop.upgrades) {
            const skillUpgrade = this.shop.upgrades.find(u => u.id === 'skill');
            const multiplierUpgrade = this.shop.upgrades.find(u => u.id === 'multiplier');
            
            if (skillUpgrade) {
                this.skillLevel = skillUpgrade.level;
            }
            
            if (multiplierUpgrade) {
                this.moneyMultiplier = 1 + (multiplierUpgrade.level * 0.4);
            }
        }
        this.moonUnlocked = savedState.moonUnlocked || false;
        this.jupiterUnlocked = savedState.jupiterUnlocked || false;
        this.sunUnlocked = savedState.sunUnlocked || false;
        this.currentWorld = savedState.currentWorld || 'earth';
        this.lastMoneyUpdate = Date.now();
        
        // Sun world specific properties
        this.platforms = null;
        this.boss = savedState.boss || null;
        if (this.currentWorld === 'sun') {
            this.setupSunWorld();
        }

        this.player = new Player(this);
        this.trees = [new Tree(300, this), new Tree(500, this)];

        this.keys = {
            a: false,
            d: false,
            space: false,
            enter: false
        };

        // Better mobile detection including iPad
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                       (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
        this.setupEventListeners();
        if (this.isMobile) {
            this.setupMobileControls();
        }
        this.updateMoneyPerSecond();

        // Set up autosave interval
        setInterval(() => this.saveGameState(), 5000); // Save every 5 seconds
        this.gameLoop();
    }

    setupMobileControls() {
        const controls = document.createElement('div');
        controls.className = 'mobile-controls';

        // Create movement buttons container
        const moveButtons = document.createElement('div');
        moveButtons.className = 'move-buttons';

        // Create left button
        const leftBtn = document.createElement('button');
        leftBtn.className = 'move-button';
        leftBtn.textContent = '←';

        // Create right button
        const rightBtn = document.createElement('button');
        rightBtn.className = 'move-button';
        rightBtn.textContent = '→';
        
        // Create jump button
        const jumpBtn = document.createElement('button');
        jumpBtn.className = 'move-button jump-button';
        jumpBtn.textContent = '↑';

        // Add touch events for movement buttons
        leftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys.a = true;
        });

        leftBtn.addEventListener('touchend', () => {
            this.keys.a = false;
        });

        rightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys.d = true;
        });

        rightBtn.addEventListener('touchend', () => {
            this.keys.d = false;
        });
        
        // Add touch events for jump button
        jumpBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys.space = true;
            this.player.jump();
        });

        jumpBtn.addEventListener('touchend', () => {
            this.keys.space = false;
        });

        // Create cut button
        const cutBtn = document.createElement('button');
        cutBtn.className = 'cut-button';
        cutBtn.textContent = 'CUT';

        // Add touch events for cut button
        cutBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys.enter = true;
            this.startCutting();
        });

        cutBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys.enter = false;
            if (this.player.isCutting) {
                this.tryCompleteCut();
            }
        });

        moveButtons.appendChild(leftBtn);
        moveButtons.appendChild(jumpBtn);
        moveButtons.appendChild(rightBtn);
        controls.appendChild(moveButtons);
        controls.appendChild(cutBtn);
        document.body.appendChild(controls);
    }

    saveGameState() {
        // Only call this directly for auto-saving or other game events
        // Shop has its own save method that handles everything
        
        // Make sure we have a shop reference
        if (!this.shop) return;
        
        // Get current shop state directly from the shop object
        const shopUpgrades = {
            skill: { purchased: true, level: this.shop.skillUpgradeCount },
            multiplier: { purchased: true, level: this.shop.moneyUpgradeCount },
            moon: { purchased: this.moonUnlocked },
            jupiter: { purchased: this.shop.jupiterUnlocked },
            sun: { purchased: this.shop.sunUnlocked }
        };
        
        // Get any existing state first
        const currentState = JSON.parse(localStorage.getItem('gameState')) || {};
        
        const gameState = {
            ...currentState,
            money: this.money,
            skillLevel: this.skillLevel,
            moneyMultiplier: this.moneyMultiplier,
            moonUnlocked: this.moonUnlocked,
            jupiterUnlocked: this.shop.jupiterUnlocked,
            sunUnlocked: this.shop.sunUnlocked,
            currentWorld: this.currentWorld,
            boss: this.boss,
            shopUpgrades: shopUpgrades
        };
        
        console.log("Game state saved:", gameState);
        localStorage.setItem('gameState', JSON.stringify(gameState));
    }

    setupEventListeners() {
        if (!this.isMobile) {
            window.addEventListener('keydown', (e) => {
                if (e.key === 'a') this.keys.a = true;
                if (e.key === 'd') this.keys.d = true;
                if (e.key === ' ') {
                    e.preventDefault();
                    this.keys.space = true;
                    this.player.jump();
                }
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.keys.enter = true;
                    this.startCutting();
                }
            });

            window.addEventListener('keyup', (e) => {
                if (e.key === 'a') this.keys.a = false;
                if (e.key === 'd') this.keys.d = false;
                if (e.key === ' ') this.keys.space = false;
                if (e.key === 'Enter') {
                    this.keys.enter = false;
                    if (this.player.isCutting) {
                        this.tryCompleteCut();
                    }
                }
            });
        }
    }

    startCutting() {
        // Check if near trees
        let startedCutting = false;
        for (let tree of this.trees) {
            if (tree.checkCollision(this.player)) {
                this.player.isCutting = true;
                this.player.cuttingTarget = 'tree';
                startedCutting = true;
                break;
            }
        }
        
        // Check if near boss
        if (!startedCutting && this.currentWorld === 'sun' && !this.boss.defeated) {
            // Check if player is close to boss
            if (Math.abs(this.player.x - this.boss.x) < 80 && 
                Math.abs(this.player.y - this.boss.y) < 100) {
                this.player.isCutting = true;
                this.player.cuttingTarget = 'boss';
            }
        }
    }

    tryCompleteCut() {
        const cutSuccess = this.player.attemptCut();
        if (cutSuccess) {
            if (this.player.cuttingTarget === 'tree') {
                // Tree was successfully cut
                // 10x wood price on Sun
                let woodValue = 1;
                if (this.currentWorld === 'sun') {
                    woodValue = 10;
                }
                
                this.money += Math.round(woodValue * this.moneyMultiplier);
                document.getElementById('moneyAmount').textContent = Math.floor(this.money);

                // Respawn trees
                this.trees = this.trees.map(tree => new Tree(
                    Math.random() * (this.canvas.width - 100) + 50,
                    this
                ));
            } else if (this.player.cuttingTarget === 'boss') {
                // Boss was successfully cut
                this.boss.health -= 20; // More damage when cutting
                
                if (this.boss.health <= 0) {
                    this.boss.defeated = true;
                    // Spawn trees after boss is defeated
                    this.trees = [
                        new Tree(300, this),
                        new Tree(500, this),
                        new Tree(700, this)
                    ];
                }
            }
            
            // Reset cutting target
            this.player.cuttingTarget = null;
        }
    }

    updateMoneyPerSecond() {
        document.getElementById('moneyPerSecondAmount').textContent = this.skillLevel;
    }

    update() {
        // Handle sun world mechanics
        if (this.currentWorld === 'sun') {
            // Check platform collision
            let onPlatform = false;
            for (let platform of this.platforms) {
                if (this.player.x < platform.x + platform.width &&
                    this.player.x + this.player.width > platform.x &&
                    this.player.y + this.player.height >= platform.y - 5 &&
                    this.player.y + this.player.height <= platform.y + 15 &&
                    this.player.velocityY >= 0) {
                    
                    this.player.y = platform.y - this.player.height;
                    this.player.velocityY = 0;
                    this.player.isJumping = false;
                    onPlatform = true;
                }
            }
            
            // Update boss
            this.updateBoss();
        }
        
        this.player.update();

        // Update passive income
        const now = Date.now();
        const deltaTime = (now - this.lastMoneyUpdate) / 1000; // Convert to seconds
        this.money += deltaTime * this.skillLevel; // Add passive income based on skill level
        this.lastMoneyUpdate = now;

        document.getElementById('moneyAmount').textContent = Math.floor(this.money);
    }

    // Add platforms and boss
    setupSunWorld() {
        this.platforms = [
            { x: 100, y: 500, width: 100, height: 20 },
            { x: 250, y: 470, width: 80, height: 20 },
            { x: 400, y: 440, width: 80, height: 20 },
            { x: 550, y: 410, width: 80, height: 20 },
            { x: 700, y: 380, width: 100, height: 20 }
        ];
        
        if (!this.boss) {
            this.boss = {
                x: 650,
                y: 300, // Lowered position to be on top of platform
                width: 60,
                height: 80,
                health: 100,
                attacking: false,
                attackTimer: 0,
                attackCooldown: 120, // frames between attacks
                defeated: false,
                canBeCut: true
            };
        }
    }
    
    drawPlatforms() {
        this.ctx.fillStyle = '#FFCC99';
        for (let platform of this.platforms) {
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        }
    }
    
    drawBoss() {
        if (this.boss.defeated) return;
        
        // Boss body
        this.ctx.fillStyle = this.boss.attacking ? '#FF0000' : '#990000';
        this.ctx.fillRect(this.boss.x, this.boss.y, this.boss.width, this.boss.height);
        
        // Boss eyes
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(this.boss.x + 10, this.boss.y + 15, 10, 10);
        this.ctx.fillRect(this.boss.x + 40, this.boss.y + 15, 10, 10);
        
        // Boss health bar
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(this.boss.x - 20, this.boss.y - 20, 100, 10);
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(this.boss.x - 20, this.boss.y - 20, this.boss.health, 10);
    }
    
    updateBoss() {
        if (this.boss.defeated) return;
        
        if (this.boss.attackTimer > 0) {
            this.boss.attackTimer--;
        } else {
            this.boss.attacking = !this.boss.attacking;
            if (this.boss.attacking) {
                this.boss.attackTimer = 30; // Attack lasts 30 frames
                
                // Check if player is in attack range
                const dx = Math.abs(this.player.x - this.boss.x);
                const dy = Math.abs(this.player.y - this.boss.y);
                if (dx < 100 && dy < 100) {
                    // Push player back
                    this.player.vx = (this.player.x < this.boss.x) ? -10 : 10;
                    this.player.vy = -5;
                }
            } else {
                this.boss.attackTimer = this.boss.attackCooldown;
            }
        }
        
        // Check if player hits boss when not attacking
        if (!this.boss.attacking && 
            this.player.x < this.boss.x + this.boss.width &&
            this.player.x + this.player.width > this.boss.x &&
            this.player.y < this.boss.y + this.boss.height &&
            this.player.y + this.player.height > this.boss.y) {
            
            if (this.player.vy > 0) { // Player is falling onto boss
                this.boss.health -= 10;
                this.player.vy = -15; // Bounce off
                
                if (this.boss.health <= 0) {
                    this.boss.defeated = true;
                    // Spawn trees after boss is defeated
                    this.trees = [
                        new Tree(300, this),
                        new Tree(500, this),
                        new Tree(700, this)
                    ];
                }
            }
        }
    }

    draw() {
        // Clear canvas
        if (this.currentWorld === 'sun') {
            this.ctx.fillStyle = '#FFFFFF'; // White for Sun
            if (!this.platforms) {
                this.setupSunWorld();
            }
        } else if (this.currentWorld === 'jupiter') {
            this.ctx.fillStyle = '#D48E6A'; // Orange-brown for Jupiter
        } else if (this.currentWorld === 'moon') {
            this.ctx.fillStyle = '#333'; // Gray for Moon
        } else {
            this.ctx.fillStyle = '#87CEEB'; // Blue for Earth
        }
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw ground
        if (this.currentWorld === 'sun') {
            this.ctx.fillStyle = '#FFDD99'; // Light orange for Sun ground
            this.drawPlatforms();
            if (!this.boss.defeated) {
                this.drawBoss();
            }
        } else if (this.currentWorld === 'jupiter') {
            this.ctx.fillStyle = '#AA5500'; // Dark orange-brown for Jupiter ground
        } else if (this.currentWorld === 'moon') {
            this.ctx.fillStyle = '#666'; // Gray for Moon ground
        } else {
            this.ctx.fillStyle = '#228B22'; // Green for Earth ground
        }
        
        if (this.currentWorld !== 'sun') {
            this.ctx.fillRect(0, this.canvas.height - 40, this.canvas.width, 40);
        } else {
            // Only draw ground at the bottom of sun world
            this.ctx.fillRect(0, this.canvas.height - 40, this.canvas.width, 40);
        }

        // Draw game objects (only draw trees after boss is defeated in Sun world)
        if (this.currentWorld !== 'sun' || this.boss.defeated) {
            this.trees.forEach(tree => tree.draw(this.ctx));
        }
        this.player.draw(this.ctx);
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the window loads
window.onload = () => {
    new Game();
};
