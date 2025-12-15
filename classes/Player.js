export default class Player {
    constructor(x, y, width = 40, height = 40) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = 5;
        this.health = 100;
        this.color = '#00ff00';
        
        // Load sprite
        this.sprite = new Image();
        this.sprite.src = '../build/0.0.1/img/player.png';
        this.spriteLoaded = false;
        this.sprite.onload = () => {
            this.spriteLoaded = true;
        };
    }

    update(input, canvasWidth, canvasHeight) {
        // Movement
        if (input.keys.has('ArrowLeft') || input.keys.has('a')) {
            this.x -= this.speed;
        }
        if (input.keys.has('ArrowRight') || input.keys.has('d')) {
            this.x += this.speed;
        }
        if (input.keys.has('ArrowUp') || input.keys.has('w')) {
            this.y -= this.speed;
        }
        if (input.keys.has('ArrowDown') || input.keys.has('s')) {
            this.y += this.speed;
        }

        // Keep player within bounds
        this.x = Math.max(0, Math.min(canvasWidth - this.width, this.x));
        this.y = Math.max(0, Math.min(canvasHeight - this.height, this.y));
    }

    draw(ctx) {
        if (this.spriteLoaded) {
            ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
        } else {
            // Fallback to colored rectangle
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        
        // Draw health bar
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y - 10, this.width, 5);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x, this.y - 10, this.width * (this.health / 100), 5);
        
        // Add glow effect
        if (this.spriteLoaded) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00ff00';
            ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
            ctx.shadowBlur = 0;
        }
    }

    getCenterX() {
        return this.x + this.width / 2;
    }

    getCenterY() {
        return this.y + this.height / 2;
    }

    takeDamage(amount) {
        this.health -= amount;
        return this.health <= 0;
    }
}
