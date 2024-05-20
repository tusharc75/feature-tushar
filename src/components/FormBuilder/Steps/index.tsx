import { Box, Button, IconButton } from '@material-ui/core';
import AddAlertIcon from '@material-ui/icons/AddAlert';
import BuildIcon from '@material-ui/icons/Build';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import PolicyIcon from '@material-ui/icons/Policy';
import SettingIcon from '@material-ui/icons/Settings';
import axios, { CancelTokenSource } from 'axios';
import { sortBy } from 'lodash';
import { useCallback, useContext, useEffect, useState } from 'react';
import { MdDragIndicator } from 'react-icons/md';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import Actions from './Actions';
import ConfigureField from './ConfigureField';
import ManageSteps from './ManageSteps';
import Notifications from './Notifications';
import Setting from './Setting';
import { resourcePolicy } from './helper';
import PolicyDialog from './policyDialog';

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const Steps = ({ resource }) => {
  const toastConfig = useContext(CustomToastContext);

  const [resourceData, setResourceData] = useState(null);
  const [steps, setSteps] = useState(null);
  const [stepsLoading, setStepsLoading] = useState(false);
  const [open, setOpen] = useState({ open: false, data: null });
  const [openField, setOpenField] = useState({ open: false, step: null });
  const [resourceId, setResourceId] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [openSetting, setOpenSetting] = useState(false);
  const [openAction, setOpenAction] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [openPolicy, setOpenPolicy] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  const fetchData = useCallback(
    async (cancelTokenSource?: CancelTokenSource) => {
      setStepsLoading(true);
      axiosInstance()
        .get(`/sa-formbuilder/steps/${resource}`, { cancelToken: cancelTokenSource?.token })
        .then(({ data: { data } }) => {
          setResourceData(data);
          setResourceId(data?._id);
          setSteps(sortBy(data?.steps, 'order'));
          setStepsLoading(false);
        })
        .catch((error) => {
          setStepsLoading(false);
          toastConfig.setToastConfig(error);
        });
    },
    [resource]
  );

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
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

  const handleUpdateOrder = (steps) => {
    axiosInstance()
      .put(
        `/sa-formbuilder/steps/order/${resourceId}`,
        steps?.map((step) => ({ stepId: step?._id, order: step?.order }))
      )
      .then(() => {
        fetchData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleOnDragEnd = (result: DragEndEvent) => {
    if (!result.over || result.active.id === result.over.id) {
      return;
    }
    const { active, over } = result;
    const overIndex = over.data.current?.index;
    const activeIndex = active.data.current?.index;

    const items: any = Array.from(steps);
    const [reorderedItem] = items.splice(activeIndex, 1);
    items.splice(overIndex, 0, { ...reorderedItem, order: overIndex });
    const updatedSteps = items.map((i, index) => ({ ...i, order: index }));
    setSteps(updatedSteps);

    handleUpdateOrder(updatedSteps);
  };

  const onDragStart = (event: DragStartEvent) => {
    if (!event?.active) return;
    setActiveItem(event?.active?.data.current.props);
  };

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10
    }
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 300,
      tolerance: 5
    }
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  return (
    <Box>
      <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
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
        <Box>
          {resourcePolicy.find((e) => e.resource === resource) && (
            <HtmlTooltip title={'Policy'}>
              <IconButton
                aria-label="Policy"
                onClick={() => {
                  setOpenPolicy(true);
                }}
              >
                <PolicyIcon fontSize="small" color={'primary'} />
              </IconButton>
            </HtmlTooltip>
          )}
          <HtmlTooltip title={'Setting'}>
            <IconButton
              aria-label="Setting"
              onClick={() => {
                setOpenSetting(true);
              }}
            >
              <SettingIcon fontSize="small" color={'primary'} />
            </IconButton>
          </HtmlTooltip>
          <HtmlTooltip title={'Actions'}>
            <IconButton
              aria-label="Actions"
              onClick={() => {
                setOpenAction(true);
              }}
            >
              <BuildIcon fontSize="small" color={'primary'} />
            </IconButton>
          </HtmlTooltip>
          <HtmlTooltip title={'Notifications'}>
            <IconButton
              aria-label="Notifications"
              onClick={() => {
                setOpenNotifications(true);
              }}
            >
              <AddAlertIcon fontSize="small" color={'primary'} />
            </IconButton>
          </HtmlTooltip>
        </Box>
      </Box>
      <Box pt={2}>
        <DndContext onDragEnd={handleOnDragEnd} onDragStart={onDragStart} sensors={sensors} modifiers={[restrictToVerticalAxis]}>
          <RenderStepItems {...{ steps, setSteps, stepsLoading, setOpen, setOpenField, setDeleteData }} />
          <DragOverlay>{activeItem && <SingleStep {...activeItem} />}</DragOverlay>
        </DndContext>
      </Box>

      <>
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
        {openPolicy && (
          <PolicyDialog
            onClose={() => {
              setOpenPolicy(false);
            }}
            onSuccess={() => {
              fetchData();
              setOpenPolicy(false);
            }}
            resource={resource}
            resourceData={resourceData}
          />
        )}

        {openSetting && (
          <Setting
            onClose={() => {
              setOpenSetting(false);
            }}
            onSuccess={() => {
              fetchData();
              setOpenSetting(false);
            }}
            resource={resource}
            resourceData={resourceData}
          />
        )}
        {openAction && (
          <Actions
            onClose={() => {
              setOpenAction(false);
            }}
            onSuccess={() => {
              fetchData();
              setOpenAction(false);
            }}
            resource={resource}
            resourceData={resourceData}
          />
        )}
        {openNotifications && (
          <Notifications
            onClose={() => {
              setOpenNotifications(false);
            }}
            onSuccess={() => {
              fetchData();
              setOpenNotifications(false);
            }}
            resource={resource}
            resourceData={resourceData}
          />
        )}
      </>
    </Box>
  );
};

export default Steps;

const RenderStepItems = ({ steps, setSteps, stepsLoading, setOpen, setOpenField, setDeleteData }) => {
  return (
    <div className="grid grid-cols-1 gap-2">
      {steps && steps?.length ? (
        <ul className="list-none grid gap-2 items-start">
          <SortableContext items={steps.map((d) => d._id)}>
            {steps?.map((step, index) => {
              return <SingleStep key={step._id} {...{ step, setSteps, setOpen, setOpenField, setDeleteData, index }} />;
            })}
          </SortableContext>
        </ul>
      ) : stepsLoading ? (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      ) : (
        <Box minHeight={'300px'} display={'flex'} justifyContent={'center'} alignItems={'center'}>
          Steps not added yet!
        </Box>
      )}
    </div>
  );
};

const SingleStep = ({ step, setOpen, setOpenField, setDeleteData, index }) => {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: step._id,
    data: {
      index,
      props: { step, setOpen, setOpenField, setDeleteData, index }
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition
  };

  return (
    <>
      <li ref={setNodeRef} style={style} className="bg-[var(--dark-secondary,white)] cursor-grab list-none">
        <div
          className={`${
            isDragging ? '[border:1px_dashed_var(--common-border-color)]' : '[border:1px_solid_var(--common-border-color)]'
          }   p-3 rounded-[5px]`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconButton size={'small'} className={`[cursor:move_!important]`} {...attributes} {...listeners}>
                <MdDragIndicator size={20} className="text-[var(--primary-text)]" />
              </IconButton>
              <h3 className="line-clamp-2 md:line-clamp-1 font-semibold">{step?.stepName}</h3>
            </div>
            <div className="min-w-fit">
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
              {!step?.linkWithResource && (
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
              )}
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
            </div>
          </div>
        </div>
      </li>
    </>
  );
};
