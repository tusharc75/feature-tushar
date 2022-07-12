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
import { makeStyles } from '@material-ui/styles';
import { Autocomplete } from '@material-ui/lab';

const useClasses = makeStyles(() => ({
  table: {
    minWidth: 650
  },
  input: {
    display: 'none'
  },
  tableContainer: {
    maxHeight: '100%',
    width: '95%',
    margin: '1rem auto'
  }
}));
const ManageCycleCountDetermination = ({ onClose, onSuccess, data, plant }) => {
  const classes = useClasses();
  const [allUsers, setAllUsers] = useState([]);
  const [allCode, setAllCode] = useState([]);
  let productCategoryIds = [];
  let cycleCodeIds = [];
  let userIds = [];
  const toastConfig = useContext(CustomToastContext);

  const fetchAllUsers = () => {
    axiosInstance()
      .get(`/user`)
      .then(({ data: { data } }) => {
        let tempAllUsers = data.map((o) => ({ optionValue: o?._id, optionLabel: o?.concatedName }));
        setAllUsers(tempAllUsers);
      });
  };
  const fetchAllCycleCode = () => {
    axiosInstance()
      .get(`/inventory-cycle`)
      .then(({ data: { data } }) => {
        let tempAllCycleCode = data.map((o) => ({ optionValue: o?._id, optionLabel: o?.cycleCode }));
        setAllCode(tempAllCycleCode);
      });
  };
  useEffect(() => {
    fetchAllUsers();
    fetchAllCycleCode();
  }, []);

  const handleSave = () => {
    let users = userIds.map((i, index) => {
      return i[index].optionValue;
    });
    let payload = productCategoryIds.map((i, index) => {
      return {
        warehouse: plant,
        productCategory: i,
        cycleCode: cycleCodeIds[index],
        users: users
      };
    });
    axiosInstance()
      .post(`/cycle-count-determination`, payload)
      .then(({ data }) => {
        onSuccess();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
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
      <CustomDialogContent>
        <Box m={1}>
          <TableContainer className={classes.tableContainer} component={Paper}>
            <Table className={classes.table} aria-label="customized table">
              <TableHead>
                <TableRow>
                  <TableCell>Sr.No.</TableCell>
                  <TableCell align="left">Product Category</TableCell>
                  <TableCell align="left">Cycle Code</TableCell>
                  <TableCell align="left">User</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={row._id}>
                    <TableCell component="th" scope="row">
                      {index + 1}
                    </TableCell>
                    <TableCell align="left">{row.name}</TableCell>
                    <TableCell align="left">
                      <Autocomplete
                        options={allCode}
                        getOptionLabel={(option: any) => option.optionLabel}
                        getOptionSelected={(option: any, val) => option._id === val}
                        onChange={(event, value) => {
                          if (value) {
                            cycleCodeIds.push(value?.optionValue);
                            productCategoryIds.push(row?._id);
                          }
                        }}
                        renderInput={(params) => <TextField {...params} label="Cycle Code" variant="outlined" margin="dense" />}
                      />
                    </TableCell>
                    <TableCell align="left">
                      <Autocomplete
                        multiple
                        options={allUsers}
                        getOptionLabel={(option: any) => option.optionLabel}
                        getOptionSelected={(option: any, val) => option._id === val}
                        renderInput={(params) => <TextField {...params} label="User" margin="dense" variant="outlined" />}
                        onChange={(event, value) => {
                          userIds.push(value);
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button
          onClick={() => {
            if (productCategoryIds.length > 0 && cycleCodeIds.length > 0 && userIds.length > 0) {
              handleSave();
            }
          }}
          variant={'contained'}
          size="small"
          color="primary"
          disabled={false}
        >
          Save
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default ManageCycleCountDetermination;
