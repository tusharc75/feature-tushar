export class ShowOverlay {
  overlay: HTMLDivElement;
  isValid: boolean;
  constructor() {
    this.overlay = document.createElement('div');
    this.overlay.style.pointerEvents = 'none';
    this.isValid = false;
  }

  animate({ target, selector }: { target: HTMLElement; selector: string }) {
    if (!target) return;
    let backgroundColor = 'rgba(0,0,255,0.3)',
      borderColor = 'blue';
    this.isValid = false;

    window.requestAnimationFrame(() => {
      if (selector) {
        try {
          const virtualElement = document.querySelector(selector);
          if (!virtualElement) return;
          if (virtualElement !== target) {
            backgroundColor = 'rgba(255,0,0,0.3)';
            borderColor = 'red';
            this.isValid = false;
          } else {
            this.isValid = true;
          }
        } catch (error) {
          backgroundColor = 'rgba(255,0,0,0.3)';
          borderColor = 'red';
          this.isValid = false;
        }
      } else {
        backgroundColor = 'rgba(255,0,0,0.3)';
        borderColor = 'red';
        this.isValid = false;
      }

      const style = getComputedStyle(target);
      const borderRadius = style.getPropertyValue('border-radius');
      const htmlBox = target.getBoundingClientRect();
      const left = htmlBox.left + window.scrollX;
      const top = htmlBox.top + window.scrollY;
      this.overlay.style.borderRadius = borderRadius;
      this.overlay.style.border = `2px dashed ${borderColor}`;
      this.overlay.style.backgroundColor = backgroundColor;
      this.overlay.style.left = left + 'px';
      this.overlay.style.top = top + 'px';
      this.overlay.style.width = htmlBox.width + 'px';
      this.overlay.style.height = htmlBox.height + 'px';
    });
    return this.isValid;
  }
  start() {
    this.overlay.classList.add('absolute', 'z-[1500]');
    document.body.appendChild(this.overlay);
  }
  stop() {
    try {
      this.overlay.style.left = -50 + 'px';
      this.overlay.style.top = -50 + 'px';
      this.overlay.style.width = 0 + 'px';
      this.overlay.style.height = 0 + 'px';
      document.body.removeChild(this.overlay);
    } catch {}
  }
}
