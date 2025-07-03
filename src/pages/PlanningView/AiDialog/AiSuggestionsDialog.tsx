import { Avatar, Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { cn } from 'src/constants/helpers';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { isMobile, isTablet } from 'react-device-detect';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { useAppTheme } from 'src/constants/AppConfig';
import DashboardModal from 'src/components/DashboardModal';
import genieImage from 'src/assets/dashboard_images/sidebar/genie.svg';

const AiSuggestionsDialog = ({ handleClose, productIds, dateRange }) => {
  const [aiSuggestions, setAiSuggestions] = useState([]);
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
      setAiSuggestions((response?.data?.data).split(/\n|\. /).filter(Boolean)); // remove empty lines
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
          aiSuggestions ? (
            <Grid container spacing={1}>
              <table className="w-full text-left text-sm rtl:text-right">
                <thead
                  className={`text-xs uppercase ${themeColor === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-50 text-gray-700'
                    }`}
                >
                  <tr>
                    <th scope="col" className="px-6 py-3">#</th>
                    <th scope="col" className="px-6 py-3">Suggestion</th>
                  </tr>
                </thead>
                <tbody>
                  {aiSuggestions
                    .map((line, index) => (
                      <tr
                        key={index}
                        className={`border-b ${themeColor === 'dark'
                          ? 'border-gray-700 bg-gray-800'
                          : 'border-gray-200 bg-white'
                          }`}
                      >
                        <td
                          className={`px-6 py-4 font-medium ${themeColor === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}
                        >
                          {index + 1}
                        </td>
                        <td
                          className={`px-6 py-4 ${themeColor === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}
                        >
                          {line.trim()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </Grid>
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
