import { Box, Button, Grid, IconButton } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import ManageSteps from './ManageSteps';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import BuildIcon from '@material-ui/icons/Build';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ConfigureField from './ConfigureField';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';

const Steps = ({ resource }) => {
  const toastConfig = useContext(CustomToastContext);

  const [steps, setSteps] = useState(null);
  const [open, setOpen] = useState({ open: false, data: null });
  const [openField, setOpenField] = useState({ open: false, step: null });
  const [resourceId, setResourceId] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);

  const fetchData = async () => {
    axiosInstance()
      .get(`/sa-formbuilder/steps/${resource}`)
      .then(({ data: { data } }) => {
        setResourceId(data?._id);
        setSteps(data?.steps);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  useEffect(() => {
    fetchData();
  }, [resource]);

  const handleDelete = (step) => {
    setDeleting(true);
    axiosInstance()
      .put(`/sa-formbuilder/steps/delete/${resourceId}`, { stepId: step?._id })
      .then(() => {
        setDeleting(false);
        fetchData();
        setDeleteData(null);
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
        setDeleteData(null);
      });
  };

  return (
    <Box>
      <Box>
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => {
            setOpen({ open: true, data: null });
          }}
        >
          Add Step
        </Button>
      </Box>
      <Box pt={2}>
        <Grid container spacing={3}>
          {steps &&
            steps?.map((step, i) => {
              return (
                <Grid item md={4} lg={4} sm={6} xs={12}>
                  <Box p={1} border={'1px solid black'}>
                    <h3>{step?.stepName}</h3>
                    <Box display={'flex'} justifyContent={'end'}>
                      <HtmlTooltip title={'Edit'}>
                        <IconButton
                          size="small"
                          aria-label="Edit"
                          onClick={() => {
                            setOpen({ open: true, data: step });
                          }}
                        >
                          <EditIcon fontSize="small" color={'primary'} />
                        </IconButton>
                      </HtmlTooltip>
                      <HtmlTooltip title={'Add Fields'}>
                        <IconButton
                          size="small"
                          aria-label="Edit"
                          onClick={() => {
                            setOpenField({ open: true, step: step });
                          }}
                        >
                          <BuildIcon fontSize="small" color={'primary'} />
                        </IconButton>
                      </HtmlTooltip>
                      <HtmlTooltip title={'Delete'}>
                        <IconButton
                          size="small"
                          aria-label="Delete"
                          onClick={() => {
                            setDeleteData(step);
                          }}
                        >
                          <DeleteIcon fontSize="small" color={'error'} />
                        </IconButton>
                      </HtmlTooltip>
                    </Box>
                  </Box>
                </Grid>
              );
            })}
        </Grid>
      </Box>

      {open?.open && (
        <ManageSteps
          resource={resource}
          resourceId={resourceId}
          data={open?.data}
          onSuccess={() => {
            fetchData();
            setOpen({ open: false, data: null });
          }}
          onClose={() => {
            setOpen({ open: false, data: null });
          }}
        />
      )}

      {openField?.open && (
        <ConfigureField
          resourceId={resourceId}
          step={openField?.step}
          handleClose={() => {
            setOpenField({ open: false, step: null });
          }}
          handleSucess={() => {
            fetchData();
            setOpenField({ open: false, step: null });
          }}
        />
      )}

      {deleteData && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to delete ${deleteData?.stepName}?`}
          onClose={() => setDeleteData(null)}
          onOk={() => handleDelete(deleteData)}
          okBtnLoading={isDeleting}
        />
      )}
    </Box>
  );
};

export default Steps;
