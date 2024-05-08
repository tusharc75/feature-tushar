import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Box, Dialog, IconButton, TextField, Typography } from '@material-ui/core';
import { Add } from '@material-ui/icons';
import { Autocomplete } from '@material-ui/lab';
import axios, { CancelTokenSource } from 'axios';
import { camelCase, groupBy } from 'lodash';
import { useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { useData } from '../../../../StateProvider/Provider';
import axiosInstance from '../../../../axios/axiosInstance';
import { CustomDialogTransition, addItemAtIndex, changeItemIndex, removeItemAtIndex, sidebarResource } from '../../../../constants/helpers';
import { get_activity_resource, get_dynamic_resource } from '../../../Activity/Helpers/utils';
import { CreateCase } from '../../Case/CreateCase';
import statusList from '../../Helpers/statusList';
import { CreateTask } from '../../Task/CreateTask';
import { BoardList } from './BoardList';

const Board = ({ type, filter }) => {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const {
    state: {
      user: { user },
      permissions
    }
  }: any = useData();
  const [resource, setResource] = useState(null);
  const [resourceData, setResourceData] = useState(null);
  const [loadingResources, setLoadingResources] = useState(false);
  const [selectedResourceData, setSelectedResourceData] = useState(null);
  const [resourceOptions, setResourceOptions] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [click, setClick] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const getResourceOptions = async () => {
    const resource: any = [];
    const dynamicResource = await get_dynamic_resource(true);
    dynamicResource?.data?.forEach((_r) => {
      if (permissions[camelCase(_r.resource)]?.isRead) {
        resource.push({
          optionLabel: _r.resource,
          optionValue: camelCase(_r.resource),
          dynamicResource: true,
          primaryField: _r?.collaborateToolsField
        });
      }
    });

    setResourceOptions([...get_activity_resource(permissions), ...resource]);
  };

  useEffect(() => {
    getResourceOptions();
  }, []);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchBoard(cancelTokenSource);
    return () => cancelTokenSource.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, filter]);

  const fetchBoard = (cancelTokenSource?: CancelTokenSource) => {
    axiosInstance()
      .get(`/activity/board?type=${type}&filter=${JSON.stringify(filter)}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data } }) => {
        setActivities(data.sort((a, b) => statusList.findIndex((s) => s.status === a.status) - statusList.findIndex((s) => s.status === b.status)));
        setSubActivities(groupBy(data, 'status'));
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
      });
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    fetchBoard();
  };

  // Data for Autocomplete

  useEffect(() => {
    if (resource && resource?.optionValue) {
      setLoadingResources(true);
      if (resource?.dynamicResource) {
        axiosInstance()
          .get(`dynamic-form`, {
            headers: {
              Resource: resource?.optionLabel
            }
          })
          .then(({ data: { data } }) => {
            setResourceData(data?.map((d) => ({ optionLabel: d[resource?.primaryField], optionValue: d?._id })) || []);
            setLoadingResources(false);
          })
          .catch((error) => {
            setLoadingResources(false);
          });
      } else {
        const lookupResource = sidebarResource[resource?.optionValue === 'quote' ? 'quoteBuilder' : resource?.optionValue];
        axiosInstance()
          .get(`/sa-formbuilder/lookup?lookupResource=${lookupResource}`)
          .then(({ data: { data } }) => {
            setResourceData(data[lookupResource] || []);
            setLoadingResources(false);
          })
          .catch((error) => {
            setLoadingResources(false);
          });
      }

      return () => {
        setSelectedResourceData(null);
        setResourceData(null);
      };
    }
  }, [resource]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    const sourceColumn = [...activities].filter((d) => d.status === source.droppableId);
    const destinationeColumn = [...activities].filter((d) => d.status === destination.droppableId);

    const restOfTheListItems = [];
    activities.forEach((a) => {
      if (a.status === source.droppableId || a.status === destination.droppableId) {
      } else {
        restOfTheListItems.push(a);
      }
    });

    let draggedItem = activities.find((a) => a._id === result.draggableId);
    if (!draggedItem) return;
    draggedItem.status = destination.droppableId;

    let newDestinationColum = destinationeColumn;
    let newSourceColumn = sourceColumn;

    // if same column
    if (source.droppableId === destination.droppableId) {
      newDestinationColum = changeItemIndex(sourceColumn, draggedItem, source.index, destination.index);
      setActivities([...restOfTheListItems, ...newDestinationColum]);
      //
      return;
    } else {
      newDestinationColum = addItemAtIndex(destinationeColumn, draggedItem, destination.index);
      newSourceColumn = removeItemAtIndex(sourceColumn, source.index);
    }

    setActivities([...restOfTheListItems, ...newSourceColumn, ...newDestinationColum]);
    updateStatus(draggableId, draggedItem);
  };

  const updateStatus = (id: string, updatedData: any) => {
    axiosInstance()
      .put(`${type}/${id}`, { status: updatedData.status })
      .then(({ data }) => {})
      .catch((err) => {
        fetchBoard();
      });
  };

  return (
    <>
      <Box className="grid grid-cols-1 md:grid-cols-2 gap-2 pb-[18px] max-w-[1008px]">
        <Autocomplete
          fullWidth
          options={resourceOptions}
          getOptionLabel={(option) => option.optionLabel}
          value={resource}
          onChange={(event, newValue) => {
            setResource(newValue);
          }}
          size="small"
          renderInput={(params) => <TextField {...params} fullWidth label="Select Resource" variant="outlined" />}
        />
        {resource && resourceData && (
          <Autocomplete
            fullWidth
            disabled={loadingResources}
            options={resourceData}
            getOptionLabel={(option: any) => option.optionLabel}
            getOptionSelected={(option: any, value: any) => option?.optionLabel === value?.optionLabel}
            value={selectedResourceData}
            onChange={(event, newValue) => {
              setSelectedResourceData(newValue);
            }}
            size="small"
            renderInput={(params) => <TextField {...params} fullWidth label={`Select ${resource.optionLabel}`} variant="outlined" />}
          />
        )}
      </Box>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className=" grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 h-[calc(100vh-32vh)] overflow-auto">
          {statusList.map((data, index) => {
            const activity = activities.filter(function (o) {
              return o.status === data.status;
            });
            return (
              <div className={`bg-[var(--dark-secondary,#f1f5ff)] rounded-[8px]`} key={data.status}>
                {!loading && (
                  <Box className="bg-[var(--dark-secondary,#f1f5ff)] sticky top-0 z-10 rounded-[8px] px-[13px] py-[14px]">
                    <Typography variant="subtitle2" style={{ width: '50%', fontSize: '0.95rem', fontWeight: 700 }} className=" capitalize">
                      {data.status}
                      {' (' +
                        activities.filter(function (o) {
                          return o.status === data.status;
                        }).length +
                        ')'}
                    </Typography>
                    {permissions && permissions[type?.toLowerCase()]?.isCreate ? (
                      <HtmlTooltip title={`Create ${type}`}>
                        <IconButton
                          size="small"
                          style={{ float: 'right', marginTop: '-25px' }}
                          onClick={() => {
                            setSelectedStatus(data.status);
                            setOpenDialog(true);
                            setFullScreen(false);
                          }}
                        >
                          <Add fontSize="small" />
                        </IconButton>
                      </HtmlTooltip>
                    ) : null}
                  </Box>
                )}
                <BoardList
                  loading={loading}
                  selectedResource={selectedResourceData}
                  resource={resource?.optionValue}
                  status={data.status}
                  activity={activity}
                  fetchBoard={fetchBoard}
                  type={type}
                />
              </div>
            );
          })}
          <Dialog
            open={openDialog}
            onClose={(e, reason) => {
              if (reason !== 'backdropClick') {
                handleCloseDialog();
                setFullScreen(false);
              }
            }}
            fullWidth
            maxWidth="md"
            fullScreen={fullScreen || isMobile || isTablet}
            TransitionComponent={CustomDialogTransition}
          >
            {type === 'task' ? (
              <CreateTask
                status={selectedStatus}
                taskId={null}
                relatedTo={[
                  {
                    type: resource?.optionValue && selectedResourceData ? camelCase(resource?.optionValue) : 'user',
                    referenceId: resource?.optionValue && selectedResourceData ? selectedResourceData.optionValue : user._id,
                    access: true
                  }
                ]}
                handleClose={() => {
                  handleCloseDialog();
                  setFullScreen(false);
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
            ) : type === 'case' ? (
              <CreateCase
                status={selectedStatus}
                caseId={null}
                relatedTo={[
                  {
                    type: resource?.optionValue && selectedResourceData ? camelCase(resource?.optionValue) : 'user',
                    referenceId: resource?.optionValue && selectedResourceData ? selectedResourceData.optionValue : user._id,
                    access: true
                  }
                ]}
                handleClose={() => {
                  handleCloseDialog();
                  setFullScreen(false);
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
            ) : null}
          </Dialog>
        </div>
      </DragDropContext>
      {/* <DndProvider backend={isMobile || isTablet ? TouchBackend : HTML5Backend}>
        <div className=" grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 h-[calc(100vh-32vh)] overflow-auto">
          {statusList.map((data, index) => {
            const activity = activities.filter(function (o) {
              return o.status === data.status;
            });
            return (
              <div className={`bg-[var(--dark-secondary,#f1f5ff)] rounded-[8px]`} key={data.status}>
                {!loading && (
                  <Box className="bg-[var(--dark-secondary,#f1f5ff)] sticky top-0 z-10 rounded-[8px] px-[13px] py-[14px]">
                    <Typography variant="subtitle2" style={{ width: '50%', fontSize: '0.95rem', fontWeight: 700 }} className=" capitalize">
                      {data.status}
                      {' (' +
                        activities.filter(function (o) {
                          return o.status === data.status;
                        }).length +
                        ')'}
                    </Typography>
                    {permissions && permissions[type?.toLowerCase()]?.isCreate ? (
                      <HtmlTooltip title={`Create ${type}`}>
                        <IconButton
                          size="small"
                          style={{ float: 'right', marginTop: '-25px' }}
                          onClick={() => {
                            setSelectedStatus(data.status);
                            setOpenDialog(true);
                            setFullScreen(false);
                          }}
                        >
                          <Add fontSize="small" />
                        </IconButton>
                      </HtmlTooltip>
                    ) : null}
                  </Box>
                )}
                <BoardList
                  loading={loading}
                  selectedResource={selectedResourceData}
                  resource={resource?.optionValue}
                  status={data.status}
                  activity={activity}
                  fetchBoard={fetchBoard}
                  type={type}
                  handleChangeStatus={handleChangeStatus}
                />
              </div>
            );
          })}
          <Dialog
            open={openDialog}
            onClose={(e, reason) => {
              if (reason !== 'backdropClick') {
                handleCloseDialog();
                setFullScreen(false);
              }
            }}
            fullWidth
            maxWidth="md"
            fullScreen={fullScreen || isMobile || isTablet}
            TransitionComponent={CustomDialogTransition}
          >
            {type === 'task' ? (
              <CreateTask
                status={selectedStatus}
                taskId={null}
                relatedTo={[
                  {
                    type: resource?.optionValue && selectedResourceData ? camelCase(resource?.optionValue) : 'user',
                    referenceId: resource?.optionValue && selectedResourceData ? selectedResourceData.optionValue : user._id,
                    access: true
                  }
                ]}
                handleClose={() => {
                  handleCloseDialog();
                  setFullScreen(false);
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
            ) : type === 'case' ? (
              <CreateCase
                status={selectedStatus}
                caseId={null}
                relatedTo={[
                  {
                    type: resource?.optionValue && selectedResourceData ? camelCase(resource?.optionValue) : 'user',
                    referenceId: resource?.optionValue && selectedResourceData ? selectedResourceData.optionValue : user._id,
                    access: true
                  }
                ]}
                handleClose={() => {
                  handleCloseDialog();
                  setFullScreen(false);
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
            ) : null}
          </Dialog>
        </div>
      </DndProvider> */}
    </>
  );
};

export default Board;
