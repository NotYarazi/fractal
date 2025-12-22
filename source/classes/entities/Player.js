export default class Player {
  constructor(x, y, width = 40, height = 40) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = 5;
    this.health = 100;
    this.color = "#00ff00";

    // Unified inventory system: 3 slots, each can hold stacks of items
    // Each slot: { type: 'bomb'|'crystal'|'star'|null, count: number }
    this.inventory = [
      { type: null, count: 0 },
      { type: null, count: 0 },
      { type: null, count: 0 },
    ];
    this.maxStackSize = 8;

    // Load sprite
    this.sprite = new Image();
    this.sprite.src = "";
    this.spriteLoaded = false;
    this.sprite.onload = () => {
      this.spriteLoaded = true;
    };
  }

  update(input, canvasWidth, canvasHeight) {
    // Movement
    if (
      input.keys.has("ArrowLeft") ||
      input.keys.has("a") ||
      input.keys.has("A")
    ) {
      this.x -= this.speed;
    }
    if (
      input.keys.has("ArrowRight") ||
      input.keys.has("d") ||
      input.keys.has("D")
    ) {
      this.x += this.speed;
    }
    if (
      input.keys.has("ArrowUp") ||
      input.keys.has("w") ||
      input.keys.has("W")
    ) {
      this.y -= this.speed;
    }
    if (
      input.keys.has("ArrowDown") ||
      input.keys.has("s") ||
      input.keys.has("S")
    ) {
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
    ctx.fillStyle = "red";
    ctx.fillRect(this.x, this.y - 10, this.width, 5);
    ctx.fillStyle = "green";
    ctx.fillRect(this.x, this.y - 10, this.width * (this.health / 100), 5);

    // Add glow effect
    if (this.spriteLoaded) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#00ff00";
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

  // Add item to inventory - finds existing stack or empty slot
  addItem(type) {
    // First, try to stack with existing same-type slot
    for (let slot of this.inventory) {
      if (slot.type === type && slot.count < this.maxStackSize) {
        slot.count++;
        return true;
      }
    }
    // Then, try to find an empty slot
    for (let slot of this.inventory) {
      if (slot.type === null) {
        slot.type = type;
        slot.count = 1;
        return true;
      }
    }
    return false; // Inventory full
  }

  // Use item from specific slot
  useItemFromSlot(slotIndex) {
    const slot = this.inventory[slotIndex];
    if (slot && slot.type && slot.count > 0) {
      const type = slot.type;
      slot.count--;
      if (slot.count <= 0) {
        slot.type = null;
        slot.count = 0;
      }
      return type;
    }
    return null;
  }

  // Get item type in slot
  getSlotType(slotIndex) {
    return this.inventory[slotIndex]?.type || null;
  }

  // Get item count in slot
  getSlotCount(slotIndex) {
    return this.inventory[slotIndex]?.count || 0;
  }

  // Check if can add item (has space)
  canAddItem(type) {
    // Check for existing stack with space
    for (let slot of this.inventory) {
      if (slot.type === type && slot.count < this.maxStackSize) {
        return true;
      }
    }
    // Check for empty slot
    for (let slot of this.inventory) {
      if (slot.type === null) {
        return true;
      }
    }
    return false;
  }

  // Legacy support methods
  addShockCrystal() {
    return this.addItem("crystal");
  }

  hasShockCrystal() {
    return this.inventory.some(
      (slot) => slot.type === "crystal" && slot.count > 0
    );
  }

  addStar() {
    return this.addItem("star");
  }

  hasStar() {
    return this.inventory.some(
      (slot) => slot.type === "star" && slot.count > 0
    );
  }

  addBomb() {
    return this.addItem("bomb");
  }

  hasBomb() {
    return this.inventory.some(
      (slot) => slot.type === "bomb" && slot.count > 0
    );
  }

  hasInventorySpace() {
    return (
      this.canAddItem("bomb") ||
      this.canAddItem("crystal") ||
      this.canAddItem("star")
    );
  }

  getTotalItemCount() {
    return this.inventory.reduce((sum, slot) => sum + slot.count, 0);
  }
}
