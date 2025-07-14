import { ShowOverlay } from 'src/components/InfoSidebar/RenderInfoInspector/ShowOverlay';
import { replaceAllMongoIds } from 'src/constants/helpers';

export class Inspector {
  onElementClick: (data: { selector: string; url: string }) => void;
  started: boolean;
  isValid: boolean;
  selector: string;
  private boundClick: (e: MouseEvent) => void = () => {};
  private boundMouseMove: (e: MouseEvent) => void = () => {};
  showOverlay: ShowOverlay;
  constructor({ onElementClick }: { onElementClick: (data: { selector: string; url: string }) => void }) {
    this.onElementClick = onElementClick;
    this.started = false;
    this.isValid = false;
    this.selector = '';
    this.showOverlay = new ShowOverlay();
  }

  private handleMouseMove(e: MouseEvent) {
    if (!this.started) return;
    const currentElement = e.target as HTMLElement;
    this.selector = this.getSelector(currentElement);
    this.isValid = this.showOverlay.animate({ selector: this.selector, target: currentElement });
  }

  private handleClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!this.showOverlay.isValid || !this.selector) return;
    const url = replaceAllMongoIds();
    this.onElementClick({ selector: this.selector, url });
    this.stop();
  }

  private addListeners() {
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundClick = this.handleClick.bind(this);
    window?.document.addEventListener('mousemove', this.boundMouseMove);
    window?.document.addEventListener('click', this.boundClick, true);
  }
  private removeListeners() {
    window?.document.removeEventListener('mousemove', this.boundMouseMove);
    window?.document.removeEventListener('click', this.boundClick, true);
  }

  private getSelector(element: HTMLElement) {
    if (!element) return null;
    if (element.id) return '#' + element.id;
    const parent = element.parentElement;
    if (parent?.id) {
      return `#${parent.id}`;
    } else if (element.className) {
      const classSelector = `.${element?.className?.split?.(' ').join('.')}`;
      return this.escapeTailwindClassNames(classSelector);
    }
  }
  private escapeTailwindClassNames(classNames: string): string {
    return classNames.replace(/[^a-zA-Z0-9-_.]/g, '\\$&');
  }

  start() {
    this.started = true;
    this.isValid = false;
    this.addListeners();
    this.showOverlay.start();
  }
  stop() {
    this.started = false;
    this.isValid = false;
    this.selector = '';
    this.removeListeners();
    this.showOverlay.stop();
  }

  destroy() {
    this.removeListeners();
    this.stop();
  }
}
