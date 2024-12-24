import { useContext, useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import { CustomDialogTransition, workOrder } from 'src/constants/helpers';
import { Box, Dialog, TextField } from '@mui/material';
import CustomButton from 'src/components/Helpers/CustomButton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import Autocomplete from '@mui/material/Autocomplete/Autocomplete';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import routes from 'src/components/Helpers/Routes';

const AssignWorkStationDialog = ({ warehouse, workOrderData, workStations, handleClose, handleSucess }) => {
  const toastConfig = useContext(CustomToastContext);
  const [workStationList, setworkStationList] = useState([]);
  const [selectedWorkStations, setSelectedWorkStations] = useState(workStations);

  useEffect(() => {
    fetchData();
  }, []);

  const getQueryString = () => {
    const filterByIds: any = [];

    filterByIds.push({
      field: 'warehouse',
      term: { $in: [warehouse] }
    });

    return `?filterById=${JSON.stringify(filterByIds)}&filterType=and`;
  };

  const fetchData = () => {
    const queryString = getQueryString();
    axiosInstance()
      .get(`${routes?.workStations.path}${queryString}`)
      .then(({ data: { data } }) => {
        const list = data?.data?.map((d) => {
          return {
            optionLabel: d?.workStationName,
            optionValue: d?._id
          };
        });
        setworkStationList(list);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleAssign = () => {
    const api = `${routes?.workOrder?.path}/service/assign-work-station`;
    const payload = {
      workStations: selectedWorkStations?.map((d) => d.optionValue),
      workOrder: workOrderData
    };
    axiosInstance()
      .put(api, payload)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        handleSucess();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
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
          handleClose();
        }
      }}
    >
      <CustomDialogHeader onClose={handleClose} title={`Assign Work Stations`} showRequiredLabel={false} showManimizeMaximize={false} />
      <CustomDialogContent>
        <Box m={1}>
          <Autocomplete
            size="small"
            options={workStationList}
            multiple
            value={selectedWorkStations}
            onChange={(_, val) => {
              setSelectedWorkStations(val);
            }}
            getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
            isOptionEqualToValue={(option: any, val: any) => option.optionValue === val.optionValue}
            renderInput={(props) => (
              <TextField {...props} placeholder={''} variant="outlined" name="workStationList" label={'Select Work Stations'} />
            )}
          />
        </Box>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button variant="outlined" color="primary" size="small" onClick={handleClose}>
          Cancel
        </Button>
        <CustomButton
          variant="contained"
          color="primary"
          type="submit"
          onClick={(e) => {
            e.preventDefault();
            handleAssign();
          }}
        >
          {' '}
          Save
        </CustomButton>
      </CustomDialogFooter>
    </Dialog>
  );
};
export default AssignWorkStationDialog;
