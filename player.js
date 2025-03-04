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
        this.cutDirection = 1;
        this.facingRight = true;
        this.money = 0;
        this.treesCut = 0;
        this.upgrades = {};
        this.cuttingTarget = null;
        this.axeAngle = 0; // For axe swing animation
        this.axeSwingSpeed = 10; // Degrees per frame
        this.animationFrame = 0; // For character animation
    }

    update() {
        // Gravity and basic movement remain unchanged
        this.velocityY += this.gravity;
        this.y += this.velocityY;

        if (this.y > this.game.canvas.height - this.height) {
            this.y = this.game.canvas.height - this.height;
            this.velocityY = 0;
            this.isJumping = false;
        }

        if (this.game.keys.a && this.x > 0) {
            this.x -= this.speed;
            this.facingRight = false;
            this.animationFrame = (this.animationFrame + 1) % 30; // Walking animation
        }
        if (this.game.keys.d && this.x < this.game.canvas.width - this.width) {
            this.x += this.speed;
            this.facingRight = true;
            this.animationFrame = (this.animationFrame + 1) % 30; // Walking animation
        }

        // Cutting animation
        if (this.isCutting) {
            this.cutProgress += this.cutDirection * 2;
            if (this.cutProgress >= 100 || this.cutProgress <= 0) {
                this.cutDirection *= -1;
            }
            // Update axe swing animation
            this.axeAngle += this.axeSwingSpeed * (this.facingRight ? 1 : -1);
            if (Math.abs(this.axeAngle) > 45) {
                this.axeSwingSpeed *= -1;
            }
        } else {
            this.axeAngle = 0;
            this.axeSwingSpeed = Math.abs(this.axeSwingSpeed);
        }
    }

    draw(ctx) {
        // Draw legs with walking animation
        const legOffset = Math.sin(this.animationFrame * 0.2) * 4;
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x + 8, this.y + 40 + legOffset, 7, 8); // Left leg (fixed width)
        ctx.fillRect(this.x + 18, this.y + 40 - legOffset, 6, 8); // Right leg

        // Draw shoes
        ctx.fillStyle = '#4A3728'; // Dark brown for shoes
        ctx.fillRect(this.x + 6, this.y + 46 + legOffset, 9, 4); // Left shoe
        ctx.fillRect(this.x + 16, this.y + 46 - legOffset, 9, 4); // Right shoe

        // Add shoe details
        ctx.fillStyle = '#2C1810'; // Darker brown for shoe details
        ctx.fillRect(this.x + 6, this.y + 48 + legOffset, 9, 2); // Left shoe sole
        ctx.fillRect(this.x + 16, this.y + 48 - legOffset, 9, 2); // Right shoe sole

        // Draw detailed body
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(this.x + 8, this.y + 12, 16, 28); // Torso

        // Draw plaid shirt pattern
        ctx.fillStyle = '#8B0000';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(this.x + 8 + (i * 6), this.y + 12, 2, 28); // Vertical stripes
            ctx.fillRect(this.x + 8, this.y + 12 + (i * 8), 16, 2); // Horizontal stripes
        }

        // Draw arms
        ctx.fillStyle = '#A0522D';
        if (this.isCutting) {
            // Animate arms during cutting
            const armAngle = Math.sin(this.cutProgress * 0.1) * 0.5;
            ctx.save();
            ctx.translate(this.x + 16, this.y + 16);
            ctx.rotate(armAngle);
            ctx.fillRect(-4, -4, 8, 20); // Arms positioned for cutting
            ctx.restore();
        } else {
            ctx.fillRect(this.x + 4, this.y + 16, 8, 16); // Left arm
            ctx.fillRect(this.x + 20, this.y + 16, 8, 16); // Right arm
        }

        // Draw detailed head with face
        ctx.fillStyle = '#DEB887'; // Face color
        ctx.fillRect(this.x + 8, this.y, 16, 12); // Head

        // Draw eyes and mouth
        ctx.fillStyle = '#000000';
        if (this.facingRight) {
            ctx.fillRect(this.x + 16, this.y + 4, 2, 2); // Right eye
            ctx.fillRect(this.x + 19, this.y + 4, 2, 2); // Left eye
            ctx.fillRect(this.x + 16, this.y + 8, 4, 1); // Mouth
        } else {
            ctx.fillRect(this.x + 11, this.y + 4, 2, 2); // Right eye
            ctx.fillRect(this.x + 14, this.y + 4, 2, 2); // Left eye
            ctx.fillRect(this.x + 12, this.y + 8, 4, 1); // Mouth
        }

        // Draw beard
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x + 8, this.y + 8, 16, 4); // Beard

        // Draw detailed axe with swing animation
        if (this.facingRight) {
            ctx.save();
            ctx.translate(this.x + 28, this.y + 20);
            ctx.rotate((this.isCutting ? this.axeAngle : 30) * Math.PI / 180);

            // Draw handle
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-2, -2, 16, 4);

            // Draw blade
            ctx.fillStyle = '#C0C0C0';
            ctx.beginPath();
            ctx.moveTo(14, -8);
            ctx.lineTo(14, 8);
            ctx.lineTo(6, 0);
            ctx.closePath();
            ctx.fill();

            // Draw blade detail
            ctx.fillStyle = '#808080';
            ctx.fillRect(13, -6, 2, 12);

            ctx.restore();
        } else {
            ctx.save();
            ctx.translate(this.x + 4, this.y + 20);
            ctx.rotate((this.isCutting ? -this.axeAngle : -30) * Math.PI / 180);

            // Draw handle
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-14, -2, 16, 4);

            // Draw blade
            ctx.fillStyle = '#C0C0C0';
            ctx.beginPath();
            ctx.moveTo(-14, -8);
            ctx.lineTo(-14, 8);
            ctx.lineTo(-6, 0);
            ctx.closePath();
            ctx.fill();

            // Draw blade detail
            ctx.fillStyle = '#808080';
            ctx.fillRect(-15, -6, 2, 12);

            ctx.restore();
        }

        // Draw cutting progress bar when active
        if (this.isCutting) {
            const skillBonus = this.game.skillLevel * 0.5;
            const barWidth = 60 + skillBonus;

            // Background bar
            ctx.fillStyle = '#000';
            ctx.fillRect(this.x - 10, this.y - 20, barWidth, 10);

            // Sweet spot indicator
            ctx.fillStyle = '#FF0';
            const sweetSpotWidth = barWidth * 0.3;
            ctx.fillRect(this.x - 10 + (barWidth * 0.35), this.y - 20, sweetSpotWidth, 10);

            // Moving indicator
            ctx.fillStyle = '#F00';
            ctx.fillRect(this.x - 10 + (barWidth * this.cutProgress / 100), this.y - 20, 2, 10);
        }
    }

    jump() {
        if (!this.isJumping) {
            this.velocityY = this.jumpForce;
            this.isJumping = true;
        }
    }

    attemptCut() {
        if (this.isCutting) {
            if (this.cutProgress >= 35 && this.cutProgress <= 65) {
                this.isCutting = false;
                this.cutProgress = 0;
                this.cutDirection = 1;
                if (this.cuttingTarget === 'tree') {
                    this.treesCut++;
                    this.addMoney(Math.round(this.treesCut * 1.4));
                } else if (this.cuttingTarget === 'boss') {
                    this.game.bossDefeated = true;
                }
                return true;
            } else {
                this.isCutting = false;
                this.cutProgress = 0;
                this.cutDirection = 1;
                return false;
            }
        }
        return false;
    }

    addMoney(amount) {
        this.money += amount;
    }
    buyUpgrade(upgrade){
        if(this.money >= upgrade.cost){
            this.money -= upgrade.cost;
            this.upgrades[upgrade.name] = true;
        }
    }
}
