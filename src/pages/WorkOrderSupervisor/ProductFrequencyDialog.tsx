import { Fragment, useContext, useEffect, useState } from 'react';
import {
  CustomDialogTransition,
  getObjKeys,
  sidebarResource,
  yupSchema,
} from '../../constants/helpers';
import {
  Dialog,
  Button,
  Grid,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Table,
  Box,
  Typography,
  CircularProgress,
  Paper
} from '@material-ui/core';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import { Form, Formik } from 'formik';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import { isEqual } from 'lodash';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import routes from 'src/components/Helpers/Routes';
import InputField from 'src/components/Helpers/InputField';
import { isMobile, isTablet } from 'react-device-detect';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';
import CustomButton from 'src/components/Helpers/CustomButton';
import { Autocomplete } from '@material-ui/lab';


export default function ProductFrequencyDialog({ onClose, onSuccess }) {

  const toastConfig = useContext(CustomToastContext);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [productOptions, setProductOptions] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productServices, setProductServices] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    axiosInstance().get(`/sa-formbuilder/lookup?lookupResource=${sidebarResource.product}`).then(({ data: { data: lookupResource } }) => {
      setProductOptions(lookupResource['Product'])
    }).catch((err) => {
      toastConfig.setToastConfig(err);
    });
  }, []);

  useEffect(() => {
    fetchServices();
  }, [selectedProduct])

  const fetchServices = () => {
    if (selectedProduct) {
      setLoading(true);
      axiosInstance().get(`${routes.product.path}/${selectedProduct}/service-master`).then(({ data: { data } }) => {
        const services = data?.map((d) => {
          return {
            _id: d._id,
            name: d.serviceName,
            frequency: d.frequency || ''
          }
        })
        setProductServices(services);
      }).catch((err) => {
        toastConfig.setToastConfig(err);
      }).finally(() => {
        setLoading(false);
      })
    } else {
      setProductServices(null);
    }
  }

  const handleSubmit = () => {
    setSubmitting(true);
    const values = productServices?.map(p => ({ _id: p._id, frequency: p.frequency }));
    axiosInstance()
      .put(`${routes.product.path}/${selectedProduct}/service-master/update-service-data`, values)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setSubmitting(false);
        onSuccess();
      })
      .catch((err) => {
        setSubmitting(false);
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <Dialog
      TransitionComponent={CustomDialogTransition}
      open={true}
      aria-labelledby="customized-dialog-title"
      fullWidth
      fullScreen={fullScreen}
      maxWidth={'md'}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
        }
      }}
    >
      {productOptions?.length > 0 ?
        (
          <Fragment>
            <CustomDialogHeader
              onClose={() => {
                onClose();
              }}
              title={`Product Frequency`}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            />
            <CustomDialogContent>
              <div className="flex flex-col p-3">
                {productOptions && <Autocomplete
                  size="small"
                  style={{ width: '300px' }}
                  options={productOptions}
                  value={productOptions && productOptions.find((data) => data.optionValue === selectedProduct) ? productOptions.find((data) => data.optionValue === selectedProduct) : {}}
                  getOptionLabel={(option: any) => option?.optionLabel || ''}
                  getOptionSelected={(option: any, val) => (option ? option?.optionValue == val?.optionValue : false)}
                  onChange={(e, val) => {
                    setSelectedProduct(val?.optionValue);
                  }
                  }
                  renderInput={(params) => <TextField {...params} label="Select Product" variant="outlined" />}
                />}
                {selectedProduct ? (
                  !loading ? (
                    productServices?.length ? (
                      <TableContainer style={{ marginTop: '16px' }} component={Paper}>
                        <Table aria-label="customized table">
                          <TableHead>
                            <TableRow>
                              <TableCell style={{ width: '50%' }}>Service</TableCell>
                              <TableCell style={{ width: '50%' }}>Frequency</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {productServices?.map((_key) => (
                              <TableRow key={_key?.value}>
                                <TableCell component="th" scope="row">
                                  {' '}
                                  {_key?.name}{' '}
                                </TableCell>
                                <TableCell align="right">
                                  <Autocomplete
                                    size="small"
                                    id={_key?.value}
                                    options={['Monthly', 'Quarterly', 'Yearly']}
                                    getOptionLabel={(option) => option}
                                    value={_key.frequency}
                                    onChange={(event, newValue) => {
                                      const updatedProductServices = productServices?.map((e) => {
                                        if (e?._id === _key?._id) {
                                          return { ...e, frequency: newValue || '' }
                                        }
                                        return e;
                                      })
                                      setProductServices(updatedProductServices);
                                    }
                                    }
                                    style={{ maxWidth: '500px' }}
                                    renderInput={(params) => <TextField {...params} label="" variant="outlined" />}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Box minHeight={'100px'} display={'flex'} justifyContent={'center'} alignItems={'center'}>
                        Services not added yet!
                      </Box>
                    )
                  ) : (
                    <Box p={2} maxHeight="fit-content">
                      <CommonSkeleton lenArray={[...Array(5).keys()]} />
                    </Box>
                  )
                ) : null}
              </div>

            </CustomDialogContent>
            <CustomDialogFooter>
              <Button
                size="small"
                color="primary"
                disabled={false}
                onClick={() => {
                  onClose();
                }}
              >
                Cancel
              </Button>
              <CustomButton
                disabled={!productServices?.length || submitting}
                loading={false}
                variant="contained"
                color="primary"
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
              >
                {' '}
                Save
              </CustomButton>
            </CustomDialogFooter>
          </Fragment>) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
    </Dialog>
  );
}

