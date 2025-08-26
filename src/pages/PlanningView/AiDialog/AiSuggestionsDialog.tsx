import { Avatar, Box } from '@mui/material';
import { cn } from 'src/constants/helpers';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { isMobile, isTablet } from 'react-device-detect';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { useAppTheme } from 'src/constants/AppConfig';
import DashboardModal from 'src/components/DashboardModal';
import genieImage from 'src/assets/dashboard_images/sidebar/genie.svg';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const AiSuggestionsDialog = ({ handleClose, productIds, dateRange }) => {

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [themeColor] = useAppTheme();

  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    if (productIds && productIds.length > 0 && dateRange) {
      fetchData();
    }
  }, []);


  const fetchData = async () => {
    setLoading(true);
    const apiDateRange = {
      from: dateRange.estimateStartDate,
      to: dateRange.estimateEndDate,
    };
    try {
      const response: any = await axiosInstance().get(
        `/generative-ai/planning-view/suggestion?product=${productIds.join(',')}&date=${JSON.stringify(apiDateRange)}`
      );
      setData(response?.data?.data)
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
      setLoading(false);
    }
  };

  return (
    <>
      <DashboardModal
        handleClose={handleClose}
        open={true}
        dialogProps={{
          fullScreen: isMobile || isTablet,
          maxWidth: 'sm'
        }}
        modalHead={{
          title: (
            <span
              className={cn(
                `[--border-gradient:91deg,_#1588CB_0.01%,_#A066B1_33.01%,_#FD3295_66%,_rgba(255,_69,_0,_0.50)_100%]`,
                'gradient-text [-webkit-text-fill-color:transparent] [background:linear-gradient(var(--border-gradient))]',
                ''
              )}
            >
              AI Suggestions
            </span>
          ),
          icon: <Avatar src={genieImage} />,
          fullScreenOption: true
        }}
      >
        {!loading ? (
          data ? (
            <Box ml={2}>
              <Markdown remarkPlugins={[remarkGfm]}>{data}</Markdown>
            </Box>
          ) : (
            <div className="flex min-h-[230px] items-center justify-center">
              <p className="text-gray-500">No suggestions available</p>
            </div>
          )
        ) : (
          <Box height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </DashboardModal>
    </>
  );
};

export default AiSuggestionsDialog;
