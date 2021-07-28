import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import update from 'immutability-helper';
import IconButton from '@material-ui/core/IconButton';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { Properties } from './Properties';

import FieldList from './FieldList';

const style = {
    backgroundColor: 'white',
    cursor: 'move',
};

const dropstyle = {
    backgroundColor: "#e3f2fd",
    borderColor: "#90caf9",
    borderStyle: "dotted",
    cursor: 'move',
    height: "54px"
}

export const DropField = ({ module, fieldHoverId, setFieldHoverId, sectionId, section, setSection, fieldId, id, index, movefield, data, addDeleteField, extraFields }) => {

    const ref = useRef(null);

    const [{ }, drop] = useDrop({
        accept: ["fieldmove", "field"],
        drop: () => {
        },
        hover: (item: any, monitor) => {
            if (!ref.current) {
                return;
            }
            const dragIndex = item.index;
            const hoverIndex = index;
            // Don't replace items with themselves
            if (item.type === "field") {
                if (dragIndex === hoverIndex) {
                    return;
                }
            }
            else {
                if (dragIndex === hoverIndex && (item.id && fieldId && item.id.toString() === fieldId.toString())) {
                    return;
                }
            }
            if (item.type === "fieldmove") {
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

                // Time to actually perform the action
                if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
                    return;
                }
                // Dragging upwards
                if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
                    return;
                }
                movefield(item.type, dragIndex, hoverIndex, item.sectionId, item.id);
            }
            else {
                movefield(item.type, dragIndex, hoverIndex, sectionId, item.id);
            }
            // Note: we're mutating the monitor item here!
            // Generally it's better to avoid mutations,
            // but it's good here for the sake of performance
            // to avoid expensive index searches.
            item.index = hoverIndex;
            item.sectionId = sectionId;
        },
    });

    const [{ isDragging }, drag] = useDrag({
        type: "fieldmove",
        item: { type: "fieldmove", id, index, sectionId },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
        end(item, monitor) {
            setFieldHoverId(null)
            // let data = [...section]
            // data.forEach((row) => {
            //     row.field = row.field.filter(i => i.fieldId)
            // });
            // setSection(data)
        },
    });

    const opacity = isDragging ? 0 : 1;
    drag(drop(ref));

    const onChangeFieldName = (fieldId, value) => {
        let data = [...section]
        data.forEach((row) => {
            if (row.sectionId.toString() === sectionId.toString()) {
                row.field.forEach((ele) => {
                    if (ele._id.toString() === fieldId.toString()) {
                        ele.fieldLabel = value
                    }
                })
            }
        });
        setSection(data)
    };

    const [anchorEl, setAnchorEl] = React.useState(null);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const [propertie_open, setPropertieOpen] = React.useState(false);
    const [field_data, setFieldData] = React.useState();

    const handleClickOpenPropertie = (data) => {
        setPropertieOpen(true);
        setFieldData(data);
        handleClose()
    };
    const handleClosePropertie = () => {
        setPropertieOpen(false);
    };

    const deleteField = (fieldId) => {
        let data = [...section]
        data.forEach((row) => {
            if (row.sectionId.toString() === sectionId.toString()) {
                row.field = (row.field.filter(i => i._id.toString() !== fieldId.toString()))
            }
        });
        setSection(data)
        addDeleteField(fieldId)
        handleClose()
    };

    const handleClone = (fieldData) => {
        let data = [...section];
        data.forEach((row) => {
            if (row.sectionId.toString() === sectionId.toString()) {
                row.field.splice(index + 1, 0, { ...fieldData, _id: (parseInt((Math.random() * 100000).toString())), fieldLabel: fieldData.type, fieldName: fieldData.type });
            }
        })
        setSection(data);
        handleClose();
    }

    // const [editFieldName, setEditFieldName] = React.useState(false);
    // const onMouseEnter = () => {
    //     setEditFieldName(true)
    // }

    // const onMouseLeave = () => {
    //     setEditFieldName(false)
    // }
    //onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}

    return (<Grid item xs={12} md={6} sm={6}>
        {!data._id || (fieldHoverId && fieldHoverId.toString() === data._id.toString()) ?
            <div ref={ref} style={{ ...dropstyle }}>
            </div> :
            <div ref={ref}>
                <Box border={1} p={0.5} borderColor="grey.300" style={{ ...style, opacity }}>
                    <Grid container spacing={1}>
                        <Grid item xs={5}>
                            {data.editAble ?
                                <TextField
                                    id={data._id}
                                    variant="outlined"
                                    margin="dense"
                                    style={{ margin: 2 }}
                                    value={data.fieldLabel}
                                    onChange={(event) => onChangeFieldName(data._id, event.target.value)}
                                /> : <Box pt={1.2} pl={2}>
                                    <Typography variant="body2" >{data.fieldLabel}</Typography>
                                </Box>}
                        </Grid>
                        <Grid item xs={5}>
                            <Box pt={1} color="text.secondary">
                                <Typography variant="body2">{FieldList[data.type.toUpperCase()].label}</Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={2} container justify="flex-end">
                            <IconButton aria-label="setting" onClick={handleClick} >
                                <MoreHorizIcon fontSize="small" />
                            </IconButton>
                            <Menu
                                id="simple-menu"
                                anchorEl={anchorEl}
                                keepMounted
                                open={Boolean(anchorEl)}
                                onClose={handleClose}
                            >
                                <MenuItem onClick={() => handleClickOpenPropertie(data)}  >Edit Properties</MenuItem>
                                {data.editAble && <MenuItem onClick={() => handleClone(data)}  >Clone</MenuItem>}
                                {data.editAble && <MenuItem onClick={() => deleteField(data._id)} >Delete</MenuItem>}
                            </Menu>
                            {propertie_open ? <Properties
                                handleClose={handleClosePropertie}
                                fieldData={field_data}
                                sectionId={sectionId}
                                section={section}
                                setSection={setSection}
                                module={module}
                                extraFields={extraFields}
                            /> : null}
                        </Grid>
                    </Grid>
                </Box>
            </div>
        }
    </Grid>
    );
};
