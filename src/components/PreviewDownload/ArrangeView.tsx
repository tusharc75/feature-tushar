import { Checkbox, Dialog, FormControlLabel, IconButton, ListItemIcon, ListItemText, TextField } from '@mui/material';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { DragIndicator, Info } from '@mui/icons-material';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import update from 'immutability-helper';
import { useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import HtmlTooltip from '../CustomTooltipTitle';
import Autocomplete from '@mui/material/Autocomplete';

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDndSensors } from 'src/hooks';
import { CustomDialogTransition } from 'src/constants/helpers';
import { startCase } from 'lodash';

export default function ArrangeView({ columns, setColumns }) {
  const [open, setOpen] = useState(false);
  const [fullScreen, setFullScreen] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  const [column, setColumn] = useState([]);

  useEffect(() => {
    setColumn(columns.map((e, idx) => ({ id: idx + 1, ...e })));
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

  const setColumnWidth = (id, width) => {
    setColumn(
      column.map((c) => {
        return c.id === id ? { ...c, width } : c;
      })
    );
  };

  const setColumnLabel = (id, label) => {
    setColumn(
      column.map((c) => {
        return c.id === id ? { ...c, customLabel: label } : c;
      })
    );
  };

  const setColumnAlignment = (id, alignment) => {
    setColumn(
      column.map((c) => {
        return c.id === id ? { ...c, alignment } : c;
      })
    );
  };

  const setColumnShowBelowRow = (id, value) => {
    setColumn(
      column.map((c) => {
        if (value && !c.showBelowRow) {
          return c.id === id ? { ...c, showBelowRow: value, alignment: null } : c;
        }
        return c.id === id ? { ...c, showBelowRow: value } : c;
      })
    );
  };

  const onDragStart = (event: DragStartEvent) => {
    if (!event?.active) return;
    setActiveItem(event.active.data.current?.props);
  };

  const onSave = () => {
    setSubmitting(true);
    setColumns(
      column.map((e) => {
        return {
          fieldName: e.fieldName,
          fieldLabel: e.fieldLabel,
          width: e.width,
          customLabel: e?.customLabel,
          showBelowRow: e?.showBelowRow,
          alignment: e?.showBelowRow ? null : e?.alignment
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
      <HtmlTooltip title="Arrange Columns" placement="top" arrow>
        <IconButton
          aria-describedby="columnSelection"
          size="small"
          className="arrange-view-v1  px-2"
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
            title="Arrange Columns"
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
              <div className="sticky -top-2 z-10 flex flex-wrap bg-[var(--dark-primary,white)] pb-4 pt-2">
                <p className=" flex select-none items-center gap-1 text-[12px] font-semibold text-gray-500">
                  <Info fontSize="small" />
                  Drag and drop to arrange, enter the width as a percentage, custom label for change table header, and alignment for text position.
                </p>
              </div>
              <SortableContext items={column?.map((c) => c.id) || []}>
                <ul className="list-none">
                  {column.map((col, index) => (
                    <RenderListItem
                      key={col.id}
                      index={index}
                      id={col.id}
                      fieldLabel={col.fieldLabel}
                      width={col.width}
                      setWidth={(w) => {
                        setColumnWidth(col.id, w);
                      }}
                      customLabel={col?.customLabel}
                      setCustomLabel={(l) => {
                        setColumnLabel(col.id, l);
                      }}
                      alignment={col?.alignment}
                      setAlignment={(a) => {
                        setColumnAlignment(col.id, a);
                      }}
                      showBelowRow={col.showBelowRow}
                      setShowBelowRow={(v) => {
                        setColumnShowBelowRow(col.id, v);
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
  width: string;
  setWidth: (width: string) => void;
  customLabel: string;
  setCustomLabel: (label: string) => void;
  alignment: string;
  setAlignment: (alignment: string) => void;
  showBelowRow: boolean;
  setShowBelowRow: (value: boolean) => void;
}

const RenderListItem = ({
  index,
  id,
  fieldLabel,
  width,
  setWidth,
  customLabel,
  setCustomLabel,
  alignment,
  setAlignment,
  showBelowRow = false,
  setShowBelowRow,
}: ItemProps) => {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id,
    data: {
      index,
      props: { index, id, fieldLabel }
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
      <div
        key={id}
        className={`grid grid-cols-[20px_1fr_650px] items-center gap-2 p-[8px_0px] [border-bottom:1px_solid_var(--common-border-color)] max-sm:grid-cols-[20px_1fr] ${index === 0 ? '[border-top:1px_solid_var(--common-border-color)]' : ''
          } `}
      >
        <ListItemIcon {...attributes} {...listeners} className="drag-handle !cursor-grab">
          <DragIndicator />
        </ListItemIcon>
        <ListItemText primary={fieldLabel} />
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr] items-center gap-2 max-sm:col-span-2 max-sm:ml-[28px]">
          <TextField
            variant="outlined"
            margin="none"
            size="small"
            placeholder="Custom Label"
            fullWidth
            value={customLabel}
            onChange={(e) => {
              setCustomLabel(e?.target?.value);
            }}
          />
          <Autocomplete
            size="small"
            fullWidth
            disabled={showBelowRow}
            options={["left", "center", "right"]}
            getOptionLabel={(option) => startCase(option)}
            value={alignment}
            renderInput={(params) => (
              <TextField {...params} placeholder="Alignment" variant="outlined" margin="none" />
            )}
            onChange={(_, newValue) => {
              setAlignment(newValue);
            }}
          />
          <TextField
            variant="outlined"
            margin="none"
            size="small"
            fullWidth
            value={width}
            onChange={(e) => {
              setWidth(e?.target?.value);
            }}
            slotProps={{
              input: {
                endAdornment: '%'
              }
            }}
            placeholder="Width"
          />
          <div className='min-w-[200px]'>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  name={'showBelowRow'}
                  checked={showBelowRow}
                  onChange={(e) => {
                    if (e.target.checked && alignment) {
                      // Clearing alignment when showBelowRow is checked as it is illogical then
                      setAlignment(null);
                    }
                    setShowBelowRow(e.target.checked);
                  }}
                />
              }
              label="Show Below Row"
              className="ml-2"
            />
          </div>
        </div>
      </div>
    </li>
  );
};
