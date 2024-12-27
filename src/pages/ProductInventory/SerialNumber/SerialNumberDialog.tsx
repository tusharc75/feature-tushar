import { useState, useEffect } from 'react';
import { Box, Button, TextField } from '@mui/material';
import Grid from '@mui/material/Grid2';
import Dialog from '@mui/material/Dialog';
import { CustomDialogTransition, productInventory, sidebarResource } from '../../../constants/helpers';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import History from './index';
import axiosInstance from 'src/axios/axiosInstance';
import AddSerialNumber from './AddSerialNumber';
import Autocomplete from '@mui/material/Autocomplete';
import { useData } from 'src/StateProvider/Provider';

const SerialNumberDialog = ({ close, product, warehouse, productName }) => {
  const {
    state: { resources }
  }: any = useData();

  const [serialNumberCount, setSerialNumberCount] = useState(0);
  const [addserialNumber, setAddserialNumber] = useState(false);
  const [refresh, setRefresh] = useState(true);
  const [warehouseOptions, setWarehouseOptions] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(warehouse && warehouse?.split(',')?.length === 1 ? warehouse : 'All');

  useEffect(() => {
    if (selectedWarehouse == 'All') {
      setSerialNumberCount(0);
    } else {
      fetchRecords();
    }
  }, [selectedWarehouse]);

  useEffect(() => {
    getWarehouse();
  }, []);

  const getWarehouse = () => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=${sidebarResource.warehouse}`)
      .then(({ data: { data } }) => {
        setWarehouseOptions([{ optionLabel: 'All', optionValue: 'All' }, ...data[sidebarResource.warehouse]]);
      });
  };

  const fetchRecords = () => {
    let api = `${productInventory.api}/product/${product}?warehouse=${selectedWarehouse}`;
    axiosInstance()
      .get(api)
      .then(({ data: { data } }) => {
        const count = data?.inventory - (data?.softHold || 0) - data?.serialNumber;
        if (count > 0) {
          setSerialNumberCount(count);
        } else {
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
          <Grid size={{xs:6, sm:6}}>
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
          </Grid>
          <Grid size={{xs:6, sm:6}}>
            <Grid container direction="row" justifyContent="flex-end" alignItems="center">
              {serialNumberCount ? (
                <Box>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => {
                      setAddserialNumber(true);
                    }}
                    aria-controls="action-menu"
                  >
                    Add Serial Numbers
                  </Button>
                </Box>
              ) : null}
            </Grid>
          </Grid>
        </Grid>
        {refresh ? <History product={product} warehouse={selectedWarehouse === 'All' ? null : selectedWarehouse} /> : null}
      </CustomDialogContent>
      {addserialNumber && (
        <AddSerialNumber
          product={product}
          warehouse={selectedWarehouse}
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
