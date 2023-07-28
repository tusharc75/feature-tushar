import React from 'react';

interface CollapseProps {
  minHeight?: number | 'auto';
  collapsed?: boolean;
  childClassName: string;
  iscollapsible?: boolean;
}
type CollpasebleElement = HTMLDivElement;

const useCollapse = ({ minHeight = 'auto', collapsed = false, childClassName, iscollapsible = true }: CollapseProps) => {
  const containerRef = React.useRef<CollpasebleElement>(null);
  const [firstElementHeight, setFirstElementHeight] = React.useState<number>(61);

  function collapseSection(element: CollpasebleElement) {
    const sectionHeight = element.scrollHeight;
    const elementTransition = element.style.transition;
    element.style.transition = '';
    element.style.overflow = 'hidden';

    requestAnimationFrame(function () {
      element.style.height = sectionHeight + 'px';
      element.style.transition = elementTransition;
      requestAnimationFrame(function () {
        element.style.height = minHeight === 'auto' ? firstElementHeight + 'px' : minHeight + 'px';
      });
    });
    element.setAttribute('data-collapsed', 'true');
  }

  function expandSection(element: CollpasebleElement) {
    const sectionHeight = element.scrollHeight;

    const transitionComplete = () => {
      element.style.height = null;
      element.style.overflow = null;
      element.removeEventListener('transitionend', transitionComplete);
    };
    element.style.height = sectionHeight + 'px';
    element.addEventListener('transitionend', transitionComplete, false);
    element.setAttribute('data-collapsed', 'false');

    // useEffect cleanup
    return () => element.removeEventListener('transitionend', transitionComplete);
  }

  const getFirstElementHeight = (element: CollpasebleElement) => {
    if (!childClassName || childClassName === '') return;
    const heightOffset = 20;
    const firstElement = element.querySelector('.' + childClassName + ':first-child');
    if (firstElement) {
      setFirstElementHeight(firstElement.clientHeight - heightOffset);
    }
  };

  React.useLayoutEffect(() => {
    if (iscollapsible) {
      if (containerRef.current) getFirstElementHeight(containerRef.current);
      if (collapsed && containerRef.current) {
        collapseSection(containerRef.current);
      }
      if (!collapsed && containerRef.current) {
        expandSection(containerRef.current);
      }
    }
  }, [collapsed]);

  return containerRef;
};

export default useCollapse;
