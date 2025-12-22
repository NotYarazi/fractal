import { CONFIG, getEnemyConfig } from "../config/GameConfig.js";

export default class Enemy {
  constructor(
    x,
    y,
    width = CONFIG.ENEMY.DEFAULT_SIZE,
    height = CONFIG.ENEMY.DEFAULT_SIZE,
    type = "dumb"
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type; // 'dumb', 'medium', 'smart', 'teleport'

    // Get config for this enemy type
    const config = getEnemyConfig(type);
    this.speed = config.SPEED;
    this.health = config.HEALTH;
    this.damage = config.DAMAGE;
    this.color = "#ff0000";

    // Fire transformation
    this.onFire = false;
    this.originalType = type;
    this.originalSpeed = this.speed;

    // Smart and medium enemy properties
    this.shootTimer = 0;
    this.shootInterval = config.SHOOT_INTERVAL || 120;
    this.dodgeTimer = 0;
    this.dodgeDirection = { x: 0, y: 0 };

    // Teleport enemy properties
    this.teleportTimer = 0;
    this.teleportInterval = config.TELEPORT_INTERVAL || 180;
    this.teleportCooldown = 0;
    this.alpha = 1;
    this.isTeleporting = false;

    // Load sprite
    this.sprite = new Image();
    this.sprite.src = "";
    this.spriteLoaded = false;
    this.sprite.onload = () => {
      this.spriteLoaded = true;
    };
  }

  update(playerX, playerY, projectiles = [], bombs = []) {
    // Check for nearby bombs to avoid
    let avoidBombs = false;
    let avoidDirection = { x: 0, y: 0 };

    // Update fire trail timer
    if (this.onFire) {
      if (!this.fireTrailTimer) this.fireTrailTimer = 0;
      this.fireTrailTimer++;
    }

    bombs.forEach((bomb) => {
      const dx = this.getCenterX() - bomb.x;
      const dy = this.getCenterY() - bomb.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const warningRadius = bomb.getWarningRadius();

      if (warningRadius > 0 && dist < warningRadius) {
        avoidBombs = true;
        // Move away from bomb
        if (dist > 0) {
          avoidDirection.x += (dx / dist) * 3;
          avoidDirection.y += (dy / dist) * 3;
        }
      }
    });

    // If avoiding bombs, override normal behavior
    if (avoidBombs) {
      this.x += avoidDirection.x;
      this.y += avoidDirection.y;
      return;
    }

    if (this.type === "dumb") {
      // Dumb: just walks straight towards player
      const dx = playerX - this.x;
      const dy = playerY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        this.x += (dx / distance) * this.speed;
        this.y += (dy / distance) * this.speed;
      }
    } else if (this.type === "medium") {
      // Medium: moves towards player and shoots, no dodging
      this.shootTimer++;

      const dx = playerX - this.getCenterX();
      const dy = playerY - this.getCenterY();
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 100) {
        // Keep some distance
        this.x += (dx / distance) * this.speed;
        this.y += (dy / distance) * this.speed;
      }
    } else if (this.type === "smart") {
      // Smart: tries to dodge projectiles and shoots
      this.shootTimer++;

      // Check for nearby projectiles to dodge
      let shouldDodge = false;
      projectiles.forEach((proj) => {
        const dx = proj.x - this.getCenterX();
        const dy = proj.y - this.getCenterY();
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 80) {
          // Dodge if projectile is close
          shouldDodge = true;
          // Dodge perpendicular to projectile direction
          this.dodgeDirection.x = -dy / dist;
          this.dodgeDirection.y = dx / dist;
        }
      });

      if (shouldDodge) {
        this.x += this.dodgeDirection.x * this.speed * 1.5;
        this.y += this.dodgeDirection.y * this.speed * 1.5;
      } else {
        // Move towards player (but not too close)
        const dx = playerX - this.getCenterX();
        const dy = playerY - this.getCenterY();
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 150) {
          // Keep distance
          this.x += (dx / distance) * this.speed;
          this.y += (dy / distance) * this.speed;
        }
      }
    } else if (this.type === "teleport") {
      // Teleport enemy
      if (this.isTeleporting) {
        this.alpha -= 0.05;
        if (this.alpha <= 0) {
          // Teleport to new position - either near (200-350px) or far (400-600px) from player
          const isFarTeleport = Math.random() < 0.5;
          const angle = Math.random() * Math.PI * 2;
          const distance = isFarTeleport
            ? 400 + Math.random() * 200 // Far: 400-600px
            : 200 + Math.random() * 150; // Near: 200-350px
          this.x = playerX + Math.cos(angle) * distance;
          this.y = playerY + Math.sin(angle) * distance;
          this.isTeleporting = false;
          this.teleportCooldown = 60;
        }
      } else if (this.alpha < 1) {
        this.alpha += 0.05;
      } else {
        // Normal movement
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
          this.x += (dx / distance) * this.speed;
          this.y += (dy / distance) * this.speed;
        }

        // Teleport timer
        this.teleportTimer++;
        if (
          this.teleportTimer >= this.teleportInterval &&
          this.teleportCooldown === 0
        ) {
          this.isTeleporting = true;
          this.teleportTimer = 0;
        }

        if (this.teleportCooldown > 0) {
          this.teleportCooldown--;
        }
      }
    }
  }

  shouldShoot() {
    if (
      (this.type === "smart" || this.type === "medium") &&
      this.shootTimer >= this.shootInterval
    ) {
      this.shootTimer = 0;
      return true;
    }
    return false;
  }

  ignite() {
    if (!this.onFire) {
      this.onFire = true;
      // Transform to smart behavior if not already smart
      if (this.originalType !== "smart") {
        this.type = "smart";
        this.speed = this.originalSpeed * 1.5; // Increase speed by 50%
      } else {
        this.speed = this.originalSpeed * 1.5;
      }
    }
  }

  draw(ctx) {
    if (this.spriteLoaded) {
      ctx.save();

      // Apply teleport alpha
      if (this.type === "teleport") {
        ctx.globalAlpha = this.alpha;
      }

      ctx.shadowBlur = 15;
      ctx.shadowColor = "#ff0000";
      ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);

      // Draw type indicator (small dot)
      ctx.shadowBlur = 0;
      if (this.type === "smart") {
        ctx.fillStyle = "#ffff00";
        ctx.fillRect(this.x + this.width / 2 - 2, this.y - 5, 4, 4);
      } else if (this.type === "medium") {
        ctx.fillStyle = "#ff8800";
        ctx.fillRect(this.x + this.width / 2 - 2, this.y - 5, 4, 4);
      } else if (this.type === "teleport") {
        ctx.fillStyle = "#00ffff";
        ctx.fillRect(this.x + this.width / 2 - 2, this.y - 5, 4, 4);
      }

      ctx.restore();
    } else {
      // Fallback to colored rectangle
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    // Draw fire effect if on fire
    if (this.onFire) {
      ctx.save();
      // White outline
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.strokeRect(this.x, this.y, this.width, this.height);

      // Fire texture overlay (simple noisy effect)
      ctx.globalAlpha = 0.4;
      const noiseSize = 4;
      for (let i = 0; i < this.width; i += noiseSize) {
        for (let j = 0; j < this.height; j += noiseSize) {
          if (Math.random() > 0.5) {
            const brightness = Math.floor(100 + Math.random() * 155);
            ctx.fillStyle = `rgb(255, ${brightness}, 0)`;
            ctx.fillRect(this.x + i, this.y + j, noiseSize, noiseSize);
          }
        }
      }
      ctx.restore();
    }
  }

  shouldLeaveFireTrail() {
    if (this.onFire && this.fireTrailTimer >= this.fireTrailInterval) {
      this.fireTrailTimer = 0;
      return true;
    }
    return false;
  }

  getCenterX() {
    return this.x + this.width / 2;
  }

  getCenterY() {
    return this.y + this.height / 2;
  }

  checkCollision(entity) {
    return (
      this.x < entity.x + entity.width &&
      this.x + this.width > entity.x &&
      this.y < entity.y + entity.height &&
      this.y + this.height > entity.y
    );
  }

  takeDamage(amount) {
    this.health -= amount;
    return this.health <= 0;
  }
}
