import { useContext, useEffect, useState, FC, Fragment } from 'react';
import { Dialog, Button, Box, TextField, Grid, IconButton } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { Add, Delete } from '@material-ui/icons';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { generateUniqueId, packages, product } from '../../constants/helpers';

type DialogProps = {
  ids: string | string[];
  onClose: VoidFunction;
  onSuccess: VoidFunction;
  resource: string;
  title: string;
  label: string;
  resourceData: any[];
};

interface FormData {
  resource: {
    name: string;
    id: string;
  };
  id: string;
  qty: number;
}

interface ResourceType {
  name: string;
  id: string;
}

const AssingQuantityDialog: FC<DialogProps> = (props) => {
  const { ids, onClose, onSuccess, title, label, resource, resourceData: newResourceData } = props;
  const { setToastConfig } = useContext(CustomToastContext);
  const [resourceData, setResourceData] = useState<ResourceType[]>([]);
  const [isSubmitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData[]>([
    {
      id: generateUniqueId(),
      resource: null,
      qty: 0
    }
  ]);

  useEffect(() => {
    if (newResourceData.length > 0) {
      let existingData = [];
      if (resource.includes('product')) {
        existingData = newResourceData.map(({ product, qty }) => ({
          id: product._id,
          resource: {
            name: product.productName,
            id: product._id
          },
          qty
        }));
      } else {
        existingData = newResourceData.map(({ wareHouse, qty }) => ({
          id: wareHouse._id,
          resource: {
            name: wareHouse.warehouseName,
            id: wareHouse._id
          },
          qty
        }));
      }

      setFormData(existingData);
    }
  }, [newResourceData]);

  useEffect(() => {
    (() => {
      axiosInstance()
        .get(`${resource}?limit=0`)
        .then(({ data: { data } }) => {
          let existingData = [];
          if (newResourceData.length > 0) {
            existingData = newResourceData.map((resource) => {
              if (resource.includes('warehouse')) {
                return resource.wareHouse;
              } else {
                return resource.product;
              }
            });
          }

          if (resource.includes('warehouse')) {
            let warehouses = [];
            if (existingData.length > 0) {
              warehouses = data
                .map((_d) => ({ id: _d._id, name: _d.warehouseName }))
                .filter((w) => existingData.filter((d) => d.id !== w.id).length > 0);
            } else {
              warehouses = data.map((_d) => ({ id: _d._id, name: _d.warehouseName }));
            }
            setResourceData(warehouses);
          } else {
            let products = [];
            if (existingData.length > 0) {
              products = data.map((_d) => ({ id: _d._id, name: _d.productName }))
                .filter((p) => existingData.filter((d) => d.id !== p.id).length > 0);
            } else {
              products = data.map((_d) => ({ id: _d._id, name: _d.productName }));
            }
            setResourceData(products);
          }
        })
        .catch((err) => {
          setToastConfig(err);
        });
    })();
  }, []);

  const submitForm = () => {
    setSubmitting(true);
    if (resource.includes('product')) {
      axiosInstance()
        .post(`${packages.packageApi}/add-products`, {
          ids: ids,
          products: formData.map((d) => ({ product: d.resource.id, qty: d.qty }))
        })
        .then(() => {
          setSubmitting(false);
          onSuccess();
        })
        .catch((err) => {
          setSubmitting(false);
          setToastConfig(err);
        });
    } else {
      axiosInstance()
        .put(`${product.api}/stock`, {
          _id: ids,
          stock: formData.map((d) => ({ warehouse: d.resource.id, qty: d.qty }))
        })
        .then(() => {
          setSubmitting(false);
          onSuccess();
        })
        .catch((err) => {
          setSubmitting(false);
          setToastConfig(err);
        });
    }
  };

  const handleChange = (name: string, data: FormData, val: any) => {
    if (name === 'resource') {
      setResourceData((prevState) => {
        const updatedArr = prevState.filter((state) => state.id !== val.id);
        return updatedArr;
      });
    }

    setFormData((prevState) => {
      const updatedState = prevState.map((state) => {
        if (state.id === data.id) {
          state[name] = val;
        }
        return state;
      });

      return updatedState;
    });
  };

  return (
    <Dialog open fullWidth maxWidth="md" onClose={onClose}>
      <CustomDialogHeader title={title} onClose={onClose} />
      <CustomDialogContent>
        <Box p={2}>
          <Grid container spacing={2}>
            {formData.map((form, indx) => (
              <Fragment key={form.id}>
                <Grid item xs={5} sm={5}>
                  <Autocomplete
                    fullWidth
                    size="small"
                    options={resourceData}
                    value={form.resource}
                    getOptionLabel={(option) => option?.name}
                    getOptionSelected={(option, value) => option.id === value.id}
                    onChange={(_, val) => {
                      handleChange('resource', form, val);
                    }}
                    renderInput={(params) => <TextField {...params} variant="outlined" required label={label} />}
                  />
                </Grid>
                <Grid item xs={5} sm={5}>
                  <TextField
                    size="small"
                    fullWidth
                    value={form.qty}
                    type="number"
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val > 0) {
                        handleChange('qty', form, val);
                      }
                    }}
                    variant="outlined"
                    required
                    label="Quantity"
                  />
                </Grid>
                <Grid item xs={2} sm={2}>
                  <Box display="flex" justifyContent="flex-end" alignItems="center">
                    <IconButton
                      size="small"
                      color="primary"
                      disabled={!Boolean(form.resource) || !Boolean(form.qty)}
                      onClick={() => {
                        setFormData((prevState) => [...prevState, { id: generateUniqueId(), resource: null, qty: 0 }]);
                      }}
                    >
                      <Add color={!Boolean(form.resource) || !Boolean(form.qty) ? 'disabled' : `primary`} />
                    </IconButton>
                    {indx !== 0 && (
                      <Box ml={2}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            setFormData((prevState) => {
                              const updatedArr = prevState.filter((s) => s.id !== form.id);
                              return updatedArr;
                            });
                          }}
                        >
                          <Delete color="error" />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                </Grid>
              </Fragment>
            ))}
          </Grid>
        </Box>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button variant="outlined" disabled={isSubmitting} color="primary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={submitForm}
          variant="contained"
          disabled={isSubmitting || !Boolean(formData[formData.length - 1].resource) || !Boolean(formData[formData.length - 1].qty)}
          color="primary"
        >
          Save
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default AssingQuantityDialog;
