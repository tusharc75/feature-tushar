import { Box, Dialog, TextField } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import axios, { CancelTokenSource } from 'axios';
import { camelCase, groupBy } from 'lodash';
import { useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useData } from '../../../../StateProvider/Provider';
import axiosInstance from '../../../../axios/axiosInstance';
import { CustomDialogTransition, addItemAtIndex, changeItemIndex, removeItemAtIndex, sidebarResource } from '../../../../constants/helpers';
import { get_activity_resource, get_dynamic_resource } from '../../../Activity/Helpers/utils';
import { CreateCase } from '../../Case/CreateCase';
import statusList from '../../Helpers/statusList';
import { CreateTask } from '../../Task/CreateTask';

import { DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { useDndSensors } from 'src/hooks';
import SingleCard from './SingleCard';
import SingleColumn from './SingleColumn';
import { Column } from './type';

let timeOut: NodeJS.Timeout;

const Board = ({ type, filter }) => {
  const [loading, setLoading] = useState(true);
  const {
    state: {
      user: { user },
      permissions,
      resources
    }
  }: any = useData();
  const [resource, setResource] = useState(null);
  const [resourceData, setResourceData] = useState(null);
  const [loadingResources, setLoadingResources] = useState(false);
  const [selectedResourceData, setSelectedResourceData] = useState(null);
  const [resourceOptions, setResourceOptions] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [groupedActivities, setGroupedActivities] = useState<Column[]>([]);
  const [activeItem, setActiveItem] = useState(null);

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

    setResourceOptions([...get_activity_resource(permissions, resources), ...resource]);
  };

  useEffect(() => {
    getResourceOptions();
  }, []);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchBoard(cancelTokenSource);
    return () => cancelTokenSource.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, filter, selectedResourceData]);

  const fetchBoard = (cancelTokenSource?: CancelTokenSource) => {
    let updatedFilter = [...(filter || [])];
    if (selectedResourceData) {
      updatedFilter.push({ _id: selectedResourceData.optionValue });
    }

    axiosInstance()
      .get(`/activity/board?type=${type}&filter=${JSON.stringify(updatedFilter)}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data } }) => {
        const groupedData = groupBy(data, 'status');
        const updatedData = [];
        for (const status of statusList) {
          if (groupedData[status.status]) {
            updatedData.push({
              ...status,
              items: groupedData[status.status]
            });
          } else {
            updatedData.push({
              ...status,
              items: []
            });
          }
        }
        setGroupedActivities(updatedData);
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

  const updateStatus = (id: string, updatedData: any) => {
    axiosInstance()
      .put(`${type}/${id}`, { status: updatedData.status })
      .then(({ data }) => { })
      .catch((err) => {
        fetchBoard();
      });
  };

  const onDragStart = (event: DragStartEvent) => {
    if (!event.active) return;
    setActiveItem(event.active.data.current.props);
  };
  const onDragOver = (event: DragOverEvent) => {
    if (!event.over) return;
    clearTimeout(timeOut);
    const { active, over } = event;
    if (active.id === over.id) return;
    const overType = over.data.current.type;
    const activeColName = active.data.current.column;
    const overColName = over.data.current.column;

    if (activeColName === overColName) return;
    const activeItem = { ...active.data.current.props.data, status: overColName };
    const activeIndex = active.data.current.index;

    if (overType === 'Item') {
      const overIndex = over.data.current.index;
      const newData = groupedActivities.map((d) => {
        const tempData = { ...d };
        if (d.status === activeColName) {
          tempData.items = removeItemAtIndex(tempData.items, activeIndex);
          return tempData;
        }
        if (d.status === overColName) {
          tempData.items = addItemAtIndex(tempData.items, activeItem, overIndex);
          return tempData;
        }
        return tempData;
      });
      timeOut = setTimeout(() => {
        setGroupedActivities(newData);
        updateStatus(activeItem._id, activeItem);
      }, 0);
    }
    if (overType === 'Column') {
      const newData = groupedActivities.map((d) => {
        const tempData = { ...d };
        if (d.status === activeColName) {
          tempData.items = removeItemAtIndex(tempData.items, activeIndex);
          return tempData;
        }
        if (d.status === overColName) {
          tempData.items = [...tempData.items, activeItem];
          return tempData;
        }
        return tempData;
      });
      timeOut = setTimeout(() => {
        setGroupedActivities(newData);
        updateStatus(activeItem._id, activeItem);
      }, 0);
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    if (!event.over) return;
    const { active, over } = event;
    const activeElement = active.data.current.props.data;
    const activeIndex = active.data.current.index;
    const overIndex = over.data.current.index;

    const activeColName = active.data.current.column;
    const overColName = over.data.current.column;
    if (activeColName === overColName) {
      const newData = groupedActivities.map((d) => {
        const tempData = { ...d };
        if (d.status === activeColName) {
          tempData.items = changeItemIndex(tempData.items, activeElement, activeIndex, overIndex);
          return tempData;
        }
        return tempData;
      });
      setGroupedActivities(newData);
    }
  };

  const sensors = useDndSensors();

  return (
    <>
      <Box className="grid max-w-[1008px] grid-cols-1 gap-2 pb-[18px] md:grid-cols-2">
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
            isOptionEqualToValue={(option: any, value: any) => option?.optionLabel === value?.optionLabel}
            value={selectedResourceData}
            onChange={(event, newValue) => {
              setSelectedResourceData(newValue);
            }}
            size="small"
            renderInput={(params) => <TextField {...params} fullWidth label={`Select ${resource.optionLabel}`} variant="outlined" />}
          />
        )}
      </Box>
      <div className=" overflow-x-auto">
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
          <ul className=" grid h-[calc(100vh-32vh)] min-h-[500px] min-w-[960px] grid-cols-3 gap-4 overflow-auto xl:grid-cols-4">
            {loading ? (
              Array.from(Array(3).keys()).map((d) => (
                <div key={d} className={`group animate-pulse rounded-[8px] bg-[var(--dark-secondary,#f1f5ff)]`} />
              ))
            ) : (
              <>
                {groupedActivities.map((column) => (
                  <SingleColumn
                    key={column.status}
                    column={column}
                    loading={loading}
                    type={type}
                    setSelectedStatus={setSelectedStatus}
                    setOpenDialog={setOpenDialog}
                    setFullScreen={setFullScreen}
                    fetchBoard={fetchBoard}
                  />
                ))}
              </>
            )}
          </ul>
          <DragOverlay>{activeItem && <SingleCard {...activeItem} />}</DragOverlay>
        </DndContext>
      </div>
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
    </>
  );
};

export default Board;
