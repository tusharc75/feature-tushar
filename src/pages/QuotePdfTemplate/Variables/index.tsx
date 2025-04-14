import { Box, Dialog, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from '@mui/material';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import { useContext, useEffect, useState } from 'react';
import { CustomDialogTransition } from 'src/constants/helpers';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import ManageVariable from './ManageVariable';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { AddOutlined, Edit, Delete } from '@mui/icons-material';

export default function VariablesDialog({ isDisable, fields, handleClose, id }) {
  const [manageVariable, setManageVariable] = useState({ open: false, data: null });
  const [variables, setVariables] = useState([]);
  const toastConfig = useContext(CustomToastContext);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    fetchVariables();
  }, [id]);

  const fetchVariables = async () => {
    try {
      setIsFetching(true);
      const res = await axiosInstance().get(`/quote-pdf-template/${id}/variables`);
      const {
        data: { data }
      } = res;
      setVariables(data);
      setIsFetching(false);
    } catch (e) {
      toastConfig.setToastConfig(e);
      setIsFetching(false);
    }
  };

  const handleDelete = async (variableId) => {
    try {
      const res = await axiosInstance().delete(`/quote-pdf-template/${id}/variables/${variableId}`);
      const {
        data: { message }
      } = res;
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: message
      });
      fetchVariables();
    } catch (e) {
      toastConfig.setToastConfig(e);
    }
  };

  return (
    <>
      <Dialog
        open={true}
        TransitionComponent={CustomDialogTransition}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick') {
            handleClose();
          }
        }}
        maxWidth="md"
        fullWidth
      >
        <CustomDialogHeader title="Variables" showRequiredLabel={false} onClose={handleClose} />
        <CustomDialogContent>
          <>
            <Box mb={2}>
              <HtmlTooltip title={'Add'} placement="top" arrow enterTouchDelay={0}>
                <ThemeButton
                  buttonType="theme"
                  disabled={isDisable}
                  onClick={() => setManageVariable({ open: true, data: null })}
                  startIcon={<AddOutlined />}
                >
                  Add
                </ThemeButton>
              </HtmlTooltip>
            </Box>

            {isFetching ? (
              <CommonSkeleton lenArray={[...Array(4).keys()]} />
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Field Label</TableCell>
                      <TableCell>Field Name</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {variables.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          <Typography variant="body2" color="textSecondary">
                            No variables added yet
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      variables.map((variable) => (
                        <TableRow key={variable._id}>
                          <TableCell>{variable.fieldLabel}</TableCell>
                          <TableCell>{variable.fieldName}</TableCell>
                          <TableCell align="right">
                            <HtmlTooltip title="Edit">
                              <IconButton size="small" disabled={isDisable} onClick={() => setManageVariable({ open: true, data: variable })}>
                                <Edit fontSize="small" />
                              </IconButton>
                            </HtmlTooltip>
                            <HtmlTooltip title="Delete">
                              <IconButton size="small" disabled={isDisable} onClick={() => handleDelete(variable._id)} color="error">
                                <Delete fontSize="small" />
                              </IconButton>
                            </HtmlTooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        </CustomDialogContent>
      </Dialog>
      {manageVariable?.open && (
        <ManageVariable
          handleClose={() => {
            setManageVariable({ open: false, data: null });
            fetchVariables();
          }}
          data={manageVariable?.data}
          fields={fields}
          id={id}
        />
      )}
    </>
  );
}
