import { Step } from 'src/components/CustomIntro';
import { getCurrentUrl } from 'src/components/CustomIntro/IntorCreator/helper';

export class RecordUserInteraction {
  startUrl: string;
  endUrl: string;
  steps: Step[];
  currentStep: null | Step;
  isListening: boolean;
  dialogElement: HTMLDialogElement;
  isDialogOpen: boolean;
  boundKeydown!: (e: KeyboardEvent) => void;
  boundMousedown!: (e: MouseEvent) => void;
  boundMouseOver!: (e: MouseEvent) => void;
  boundContextMenu!: (e: MouseEvent) => void;
  startCapturingMessageElement: null | HTMLParagraphElement;
  highlightHTMLElement: null | HTMLDivElement;
  titleInput: HTMLInputElement;
  descriptionInput: HTMLTextAreaElement;
  tutorialName: string;
  tutorialNameInput: HTMLInputElement;
  nameInputDialog: HTMLDialogElement;
  constructor() {
    this.startUrl = '';
    this.endUrl = '';
    this.steps = [];
    this.currentStep = null;
    this.isListening = false;
    this.isDialogOpen = false;
    this.dialogElement = null;
    this.startCapturingMessageElement = null;
    this.highlightHTMLElement = null;
    this.titleInput = null;
    this.descriptionInput = null;
    this.tutorialName = '';
    this.tutorialNameInput = null;
    this.nameInputDialog = null;

    if (!import.meta.env.PROD) {
      this.addEventListeners();
      this.createQuestionDialog();
    }
    console.log(this);
  }

  private addEventListeners() {
    this.boundKeydown = this.handleKeydown.bind(this);
    this.boundMousedown = this.handleMouseDown.bind(this);
    this.boundMouseOver = this.handleMouseOver.bind(this);
    this.boundContextMenu = this.handleContextMenu.bind(this);
    window.addEventListener('keydown', this.boundKeydown);
    window.addEventListener('mousedown', this.boundMousedown);
    window.addEventListener('mouseover', this.boundMouseOver);
    window.addEventListener('contextmenu', this.boundContextMenu);
  }

  startCapturing() {
    console.log('started capturing');
    this.isListening = true;
    const message = this.createElement('p', {
      className: 'text-[50px] text-gray-300 z-[99999999] dark:text-gray-600 fixed font-bold animate-pulse',
      innerText: 'Capturing...'
    });

    message.style.cssText = 'top: 50%; left: 50%; z-[1305] transform: translateX(-50%); pointer-events: none;';
    document.body.appendChild(message);
    this.startCapturingMessageElement = message;
  }

  stopCapturing() {
    console.log('stopped capturing');
    this.isListening = false;
    const message = this.createElement('p', {
      className: 'text-[50px] text-gray-300 z-[99999999] dark:text-gray-600 fixed font-bold animate-pulse',
      innerText: 'Stoped Capturing...'
    });
    message.style.cssText = 'top: 50%; left: 50%; transform: translateX(-50%); pointer-events: none;';
    document.body.appendChild(message);
    message.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1000, iterations: 1 });
    document.body.removeChild(this.startCapturingMessageElement!);
    document.body.removeChild(this.highlightHTMLElement);
    this.highlightHTMLElement = null;
    setTimeout(() => {
      document.body.removeChild(message);
    }, 1000);
  }

  removeEventListeners() {
    window.removeEventListener('keydown', this.boundKeydown);
    window.removeEventListener('mousedown', this.boundMousedown);
    window.removeEventListener('mouseover', this.boundMouseOver);
    window.removeEventListener('contextmenu', this.boundContextMenu);
  }

  private handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      this.closeDialog();
    }
    if (e.key === 'ḍ' && e.altKey && e.ctrlKey) {
      if (!this.isListening) {
        this.openNameInput();
        this.startCapturing();
      } else {
        this.stopCapturing();
      }
    }
  }

  private handleMouseDown(e: MouseEvent) {
    if (this.isListening && !this.isDialogOpen) {
      // left click
      // if(e.button === 0){

      // }
      // right click
      if (e.button === 2) {
        e.preventDefault();
        e.stopPropagation();
        const target = e.target as HTMLElement;
        this.currentStep.target = this.getSelector(target);
        this.currentStep.url = getCurrentUrl();
        this.openDialog();
      }
    }
  }

  private handleMouseOver(e: MouseEvent) {
    if (this.isListening && !this.isDialogOpen) {
      const target = e.target as HTMLElement;
      window.requestAnimationFrame(() => this.highlightElement(target));
      if (this.currentStep) {
        this.currentStep = null;
      }
      this.currentStep = {
        target: this.getSelector(target),
        url: getCurrentUrl(),
        title: '',
        content: '',
        waitForUserClick: false
      };
    }
  }

  private handleContextMenu(e: MouseEvent) {
    if (this.isListening) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  highlightElement(element: HTMLElement) {
    const selector = this.getSelector(element);
    let color = 'background: rgba(0,255,0,1)';
    let highlightHTMLElement = null;
    if (this.highlightHTMLElement) {
      highlightHTMLElement = this.highlightHTMLElement;
    } else {
      highlightHTMLElement = this.createElement('div', {
        className: 'border-2 border-red-500 absolute z-[1305]'
      });
      this.highlightHTMLElement = highlightHTMLElement;
      document.body.appendChild(highlightHTMLElement);
    }
    const selectedElement = document.querySelector(selector);
    if (element !== selectedElement) {
      color = 'background: rgba(255,0,0,0.5)';
    }
    const elementBoundingBox = selectedElement.getBoundingClientRect();
    if (this.isListening && !this.isDialogOpen) {
      highlightHTMLElement.style.cssText = `top: ${elementBoundingBox.top}px; left: ${elementBoundingBox.left}px; width: ${elementBoundingBox.width}px; height: ${elementBoundingBox.height}px; pointer-events: none; ${color}`;
    } else {
      highlightHTMLElement.style.cssText = `top: ${0}px; left: ${0}px; width: ${0}px; height: ${0}px; pointer-events: none;`;
    }
  }

  getSelector(element: HTMLElement) {
    if (!element) return null;
    if (element.id) return '#' + element.id;
    const parent = element.parentElement;
    if (parent.id) {
      return `#${parent.id}`;
    } else if (element.className) {
      return `.${element?.className?.split?.(' ').join('.')}`;
    }
  }

  createElement<T extends keyof HTMLElementTagNameMap>(tag: T, attributes?: Partial<HTMLElementTagNameMap[T]>): HTMLElementTagNameMap[T] {
    const element = document.createElement(tag);
    if (attributes) {
      Object.assign(element, attributes);
    }
    return element;
  }
  openDialog() {
    this.isDialogOpen = true;
    this.dialogElement.showModal();
  }
  closeDialog() {
    this.isDialogOpen = false;
    this.dialogElement.close();
    this.clarInput();
  }

  finishStep() {
    this.createStep();
    const data = {
      [this.steps[0].url]: {
        name: this.tutorialName,
        steps: this.steps
      }
    };
    console.log(data);
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });

    const anchor = this.createElement('a', {
      href: URL.createObjectURL(blob),
      download: `${this.tutorialName}.json`,
      className: 'hidden'
    });
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(anchor.href);
    this.steps = [];
    this.tutorialName = '';
    this.stopCapturing();
  }

  createQuestionDialog() {
    if (this.dialogElement) return;
    const addStepButton = this.createElement('button', {
      innerText: '+ Add Step',
      className: 'shadow bg-purple-500 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded border-0',
      onclick: () => {
        this.closeDialog();
        this.createStep();
      }
    });
    const finishButton = this.createElement('button', {
      innerText: 'Finish',
      className: 'shadow bg-green-500 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded border-0',
      onclick: () => {
        this.closeDialog();
        this.finishStep();
      }
    });
    this.titleInput = this.createElement('input', {
      placeholder: 'Step title',
      className:
        'shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline col-span-2',
      onchange: (e) => {
        const target = e.target as HTMLInputElement;
        this.currentStep.title = target.value;
      }
    });
    this.descriptionInput = this.createElement('textarea', {
      placeholder: 'Step description',
      rows: 4,
      cols: 50,
      className:
        'shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline col-span-2',
      onchange: (e) => {
        const target = e.target as HTMLInputElement;
        this.currentStep.content = target.value;
      }
    });
    const div = this.createElement('div', {
      className: 'col-span-2 flex items-center'
    });

    const waitForUserInteractionCheckBox = this.createElement('input', {
      type: 'checkbox',
      id: 'waitForUserInteraction',
      className: 'form-checkbox h-5 w-5 text-indigo-500',
      onchange: (e) => {
        const target = e.target as HTMLInputElement;
        this.currentStep.waitForUserClick = target.checked;
      }
    });
    const label = this.createElement('label', {
      innerText: 'Wait for user interaction',
      className: 'inline-flex items-center',
      htmlFor: 'waitForUserInteraction'
    });
    div.append(waitForUserInteractionCheckBox, label);
    const container = this.createElement('div', {
      className: 'p-2 rounded-md grid gap-2  grid-cols-2'
    });
    container.append(this.titleInput, this.descriptionInput, div, addStepButton, finishButton);
    const dialogElement = this.createElement('dialog', {
      className: 'p-2 rounded-md border-0 fixed top-[20%] left-[50%] [transform:translate(-50%)]'
    });
    dialogElement.appendChild(container);

    if (!this.dialogElement) {
      this.dialogElement = dialogElement;
      document.body.appendChild(dialogElement);
    }
  }
  createNameInputDialog() {
    if (this.nameInputDialog) return;
    const dialog = this.createElement('dialog', {
      className: 'p-2 rounded-md border-0 fixed top-[20%] left-[50%] [transform:translate(-50%)]'
    });

    this.tutorialNameInput = this.createElement('input', {
      placeholder: 'Tutorial Name',
      className:
        'shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline col-span-2',
      onchange: (e) => {
        const target = e.target as HTMLInputElement;
        this.tutorialName = target.value;
      }
    });
    const submitButton = this.createElement('button', {
      innerText: 'Create New Tutorial',
      className:
        'shadow bg-green-500 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded border-0 cursor-pointer w-[116%]',
      onclick: () => {
        this.closeNameInput();
      }
    });
    const container = this.createElement('div', {
      className: 'p-2 rounded-md grid gap-2'
    });
    container.append(this.tutorialNameInput, submitButton);
    dialog.appendChild(container);

    if (!this.nameInputDialog) {
      this.nameInputDialog = dialog;
      document.body.appendChild(dialog);
    }
  }

  closeNameInput() {
    this.isDialogOpen = false;
    this.clarInput();
    this.nameInputDialog.close();
  }
  openNameInput() {
    this.isDialogOpen = true;
    this.createNameInputDialog();
    this.nameInputDialog.showModal();
  }

  clarInput() {
    this.titleInput.value = '';
    this.descriptionInput.value = '';
    this.tutorialNameInput.value = '';
  }
  createStep() {
    this.clarInput();
    this.steps.push(this.currentStep!);
    this.currentStep = null;
  }
}
