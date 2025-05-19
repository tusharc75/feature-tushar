import { useState, useEffect, useContext } from 'react';
import { Box, IconButton } from '@mui/material';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import TinyMce from './../../components/TinyMCE';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import Grid from '@mui/material/Grid2';
import RefreshIcon from '@mui/icons-material/Refresh';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { displayDateTime } from 'src/constants/helpers';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const Comments = ({ uniqueId }) => {
  const toastConfig = useContext(CustomToastContext);
  const [data, setData] = useState(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setData(null);
    let url = `${routes.supportTicket.path}/${uniqueId}/comment`;
    axiosInstance()
      .get(url)
      .then(({ data: { data } }) => {
        if (data && data?.length) {
          setData(data);
        } else {
          setData([]);
        }
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    axiosInstance()
      .post(`${routes.supportTicket.path}/${uniqueId}/comment`, {
        comment: comment
      })
      .then(({ data: { data } }) => {
        fetchData();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
    setComment('');
  };

  return (
    <div className="relative">
      <span className="absolute right-0 top-0 z-[1] flex size-[40px] items-center justify-center rounded-full bg-[var(--dark-secondary,white)] shadow-md">
        <HtmlTooltip className="size-[30px]" title={'Refresh'}>
          <IconButton size="small" onClick={() => fetchData()} style={{ marginRight: '16px' }}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </HtmlTooltip>
      </span>

      {data ? (
        <>
          <div className="[scrollbar-gutter: stable] relative mb-2 max-h-[calc(100vh-500px)] min-h-[300px] space-y-2 overflow-y-auto px-2">
            {data.length > 0 ? (
              data.map((item: any) => (
                <div key={item._id} className="rounded-md border p-2">
                  <p className="mb-2 flex flex-wrap gap-[10px] text-[13px] text-[var(--primary-text)] ">
                    <span className="font-semibold">{item?.user?.optionLabel}</span>
                    <span className="ml-2 text-[#969696] dark:text-gray-400">{displayDateTime(item.date)}</span>
                  </p>
                  <div
                    className="max-image [&_*:last-child]:mb-0"
                    dangerouslySetInnerHTML={{
                      __html: item?.comment
                    }}
                  />
                </div>
              ))
            ) : (
              <div className="absolute left-1/2 top-1/2 select-none text-gray-500 [transform:translate(-50%,-50%)]">No Data Found</div>
            )}
          </div>
          <Grid style={{ marginTop: data?.length > 0 ? '5px' : '0' }} container justifyContent="center" alignItems="center" spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TinyMce
                id="comment"
                onChange={(value) => {
                  setComment(value);
                }}
                initialValue={''}
                height={200}
                doNotShowUploadFile={true}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <ThemeButton disabled={comment === ''} buttonType="theme" onClick={handleSubmit}>
                Send
              </ThemeButton>
            </Grid>
          </Grid>
        </>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </div>
  );
};
export default Comments;
