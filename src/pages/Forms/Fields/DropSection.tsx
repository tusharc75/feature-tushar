import { Box, Grid, IconButton, Menu, MenuItem, TextField, Typography } from '@material-ui/core';
import { useCallback, useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import update from 'immutability-helper';
import SettingsIcon from '@material-ui/icons/Settings';
import { DropField } from './DropField';
import FieldList, { TEXTBOX, DROPDOWN, DATE } from './FieldList';

const style = {
  cursor: 'move'
};

const dropstyle = {
  backgroundColor: '#e3f2fd',
  borderColor: '#90caf9',
  borderStyle: 'dashed',
  cursor: 'move'
};

const DropSection = ({
  sectionHoverIndex,
  setSectionHoverIndex,
  fieldHoverId,
  setFieldHoverId,
  index,
  sectionId,
  moveSection,
  section,
  setSection,
  data
}) => {
  const ref = useRef(null);

  const [anchorEl, setAnchorEl] = useState(null);

  const returnType = (type: string) => {
    if (type === FieldList['TEXTBOX'].type) {
      return TEXTBOX.SINGLELINE.type;
    }

    if (type === FieldList['DROPDOWN'].type) {
      return DROPDOWN.DROPDOWN.type;
    }

    if (type === FieldList['DATE'].type) {
      return DATE.DATE.type;
    }
    return type;
  };

  const fieldLabel = (field: [], type: string) => {
    if (type === FieldList['TEXTBOX'].type) {
      return (
        FieldList[type?.toUpperCase()]?.label +
        ' ' +
        (field.filter((i: any) =>
          Object.keys(TEXTBOX)
            ?.map((t) => TEXTBOX[t]?.type)
            ?.includes(i?.type)
        )?.length +
          1)
      );
    }

    if (type === FieldList['DROPDOWN'].type) {
      return (
        FieldList[type?.toUpperCase()]?.label +
        ' ' +
        (field.filter((i: any) =>
          Object.keys(DROPDOWN)
            ?.map((t) => DROPDOWN[t]?.type)
            ?.includes(i?.type)
        )?.length +
          1)
      );
    }

    if (type === FieldList['DATE'].type) {
      return (
        FieldList[type?.toUpperCase()]?.label +
        ' ' +
        (field.filter((i: any) =>
          Object.keys(DATE)
            ?.map((t) => DATE[t]?.type)
            ?.includes(i?.type)
        )?.length +
          1)
      );
    }

    return FieldList[type?.toUpperCase()]?.label + ' ' + (field.filter((i: any) => i.type === type)?.length + 1);
  };

  const addField = (sectionId, type, index) => {
    let data = [...section];
    data.forEach((row) => {
      row.field = row.field.filter((i) => i._id);
      if (row.sectionId.toString() === sectionId.toString()) {
        let option = [];
        if (
          type === FieldList.DROPDOWN.type ||
          type === FieldList.RADIO.type ||
          type === FieldList.VLOOKUPDROPDOWN.type ||
          type === FieldList.PROCESS.type
        ) {
          option = [{ optionLabel: 'Option 1', optionValue: 'Option 1' }];
        }

        let insert_object: any = {
          _id: parseInt((Math.random() * 100000).toString()),
          fieldLabel: fieldLabel(row?.field || [], type),
          type: returnType(type),
          option: option,
          required: false,
          isTooltip: false,
          tooltipMessage: '',
          editAble: true,
          deletAble: true,
          order: 0
        };
        if (type === FieldList.FORMULA.type) {
          insert_object.formula = 'return ';
          insert_object.inputFields = [];
          insert_object.returnType = 'decimal';
        }
        if (
          type === FieldList.FORMULA.type ||
          type === FieldList.DECIMAL.type ||
          type === FieldList.CONVERTER.type ||
          type === FieldList.CURRENCYAMOUNT.type
        ) {
          insert_object.decimalPlaces = 2;
        }
        if (type === FieldList.VLOOKUPDROPDOWN.type) {
          insert_object.vlookupInputFields = [];
        }
        if (type === FieldList.CURRENCYAMOUNT.type) {
          insert_object.displayCurrency = ['CUR'];
        }
        if (type === FieldList.CONVERTER.type) {
          insert_object.units = [];
          insert_object.unitoption = [];
          insert_object.displayUnits = [];
          insert_object.formulaUnits = [];
        }
        if (index !== null) {
          row.field.splice(index, 0, insert_object);
        } else {
          row.field.push(insert_object);
        }
      }
    });
    setSection(data);
  };

  const addCustomField = (sectionId, fieldData, index) => {
    let data = [...section];
    data.forEach((row) => {
      row.field = row.field.filter((i) => i._id);
      if (row.sectionId.toString() === sectionId.toString()) {
        delete fieldData.brand;
        delete fieldData.createdBy;
        delete fieldData.updatedBy;
        delete fieldData._id;
        delete fieldData.fieldName;
        if (index !== null) {
          row.field.splice(index, 0, { _id: parseInt((Math.random() * 100000).toString()), ...fieldData, editAble: true, deletAble: true, order: 0 });
        } else {
          row.field.push({ _id: parseInt((Math.random() * 100000).toString()), ...fieldData, editAble: true, deletAble: true, order: 0 });
        }
      }
    });
    setSection(data);
  };

  const [{}, drop] = useDrop({
    accept: ['section', 'master'],
    hover: (item: any, monitor) => {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
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
      // Time to actually perform the action
      if (item.type === 'section') {
        moveSection(dragIndex, hoverIndex);
      } else {
        setSectionHoverIndex(hoverIndex);
      }
      item.index = hoverIndex;
    }
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'section',
    item: { type: 'section', id: sectionId, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  drag(drop(ref));

  const [{}, drop_field] = useDrop({
    accept: ['field', 'fieldmove'],
    drop: (data: any) => {
      if (data.data) {
        addCustomField(sectionId, data.data, data.index);
      } else if (data.type === 'field') {
        addField(sectionId, data.name, data.index);
      } else {
        if (data.sectionId.toString() !== sectionId.toString()) {
          let sect = [...section];
          sect.forEach((row) => {
            row.field = row.field.filter((i) => i._id);
          });
          let sect_index = sect.findIndex((x) => x.sectionId.toString() === data.sectionId.toString());
          const dragField = sect[sect_index].field.filter((i) => i._id.toString() === data.id.toString());
          sect[sect_index].field = sect[sect_index].field.filter((i) => i._id.toString() !== data.id.toString());
          if (dragField.length > 0) {
            let sect_drop_index = sect.findIndex((x) => x.sectionId.toString() === sectionId.toString());
            sect[sect_drop_index].field.splice(data.index, 0, dragField[0]);
          }
          setSection(sect);
        }
      }
    }
  });

  const movefield = useCallback(
    (type, dragIndex, hoverIndex, sec_id, fieldId) => {
      if (sec_id.toString() === sectionId.toString()) {
        let data = [...section];
        data.forEach((row) => {
          row.field = row.field.filter((i) => i._id);
          if (row.sectionId.toString() === sectionId.toString()) {
            if (type === 'fieldmove') {
              const dragField = row.field[dragIndex];
              if (dragField !== undefined) {
                let field = update(row.field, {
                  $splice: [
                    [dragIndex, 1],
                    [hoverIndex, 0, dragField]
                  ]
                });
                row.field = field;
              }
            } else {
              row.field.splice(hoverIndex, 0, {});
            }
          }
        });
        setSection(data);
      } else {
        let data = [...section];
        let sect_index = data.findIndex((x) => x.sectionId.toString() === sec_id.toString());
        const dragField = data[sect_index].field[dragIndex];
        if (dragField) {
          data[sect_index].field = data[sect_index].field.filter((i) => i._id.toString() !== dragField._id.toString());
          let sect_drop_index = data.findIndex((x) => x.sectionId.toString() === sectionId.toString());
          data[sect_drop_index].field.splice(hoverIndex, 0, dragField);
        }
        setSection(data);
      }
      if (type === 'fieldmove') {
        setFieldHoverId(fieldId);
      }
    },
    [section]
  );

  const onChangeSectionName = (sectionId, value) => {
    setSection(
      update(section, {
        $apply: (b) =>
          b.map((item) => {
            if (item.sectionId !== sectionId) return item;
            return {
              ...item,
              sectionName: value
            };
          })
      })
    );
  };

  const deleteSection = (sectionId) => {
    setSection(section.filter((i) => i.sectionId.toString() !== sectionId.toString()));
    handleClose();
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      {sectionHoverIndex === index ? <Box mt={1} mb={1} style={{ ...dropstyle, height: '150px' }}></Box> : null}
      <div ref={ref}>
        <Box border={1} p={1} marginBottom={2} borderColor="var(--common-border-color)" style={isDragging ? { ...dropstyle } : { ...style }}>
          <div ref={drop_field}>
            <Grid container spacing={1}>
              <Grid item xs={10} md={6} sm={6}>
                <TextField
                  id="standard-basic"
                  variant="outlined"
                  margin="dense"
                  value={data?.sectionName}
                  onChange={(event) => onChangeSectionName(data.sectionId, event.target.value)}
                />
              </Grid>
              <Grid item xs={2} md={6} sm={6} container justify="flex-end">
                <IconButton
                  aria-label="setting"
                  onClick={handleClick}
                  //   disabled={data.field.filter((_field) => _field.editAble === false).length > 0 ? true : true}
                >
                  <SettingsIcon fontSize="small" />
                </IconButton>
                <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
                  <MenuItem onClick={() => deleteSection(data.sectionId)}>Delete</MenuItem>
                </Menu>
              </Grid>
            </Grid>
            <Grid container spacing={1}>
              {data.field.length > 0 ? (
                data.field.map((ele, i) => (
                  <DropField
                    key={ele._id}
                    section={section}
                    setSection={setSection}
                    sectionId={sectionId}
                    data={ele}
                    fieldId={ele._id}
                    index={i}
                    fieldHoverId={fieldHoverId}
                    setFieldHoverId={setFieldHoverId}
                    movefield={movefield}
                  />
                ))
              ) : (
                <Box m={5} width="100%">
                  <Typography variant="body2" align="center">
                    Drag and drop your fields here
                  </Typography>
                </Box>
              )}
            </Grid>
          </div>
        </Box>
      </div>
    </>
  );
};

export default DropSection;
