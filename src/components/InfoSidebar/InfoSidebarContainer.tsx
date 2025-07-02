import React from 'react';
import InfoSidebar from 'src/components/InfoSidebar/InfoSidebar';
import { useInforSidebar } from 'src/components/InfoSidebar/store';
import { cn } from 'src/constants/helpers';

const InfoSidebarContainer = () => {
  const [infoSidebarData] = useInforSidebar((state) => state.data);
  const [content] = useInforSidebar((state) => state.content);
  return (
    <div
      className={cn(
        'max-sm: absolute bottom-0 right-0 top-0 flex h-screen flex-shrink-0 overflow-hidden transition-[width] duration-0 motion-safe:duration-300 sm:static',
        infoSidebarData || content ? 'w-[--info-sidebar-w]' : 'w-0'
      )}
    >
      <div className="sticky top-0 z-10 flex w-[--info-sidebar-w] flex-grow border bg-[var(--dark-primary,white)]">
        {(infoSidebarData || content) && <InfoSidebar />}
      </div>
    </div>
  );
};

export default InfoSidebarContainer;
