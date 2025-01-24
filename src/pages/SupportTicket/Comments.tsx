import { useState, useEffect, useContext } from 'react';
import { Box, IconButton } from '@mui/material';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
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
    <Box mt={2}>
      <div className="flex justify-end">
        <HtmlTooltip title={'Refresh'}>
          <IconButton size="small" onClick={() => fetchData()} style={{ marginRight: '16px' }}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </HtmlTooltip>
      </div>
      <CustomDialogContent style={{ padding: '18px 24px 12px', marginTop: '3px' }} isFooterPresent={false}>
        {data ? (
          <div>
            {data.map((item: any) => (
              <div key={item._id} className="mb-4 border border-[var(--common-border-color)] p-2">
                <div key={item._id} className="md:mb-[26px]">
                  <div className="mb-4 mt-[9px] flex flex-wrap justify-between gap-[10px] text-[13px] text-[var(--primary-text)] ">
                    <p>
                      <span className="font-semibold">{item?.user?.optionLabel}</span>
                      <span className="ml-2 text-[#969696] dark:text-gray-400">{displayDateTime(item.date)}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-start justify-between gap-4 md:gap-[32px]">
                    <div
                      className="max-image"
                      dangerouslySetInnerHTML={{
                        __html: item?.comment
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            <Grid style={{ marginTop: data?.length > 0 ? '5px' : '0' }} container justifyContent="center" alignItems="center" spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TinyMce
                  id="comment"
                  onChange={(value) => {
                    setComment(value);
                  }}
                  imageOrFileUploadCompletePercentage={(completePercentage) => null}
                  initialValue={''}
                  height={200}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <ThemeButton disabled={comment === ''} buttonType="theme" onClick={handleSubmit}>
                  Send
                </ThemeButton>
              </Grid>
            </Grid>
          </div>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomDialogContent>
    </Box>
  );
};
export default Comments;
