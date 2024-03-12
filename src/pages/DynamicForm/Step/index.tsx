import { useContext, useEffect, useState } from 'react';
import { Box, Button, IconButton, MenuItem, Typography } from '@material-ui/core';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import ContentFullScreen from 'src/components/ContentFullScreen';
import Steps, { getIndex } from 'src/components/Steps';
import _ from 'lodash';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import ManageStep from './ManageStep';
import { gridLoadingTimeout, prepareDataForGrid } from 'src/constants/helpers';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { deleteDisable, editDisable } from 'src/constants/messageHelpers';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import DetailsPage from '../../../components/Shared/DetailsPage';

const Step = ({ resourceId, resource, data, allowedToEdit }) => {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = `${_.camelCase(resource)}`;

  const [steps, setSteps] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepFullScreen, setStepFullScreen] = useState(false);
  const [open, setOpen] = useState({ open: false, id: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);

  const { state, dispatch } = useTableReducer();
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();

  useEffect(() => {
    setSteps(_.sortBy(data?.steps, 'order'));
  }, [data]);

  const getColumns = () => {
    const newColumns = generateColumns(
      `${renderedFrom}_${steps[currentStep]?.stepName}`,
      steps[currentStep]?.fields || [],
      null,
      false,
      data?.currency
    );
    const column: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      }
    ];

    return [
      ...column,
      ...newColumns,
      {
        accessor: 'action',
        Header: 'Actions',
        minWidth: 100,
        width: 110,
        sticky: 'right',
        disableFilters: true,
        disableSortBy: true,
        canDrag: false,
        Cell: ({ row }) => (
          <>
            <HtmlTooltip title={allowedToEdit ? 'Edit' : editDisable}>
              <span>
                <IconButton
                  size="small"
                  aria-label="Edit"
                  disabled={allowedToEdit ? false : true}
                  onClick={() => {
                    setOpen({ open: true, id: row?.original?._id });
                  }}
                >
                  <EditIcon fontSize="small" color={allowedToEdit ? 'primary' : 'disabled'} />
                </IconButton>
              </span>
            </HtmlTooltip>

            <HtmlTooltip title={allowedToEdit ? 'Delete' : deleteDisable}>
              <span>
                <IconButton
                  size="small"
                  aria-label="Delete"
                  disabled={allowedToEdit ? false : true}
                  onClick={() => {
                    setDeleteRecord(row?.original);
                    setShowDeleteConfirmBox(true);
                  }}
                >
                  <DeleteIcon fontSize="small" color={allowedToEdit ? 'error' : 'disabled'} />
                </IconButton>
              </span>
            </HtmlTooltip>
          </>
        )
      }
    ];
  };

  useEffect(() => {
    if (steps && steps[currentStep]?.fields?.length) {
      fetchData();
    }
  }, [steps, currentStep]);

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });

    axiosInstance()
      .get(`/dynamic-form/step/${resourceId}/${steps[currentStep]?._id}`, {
        headers: {
          Resource: resource
        }
      })
      .then(({ data: { data } }) => {
        let rows = data.map((u, i) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['index'] = i + 1;
          finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows, count: data?.length });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => {
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const handleDelete = async () => {
    let ids: any = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((m) => m._id);
    }

    axiosInstance()
      .put(
        `/dynamic-form/step/remove/${resourceId}`,
        { ids: ids, stepId: steps[currentStep]?._id },
        {
          headers: {
            Resource: resource
          }
        }
      )
      .then(({ data }) => {
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const actionButtonMenuItems = () => {
    return (
      <MenuItem disabled={selectedRecords.length ? false : true} onClick={() => setShowDeleteConfirmBox(true)}>
        Delete
      </MenuItem>
    );
  };

  return (
    <>
      {steps && steps?.length && (
        <>
          <Steps
            isNextStep={false}
            nextStep={steps[currentStep]?.stepDataRequired ? (dataRows?.length ? true : false) : true}
            steps={steps?.map((s) => ({ name: s?.stepName, title: s?.stepName }))}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            isStepEnded={false}
            setStepFullScreen={() => setStepFullScreen(true)}
          />
          <ContentFullScreen title={steps[currentStep]?.stepName} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
            {steps[currentStep]?.fields?.length ? (
              steps[currentStep]?.multipleStepData ? (
                <>
                  {allowedToEdit && (
                    <DetailsPageHeader
                      isAddButtonVisible={false}
                      isActionButtonVisible={true}
                      actionButtonMenuItems={actionButtonMenuItems()}
                      actionButtonProps={{ disabled: !Boolean(selectedRecords?.length) }}
                      hasXpadding
                      leftSideContents={
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => {
                            setOpen({ open: true, id: null });
                          }}
                        >
                          Add
                        </Button>
                      }
                    />
                  )}
                  <Box zIndex={5} width={'100%'}>
                    <CustomReactTable
                      height={'300px'}
                      columns={getColumns()}
                      state={state}
                      dispatch={dispatch}
                      renderedFrom={`${renderedFrom}_${steps[currentStep]?.stepName}`}
                      isClientSideGrid={true}
                      refreshGrid={fetchData}
                    />
                  </Box>
                </>
              ) : (
                <>
                  <Box textAlign={'right'}>
                    <Button
                      className={'no-shadow'}
                      onClick={() => {
                        setOpen({ open: true, id: dataRows[0] ? dataRows[0]?._id : null });
                      }}
                      variant={'contained'}
                      size="small"
                      color="primary"
                    >
                      Edit
                    </Button>
                  </Box>
                  <Box mt={2}>
                    <DetailsPage data={dataRows[0] || {}} fields={steps[currentStep]?.fields?.map((f) => ({ fieldData: f }))} />
                  </Box>
                </>
              )
            ) : (
              <Box minHeight={'270px'} display={'flex'} alignItems={'center'} justifyContent={'center'}>
                <Typography>No Fields</Typography>
              </Box>
            )}

            {open?.open && (
              <ManageStep
                onClose={() => {
                  setOpen({ open: false, id: null });
                }}
                onSuccess={() => {
                  fetchData();
                  setOpen({ open: false, id: null });
                }}
                resource={resource}
                resourceId={resourceId}
                stepId={steps[currentStep]?._id}
                id={open?.id}
                fields={steps[currentStep]?.fields || []}
              />
            )}

            {showDeleteConfirmBox && (
              <ConfirmationDialog
                open={showDeleteConfirmBox}
                message={`Are you sure, you want to delete ?`}
                onClose={() => {
                  setDeleteRecord(null);
                  setShowDeleteConfirmBox(false);
                }}
                onOk={handleDelete}
              />
            )}
          </ContentFullScreen>
        </>
      )}
    </>
  );
};

export default Step;
