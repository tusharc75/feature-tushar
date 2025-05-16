import { Close } from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';
import { useCallback, useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { useInforSidebar } from 'src/components/InfoSidebar';
import useLockBodyScroll from 'src/hooks/useLockBodyScroll';
import { useWindowScroll } from 'src/hooks/useWindowScroll';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const InfoSidebar = () => {
  const [store, setStore] = useInforSidebar((store) => store.data);

  const [{ y }] = useWindowScroll();
  const toastConfig = useContext(CustomToastContext);

  const [resourceData, setResourceData] = useState({ actionName: '', content: '' });
  const [isLoading, setIsLoading] = useState(false);

  useLockBodyScroll();

  useEffect(() => {
    if (store) {
      setIsLoading(true)
      axiosInstance().get(`/resource-information/actions?resource=${store.resource}&actionId=${store.actionId}`)
        .then(({ data: { data } }) => {
          if (data?.content) {
            setResourceData({ actionName: data?.actionName, content: data?.content })
          }
          else {
            setResourceData({ actionName: '', content: 'No information available' })
          }
          setIsLoading(false)
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
          setIsLoading(false)
        });
    }
  }, [store]);

  const handleClose = useCallback(() => {
    setStore({ data: null });
  }, [setStore]);

  console.log(resourceData)

  return (
    <div className="max-h-[calc(100vh-111px)] flex-grow [--px:8px] [--py:8px] md:max-h-[calc(100vh-64px)] " style={{ marginTop: y }}>
      <div className="flex items-center justify-between gap-2 border-b px-[--px] py-[--py]">
        <h6 className="line-clamp-1 text-base font-semibold">{resourceData?.actionName}</h6>
        <IconButton color="primary" size="small" onClick={handleClose} sx={{ borderRadius: '5px' }}>
          <Close />
        </IconButton>
      </div>
      {isLoading ? <Box p={2} >
        <CommonSkeleton sm={12} md={12} lg={12} xs={12} lenArray={[...Array(10).keys()]} />
      </Box> :
        <div className="content px-[--px] py-[--py]" dangerouslySetInnerHTML={{ __html: resourceData?.content }} />
      }
    </div>
  );
};

export default InfoSidebar;
