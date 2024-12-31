import { Box, Dialog, TextField } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { CustomDialogTransition, MATERIAL_TYPE, rentalManagement } from 'src/constants/helpers';

const PackageDialog = ({ onClose, rentalManagementData, onSuccess }) => {
  const [packageOptions, setPackageOptions] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);

  useEffect(() => {
    fetchData();
  }, [rentalManagementData]);

  const fetchData = () => {
    axiosInstance()
      .get(`${rentalManagement.api}/productpackage/${rentalManagementData._id}`)
      .then(({ data: { data } }) => {
        setPackageOptions(
          data?.material
            ?.filter((m) => m?.type === MATERIAL_TYPE.package && m?.packageDetail?.packageType === 'Product')
            ?.map((m) => ({ optionLabel: m?.packageDetail?.packageName, optionValue: m?._id }))
        );
      })
      .catch((error) => { });
  };

  return (
    <Dialog
      maxWidth="sm"
      fullScreen={isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
    >
      <CustomDialogHeader onClose={onClose} title={`Select Package`} showRequiredLabel={false} showManimizeMaximize={false} />
      <CustomDialogContent>
        <Box m={1}>
          <Autocomplete
            size="small"
            options={packageOptions || []}
            value={selectedPackage}
            onChange={(_, val) => {
              setSelectedPackage(val);
            }}
            getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
            isOptionEqualToValue={(option: any, val: any) => option.optionValue === val.optionValue}
            renderInput={(props) => <TextField {...props} placeholder={''} variant="outlined" name="package" label="Select Package" />}
          />
        </Box>
      </CustomDialogContent>
      <CustomDialogFooter>
        <ThemeButton buttonType="transparent" onClick={onClose}>
          Cancel
        </ThemeButton>
        <ThemeButton
          isLoading={false}
          buttonType="theme"
          onClick={(e) => {
            onSuccess(selectedPackage);
          }}
        >
          Save
        </ThemeButton>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default PackageDialog;
