import { useContext, useEffect, useState } from 'react';
import { Box, Button, Grid, IconButton, MenuItem, Typography } from '@material-ui/core';
import { Accordion, AccordionDetails, AccordionSummary } from 'src/components/CustomAccordion';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import ContentFullScreen from 'src/components/ContentFullScreen';
import Steps from 'src/components/Steps';
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
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';

const Step = ({ resourceData, resourceId, resource, data, allowedToEdit }) => {
  const [steps, setSteps] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepFullScreen, setStepFullScreen] = useState(false);
  const [expended, setExpended] = useState({});
  const [nextStep, setNextStep] = useState(false);

  useEffect(() => {
    setSteps(_.sortBy(resourceData?.steps, 'order'));
  }, [resourceData]);

  return (
    <>
      {steps &&
        steps?.length &&
        (!resourceData?.showStepsInList ? (
          <>
            <Steps
              isNextStep={false}
              nextStep={steps[currentStep]?.stepDataRequired ? nextStep : true}
              steps={steps?.map((s) => ({ name: s?.stepName, title: s?.stepName }))}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              isStepEnded={false}
              setStepFullScreen={() => setStepFullScreen(true)}
            />
            <ContentFullScreen title={steps[currentStep]?.stepName} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
              <RenderData
                step={steps[currentStep]}
                allowedToEdit={allowedToEdit}
                data={data}
                resource={resource}
                resourceId={resourceId}
                setNextStep={setNextStep}
              />
            </ContentFullScreen>
          </>
        ) : (
          <>
            {steps?.map((step, i) => {
              return (
                <Box mt={2} key={i}>
                  <Accordion
                    expanded={expended[`${step?._id}`]}
                    className="accordOpportunity"
                    onChange={() => setExpended({ ...expended, [`${step?._id}`]: !expended[`${step?._id}`] })}
                  >
                    <AccordionSummary aria-controls="user-panel-content" id="user-panel-header">
                      <Grid container className="pos_rel">
                        <Grid item xs={8}>
                          <Box display="flex" alignItems="center">
                            <Box>
                              <IconButton size="small">{expended[`${step?._id}`] === true ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                            </Box>
                            <Box padding="5px">
                              <Typography variant="subtitle2">{step?.stepName}</Typography>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                    </AccordionSummary>
                    <AccordionDetails>
                      <>
                        {expended[`${step?._id}`] && (
                          <RenderData
                            step={step}
                            allowedToEdit={allowedToEdit}
                            data={data}
                            resource={resource}
                            resourceId={resourceId}
                            fromAccordian={true}
                          />
                        )}
                      </>
                    </AccordionDetails>
                  </Accordion>
                </Box>
              );
            })}
          </>
        ))}
    </>
  );
};

const RenderData = ({ step, allowedToEdit, data, resource, resourceId, setNextStep = null, fromAccordian = false }) => {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = `${_.camelCase(resource)}`;

  const [open, setOpen] = useState({ open: false, id: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);

  const { state, dispatch } = useTableReducer();
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();

  const getColumns = () => {
    const newColumns = generateColumns(`${renderedFrom}_${step?.stepName}`, step?.fields || [], null, false, data?.currency);
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

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });

    axiosInstance()
      .get(`/dynamic-form/step/${resourceId}/${step?._id}`, {
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
        if (setNextStep) {
          if (rows?.length > 0) {
            setNextStep(true);
          } else {
            setNextStep(false);
          }
        }
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

  useEffect(() => {
    if (step && step?.fields?.length) {
      fetchData();
    }
  }, [step]);

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
        { ids: ids, stepId: step?._id },
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
      {step?.fields?.length ? (
        step?.multipleStepData ? (
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
                renderedFrom={`${renderedFrom}_${step?.stepName}`}
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
              <DetailsPage data={dataRows[0] || {}} fields={step?.fields?.map((f) => ({ fieldData: f }))} />
            </Box>
          </>
        )
      ) : (
        <Box minHeight={fromAccordian ? '50px' : '270px'} display={'flex'} alignItems={'center'} justifyContent={'center'}>
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
          stepId={step?._id}
          id={open?.id}
          fields={step?.fields || []}
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
    </>
  );
};

export default Step;
