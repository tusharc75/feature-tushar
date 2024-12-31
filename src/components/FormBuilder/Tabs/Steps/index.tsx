import { Box, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { sortBy } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { MdDragIndicator } from 'react-icons/md';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ConfirmationDialog from '../../../../components/Helpers/ConfirmationDialog';
import ManageSteps from './ManageSteps';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDndSensors } from 'src/hooks';
import { AddOutlined } from '@mui/icons-material';
import routes from 'src/components/Helpers/Routes';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const Steps = ({ resourceData, tab, fetchData, workflowId = null }) => {
  const toastConfig = useContext(CustomToastContext);

  const [steps, setSteps] = useState(null);
  const [open, setOpen] = useState({ open: false, data: null });
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setSteps(sortBy(tab?.steps || [], 'order'));
  }, [resourceData, tab]);

  const handleSave = (values) => {
    setIsSubmitting(true);
    let api = `/sa-formbuilder/tabs/steps/${resourceData?._id}/${tab?._id}`;
    if (workflowId) api = `${routes.workflow.path}/tabs/steps/${workflowId}/${tab?._id}`;
    if (values?.stepId) {
      axiosInstance()
        .put(api, values)
        .then(({ data }) => {
          setIsSubmitting(false);
          fetchData();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setOpen({ open: false, data: null });
        })
        .catch((error) => {
          setIsSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .post(api, { ...values, order: steps?.length > 0 ? steps?.length : 0 })
        .then(({ data }) => {
          setIsSubmitting(false);
          fetchData();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setOpen({ open: false, data: null });
        })
        .catch((error) => {
          setIsSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleDelete = (step) => {
    setDeleting(true);
    let api = `/sa-formbuilder/tabs/steps/${resourceData?._id}/${tab?._id}/delete`;
    if (workflowId) api = `${routes.workflow.path}/tabs/steps/${workflowId}/${tab?._id}/delete`;
    axiosInstance()
      .put(api, { stepId: step?._id })
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
    let api = `/sa-formbuilder/tabs/steps/${resourceData?._id}/${tab?._id}/order`;
    if (workflowId) api = `${routes.workflow.path}/tabs/steps/${workflowId}/${tab?._id}/order`;
    axiosInstance()
      .put(
        api,
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
    <Box>
      <Box>
        <ThemeButton
          onClick={() => {
            setOpen({ open: true, data: null });
          }}
          startIcon={<AddOutlined />}
        >
          Add Step
        </ThemeButton>
      </Box>
      <Box pt={2}>
        <DndContext onDragEnd={handleOnDragEnd} onDragStart={onDragStart} sensors={sensors} modifiers={[restrictToVerticalAxis]}>
          <RenderStepItems {...{ steps, setSteps, setOpen, setDeleteData }} />
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
        {open?.open && (
          <ManageSteps
            isSubmitting={isSubmitting}
            data={open?.data}
            onSuccess={(data) => {
              handleSave(data);
            }}
            onClose={() => {
              setOpen({ open: false, data: null });
            }}
            resource={resourceData?.resource || resourceData?.workflowResource}
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

const RenderStepItems = ({ steps, setSteps, setOpen, setDeleteData }) => {
  return (
    <div className="grid grid-cols-1 gap-2">
      {steps && steps?.length ? (
        <ul className="grid list-none items-start gap-2">
          <SortableContext items={steps.map((d) => d._id)}>
            {steps?.map((step, index) => {
              return <SingleStep key={step._id} {...{ step, setSteps, setOpen, setDeleteData, index }} />;
            })}
          </SortableContext>
        </ul>
      ) : (
        <Box minHeight={'50px'} display={'flex'} justifyContent={'center'} alignItems={'center'}>
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
      props: { step, setOpen, setDeleteData, index }
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
          className={`rounded-[5px]  p-3 [border:1px_solid_var(--common-border-color)] ${isDragging ? 'bg-[var(--dark-primary,theme("colors.blue.200"))]' : 'bg-[var(--dark-secondary,white)]'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconButton size={'small'} className={`drag-handle !cursor-grab `} {...attributes} {...listeners}>
                <MdDragIndicator size={20} className="text-[var(--primary-text)]" />
              </IconButton>
              <h4 className="line-clamp-2 font-normal	md:line-clamp-1">{step?.stepName}</h4>
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
