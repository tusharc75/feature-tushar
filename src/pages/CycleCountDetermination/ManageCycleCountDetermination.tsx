import { useState, useEffect, useContext } from 'react';
import Button from '@mui/material/Button';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@mui/material/Dialog';
import axiosInstance from '../../axios/axiosInstance';
import { Box, Table, TableHead, Paper, TableContainer, TableBody, TableCell, TextField, TableRow } from '@mui/material';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { CustomDialogTransition } from './../../constants/helpers';
import { Autocomplete } from '@material-ui/lab';
import { Formik, Form, FieldArray } from 'formik';
import routes from 'src/components/Helpers/Routes';
import { useData } from 'src/StateProvider/Provider';

const ManageCycleCountDetermination = ({ onClose, onSuccess, data, warehouse, warehouseName }) => {
  const toastConfig = useContext(CustomToastContext);

  const [users, setUsers] = useState([]);
  const [inventoryCycle, setInventoryCycle] = useState([]);

  const {
    state: { resources }
  }: any = useData();

  useEffect(() => {
    fetchUsers();
    fetchInventoryCycle();
  }, []);

  const fetchUsers = () => {
    axiosInstance()
      .get(`/user`)
      .then(({ data: { data } }) => {
        let tempAllUsers = data.map((o) => ({ optionValue: o?._id, optionLabel: o?.concatedName }));
        setUsers(tempAllUsers);
      });
  };

  const fetchInventoryCycle = () => {
    axiosInstance()
      .get(`/inventory-cycle`)
      .then(
        ({
          data: {
            data: { data }
          }
        }) => {
          setInventoryCycle(data?.map((o) => ({ optionValue: o?._id, optionLabel: o?.cycleCode })));
        }
      );
  };

  const handleSave = (values) => {
    const payload = [];
    values?.forEach((element) => {
      if (element?.inventoryCycle?.optionValue || element?.user?.optionValue) {
        payload.push({
          productCategory: element._id,
          inventoryCycle: element?.inventoryCycle?.optionValue || '',
          user: element?.user?.optionValue || ''
        });
      }
    });

    axiosInstance()
      .post(`/cycle-count-determination/${warehouse}`, payload)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        onSuccess();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Dialog
      maxWidth="md"
      fullScreen={true}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      onClose={onClose}
      fullWidth
    >
      <CustomDialogHeader
        title={`${resources?.cycleCountDetermination?.titleSingular} - ${warehouseName}`}
        showRequiredLabel={false}
        onClose={() => {
          onClose();
        }}
        showManimizeMaximize={false}
      ></CustomDialogHeader>
      <Formik
        initialValues={{
          categoryArray: data.map((d) => ({
            _id: d?._id,
            categoryName: d?.name,
            inventoryCycle: d?.inventoryCycle ? d?.inventoryCycle : '',
            user: d?.user ? d?.user : ''
          }))
        }}
        enableReinitialize={true}
        onSubmit={() => {}}
      >
        {({ values }) => (
          <>
            <CustomDialogContent>
              <Box m={1}>
                <TableContainer component={Paper}>
                  <Table aria-label="customized table">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell align="left">Product Category</TableCell>
                        <TableCell align="left">Cycle Code</TableCell>
                        <TableCell align="left">User</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <FieldArray
                        name="categoryArray"
                        render={(arrayHelpers) =>
                          values.categoryArray.map((data, index) => (
                            <TableRow key={data._id}>
                              <TableCell component="th" scope="row">
                                {index + 1}
                              </TableCell>
                              <TableCell align="left">{data.categoryName}</TableCell>
                              <TableCell align="left">
                                <Autocomplete
                                  size="small"
                                  value={data.inventoryCycle}
                                  options={inventoryCycle}
                                  getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                                  onChange={(_, newValue) => {
                                    arrayHelpers.replace(index, {
                                      ...values.categoryArray[index],
                                      ['inventoryCycle']: newValue
                                    });
                                  }}
                                  renderInput={(params) => <TextField {...params} variant="outlined" name="inventoryCycle" label="Cycle Code" />}
                                />
                              </TableCell>
                              <TableCell align="left">
                                <Autocomplete
                                  size="small"
                                  value={data.user}
                                  options={users}
                                  getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                                  onChange={(_, newValue) => {
                                    arrayHelpers.replace(index, {
                                      ...values.categoryArray[index],
                                      ['user']: newValue
                                    });
                                  }}
                                  renderInput={(params) => <TextField {...params} variant="outlined" name="user" label="User" />}
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        }
                      />
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button onClick={() => handleSave(values.categoryArray)} variant={'contained'} size="small" color="primary" disabled={false}>
                Save
              </Button>
            </CustomDialogFooter>
          </>
        )}
      </Formik>
    </Dialog>
  );
};

export default ManageCycleCountDetermination;
