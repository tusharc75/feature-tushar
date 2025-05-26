import { Avatar, Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { formatAmountWithCurrency } from 'src/constants/helpers';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { isMobile, isTablet } from 'react-device-detect';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { useAppTheme } from 'src/constants/AppConfig';
import DashboardModal from 'src/components/DashboardModal';
import genieImage from 'src/assets/dashboard_images/sidebar/genie.svg';

const AiPriceSuggestionsDialog = ({ quotationData, handleClose }) => {

  const [aiPriceSuggestions, setAiPriceSuggestions] = useState([]);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [loading, setLoading] = useState(false);
  const [themeColor] = useAppTheme();

  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    if (quotationData) {
      fetchData();
    }
  }, [quotationData]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response: any = await axiosInstance().get(`/quotation/suggestion/material/${quotationData?._id}`);
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
          fullScreen: fullScreen || isMobile || isTablet,
          maxWidth: 'sm'
        }}
        modalHead={{
          title: `AI Price Suggestions`,
          icon: <Avatar src={genieImage} />,
          fullScreenOption: true
        }}
      >
        {!loading ? (
          <Grid container spacing={1}>
            <table className="w-full text-left text-sm rtl:text-right">
              <thead className={`text-xs uppercase ${themeColor === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-50 text-gray-700'}`}>
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Average Price
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Maximum Price
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Minimum Price
                  </th>
                </tr>
              </thead>
              <tbody>
                {aiPriceSuggestions.map((suggestion) => (
                  <tr
                    key={suggestion.id}
                    className={`border-b ${themeColor === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}
                  >
                    <th
                      scope="row"
                      className={`whitespace-nowrap px-6 py-4 font-medium ${themeColor === 'dark' ? 'text-white' : 'text-gray-900'}`}
                    >
                      {suggestion?.product?.optionLabel}
                    </th>
                    <td className={`px-6 py-4 ${themeColor === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatAmountWithCurrency(quotationData?.currency, suggestion?.averagePrice || 0)?.fullFormatAmount || ''}
                    </td>
                    <td className={`px-6 py-4 ${themeColor === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatAmountWithCurrency(quotationData?.currency, suggestion?.maxPrice || 0)?.fullFormatAmount || ''}
                    </td>
                    <td className={`px-6 py-4 ${themeColor === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatAmountWithCurrency(quotationData?.currency, suggestion?.minPrice || 0)?.fullFormatAmount || ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Grid>
        ) : (
          <Box height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </DashboardModal>

    </>
  );
};

export default AiPriceSuggestionsDialog;
