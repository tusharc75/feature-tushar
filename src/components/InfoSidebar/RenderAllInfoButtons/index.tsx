import { useEffect, useMemo, useState } from 'react';
import { createPortal, render } from 'react-dom';
import { useUrlParser } from 'src/components/InfoSidebar/RenderAllInfoButtons/hooks';
import { tempInfoData } from 'src/components/InfoSidebar/RenderAllInfoButtons/tempData';
import { RenderInfoButton } from 'src/components/InfoSidebar/RenderAllInfoButtons/templates';
import { useInforSidebar } from 'src/components/InfoSidebar/store';
import { applyStyles } from 'src/components/InfoSidebar/utils';
import { throttle } from 'src/hooks/useThrottle';

const callback = (
  mutationList: MutationRecord[],
  observer: MutationObserver,
  onChildChange: (mutationList: MutationRecord[], observer: MutationObserver) => void
) => {
  for (const mutation of mutationList) {
    if (mutation.type === 'childList') {
      onChildChange(mutationList, observer);
      // console.log('A child node has been added or removed in the root element.');
    }
  }
};

const RenderAllInfoButtons = () => {
  const parsedUrl = useUrlParser();
  const data = useMemo(() => tempInfoData.filter((d) => d.url === parsedUrl), [parsedUrl]);
  const [changedSignal, setChangedSignal] = useState(0);
  const [, setStore] = useInforSidebar((state) => state.data);

  useEffect(() => {
    const root = document.querySelector('#root');
    if (!root) return;

    const onChildChange = throttle(() => {
      setChangedSignal((prev) => (prev > 10 ? 0 : prev + 1));
    });

    const observer = new MutationObserver((mutationList, observer) => callback(mutationList, observer, onChildChange));
    observer.observe(root, {
      childList: true,
      attributes: true,
      characterData: true,
      subtree: true // optional: observes deeper levels
    });

    return () => {
      observer.disconnect();
    };
  }, [data]);

  useEffect(() => {
    const handleInsert = () => {
      for (const d of data) {
        const element = document.querySelector<HTMLElement>(d.itemSelector);
        if (!element) continue;
        if (element.querySelector(`#info-sidebar-button-${d._id}`)) continue;
        applyStyles(element, { ...d.anchorElementPadding, position: 'relative' });
        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('info-sidebar-action-container');
        buttonContainer.id = `info-sidebar-button-${d._id}`;
        applyStyles(buttonContainer, { ...d.buttonPosition, position: 'absolute' });

        element.appendChild(buttonContainer);
        render(
          createPortal(
            <RenderInfoButton
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setStore({ content: d.data });
              }}
            />,
            buttonContainer
          ),
          buttonContainer
        );
        console.log(element);
      }
    };
    if (data.length > 0) {
      handleInsert();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changedSignal, data]);

  return null; // cleaner than empty fragment for no rendering
};

export default RenderAllInfoButtons;
