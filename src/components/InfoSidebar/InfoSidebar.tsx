import { Close } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { useCallback, useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { useInforSidebar } from 'src/components/InfoSidebar';
import useLockBodyScroll from 'src/hooks/useLockBodyScroll';
import { useWindowScroll } from 'src/hooks/useWindowScroll';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const InfoSidebar = () => {
  const [store, setStore] = useInforSidebar((store) => store.data);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [{ y }] = useWindowScroll();
  const toastConfig = useContext(CustomToastContext);

  useLockBodyScroll();

  useEffect(() => {
    if (store) {
      axiosInstance()
        .get(`/resource-information/actions?resource=${store.resource}&actionId=${store.actionId}`)
        .then(({ data: { data } }) => {
        if (data.length) {
          setTitle(data.actionName);
          setContent(data.content);
        } else {
          setTitle('No information found');
          setContent('<p>No content available.</p>');
        }
        })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
    }
  }, [store]);

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
      <div className="content px-[--px] py-[--py]" dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
};

export default InfoSidebar;
