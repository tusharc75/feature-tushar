import { Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import Dialog from '@mui/material/Dialog';
import { CustomDialogTransition } from 'src/constants/helpers';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const AiPriceSuggestionsDialog = (props) => {
  const { setAiPriceSuggestionDialog, aiPriceSuggestionDialog, quoteData } = props;
  const [aiPriceSuggestions, setAiPriceSuggestions] = useState([]);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [loading, setLoading] = useState(false);

  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    if (quoteData) {
      fetchAiPrice();
    }
  }, [quoteData]);

  const fetchAiPrice = async () => {
    setLoading(true);
    try {
      const response: any = await axiosInstance().get(`/quotation/suggestion/material/${quoteData?._id}`);
      setAiPriceSuggestions(response?.data?.data);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog
        maxWidth={'md'}
        fullWidth={true}
        fullScreen={fullScreen || isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={aiPriceSuggestionDialog}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick') {
            setAiPriceSuggestionDialog(false);
          }
        }}
        disableEnforceFocus={true}
      >
        <CustomDialogHeader
          title={'AI Price Suggestions'}
          onClose={() => {
            setAiPriceSuggestionDialog(false);
          }}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen((prevState) => !prevState);
          }}
          showManimizeMaximize={true}
          showRequiredLabel={false}
        />

        <CustomDialogContent>
          {!loading ? (
            <Box padding={1}>
              <Grid container spacing={1}>
                <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400 rtl:text-right">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                      <th scope="col" className="px-6 py-3">
                        Product name
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Maximum Price
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Average Price
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Minimum Price
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiPriceSuggestions.map((suggestion) => (
                      <tr key={suggestion.id} className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                        <th scope="row" className="whitespace-nowrap px-6 py-4 font-medium text-gray-900 dark:text-white">
                          {suggestion?.product?.optionLabel}
                        </th>
                        <td className="px-6 py-4">{suggestion.maxPrice}</td>
                        <td className="px-6 py-4">{suggestion.averagePrice}</td>
                        <td className="px-6 py-4">{suggestion.minPrice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Grid>
            </Box>
          ) : (
            <Box height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </CustomDialogContent>

        <CustomDialogFooter>
          <ThemeButton
            buttonType="theme"
            onClick={() => {
              setAiPriceSuggestionDialog(false);
            }}
          >
            Close
          </ThemeButton>
        </CustomDialogFooter>
      </Dialog>
    </>
  );
};

export default AiPriceSuggestionsDialog;
