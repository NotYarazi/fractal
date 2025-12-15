import Player from './Player.js';
import Enemy from './Enemy.js';
import Projectile from './Projectile.js';
import InputHandler from './InputHandler.js';
import Particle, { ExplosionParticle, ProjectileTrail } from './Particle.js';
import ScreenShake from './ScreenShake.js';
import Light, { LightingSystem } from './Light.js';

export default class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.init();
        
        // Start game loop
        this.lastTime = 0;
        this.animate(0);
    }

    init() {
        this.player = new Player(this.width / 2, this.height / 2);
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.input = new InputHandler();
        this.screenShake = new ScreenShake();
        this.lightingSystem = new LightingSystem();
        
        this.score = 0;
        this.gameOver = false;
        this.paused = false;
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 120; // Spawn enemy every 2 seconds at 60fps
        
        // Setup shooting
        this.input.setupMouseListeners(this.canvas, (x, y) => this.shoot(x, y));
        
        // Add player light
        this.playerLight = new Light(
            this.player.getCenterX(), 
            this.player.getCenterY(), 
            150, 
            'rgba(0, 255, 0, 0.3)'
        );
        this.lightingSystem.addLight(this.playerLight);
    }

    reset() {
        this.init();
    }

    shoot(targetX, targetY) {
        if (!this.gameOver && !this.paused) {
            const projectile = new Projectile(
                this.player.getCenterX(),
                this.player.getCenterY(),
                targetX,
                targetY
            );
            this.projectiles.push(projectile);
            
            // Add muzzle flash particles
            for (let i = 0; i < 5; i++) {
                this.particles.push(new Particle(
                    this.player.getCenterX(),
                    this.player.getCenterY(),
                    '#ffff00'
                ));
            }
        }
    }

    spawnEnemy() {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        
        switch(side) {
            case 0: // Top
                x = Math.random() * this.width;
                y = -30;
                break;
            case 1: // Right
                x = this.width + 30;
                y = Math.random() * this.height;
                break;
            case 2: // Bottom
                x = Math.random() * this.width;
                y = this.height + 30;
                break;
            case 3: // Left
                x = -30;
                y = Math.random() * this.height;
                break;
        }
        
        this.enemies.push(new Enemy(x, y));
    }

    update() {
        // Check for reset
        if (this.input.consumeResetPress()) {
            this.reset();
            return;
        }
        
        // Check for pause
        if (this.input.consumePausePress()) {
            this.paused = !this.paused;
        }
        
        if (this.gameOver || this.paused) return;

        // Update screen shake
        this.screenShake.update();

        // Update player
        this.player.update(this.input, this.width, this.height);
        
        // Update player light
        this.playerLight.update(this.player.getCenterX(), this.player.getCenterY());

        // Update enemies
        this.enemies.forEach(enemy => {
            enemy.update(this.player.getCenterX(), this.player.getCenterY());
            
            // Check collision with player
            if (enemy.checkCollision(this.player)) {
                if (this.player.takeDamage(enemy.damage)) {
                    this.gameOver = true;
                }
            }
        });

        // Update projectiles
        this.projectiles = this.projectiles.filter(projectile => {
            projectile.update();
            
            // Add trail particles
            if (Math.random() < 0.5) {
                this.particles.push(new ProjectileTrail(projectile.x, projectile.y));
            }
            
            // Remove if off screen
            if (projectile.isOffScreen(this.width, this.height)) {
                return false;
            }
            
            // Check collision with enemies
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                if (projectile.checkCollision(this.enemies[i])) {
                    if (this.enemies[i].takeDamage(projectile.damage)) {
                        const enemy = this.enemies[i];
                        
                        // Create explosion
                        for (let j = 0; j < 30; j++) {
                            this.particles.push(new ExplosionParticle(
                                enemy.getCenterX(),
                                enemy.getCenterY()
                            ));
                        }
                        
                        // Screen shake
                        this.screenShake.shake(8, 15);
                        
                        // Add explosion light
                        const explosionLight = new Light(
                            enemy.getCenterX(),
                            enemy.getCenterY(),
                            200,
                            'rgba(255, 100, 0, 0.8)'
                        );
                        this.lightingSystem.addLight(explosionLight);
                        setTimeout(() => {
                            this.lightingSystem.removeLight(explosionLight);
                        }, 300);
                        
                        this.enemies.splice(i, 1);
                        this.score += 10;
                    }
                    return false; // Remove projectile
                }
            }
            
            return true;
        });

        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.update();
            return !particle.isDead();
        });

        // Spawn enemies
        this.enemySpawnTimer++;
        if (this.enemySpawnTimer >= this.enemySpawnInterval) {
            this.spawnEnemy();
            this.enemySpawnTimer = 0;
            
            // Gradually increase difficulty
            if (this.enemySpawnInterval > 60) {
                this.enemySpawnInterval -= 1;
            }
        }
    }

    draw() {
        // Apply screen shake
        this.ctx.save();
        this.ctx.translate(this.screenShake.x, this.screenShake.y);
        
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(-this.screenShake.x, -this.screenShake.y, this.width, this.height);

        // Draw particles (behind)
        this.particles.forEach(particle => particle.draw(this.ctx));

        // Draw projectiles
        this.projectiles.forEach(projectile => projectile.draw(this.ctx));

        // Draw enemies with lights
        this.enemies.forEach(enemy => {
            enemy.draw(this.ctx);
            
            // Add enemy light
            const enemyLight = new Light(
                enemy.getCenterX(),
                enemy.getCenterY(),
                80,
                'rgba(255, 0, 0, 0.2)'
            );
            enemyLight.draw(this.ctx);
        });

        // Draw player
        this.player.draw(this.ctx);
        
        // Draw lighting system
        this.lightingSystem.draw(this.ctx, this.width, this.height);
        
        this.ctx.restore();

        // Draw UI (not affected by shake)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${this.score}`, 10, 30);
        this.ctx.fillText(`Health: ${this.player.health}`, 10, 60);
        this.ctx.fillText(`Enemies: ${this.enemies.length}`, 10, 90);

        if (this.paused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.width / 2, this.height / 2);
            this.ctx.font = '20px Arial';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText('Press ESC or P to resume', this.width / 2, this.height / 2 + 40);
            this.ctx.fillText('Press R to restart', this.width / 2, this.height / 2 + 70);
            this.ctx.textAlign = 'left';
        }

        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#ff0000';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2);
            this.ctx.font = '24px Arial';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2 + 40);
            this.ctx.fillText('Press R to restart', this.width / 2, this.height / 2 + 80);
            this.ctx.textAlign = 'left';
        }
    }

    animate(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update();
        this.draw();

        requestAnimationFrame((time) => this.animate(time));
    }
}
