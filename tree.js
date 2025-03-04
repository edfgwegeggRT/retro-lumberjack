class Tree {
    constructor(x, game) {
        this.game = game;
        this.width = 40;
        this.height = 120;
        this.x = x;
        this.y = game.canvas.height - this.height;
        
        // Set tree color based on world
        if (game.currentWorld === 'sun') {
            this.color = '#FFD700'; // Golden trees on Sun (worth 10x)
        } else if (game.currentWorld === 'moon') {
            this.color = '#888'; // Gray on Moon
        } else if (game.currentWorld === 'jupiter') {
            this.color = '#8B4513'; // Brown on Jupiter
        } else {
            this.color = '#228B22'; // Green on Earth
        }
    }

    draw(ctx) {
        // Draw trunk
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x + 10, this.y + 40, 20, 80);

        // Draw leaves
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + 40);
        ctx.lineTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + 40);
        ctx.closePath();
        ctx.fill();
    }

    checkCollision(player) {
        return (
            player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y
        );
    }
}
