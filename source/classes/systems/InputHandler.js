export default class InputHandler {
  constructor() {
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, clicked: false };
    this.mouseDown = false; // Track if left mouse button is held
    this.pausePressed = false;
    this.resetPressed = false;
    this.firstInputDetected = false;
    this.firstInputTime = 0;

    window.addEventListener("keydown", (e) => {
      if (!this.firstInputDetected) {
        this.firstInputDetected = true;
        this.firstInputTime = Date.now();
      }

      this.keys.add(e.key);

      // Handle pause
      if (e.key === "Escape" || e.key === "p" || e.key === "P") {
        this.pausePressed = true;
      }

      // Handle reset
      if (e.key === "r" || e.key === "R") {
        this.resetPressed = true;
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys.delete(e.key);
    });
  }

  setupMouseListeners(canvas, onShoot, onRightClick) {
    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    canvas.addEventListener("mousedown", (e) => {
      if (e.button === 0) {
        // Left click
        this.mouseDown = true;
        if (!this.firstInputDetected) {
          this.firstInputDetected = true;
          this.firstInputTime = Date.now();
        }
      }
    });

    canvas.addEventListener("mouseup", (e) => {
      if (e.button === 0) {
        // Left click
        this.mouseDown = false;
      }
    });

    canvas.addEventListener("mouseleave", () => {
      this.mouseDown = false;
    });

    canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      if (!this.firstInputDetected) {
        this.firstInputDetected = true;
        this.firstInputTime = Date.now();
      }

      if (onRightClick) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        onRightClick(mouseX, mouseY);
      }
    });
  }

  consumePausePress() {
    const pressed = this.pausePressed;
    this.pausePressed = false;
    return pressed;
  }

  consumeResetPress() {
    const pressed = this.resetPressed;
    this.resetPressed = false;
    return pressed;
  }

  shouldShowInstructions() {
    if (!this.firstInputDetected) return true;
    return Date.now() - this.firstInputTime < 10000; // Hide after 10 seconds
  }
}
