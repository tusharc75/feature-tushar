import { Box, Button, IconButton } from '@material-ui/core';
import BuildIcon from '@material-ui/icons/Build';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
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

const DND_NAME = 'Box';

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
        <DndProvider backend={isMobile || isTablet ? TouchBackend : HTML5Backend}>
          <RenderStepItems {...{ steps, setSteps, setOpen, setOpenField, setDeleteData }} />
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
    </Box>
  );
};

export default Steps;

const RenderStepItems = ({ steps, setSteps, setOpen, setOpenField, setDeleteData }) => {
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
      {steps &&
        steps?.map((step, i) => {
          return <SingleStep key={step._id} {...{ step, i, setSteps, setOpen, setOpenField, setDeleteData, moveStep, findStep }} />;
        })}
    </div>
  );
};

const SingleStep = ({ step, i, setOpen, setOpenField, setDeleteData, moveStep, findStep }) => {
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
      }
    }),
    [findStep, moveStep]
  );

  return (
    <div ref={preview} style={{ opacity }}>
      <div ref={(node) => drop(node)} className="[border:1px_solid_var(--common-border-color)] p-3 rounded-[5px]">
        <div className="flex gap-2 justify-between">
          <h3 className="line-clamp-1 font-semibold">{step?.stepName}</h3>
          <IconButton size={'small'} className={`[cursor:move_!important]`} ref={drag}>
            <MdDragIndicator size={20} className="text-[var(--primary-text)]" />
          </IconButton>
        </div>
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
      </div>
    </div>
  );
};
