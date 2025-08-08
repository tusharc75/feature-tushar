import { DragIndicator, Info } from '@mui/icons-material';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { Checkbox, Dialog, FormControlLabel, IconButton, TextField } from '@mui/material';
import update from 'immutability-helper';
import { memo, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn, CustomDialogTransition } from 'src/constants/helpers';
import { useDndSensors } from 'src/hooks';

export default function ArrangeChildResourceFieldView({ columns, setColumns, disabled, childResourceFields }) {

  const [open, setOpen] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [isSubmitting, setSubmitting] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  const [column, setColumn] = useState([]);

  useEffect(() => {
    setColumn(columns?.map((e, idx) => ({ id: idx + 1, ...e })) || []);
  }, [columns]);

  const moveCard = (event: DragEndEvent) => {
    if (!event.over) return;

    const dragIndex = event.active.data.current.index;
    const dropIndex = event.over.data.current.index;

    const dragCard = column[dragIndex];
    setColumn(
      update(column, {
        $splice: [
          [dragIndex, 1],
          [dropIndex, 0, dragCard]
        ]
      })
    );
  };

  const setColumnLabel = (id, label) => {
    setColumn(
      column?.map((c) => {
        return c?.id === id ? { ...c, customLabel: label } : c;
      })
    );
  };

  const setColumnHideOnZeroValue = (id, value) => {
    setColumn(
      column?.map((c) => {
        return c?.id === id ? { ...c, hideOnZeroValue: value } : c;
      })
    );
  };

  const onDragStart = (event: DragStartEvent) => {
    if (!event?.active) return;
    setActiveItem(event?.active?.data?.current?.props);
  };

  const onSave = () => {
    setSubmitting(true);
    setColumns(
      column?.map((e) => {
        return {
          fieldName: e?.fieldName,
          customLabel: e?.customLabel,
          hideOnZeroValue: e?.hideOnZeroValue
        };
      })
    );
    setSubmitting(false);
    onClose();
  };

  const onClose = () => {
    setOpen(false);
  };

  const sensors = useDndSensors();

  return (
    <>
      <HtmlTooltip title="Arrange" placement="top" arrow>
        <IconButton
          disabled={disabled}
          aria-describedby="columnSelection"
          size="small"
          className="arrange-view-v1 px-2"
          color="primary"
          onClick={(event) => {
            setOpen(true);
          }}
        >
          <SwapVertIcon />
        </IconButton>
      </HtmlTooltip>
      {open && (
        <Dialog
          TransitionComponent={CustomDialogTransition}
          open
          onClose={onClose}
          maxWidth="md"
          fullWidth
          fullScreen={fullScreen || isMobile || isTablet}
        >
          <CustomDialogHeader
            title="Arrange"
            onClose={onClose}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen((prevState) => !prevState);
            }}
            showManimizeMaximize={true}
            showRequiredLabel={false}
          />
          <CustomDialogContent>
            <DndContext onDragEnd={moveCard} onDragStart={onDragStart} sensors={sensors} modifiers={[restrictToVerticalAxis]}>
              <div className="sticky -top-[12px] z-10 flex flex-wrap bg-[var(--dark-primary,white)] pb-4 pt-2">
                <p className=" flex select-none items-center gap-1 text-[12px] font-semibold text-gray-500">
                  <Info fontSize="small" />
                  Drag and drop to arrange.
                </p>
              </div>
              <SortableContext items={column?.map((c) => c?.id) || []}>
                <ul className="list-none">
                  {column?.map((col, index) => (
                    <RenderListItem
                      key={col?.id}
                      index={index}
                      id={col?.id}
                      fieldLabel={childResourceFields?.find((e) => e?.fieldName === col?.fieldName)?.fieldLabel || col?.fieldName}
                      isFullScreen={fullScreen || isMobile || isTablet}
                      customLabel={col?.customLabel}
                      setCustomLabel={(l) => {
                        setColumnLabel(col?.id, l);
                      }}
                      hideOnZeroValue={col?.hideOnZeroValue}
                      setHideOnZeroValue={(v) => {
                        setColumnHideOnZeroValue(col?.id, v);
                      }}
                    />
                  ))}
                </ul>
              </SortableContext>
              <DragOverlay>
                <span className="[&_.drag-handle]:!cursor-grabbing">{activeItem && <RenderListItem {...activeItem} />}</span>
              </DragOverlay>
            </DndContext>
          </CustomDialogContent>
          <CustomDialogFooter>
            <ThemeButton disabled={isSubmitting} buttonType="transparent" onClick={onClose}>
              Cancel
            </ThemeButton>
            <ThemeButton disabled={isSubmitting} buttonType="theme" onClick={onSave}>
              Save
            </ThemeButton>
          </CustomDialogFooter>
        </Dialog>
      )}
    </>
  );
}

interface ItemProps {
  id: any;
  fieldLabel: string;
  index: number;
  customLabel: string;
  setCustomLabel: (label: string) => void;
  hideOnZeroValue: boolean;
  setHideOnZeroValue: (value: boolean) => void;
  isFullScreen: boolean;
}

const RenderListItem = memo(
  ({ index, id, fieldLabel, customLabel, setCustomLabel, hideOnZeroValue = false, setHideOnZeroValue, isFullScreen }: ItemProps) => {
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
      id,
      data: {
        index,
        props: { index, id, fieldLabel, isFullScreen }
      }
    });

    const style = {
      transform: CSS.Translate.toString(transform),
      transition
    };

    return (
      <li
        style={style}
        ref={setNodeRef}
        className={`${isDragging ? ' bg-[var(--dark-secondary,theme("colors.blue.200"))] ' : 'bg-[var(--dark-secondary,#fff)]'
          } list-none transition-colors`}
      >
        <div key={id} className={cn(`rounded-md border p-[8px_0px]`, index === 0 ? 'mt-0' : 'mt-2')}>
          <div className="flex items-center gap-1">
            <IconButton color="primary" size="small" {...attributes} {...listeners} className="drag-handle !cursor-grab">
              <DragIndicator fontSize="small" />
            </IconButton>
            <h6 className="text-base font-semibold">{fieldLabel}</h6>
          </div>
          <div
            className={cn('grid gap-2 p-2', isFullScreen ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'grid-cols-2 md:grid-cols-3')}
          >
            <TextField
              variant="outlined"
              margin="none"
              size="small"
              placeholder="Custom Label"
              label="Custom Label"
              fullWidth
              value={customLabel}
              onChange={(e) => {
                setCustomLabel(e?.target?.value);
              }}
            />
            <div className="col-span-2 md:col-span-1">
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    name={'hideOnZeroValue'}
                    checked={hideOnZeroValue}
                    onChange={(e) => {
                      setHideOnZeroValue(e.target.checked);
                    }}
                  />
                }
                label="Hide On Zero Value"
                className="!ml-[0px]"
              />
            </div>
          </div>
        </div>
      </li>
    );
  }
);
