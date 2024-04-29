import { Box, Button, IconButton } from '@material-ui/core';
import BuildIcon from '@material-ui/icons/Build';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import SettingIcon from '@material-ui/icons/Settings';
import AddAlertIcon from '@material-ui/icons/AddAlert';
import update from 'immutability-helper';
import { useCallback, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { MdDragIndicator } from 'react-icons/md';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import ConfigureField from './ConfigureField';
import ManageSteps from './ManageSteps';
import _ from 'lodash';
import Setting from './Setting';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import Actions from './Actions';
import Notifications from './Notifications';
import PolicyDialog from './policyDialog';

const DND_NAME = 'Box';

const Steps = ({ resource }) => {
  const toastConfig = useContext(CustomToastContext);

  const [resourceData, setResourceData] = useState(null);
  const [steps, setSteps] = useState(null);
  const [stepsLoading, setStepsLoading] = useState(false);
  const [initialSteps, setInitialSteps] = useState(null);
  const [open, setOpen] = useState({ open: false, data: null });
  const [openField, setOpenField] = useState({ open: false, step: null });
  const [resourceId, setResourceId] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [openSetting, setOpenSetting] = useState(false);
  const [openAction, setOpenAction] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [openPolicy,setOpenPolicy] = useState(false)

  const fetchData = async () => {
    setStepsLoading(true);
    axiosInstance()
      .get(`/sa-formbuilder/steps/${resource}`)
      .then(({ data: { data } }) => {
        setResourceData(data);
        setResourceId(data?._id);
        setSteps(_.sortBy(data?.steps, 'order'));
        setInitialSteps(_.sortBy(data?.steps, 'order'));
        setStepsLoading(false);
      })
      .catch((error) => {
        setStepsLoading(false);
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

  const handleUpdateOrder = () => {
    if (!isEqualOrder(initialSteps, steps)) {
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
    }
  };

  const isEqualOrder = (initialSteps, newSteps) => {
    let isEqual = true;

    initialSteps?.forEach((step) => {
      if (newSteps?.find((s) => s?._id === step?._id)?.order !== step?.order) {
        isEqual = false;
      }
    });

    return isEqual;
  };

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
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => {
            setOpenPolicy(true);
          }}
        >
          Policy
        </Button>
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
        <DndProvider backend={isMobile || isTablet ? TouchBackend : HTML5Backend}>
          <RenderStepItems {...{ steps, setSteps, stepsLoading, setOpen, setOpenField, setDeleteData, handleUpdateOrder }} />
        </DndProvider>
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
      {openPolicy && (
        <PolicyDialog 
        onClose={()=>{
          setOpenPolicy(false);
        }}
        onSuccess={()=>{
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
    </Box>
  );
};

export default Steps;

const RenderStepItems = ({ steps, setSteps, stepsLoading, setOpen, setOpenField, setDeleteData, handleUpdateOrder }) => {
  const findStep = useCallback(
    (id: string) => {
      const card = steps.filter((c) => `${c._id}` === id)[0] as {
        id: string;
        stepName: string;
        order: number;
      };
      return {
        card,
        index: steps.indexOf(card)
      };
    },
    [steps]
  );

  const moveStep = useCallback(
    (id: string, atIndex: number) => {
      const { card, index } = findStep(id);
      const tempStpes = update(steps, {
        $splice: [
          [index, 1],
          [atIndex, 0, card]
        ]
      });
      const newSteps = tempStpes.map((step, i) => ({ ...step, order: i }));
      setSteps(newSteps);
    },
    [findStep, steps, setSteps]
  );

  const [, drop] = useDrop(() => ({ accept: DND_NAME }));

  return (
    <div className="grid grid-cols-1 gap-2" ref={drop}>
      {steps && steps?.length ? (
        steps?.map((step, i) => {
          return (
            <SingleStep key={step._id} {...{ step, i, setSteps, setOpen, setOpenField, setDeleteData, moveStep, findStep, handleUpdateOrder }} />
          );
        })
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

const SingleStep = ({ step, i, setOpen, setOpenField, setDeleteData, moveStep, findStep, handleUpdateOrder }) => {
  const [{ opacity }, drag, preview] = useDrag(() => ({
    type: DND_NAME,
    item: { id: step._id, originalIndex: i },
    collect: (monitor) => ({
      opacity: monitor.isDragging() ? 0.4 : 1
    }),
    end: (item, monitor) => {
      const { id: droppedId, originalIndex } = item;
      const didDrop = monitor.didDrop();
      if (!didDrop) {
        moveStep(droppedId, originalIndex);
      }
    }
  }));

  const [, drop] = useDrop(
    () => ({
      accept: DND_NAME,
      hover({ id: draggedId }) {
        if (draggedId !== step._id) {
          const { index: overIndex } = findStep(step._id);
          moveStep(draggedId, overIndex);
        }
      },
      drop(item, monitor) {
        if (!monitor.didDrop()) {
          handleUpdateOrder();
        }
      }
    }),
    [findStep, moveStep]
  );

  return (
    <div ref={preview} style={{ opacity }}>
      <div ref={(node) => drop(node)} className="[border:1px_solid_var(--common-border-color)] p-3 rounded-[5px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconButton size={'small'} className={`[cursor:move_!important]`} ref={drag}>
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
    </div>
  );
};
