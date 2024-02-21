import React, { useRef, useContext, Fragment } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import FieldList from './FieldList';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { checkFieldDependency } from 'src/constants/formulaUtility';

const style = {
  cursor: 'move'
};

const dropstyle = {
  backgroundColor: '#e3f2fd',
  borderColor: '#90caf9',
  borderStyle: 'dotted',
  cursor: 'move',
  height: '54px'
};

export const DropField = ({ section, setSection, sectionId, data, fieldId, index, fieldHoverId, setFieldHoverId, movefield }) => {
  const ref = useRef(null);
  const toastConfig = useContext(CustomToastContext);

  const [{}, drop] = useDrop({
    accept: ['fieldmove', 'field'],
    drop: () => {},
    hover: (item: any, monitor) => {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      // Don't replace items with themselves
      if (item.type === 'field') {
        if (dragIndex === hoverIndex) {
          return;
        }
      } else {
        if (dragIndex === hoverIndex && item.id && fieldId && item.id.toString() === fieldId.toString()) {
          return;
        }
      }
      if (item.type === 'fieldmove') {
        // Determine rectangle on screen
        const hoverBoundingRect = ref.current?.getBoundingClientRect();
        // Get vertical middle
        const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
        // Determine mouse position
        const clientOffset = monitor.getClientOffset();
        // Get pixels to the top
        const hoverClientY = clientOffset.y - hoverBoundingRect.top;

        if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
          return;
        }
        // Dragging upwards
        if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
          return;
        }
        movefield(item.type, dragIndex, hoverIndex, item.sectionId, item.id);
      } else {
        movefield(item.type, dragIndex, hoverIndex, sectionId, item.id);
      }

      item.index = hoverIndex;
      item.sectionId = sectionId;
    }
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'fieldmove',
    item: { type: 'fieldmove', id: fieldId, index, sectionId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    end(item, monitor) {
      setFieldHoverId(null);
    }
  });

  const opacity = isDragging ? 0 : 1;

  drag(drop(ref));

  const onChangeFieldName = (fieldId, value) => {
    let data = [...section];
    data.forEach((row) => {
      if (row.sectionId.toString() === sectionId.toString()) {
        row.field.forEach((ele) => {
          if (ele._id.toString() === fieldId.toString()) {
            ele.fieldLabel = value;
          }
        });
      }
    });
    setSection(data);
  };

  const deleteField = (fieldId) => {
    let data = [...section];
    var result = checkFieldDependency(fieldId, sectionId, data);
    if (result.error) {
      toastConfig.setToastConfig({ open: true, type: 'error', message: result.message });
      return;
    }
    data.forEach((row) => {
      if (row.sectionId.toString() === sectionId.toString()) {
        row.field = row.field.filter((i) => i._id.toString() !== fieldId.toString());
      }
    });
    setSection(data);
  };

  return (
    <Grid item xs={12} md={6} sm={6}>
      {!data._id || (fieldHoverId && fieldHoverId.toString() === data._id.toString()) ? (
        <div ref={ref} style={{ ...dropstyle }}></div>
      ) : (
        <div ref={ref}>
          <Box border={1} p={0.5} borderColor="var(--common-border-color)" style={{ ...style, opacity }}>
            <Grid container spacing={1}>
              <Grid item xs={5}>
                {data.editAble ? (
                  <TextField
                    id={data._id}
                    variant="outlined"
                    margin="dense"
                    style={{ margin: 2 }}
                    value={data.fieldLabel}
                    onChange={(event) => onChangeFieldName(data._id, event.target.value)}
                  />
                ) : (
                  <Box pt={1.2} pl={2}>
                    <Typography variant="body2">{data.fieldLabel}</Typography>
                  </Box>
                )}
              </Grid>
              <Grid item xs={5}>
                <Box pt={1} color="text.secondary">
                  <Typography variant="body2">{FieldList[data?.type?.toUpperCase()]?.label}</Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </div>
      )}
    </Grid>
  );
};
