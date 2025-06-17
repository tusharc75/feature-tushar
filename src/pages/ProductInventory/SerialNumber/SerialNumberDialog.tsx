import { useState, useEffect } from 'react';
import { Box, TextField } from '@mui/material';
import Grid from '@mui/material/Grid2';
import Dialog from '@mui/material/Dialog';
import { CustomDialogTransition, productInventory, sidebarResource } from '../../../constants/helpers';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import SerialNumber from './index';
import axiosInstance from 'src/axios/axiosInstance';
import AddSerialNumber from './AddSerialNumber';
import Autocomplete from '@mui/material/Autocomplete';
import { useData } from 'src/StateProvider/Provider';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const SerialNumberDialog = ({ close, product, warehouse, productName }) => {
  const {
    state: { resources, user }
  }: any = useData();

  const [serialNumberCount, setSerialNumberCount] = useState(0);
  const [addserialNumber, setAddserialNumber] = useState(false);
  const [refresh, setRefresh] = useState(true);
  const [warehouseOptions, setWarehouseOptions] = useState(null);
  const [storageLocationOptions, setStorageLocationOptions] = useState([]);

  const [selectedWarehouse, setSelectedWarehouse] = useState(warehouse && warehouse?.split(',')?.length === 1 ? warehouse : 'All');
  const [selectedStorageLocation, setSelectedStorageLocation] = useState(null);

  useEffect(() => {
    if (selectedWarehouse == 'All') {
      setSerialNumberCount(0);
    } else {
      fetchRecords();
    }
  }, [selectedWarehouse, selectedStorageLocation]);

  useEffect(() => {
    getWarehouse();
  }, []);

  const getWarehouse = () => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=${sidebarResource.warehouse},${sidebarResource.storageLocation}`)
      .then(({ data: { data } }) => {
        setWarehouseOptions([{ optionLabel: 'All', optionValue: 'All' }, ...data[sidebarResource.warehouse]]);
        setStorageLocationOptions(data[sidebarResource.storageLocation]);
      });
  };

  const fetchRecords = () => {
    let api = `${productInventory.api}/product/${product}?warehouse=${selectedWarehouse}`;
    if (selectedStorageLocation) {
      api = `${api}&storageLocation=${selectedStorageLocation}`;
    }
    axiosInstance()
      .get(api)
      .then(({ data: { data } }) => {
        if (typeof data === 'object') {
          const count = data?.inventory - (data?.softHold || 0) - (data?.serialNumber || 0);
          if (count > 0) {
            setSerialNumberCount(count);
          } else {
            setSerialNumberCount(0);
          }
        }
        else {
          setSerialNumberCount(0);
        }
      })
      .catch((err) => { });
  };

  return (
    <Dialog fullScreen TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true} fullWidth>
      <CustomDialogHeader title={`Serial Numbers - ${productName}`} onClose={close} showRequiredLabel={false}></CustomDialogHeader>
      <CustomDialogContent isFooterPresent={false}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 6, sm: 6 }}>
            <div className='flex gap-2'>
              {warehouseOptions && (
                <Autocomplete
                  options={warehouseOptions}
                  getOptionLabel={(option: any) => option.optionLabel}
                  disableClearable
                  style={{ width: '300px' }}
                  isOptionEqualToValue={(option: any, val) => option.optionValue === val}
                  value={
                    warehouseOptions.filter((data) => data.optionValue === selectedWarehouse).length
                      ? warehouseOptions.filter((data) => data.optionValue === selectedWarehouse)[0]
                      : ''
                  }
                  onChange={(e, val) => {
                    if (val !== null) {
                      setSelectedWarehouse(val && val.optionValue ? val.optionValue : '');
                    }
                  }}
                  renderInput={(params) => (
                    <TextField {...params} margin="dense" size="small" name="plant" label={resources?.warehouse?.titleSingular} variant="outlined" fullWidth />
                  )}
                />
              )}
              {user?.user?.brandPolicy?.storageLocation && (
                <Autocomplete
                  style={{ width: '300px' }}
                  options={storageLocationOptions?.filter((e) => e.warehouse === selectedWarehouse)}
                  getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                  isOptionEqualToValue={(option: any, val) => option.optionValue === val}
                  value={
                    storageLocationOptions.filter((data) => data.optionValue === selectedStorageLocation).length
                      ? storageLocationOptions.filter((data) => data.optionValue === selectedStorageLocation)[0]
                      : ''
                  }
                  onChange={(e, val) => {
                    setSelectedStorageLocation(val?.optionValue);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      margin="dense"
                      size="small"
                      name="storageLocation"
                      label="Storage Location"
                      variant="outlined"
                      fullWidth
                    />
                  )}
                />
              )}
            </div>
          </Grid>
          <Grid size={{ xs: 6, sm: 6 }}>
            <Grid container direction="row" justifyContent="flex-end" alignItems="center">
              {serialNumberCount ? (
                <Box>
                  <ThemeButton
                    buttonType='theme'
                    onClick={() => {
                      setAddserialNumber(true);
                    }}
                  >
                    Add Serial Numbers
                  </ThemeButton>
                </Box>
              ) : null}
            </Grid>
          </Grid>
        </Grid>
        {refresh ? <SerialNumber
          product={product}
          warehouse={selectedWarehouse === 'All' ? null : selectedWarehouse}
          storageLocation={selectedStorageLocation}
        />
          : null}
      </CustomDialogContent>
      {addserialNumber && (
        <AddSerialNumber
          product={product}
          warehouse={selectedWarehouse}
          storageLocation={selectedStorageLocation}
          serialNumberCount={serialNumberCount}
          handleClose={() => setAddserialNumber(false)}
          handleSucess={() => {
            setAddserialNumber(false);
            fetchRecords();
            setRefresh(false);
            setRefresh(true);
          }}
        />
      )}
    </Dialog>
  );
};

export default SerialNumberDialog;
