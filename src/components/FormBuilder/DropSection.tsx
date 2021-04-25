import React, { useRef, useCallback } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import Box from '@material-ui/core/Box';
import { DropField } from './DropField';
import update from 'immutability-helper';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import SettingsIcon from '@material-ui/icons/Settings';
import IconButton from '@material-ui/core/IconButton';
import { Typography } from '@material-ui/core';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import FieldList from './FieldList';

const style = {
    backgroundColor: 'white',
    cursor: 'move',
};

const dropstyle = {
    backgroundColor: "#e3f2fd",
    borderColor: "#90caf9",
    borderStyle: "dashed",
    cursor: 'move',
}

export const DropSection = ({ fieldHoverId, setFieldHoverId, setSectionHoverIndex, sectionHoverIndex, section, setSection, sectionId, id, index, moveSection, data, addDeleteField }) => {

    const [anchorEl, setAnchorEl] = React.useState(null);

    const ref = useRef(null);

    const addField = (sectionId, type, index) => {
        let data = [...section];
        data.forEach((row) => {
            row.field = row.field.filter(i => i.fieldId)
            if (row.sectionId.toString() === sectionId.toString()) {
                let count = row.field.filter(i => i.type === type).length
                let option = []
                if (type === FieldList.DROPDOWN.type || type === FieldList.MULTISELECT.type || type === FieldList.RADIO.type || type === FieldList.VLOOKUPDROPDOWN.type) {
                    option = [{ optionLabel: "Option 1" }]
                }
                let insert_object: any = {
                    fieldId: (parseInt((Math.random() * 100000).toString())), fieldLabel: FieldList[type.toUpperCase()].label + " " + (count + 1), type: type, option: option,
                    required: true, isTooltip: false, tooltipMessage: "", editAble: true, order: 0
                }
                if (type === FieldList.FORMULA.type) {
                    insert_object.formula = ""
                    insert_object.inputFields = []
                    insert_object.returnType = "decimal"
                }
                if (type === FieldList.FORMULA.type || type === FieldList.DECIMAL.type) {
                    insert_object.decimalPlaces = 2
                }
                if (type === FieldList.VLOOKUPDROPDOWN.type) {
                    insert_object.inputFields = []
                }
                if (index !== null) {
                    row.field.splice(index, 0, insert_object);
                }
                else {
                    row.field.push(insert_object)
                }
            }
        });
        setSection(data);
    };

    const addCustomField = (sectionId, fieldData) => {
        let data = [...section];
        data.forEach((row) => {
            row.field = row.field.filter(i => i.fieldId)
            if (row.sectionId.toString() === sectionId.toString()) {
                delete fieldData.brand
                delete fieldData.createdBy
                delete fieldData.updatedBy
                delete fieldData._id
                row.field.push({ fieldId: (parseInt((Math.random() * 100000).toString())), ...fieldData, editAble: true, order: 0 })
            }
        })
        setSection(data);
    }

    const [{ }, drop] = useDrop({
        accept: ["section", "master"],
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
            // Only perform the move when the mouse has crossed half of the items height
            // When dragging downwards, only move when the cursor is below 50%
            // When dragging upwards, only move when the cursor is above 50%
            // Dragging downwards
            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
                return;
            }
            // Dragging upwards
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
                return;
            }
            // Time to actually perform the action
            if (item.type === "section") {
                moveSection(dragIndex, hoverIndex);
            }
            else {
                setSectionHoverIndex(hoverIndex)
            }
            // Note: we're mutating the monitor item here!
            // Generally it's better to avoid mutations,
            // but it's good here for the sake of performance
            // to avoid expensive index searches.
            item.index = hoverIndex;
        },
    });

    const [{ isDragging }, drag] = useDrag({
        type: "section",
        item: { type: "section", id, index },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const opacity = isDragging ? 0 : 1;
    drag(drop(ref));

    const [{ }, drop_field] = useDrop({
        accept: ["field", "fieldmove"],
        drop: (data: any) => {
            if (data.data) {
                addCustomField(sectionId, data.data)
            }
            else if (data.type === "field") {
                addField(sectionId, data.name, data.index)
            }
            else {
                if (data.sectionId.toString() !== sectionId.toString()) {
                    let sect = [...section]
                    sect.forEach((row) => {
                        row.field = row.field.filter(i => i.fieldId)
                    })
                    let sect_index = sect.findIndex(x => x.sectionId.toString() === data.sectionId.toString());
                    const dragField = sect[sect_index].field.filter(i => i.fieldId.toString() === data.id.toString());
                    sect[sect_index].field = (sect[sect_index].field.filter(i => i.fieldId.toString() !== data.id.toString()))
                    if (dragField.length > 0) {
                        let sect_drop_index = sect.findIndex(x => x.sectionId.toString() === sectionId.toString());
                        sect[sect_drop_index].field.splice(data.index, 0, dragField[0]);
                    }
                    setSection(sect)
                }
            }
        }
    });


    const movefield = useCallback((type, dragIndex, hoverIndex, sec_id, fieldId) => {
        if (sec_id.toString() === sectionId.toString()) {
            let data = [...section]
            data.forEach((row) => {
                row.field = row.field.filter(i => i.fieldId)
                if (row.sectionId.toString() === sectionId.toString()) {
                    if (type === "fieldmove") {
                        const dragField = row.field[dragIndex];
                        if (dragField !== undefined) {
                            let field = update(row.field, {
                                $splice: [
                                    [dragIndex, 1],
                                    [hoverIndex, 0, dragField],
                                ],
                            })
                            row.field = field;
                        }
                    }
                    else {
                        row.field.splice(hoverIndex, 0, {});
                    }
                }
            });
            setSection(data)
        }
        else {
            let data = [...section]
            let sect_index = data.findIndex(x => x.sectionId.toString() === sec_id.toString());
            const dragField = data[sect_index].field[dragIndex];
            if (dragField) {
                data[sect_index].field = (data[sect_index].field.filter(i => i.fieldId.toString() !== dragField.fieldId.toString()))
                let sect_drop_index = data.findIndex(x => x.sectionId.toString() === sectionId.toString());
                data[sect_drop_index].field.splice(hoverIndex, 0, dragField);
            }
            setSection(data)
        }
        if (type === "fieldmove") {
            setFieldHoverId(fieldId)
        }
    }, [section]);

    const onChangeSectionName = (sectionId, value) => {
        setSection(update(section, {
            $apply: b => b.map((item) => {
                if (item.sectionId !== sectionId) return item;
                return {
                    ...item,
                    sectionName: value
                }
            })
        }));
    };

    const deleteSection = (sectionId) => {
        setSection(section.filter(i => i.sectionId.toString() !== sectionId.toString()))
        handleClose()
    };

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (<>
        {sectionHoverIndex === index ? <Box mt={1} mb={1} style={{ ...dropstyle, height: "150px" }}>
        </Box> : null}
        <div ref={ref}>
            <Box bgcolor="white" border={1} p={1} marginBottom={2} borderColor="grey.300" style={isDragging ? { ...dropstyle } : { ...style }} >
                <div ref={drop_field}>
                    <Grid container spacing={1}>
                        <Grid item xs={6}>
                            <TextField
                                id="standard-basic"
                                variant="outlined"
                                margin="dense"
                                value={data.sectionName}
                                onChange={(event) => onChangeSectionName(data.sectionId, event.target.value)}
                            />
                        </Grid>
                        <Grid item xs={6} container justify="flex-end">
                            <IconButton aria-label="setting" onClick={handleClick} disabled={data.field.filter((_field) => _field.editAble === false).length > 0 ? true : true}  >
                                <SettingsIcon fontSize="small" />
                            </IconButton>
                            <Menu
                                id="simple-menu"
                                anchorEl={anchorEl}
                                keepMounted
                                open={Boolean(anchorEl)}
                                onClose={handleClose}
                            >
                                <MenuItem onClick={() => deleteSection(data.sectionId)}>Delete</MenuItem>
                            </Menu>
                        </Grid>
                    </Grid>
                    <Grid container spacing={1}>
                        {data.field.length > 0 ?
                            data.field.map((ele, i) => (
                                <DropField key={ele.fieldId} index={i} id={ele.fieldId}
                                    sectionId={sectionId} section={section} setSection={setSection} fieldId={ele.fieldId} data={ele}
                                    movefield={movefield}
                                    fieldHoverId={fieldHoverId} setFieldHoverId={setFieldHoverId} addDeleteField={addDeleteField}
                                />
                            )) : <Box m={5} width="100%">
                                <Typography variant="body2" align="center">Drag and drop your fields here</Typography>
                            </Box>}
                    </Grid>
                </div>
            </Box>
        </div>
    </>);
};