import { useState, useEffect, useContext } from 'react';
import Button from '@material-ui/core/Button';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@material-ui/core/Dialog';
import axiosInstance from '../../axios/axiosInstance';
import { Box, Table, TableHead, Paper, TableContainer, TableBody, TableCell, TextField, TableRow } from '@material-ui/core';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { CustomDialogTransition } from './../../constants/helpers';
import { Autocomplete } from '@material-ui/lab';
import { Formik, Form, FieldArray, Field } from 'formik';

const ManageCycleCountDetermination = ({ onClose, onSuccess, data, warehouse }) => {

  const toastConfig = useContext(CustomToastContext);

  console.log(data)

  const [users, setUsers] = useState([]);
  const [cycleCodes, setCycleCodes] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchCycleCodes();
  }, []);

  const fetchUsers = () => {
    axiosInstance()
      .get(`/user`)
      .then(({ data: { data } }) => {
        let tempAllUsers = data.map((o) => ({ optionValue: o?._id, optionLabel: o?.concatedName }));
        setUsers(tempAllUsers);
      });
  };

  const fetchCycleCodes = () => {
    axiosInstance()
      .get(`/inventory-cycle`)
      .then(({ data: { data } }) => {
        let tempAllCycleCode = data.map((o) => ({ optionValue: o?._id, optionLabel: o?.cycleCode }));
        setCycleCodes(tempAllCycleCode);
      });
  };

  const handleSave = (values) => {
    const payload = [];
    values?.forEach(element => {
      if (element?.cycleCode?.optionValue && element?.user?.optionValue) {
        payload.push({
          productCategory: element._id,
          cycleCode: element?.cycleCode?.optionValue,
          user: element?.user?.optionValue
        })
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
        title={'Edit Cycle Count Determination'}
        showRequiredLabel={false}
        onClose={() => {
          onClose();
        }}
        showManimizeMaximize={false}
      ></CustomDialogHeader>
      <Formik
        initialValues={{
          categoryArray: data.map(d => ({
            "_id": d?._id,
            "categoryName": d?.name,
            "cycleCode": d?.cycleCode ? d?.cycleCode : "",
            "user": d?.user ? d?.user : "",
          }))
        }}
        enableReinitialize={true}
        onSubmit={() => { }}>
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
                        render={arrayHelpers => (
                          (values.categoryArray.map((data, index) => (
                            <TableRow key={data._id}>
                              <TableCell component="th" scope="row">
                                {index + 1}
                              </TableCell>
                              <TableCell align="left">{data.categoryName}</TableCell>
                              <TableCell align="left">
                                <Autocomplete
                                  size="small"
                                  value={data.cycleCode}
                                  options={cycleCodes}
                                  getOptionLabel={(option: any) => option ? option?.optionLabel : ""}
                                  onChange={(_, newValue) => {
                                    arrayHelpers.replace(index, {
                                      ...values.categoryArray[index],
                                      ["cycleCode"]: newValue,
                                    });
                                  }}
                                  renderInput={(params) => <TextField
                                    {...params}
                                    variant="outlined"
                                    name="cycleCode"
                                    label="Cycle Code"
                                  />}
                                />
                              </TableCell>
                              <TableCell align="left">
                                <Autocomplete
                                  size="small"
                                  value={data.user}
                                  options={users}
                                  getOptionLabel={(option: any) => option ? option?.optionLabel : ""}
                                  onChange={(_, newValue) => {
                                    arrayHelpers.replace(index, {
                                      ...values.categoryArray[index],
                                      ["user"]: newValue,
                                    });
                                  }}
                                  renderInput={(params) => <TextField
                                    {...params}
                                    variant="outlined"
                                    name="user"
                                    label="User"
                                  />
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          )))
                        )}
                      />
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button
                onClick={() => handleSave(values.categoryArray)}
                variant={'contained'}
                size="small"
                color="primary"
                disabled={false}
              >
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
