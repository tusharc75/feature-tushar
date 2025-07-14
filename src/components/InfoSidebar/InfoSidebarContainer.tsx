import React, { useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import axiosInstance from 'src/axios/axiosInstance';
import InfoSidebar from 'src/components/InfoSidebar/InfoSidebar';
import { useInforSidebar } from 'src/components/InfoSidebar/store';
import { cn } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const InfoSidebarContainer = () => {
  const [item, setStore] = useInforSidebar((state) => state.item);
  const cache = useRef<Record<string, string>>({});
  const toastConfig = useContext(CustomToastContext);

  const [fullScreen, setFullScreen] = useState(false);

  useEffect(() => {
    if (!item) setFullScreen(false);
  }, [item]);

  useEffect(() => {
    if (item) {
      const api = `/resource-information/actions?resourceId=${item.resourceId}&actionId=${item._id}`;
      if (cache.current[api]) {
        setStore({ content: cache.current[api] });
      } else {
        axiosInstance()
          .get(api)
          .then(({ data: { data } }) => {
            if (data?.content) {
              cache.current[api] = data?.content;
            } else {
              cache.current[api] = 'No information available';
            }
            setStore({ content: cache.current[api] });
          })
          .catch((err) => {
            toastConfig.setToastConfig(err);
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?._id]);

  if (fullScreen && item) {
    return createPortal(
      <div className="fixed inset-0 z-[1300] bg-[var(--dark-primary,white)]">
        <InfoSidebar toggleFullScreen={() => setFullScreen((prev) => !prev)} isFullScreen={fullScreen} />
      </div>,
      document.body
    );
  }

  return (
    <div
      className={cn(
        'max-sm: absolute bottom-0 right-0 top-0 flex h-screen flex-shrink-0 overflow-hidden transition-[width] duration-0 motion-safe:duration-300 sm:static',
        item ? 'w-[--info-sidebar-w]' : 'w-0'
      )}
    >
      <div className="sticky top-0 z-10 flex w-[--info-sidebar-w] flex-grow border bg-[var(--dark-primary,white)]">
        {item && <InfoSidebar toggleFullScreen={() => setFullScreen((prev) => !prev)} isFullScreen={fullScreen} />}
      </div>
    </div>
  );
};

export default InfoSidebarContainer;
