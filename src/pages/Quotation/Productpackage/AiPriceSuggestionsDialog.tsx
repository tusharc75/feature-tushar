import { Avatar, Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { cn, formatAmountWithCurrency } from 'src/constants/helpers';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { isMobile, isTablet } from 'react-device-detect';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { useAppTheme } from 'src/constants/AppConfig';
import DashboardModal from 'src/components/DashboardModal';
import genieImage from 'src/assets/dashboard_images/sidebar/genie.svg';

const AiPriceSuggestionsDialog = ({ quotationData, versionId, handleClose }) => {
  const [aiPriceSuggestions, setAiPriceSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    if (quotationData) {
      fetchData();
    }
  }, [quotationData]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response: any = await axiosInstance().get(`/generative-ai/quotation/price-suggestion/${quotationData?._id}/${versionId}`);
      setAiPriceSuggestions(response?.data?.data);
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
              AI Price Suggestions
            </span>
          ),
          icon: <Avatar src={genieImage} />,
          fullScreenOption: true
        }}
      >
        {!loading ? (
          aiPriceSuggestions.length > 0 ? (
            <Grid container spacing={1}>
              {aiPriceSuggestions?.map((ele) => (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border rounded-lg">
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4" colSpan={2}>
                          <p className="font-bold text-gray-800">{ele?.name}</p>
                        </td>
                      </tr>
                      {ele?.suggestions?.map((sug) => (
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatAmountWithCurrency(quotationData?.currency, sug?.price || 0)?.fullFormatAmount || ''}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{sug?.reasoning}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </Grid>
          ) : (
            <div className="flex min-h-[230px] items-center justify-center">
              <p>No data history found for this customer to suggest the price</p>
            </div>
          )
        ) : (
          <Box height={200}>
            <CommonSkeleton lenArray={[...Array(4).keys()]} />
          </Box>
        )}
      </DashboardModal>
    </>
  );
};

export default AiPriceSuggestionsDialog;
