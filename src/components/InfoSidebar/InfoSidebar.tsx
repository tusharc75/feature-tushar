import { Close } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { useCallback } from 'react';
import { useInforSidebar } from 'src/components/InfoSidebar';
import useLockBodyScroll from 'src/hooks/useLockBodyScroll';
import { useWindowScroll } from 'src/hooks/useWindowScroll';

const InfoSidebar = () => {
  const [, setStore] = useInforSidebar((store) => store.data);
  const title = 'Info will be dynamic';
  const [{ y }] = useWindowScroll();

  useLockBodyScroll();

  const handleClose = useCallback(() => {
    setStore({ data: null });
  }, [setStore]);

  return (
    <div className="max-h-[calc(100vh-111px)] flex-grow [--px:8px] [--py:8px] md:max-h-[calc(100vh-64px)] " style={{ marginTop: y }}>
      <div className="flex items-center justify-between gap-2 border-b px-[--px] py-[--py]">
        <h6 className="line-clamp-1 text-base font-semibold">{title}</h6>
        <IconButton color="primary" size="small" onClick={handleClose} sx={{ borderRadius: '5px' }}>
          <Close />
        </IconButton>
      </div>
      <div className="content px-[--px] py-[--py]">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Minus fugiat veritatis earum! Porro delectus ullam saepe placeat impedit velit
        veritatis dolorem perferendis, eaque sunt repellendus tenetur maxime magni dignissimos nulla, hic suscipit ipsa, error esse officia. Doloribus
        ullam odit, similique totam maiores voluptas magni ratione sapiente cupiditate earum repudiandae accusamus.
      </div>
    </div>
  );
};

export default InfoSidebar;
