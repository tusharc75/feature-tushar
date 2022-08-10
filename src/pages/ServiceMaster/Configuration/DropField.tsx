import React, { CSSProperties } from 'react';
import { Grid, Box, TextField, Typography, IconButton, Menu, MenuItem } from '@material-ui/core';
import { useDrag, useDrop, XYCoord } from 'react-dnd';
import { MoreHoriz } from '@material-ui/icons';

const style: CSSProperties = {
  padding: '0.5rem',
  marginBottom: '.5rem',
  backgroundColor: 'white',
  cursor: 'move'
};

const DropField = ({ id, index, data, moveField, handleLabelChange, removeField, openProperties, cloneField }: any) => {
  const ref = React.useRef(null);
  const [anchorEl, setAnchorEl] = React.useState(null);

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: 'fieldmove',
      item: { id, index, sorting: true },
      collect: (monitor) => ({
        isDragging: monitor.isDragging()
      })
    }),
    [id]
  );
  const [, drop] = useDrop({
    accept: 'fieldmove',
    drop: () => {},
    hover(item: any, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) {
        return;
      }
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      moveField(dragIndex, hoverIndex);
      item.index = hoverIndex;
    }
  });

  drag(drop(ref));

  return (
    <Grid item xs={12} sm={6}>
      <div ref={ref}>
        <Box style={{ ...style, opacity: isDragging ? 0.5 : 1, border: isDragging ? '1px dashed gray' : '1px solid lightgray' }}>
          <Grid container spacing={1}>
            <Grid item xs={5}>
              {data ? (
                <TextField
                  id={data.id}
                  variant="outlined"
                  margin="dense"
                  style={{ margin: 2 }}
                  value={data.fieldLabel}
                  onChange={(event) => handleLabelChange(data.id, event.target.value)}
                />
              ) : (
                ''
              )}
            </Grid>
            <Grid item xs={5}>
              <Box pt={1} color="text.secondary">
                <Typography variant="body2">{data.type}</Typography>
              </Box>
            </Grid>
            <Grid item xs={2} container justify="flex-end">
              <Box
                mt={1}
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  navigator.clipboard.writeText(data?.fieldName);
                }}
              ></Box>
              <IconButton
                aria-label="setting"
                onClick={(e) => {
                  setAnchorEl(e.currentTarget);
                }}
              >
                <MoreHoriz fontSize="small" />
              </IconButton>
              <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                <MenuItem
                  onClick={() => {
                    openProperties();
                    setAnchorEl(null);
                  }}
                >
                  Edit Properties
                </MenuItem>
                <MenuItem onClick={() => cloneField(data)}>Clone</MenuItem>
                <MenuItem
                  onClick={() => {
                    removeField(id);
                    setAnchorEl(null);
                  }}
                >
                  Delete
                </MenuItem>
              </Menu>
            </Grid>
          </Grid>
        </Box>
      </div>
    </Grid>
  );
};

export default DropField;
