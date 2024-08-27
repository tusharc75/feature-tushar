import { Box, Button, IconButton } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import BuildIcon from '@material-ui/icons/Build';
import { useCallback, useContext, useEffect, useState } from 'react';
import { MdDragIndicator } from 'react-icons/md';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDndSensors } from 'src/hooks';
import ManageSteps from 'src/components/FormBuilder/Steps/ManageSteps';
import routes from 'src/components/Helpers/Routes';
import { sortBy } from 'lodash';
import axios, { CancelTokenSource } from 'axios';

const Steps = ({ resource, loading, id }) => {
  const toastConfig = useContext(CustomToastContext);
  const [stepsLoading, setStepsLoading] = useState(false);
  const [open, setOpen] = useState({ open: false, data: null });
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [steps, setSteps] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(
    async (cancelTokenSource?: CancelTokenSource) => {
      setStepsLoading(true);
      axiosInstance()
        .get(`${routes.workFlow.path}/${id}/steps`, { cancelToken: cancelTokenSource?.token })
        .then(({ data: { data } }) => {
          setSteps(sortBy(data?.steps, 'order'));
          setStepsLoading(false);
        })
        .catch((error) => {
          setStepsLoading(false);
          toastConfig.setToastConfig(error);
        });
    },
    []
  );

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, []);

  const handleSave = (values)=>{
    setIsSubmitting(true);
    if (values?.stepId) {
      axiosInstance()
        .put(`${routes.workFlow.path}/${id}/steps`, values )
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setIsSubmitting(false);
          fetchData();
        })
        .catch((error) => {
          setIsSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .post(`${routes?.workFlow.path}/${id}/steps`, values)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setIsSubmitting(false);
          fetchData();
        })
        .catch((error) => {
          setIsSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    }
  }

  const handleDelete = (step) => {
    setDeleting(true);
    axiosInstance()
      .put(`${routes.workFlow.path}/${id}/steps/delete`, { stepId: step?._id })
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
        `${routes.workFlow.path}/${id}/steps/order`,
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

  const sensors = useDndSensors();

  return (
    <Box className="conditions-container container-with-border mb-2 p-2 sm:mb-3 sm:p-3 md:mb-4 md:p-4">
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
      </Box>
      <Box pt={2}>
        <DndContext onDragEnd={handleOnDragEnd} onDragStart={onDragStart} sensors={sensors} modifiers={[restrictToVerticalAxis]}>
          <RenderStepItems {...{ steps, setSteps, stepsLoading, loading, setOpen, setDeleteData }} />
          <DragOverlay>
            {activeItem && (
              <span className="[&_.drag-handle]:!cursor-grabbing">
                <SingleStep {...activeItem} />
              </span>
            )}
          </DragOverlay>
        </DndContext>
      </Box>

      <>
        {(open?.open || isSubmitting) && (
          <ManageSteps
            data={open?.data}
            onSuccess={(data) => {
              handleSave(data);
              setOpen({ open: false, data: null });
            }}
            onClose={() => {
              setOpen({ open: false, data: null });
            }}
            isSubmitting={isSubmitting}
            resource={resource}
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
      </>
    </Box>
  );
};

export default Steps;

const RenderStepItems = ({ steps, setSteps, stepsLoading, setOpen, setDeleteData, loading }) => {
  return (
    <div className="grid grid-cols-1 gap-2">
      {steps && steps?.length ? (
        <ul className="grid list-none items-start gap-2">
          <SortableContext items={steps.map((d) => d._id)}>
            {steps?.map((step, index) => {
              return <SingleStep key={step._id} {...{ step, setSteps, setOpen, setDeleteData,index }} />;
            })}
          </SortableContext>
        </ul>
      ) : stepsLoading || loading ? (
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

const SingleStep = ({ step, setOpen, setDeleteData, index }) => {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: step._id,
    data: {
      index,
      props: { step, setOpen,  setDeleteData, index }
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition
  };

  return (
    <>
      <li ref={setNodeRef} style={style} className={` list-none `}>
        <div
          className={` rounded-[5px]  p-2 [border:1px_solid_var(--common-border-color)] ${isDragging ? 'bg-[var(--dark-primary,theme("colors.blue.200"))]' : 'bg-[var(--dark-secondary,white)]'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconButton size={'small'} className={`drag-handle !cursor-grab `} {...attributes} {...listeners}>
                <MdDragIndicator size={20} className="text-[var(--primary-text)]" />
              </IconButton>
              <h3 className="line-clamp-2 font-semibold md:line-clamp-1">{step?.stepName}</h3>
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
