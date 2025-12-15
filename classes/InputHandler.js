export default class InputHandler {
    constructor() {
        this.keys = new Set();
        this.mouse = { x: 0, y: 0, clicked: false };
        this.pausePressed = false;
        this.resetPressed = false;
        
        window.addEventListener('keydown', (e) => {
            this.keys.add(e.key);
            
            // Handle pause
            if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
                this.pausePressed = true;
            }
            
            // Handle reset
            if (e.key === 'r' || e.key === 'R') {
                this.resetPressed = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.key);
        });
    }

    setupMouseListeners(canvas, onShoot) {
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            onShoot(mouseX, mouseY);
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
}
