class Player {
    constructor(game) {
        this.game = game;
        this.width = 32;
        this.height = 48;
        this.x = 100;
        this.y = game.canvas.height - this.height;
        this.velocityY = 0;
        this.speed = 5;
        this.gravity = 0.5;
        this.jumpForce = -12;
        this.isJumping = false;
        this.isCutting = false;
        this.cutProgress = 0;
        this.cutDirection = 1; // 1 for increasing, -1 for decreasing
        this.facingRight = true;
        this.money = 0; // Added money property
        this.treesCut = 0; // Added trees cut property
        this.upgrades = {}; // Added upgrades property
        this.cuttingTarget = null; // Added cuttingTarget property
        // Using game's skill level instead of having a separate one
    }

    update() {
        // Gravity
        this.velocityY += this.gravity;
        this.y += this.velocityY;

        // Ground collision (depends on the world)
        if (this.game.currentWorld === 'sun') {
            // For Sun world, we handle platform collisions in the game's update method
            // But still need ground collision
            if (this.y > this.game.canvas.height - this.height) {
                this.y = this.game.canvas.height - this.height;
                this.velocityY = 0;
                this.isJumping = false;
            }
        } else {
            // Normal ground collision for other worlds
            if (this.y > this.game.canvas.height - this.height) {
                this.y = this.game.canvas.height - this.height;
                this.velocityY = 0;
                this.isJumping = false;
            }
        }

        // Movement
        if (this.game.keys.a && this.x > 0) {
            this.x -= this.speed;
            this.facingRight = false;
        }
        if (this.game.keys.d && this.x < this.game.canvas.width - this.width) {
            this.x += this.speed;
            this.facingRight = true;
        }

        // Cutting progress - automatic movement
        if (this.isCutting) {
            this.cutProgress += this.cutDirection * 2;
            if (this.cutProgress >= 100 || this.cutProgress <= 0) {
                this.cutDirection *= -1;
            }
        }
    }

    jump() {
        if (!this.isJumping) {
            // Higher jump in Sun world for parkour
            if (this.game.currentWorld === 'sun') {
                this.velocityY = -12;
            } else {
                this.velocityY = this.jumpForce;
            }
            this.isJumping = true;
        }
    }

    attemptCut() {
        if (this.isCutting) {
            // Check if cut attempt is within the sweet spot (35-65%)
            if (this.cutProgress >= 35 && this.cutProgress <= 65) {
                this.isCutting = false;
                this.cutProgress = 0;
                this.cutDirection = 1;
                if (this.cuttingTarget === 'tree') {
                    this.treesCut++;
                    this.addMoney(Math.round(this.treesCut * 1.4)); // Money multiplier change
                } else if (this.cuttingTarget === 'boss') {
                    // Boss defeated logic here
                    this.game.bossDefeated = true;
                }
                return true; // Successful cut
            } else {
                this.isCutting = false;
                this.cutProgress = 0;
                this.cutDirection = 1;
                return false; // Failed cut
            }
        }
        return false;
    }
    addMoney(amount){
        this.money += amount;
    }
    buyUpgrade(upgrade){
        if(this.money >= upgrade.cost){
            this.money -= upgrade.cost;
            this.upgrades[upgrade.name] = true;
        }
    }

    draw(ctx) {
        // Draw pixel character body
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x + 8, this.y + 8, 16, 32); // Body

        // Draw feet
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 8, this.y + 40, 8, 4); // Left foot
        ctx.fillRect(this.x + 16, this.y + 40, 8, 4); // Right foot

        // Draw head
        ctx.fillStyle = '#FFA07A';
        ctx.fillRect(this.x + 10, this.y, 12, 8); // Head

        // Draw bigger axe
        if (this.facingRight) {
            ctx.fillStyle = '#A0522D';
            ctx.fillRect(this.x + 24, this.y + 16, 12, 6); // Handle
            ctx.fillStyle = '#C0C0C0';
            ctx.fillRect(this.x + 32, this.y + 10, 12, 12); // Blade
        } else {
            ctx.fillStyle = '#A0522D';
            ctx.fillRect(this.x - 4, this.y + 16, 12, 6); // Handle
            ctx.fillStyle = '#C0C0C0';
            ctx.fillRect(this.x - 12, this.y + 10, 12, 12); // Blade
        }

        // Draw cutting progress bar when active
        if (this.isCutting) {
            // Skill-level based bar width
            const skillBonus = this.game.skillLevel * 0.5;
            const barWidth = 60 + skillBonus;

            // Background bar
            ctx.fillStyle = '#000';
            ctx.fillRect(this.x - 10, this.y - 20, barWidth, 10);

            // Sweet spot indicator (35-65%)
            ctx.fillStyle = '#FF0';
            const sweetSpotWidth = barWidth * 0.3;
            ctx.fillRect(this.x - 10 + (barWidth * 0.35), this.y - 20, sweetSpotWidth, 10);

            // Moving indicator
            ctx.fillStyle = '#F00';
            ctx.fillRect(this.x - 10 + (barWidth * this.cutProgress / 100), this.y - 20, 2, 10);
        }
    }
}
