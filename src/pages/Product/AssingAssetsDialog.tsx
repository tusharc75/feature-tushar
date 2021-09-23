import { useContext, useEffect, useState } from 'react';
import { Dialog, Button, Box, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';

const AssingAssetsDialog = (props) => {
  const { productId, onClose, onSuccess } = props;
  const { setToastConfig } = useContext(CustomToastContext);
  const [wHs, setWHs] = useState([]);
  const [warehouse, setWarehouse] = useState(null);
  const [qty, setQty] = useState(0);
  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    (() => {
      axiosInstance()
        .get(`/warehouse?limit=0`)
        .then(({ data: { data } }) => {
          const warehouses = data.map((_d) => ({ id: _d._id, name: _d.warehouseName }));
          setWHs(warehouses);
        })
        .catch((err) => {
          setToastConfig(err);
        });
    })();
  }, []);

  const submitForm = () => {
    setSubmitting(true);
    axiosInstance()
      .put(`/product/stock`, {
        _id: productId,
        stock: {
          warehouse: warehouse.id,
          qty
        }
      })
      .then(() => {
        setSubmitting(false);
        onSuccess();
      })
      .catch((err) => {
        setSubmitting(false);
        setToastConfig(err);
      });
  };

  return (
    <Dialog open fullWidth maxWidth="sm" onClose={onClose}>
      <CustomDialogHeader title="Assign To Warehouse" onClose={onClose} />
      <CustomDialogContent>
        <Box p={2}>
          <Autocomplete
            fullWidth
            size="small"
            options={wHs}
            value={warehouse}
            getOptionLabel={(option) => option?.name}
            onChange={(_, val) => {
              setWarehouse(val);
            }}
            renderInput={(params) => <TextField {...params} variant="outlined" required label="Selecte Warehouse" />}
          />

          <Box my={4} />
          <TextField
            size="small"
            fullWidth
            value={qty}
            type="number"
            onChange={(e) => setQty(parseInt(e.target.value))}
            variant="outlined"
            required
            label="Selecte Warehouse"
          />
        </Box>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button variant="outlined" disabled={isSubmitting} color="primary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submitForm} variant="contained" disabled={isSubmitting || !Boolean(warehouse) || !Boolean(qty)} color="primary">
          Save
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default AssingAssetsDialog;
