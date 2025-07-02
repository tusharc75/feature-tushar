import { createPortal, render } from 'react-dom';
import { RenderInfoButton } from 'src/components/InfoSidebar/RenderAllInfoButtons/templates';
import { AutoPosition, PositionValues } from 'src/components/InfoSidebar/types';

export function replaceAllMongoIds(
  url: string = `${window.location.pathname}${window.location.search}${window.location.hash}`,
  replaceWith = ':id'
): string {
  const objectIdRegex = /([/=])([a-f\d]{24})(?=[/?#&=]|$)/gi;
  return url.replace(objectIdRegex, `$1${replaceWith}`);
}

export const applyStyles = (element: HTMLElement, styles: React.CSSProperties) => {
  Object.entries(styles).forEach(([key, value]) => {
    // Type assertion because element.style only accepts specific string values
    (element.style as any)[key] = value;
  });
};

export function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch (e) {
    // Some browsers may throw if cross-origin restrictions are hit
    return true;
  }
}

export function generateUniqueMongoId(): string {
  // 4-byte (8 hex chars) Unix timestamp
  const timestamp = Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, '0');

  // 16 random hex characters (8 bytes)
  const randomPart = crypto.getRandomValues(new Uint8Array(12)).reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');

  return timestamp + randomPart;
}

export const handleRemoveInfoButtonFromDom = (id: string) => {
  try {
    const element = document.querySelector(`#info-sidebar-button-${id}`);

    if (element) {
      const parent = element.parentElement;
      parent?.removeChild(element);
    }
  } catch (error) {
    console.log(error);
  }
};

type GetStyleProps = {
  anchorElementPadding: PositionValues;
  buttonPosition: PositionValues;
  manualPosition: boolean;
  autoPosition: AutoPosition;
  insideAnchor: boolean;
  container: HTMLElement;
  id: string;
};

const originalComputedStyle = new Map<string, { paddingBottom: string; paddingTop: string; paddingLeft: string; paddingRight: string }>();
export const getStyles = ({ anchorElementPadding, autoPosition, buttonPosition, manualPosition, insideAnchor, container, id }: GetStyleProps) => {
  const computedStyles = getComputedStyle(container);
  let computedStyle = {
    paddingLeft: computedStyles.paddingLeft,
    paddingRight: computedStyles.paddingRight,
    paddingBottom: computedStyles.paddingBottom,
    paddingTop: computedStyles.paddingTop
  };

  if (originalComputedStyle.has(id)) {
    computedStyle = originalComputedStyle.get(id);
  } else {
    const { paddingLeft, paddingRight, paddingBottom, paddingTop } = computedStyles;
    originalComputedStyle.set(id, { paddingLeft, paddingRight, paddingBottom, paddingTop });
  }

  let containerStyle = {
    paddingTop: computedStyle.paddingTop,
    paddingBottom: computedStyle.paddingBottom,
    paddingLeft: computedStyle.paddingLeft,
    paddingRight: computedStyle.paddingRight
  } as React.CSSProperties;

  let buttonStyle = {} as React.CSSProperties;

  const buttonSize = '30px';
  if (manualPosition) {
    containerStyle = { ...anchorElementPadding };
    buttonStyle = { ...buttonPosition };
  } else {
    switch (autoPosition) {
      case 'bottom': {
        if (insideAnchor) {
          containerStyle.paddingBottom = `calc(${buttonSize} + ${computedStyle.paddingBottom})`;
          buttonStyle = { left: '50%', transform: 'translateX(-50%)', bottom: '0px' };
        } else {
          buttonStyle = { left: '50%', transform: 'translateX(-50%)', bottom: `-${buttonSize}` };
        }
        break;
      }
      case 'top': {
        if (insideAnchor) {
          containerStyle.paddingTop = `calc(${buttonSize} + ${computedStyle.paddingTop})`;
          buttonStyle = { left: '50%', transform: 'translateX(-50%)', top: '0px' };
        } else {
          buttonStyle = { left: '50%', transform: 'translateX(-50%)', top: `-${buttonSize}` };
        }
        break;
      }
      case 'left': {
        if (insideAnchor) {
          containerStyle = {
            paddingLeft: `calc(${buttonSize} + ${computedStyle.paddingLeft})`,
            minHeight: buttonSize,
            display: 'flex',
            alignItems: 'center'
          };
          buttonStyle = { top: '50%', transform: 'translateY(-50%)', left: '0px' };
        } else {
          buttonStyle = { top: '50%', transform: 'translateY(-50%)', left: `-${buttonSize}` };
        }
        break;
      }
      case 'right': {
        if (insideAnchor) {
          containerStyle = {
            paddingRight: `calc(${buttonSize} + ${computedStyle.paddingRight})`,
            minHeight: buttonSize,
            display: 'flex',
            alignItems: 'center'
          };
          buttonStyle = { top: '50%', transform: 'translateY(-50%)', right: '0px' };
        } else {
          buttonStyle = { top: '50%', transform: 'translateY(-50%)', right: `-${buttonSize}` };
        }
        break;
      }
      case 'top-left': {
        if (insideAnchor) {
          buttonStyle = { top: '0px', left: '0px' };
        } else {
          buttonStyle = { top: `-${buttonSize}`, left: `-${buttonSize}` };
        }
        break;
      }
      case 'top-right': {
        if (insideAnchor) {
          buttonStyle = { top: '0px', right: '0px' };
        } else {
          buttonStyle = { top: `-${buttonSize}`, right: `-${buttonSize}` };
        }
        break;
      }
      case 'bottom-left': {
        if (insideAnchor) {
          buttonStyle = { bottom: '0px', left: '0px' };
        } else {
          buttonStyle = { bottom: `-${buttonSize}`, left: `-${buttonSize}` };
        }
        break;
      }
      case 'bottom-right': {
        if (insideAnchor) {
          buttonStyle = { bottom: '0px', right: '0px' };
        } else {
          buttonStyle = { bottom: `-${buttonSize}`, right: `-${buttonSize}` };
        }
        break;
      }
    }
  }

  return { containerStyle, buttonStyle };
};

export const handleInsertInfoButtonPreview = ({
  id,
  targetSelector,
  anchorElementPadding,
  autoPosition,
  buttonPosition,
  manualPosition,
  insideAnchor,
  tooltip,
  onClick = () => {}
}: {
  targetSelector: string;
  id: string;
  anchorElementPadding: PositionValues;
  buttonPosition: PositionValues;
  manualPosition: boolean;
  autoPosition: AutoPosition;
  insideAnchor: boolean;
  tooltip?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}) => {
  const element = document.querySelector<HTMLElement>(targetSelector);
  if (!element) return;
  if (element.querySelector(`#info-sidebar-button-${id}`)) return;

  const { buttonStyle, containerStyle } = getStyles({
    anchorElementPadding,
    autoPosition,
    buttonPosition,
    insideAnchor,
    manualPosition,
    container: element,
    id
  });
  applyStyles(element, { position: 'relative', ...containerStyle });

  const buttonContainer = document.createElement('div');
  buttonContainer.classList.add('info-sidebar-action-container');
  buttonContainer.id = `info-sidebar-button-${id}`;
  const computedStyle = getComputedStyle(element);
  const anchorElementStyles = {} as React.CSSProperties;
  if (!['absolute', 'relative'].includes(computedStyle.position)) {
    anchorElementStyles.position = 'relative';
  }
  applyStyles(buttonContainer, { ...buttonStyle, ...anchorElementStyles, position: 'absolute' });

  element.appendChild(buttonContainer);
  render(
    createPortal(
      <RenderInfoButton
        tooltip={tooltip}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick(e);
        }}
      />,
      buttonContainer
    ),
    buttonContainer
  );
};
