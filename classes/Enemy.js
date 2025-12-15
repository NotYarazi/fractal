export default class Enemy {
    constructor(x, y, width = 30, height = 30) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = 2;
        this.health = 30;
        this.color = '#ff0000';
        this.damage = 10;
        
        // Load sprite
        this.sprite = new Image();
        this.sprite.src = '../build/0.0.1/img/enemy.png';
        this.spriteLoaded = false;
        this.sprite.onload = () => {
            this.spriteLoaded = true;
        };
    }

    update(playerX, playerY) {
        // Simple AI: move towards player
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
    }

    draw(ctx) {
        if (this.spriteLoaded) {
            ctx.save();
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff0000';
            ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
            ctx.restore();
        } else {
            // Fallback to colored rectangle
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    getCenterX() {
        return this.x + this.width / 2;
    }

    getCenterY() {
        return this.y + this.height / 2;
    }

    checkCollision(entity) {
        return this.x < entity.x + entity.width &&
               this.x + this.width > entity.x &&
               this.y < entity.y + entity.height &&
               this.y + this.height > entity.y;
    }

    takeDamage(amount) {
        this.health -= amount;
        return this.health <= 0;
    }
}
