import { AutoPosition, PositionValues } from 'src/components/InfoSidebar/types';

export const targetOrigin = import.meta.env.DEV ? 'http://localhost:5173' : 'https://uat-admin.equipt.ai';

export function replaceAllMongoIds(
  url: string = `${window.location.pathname}${window.location.search}${window.location.hash}`,
  replaceWith = ':id'
): string {
  const objectIdRegex = /([/=])([a-f\d]{24})(?=[/?#&=]|$)/gi;
  return url.replace(objectIdRegex, `$1${replaceWith}`);
}

export const applyStyles = (element: HTMLElement, styles: React.CSSProperties) => {
  Object.assign(element.style, styles);
};

export function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch (e) {
    // Some browsers may throw if cross-origin restrictions are hit
    return true;
  }
}

type GetStyleProps = {
  anchorElementPadding: PositionValues;
  buttonPosition: PositionValues;
  manualPosition: boolean;
  autoPosition: AutoPosition;
  insideAnchor: boolean;
  container: HTMLElement;
  id: string;
};

const originalComputedStyleReactMethod = new Map<string, { paddingBottom: string; paddingTop: string; paddingLeft: string; paddingRight: string }>();
export const getStylesReactMethod = ({
  anchorElementPadding,
  autoPosition,
  buttonPosition,
  manualPosition,
  insideAnchor,
  container,
  id
}: GetStyleProps) => {
  const computedStyles = getComputedStyle(container);
  if (insideAnchor && !['absolute', 'relative'].includes(computedStyles.position)) {
    container.style.position = 'relative';
  }

  let computedStyle = {
    paddingLeft: computedStyles.paddingLeft,
    paddingRight: computedStyles.paddingRight,
    paddingBottom: computedStyles.paddingBottom,
    paddingTop: computedStyles.paddingTop
  };

  if (originalComputedStyleReactMethod.has(id)) {
    computedStyle = originalComputedStyleReactMethod.get(id);
  } else {
    const { paddingLeft, paddingRight, paddingBottom, paddingTop } = computedStyles;
    originalComputedStyleReactMethod.set(id, { paddingLeft, paddingRight, paddingBottom, paddingTop });
  }

  let containerStyle = {
    paddingTop: computedStyle.paddingTop,
    paddingBottom: computedStyle.paddingBottom,
    paddingLeft: computedStyle.paddingLeft,
    paddingRight: computedStyle.paddingRight
  } as React.CSSProperties;

  const rect = container.getBoundingClientRect();
  const top = rect.top + window.scrollY;
  const bottom = top + rect.height;
  const left = rect.left + window.scrollX;
  const right = left + rect.width;
  const buttonSize = 30;

  let buttonStyle = {} as React.CSSProperties;

  if (manualPosition) {
    containerStyle = { ...anchorElementPadding };
    buttonStyle = { ...buttonPosition };
  } else {
    switch (autoPosition) {
      case 'bottom': {
        if (insideAnchor) {
          containerStyle.paddingBottom = `calc(${buttonSize}px + ${computedStyle.paddingBottom})`;
          buttonStyle = { left: '50%', transform: 'translateX(-50%)', bottom: '0px' };
        } else {
          buttonStyle = { left: `${left + rect.width / 2 - buttonSize * 0.5}px`, top: `${bottom}px` };
        }
        break;
      }
      case 'top': {
        if (insideAnchor) {
          containerStyle.paddingTop = `calc(${buttonSize}px + ${computedStyle.paddingTop})`;
          buttonStyle = { left: '50%', transform: 'translateX(-50%)', top: '0px' };
        } else {
          buttonStyle = { left: `${left + rect.width / 2 - buttonSize * 0.5}px`, top: `${top - buttonSize}px` };
        }
        break;
      }
      case 'left': {
        if (insideAnchor) {
          containerStyle = {
            ...containerStyle,
            paddingLeft: `calc(${buttonSize}px + ${computedStyle.paddingLeft})`,
            minHeight: `${buttonSize}px`
          };
          buttonStyle = { top: '50%', transform: 'translateY(-50%)', left: '0px' };
        } else {
          buttonStyle = { top: `${top + rect.height / 2 - buttonSize * 0.5}px`, left: `${left - buttonSize}px` };
        }
        break;
      }
      case 'right': {
        if (insideAnchor) {
          containerStyle = {
            ...containerStyle,
            paddingRight: `calc(${buttonSize}px + ${computedStyle.paddingRight})`,
            minHeight: `${buttonSize}px`
          };
          buttonStyle = { top: '50%', transform: 'translateY(-50%)', right: '0px' };
        } else {
          buttonStyle = { top: `${top + rect.height / 2 - buttonSize * 0.5}px`, left: `${right}px` };
        }
        break;
      }
      case 'top-left': {
        if (insideAnchor) {
          buttonStyle = { top: '0px', left: '0px' };
        } else {
          buttonStyle = { top: `${top - buttonSize}px`, left: `${left - buttonSize}px` };
        }
        break;
      }
      case 'top-right': {
        if (insideAnchor) {
          buttonStyle = { top: '0px', right: '0px' };
        } else {
          buttonStyle = { top: `${top - buttonSize}px`, left: `${right}px` };
        }
        break;
      }
      case 'bottom-left': {
        if (insideAnchor) {
          buttonStyle = { bottom: '0px', left: '0px' };
        } else {
          buttonStyle = { top: `${bottom}px`, left: `${left - buttonSize}px` };
        }
        break;
      }
      case 'bottom-right': {
        if (insideAnchor) {
          buttonStyle = { bottom: '0px', right: '0px' };
        } else {
          buttonStyle = { top: `${bottom}px`, left: `${right}px` };
        }
        break;
      }
    }
  }

  applyStyles(container, containerStyle);
  return { containerStyle, buttonStyle };
};
