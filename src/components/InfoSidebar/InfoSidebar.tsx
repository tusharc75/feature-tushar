import { Close } from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';
import { useCallback } from 'react';
import { FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { useInforSidebar } from 'src/components/InfoSidebar';
import useLockBodyScroll from 'src/hooks/useLockBodyScroll';
import { useWindowScroll } from 'src/hooks/useWindowScroll';

const InfoSidebar = ({ isFullScreen, toggleFullScreen }: { toggleFullScreen: () => void; isFullScreen: boolean }) => {
  const [{ content, item }, setStore] = useInforSidebar((store) => store);

  const [{ y }] = useWindowScroll();

  useLockBodyScroll();

  const handleClose = useCallback(() => {
    setStore({ item: null });
  }, [setStore]);

  return (
    <div className="flex max-h-[calc(100vh-111px)] flex-grow flex-col [--px:8px] [--py:8px] md:max-h-[calc(100vh-64px)] " style={{ marginTop: y }}>
      <div className="flex items-center justify-between gap-2 border-b px-[--px] py-[--py]">
        <h6 className="line-clamp-1 text-base font-semibold">{item?.actionName}</h6>
        <div className="flex flex-shrink-0 items-center">
          <IconButton onClick={toggleFullScreen} color="primary" size="small">
            {!isFullScreen ? <FiMaximize2 /> : <FiMinimize2 />}
          </IconButton>
          <IconButton color="primary" size="small" onClick={handleClose} sx={{ borderRadius: '5px' }}>
            <Close />
          </IconButton>
        </div>
      </div>
      {!content ? (
        <Box p={2}>
          <CommonSkeleton sm={12} md={12} lg={12} xs={12} lenArray={[...Array(10).keys()]} />
        </Box>
      ) : (
        <div className="content flex-grow overflow-y-auto px-[--px] py-[--py] [&_img]:!max-w-full" dangerouslySetInnerHTML={{ __html: content }} />
      )}
    </div>
  );
};

export default InfoSidebar;
