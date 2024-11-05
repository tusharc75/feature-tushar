import { Box, Button, Dialog, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';
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
      .catch((error) => {});
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
            getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
            renderInput={(props) => <TextField {...props} placeholder={''} variant="outlined" name="package" label="Select Package" />}
          />
        </Box>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button variant="outlined" color="primary" size="small" onClick={onClose}>
          Cancel
        </Button>
        <CustomButton
          loading={false}
          variant="contained"
          color="primary"
          onClick={(e) => {
            onSuccess(selectedPackage);
          }}
        >
          Save
        </CustomButton>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default PackageDialog;
