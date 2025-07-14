import { HelpOutline } from '@mui/icons-material';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { useInforSidebar } from 'src/components/InfoSidebar/store';
import { Action, ApiFormData } from 'src/components/InfoSidebar/types';
import { getStylesReactMethod } from 'src/components/InfoSidebar/utils';

const InfoButton = ({ item }: { item: Partial<Action | ApiFormData> }) => {
  const { anchorElementPadding, autoPosition, buttonPosition, insideAnchor, manualPosition, targetSelector, _id } = item;
  const [, setStore] = useInforSidebar((state) => state.item);
  const targetElement = useMemo(() => document.querySelector(targetSelector) as HTMLElement | null, [targetSelector]);
  const containerRef = useRef<HTMLElement | null>(null);

  const handleClick = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setStore({ item: item as ApiFormData });
    },
    [item, setStore]
  );

  // Create a dedicated portal wrapper div
  const portalEl = useMemo(() => {
    const el = document.createElement('div');
    el.id = `info-sidebar-button-${_id}`;
    el.style.position = 'absolute';
    el.style.zIndex = '1100';
    return el;
  }, [_id]);

  // Mount & unmount the portal wrapper safely
  useEffect(() => {
    const parent = insideAnchor ? targetElement : document.body;
    if (!parent) return;

    containerRef.current = parent;
    parent.appendChild(portalEl);

    return () => {
      const mountedParent = containerRef.current;
      if (mountedParent?.contains(portalEl)) {
        mountedParent.removeChild(portalEl);
      }
    };
  }, [insideAnchor, targetElement, portalEl]);

  useLayoutEffect(() => {
    if (!targetElement) return;

    const { buttonStyle } = getStylesReactMethod({
      anchorElementPadding,
      autoPosition,
      buttonPosition,
      container: targetElement,
      id: _id,
      insideAnchor,
      manualPosition
    });

    Object.assign(portalEl.style, buttonStyle);
  }, [anchorElementPadding, autoPosition, buttonPosition, insideAnchor, manualPosition, targetElement, _id, portalEl]);

  // 6. If target element isn’t found, render nothing
  if (!targetElement) return null;

  return createPortal(
    <HtmlTooltip title={item.tooltip || 'Information'}>
      <button
        className="flex size-[30px] cursor-pointer items-center justify-center rounded-full bg-transparent transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        onClick={handleClick}
      >
        <HelpOutline fontSize="small" className="text-[var(--primary-text)]" />
      </button>
    </HtmlTooltip>,
    portalEl
  );
};

export default InfoButton;
