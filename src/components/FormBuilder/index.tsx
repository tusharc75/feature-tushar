import React, { useState, useEffect } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Divider from '@material-ui/core/Divider';
import Button from '@material-ui/core/Button';
import { useParams, useHistory } from "react-router-dom";
import { DataGrid, GridToolbar } from "@material-ui/data-grid";
import AddIcon from "@material-ui/icons/Add";
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { TouchBackend } from 'react-dnd-touch-backend'
import { isMobile, isTablet } from "react-device-detect";
import { makeStyles } from '@material-ui/core/styles';
import FieldList from './FieldList';
import { DragBox } from './DragBox'
import { DropMaster } from './DropMaster'
import { CustomField } from './CustomField/index'

const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
        margin: 10
    },
    screenHeightAuto: {
        minHeight: window.innerHeight - 220,
        maxHeight: window.innerHeight - 220,
        overflow: "auto"
    },
    screenHeight: {
        minHeight: window.innerHeight - 200,
        maxHeight: window.innerHeight - 200,
    },
}));

export const FormBuilder = ({ section, setSection, deleteField, setDeleteField, isCustomField }) => {

    const addSection = (sectionHoverIndex) => {
        let data = [...section];
        if (sectionHoverIndex !== null) {
            const obj = { sectionId: (parseInt((Math.random() * 100000).toString())), sectionName: "New Section " + (data.length + 1), srno: data.length + 1, field: [] }
            data.splice(sectionHoverIndex, 0, obj);
        }
        else {
            data.push({ sectionId: (parseInt((Math.random() * 100000).toString())), sectionName: "New Section " + (data.length + 1), srno: data.length + 1, field: [] })
        }
        setSection(data);
    };

    const addDeleteField = (fieldId) => {
        let data = [...deleteField];
        data.push({ fieldId: fieldId })
        setDeleteField(data);
    }

    const removeExtraField = () => {
        let data = [...section];
        data.forEach((row) => {
            row.field = row.field.filter(i => i.fieldId)
        });
        setSection(data);
    }

    const classes = useStyles();
    return (<Box mt={1} p={2} bgcolor="white">
        <DndProvider backend={isMobile || isTablet ? TouchBackend : HTML5Backend}>
            <Grid container spacing={1}>
                <Grid item xs={3}>
                    <Box border={1} p={2} borderColor="grey.300" className={classes.screenHeightAuto}>
                        <Grid container spacing={1} >
                            {Object.keys(FieldList).map((type, index) => {
                                return <DragBox key={index}
                                    type="field" label={FieldList[type].label}
                                    name={FieldList[type].type} removeExtraField={removeExtraField}
                                />
                            })}
                        </Grid>
                        <Box mt={2} mb={2}>
                            <Divider />
                        </Box>
                        <DragBox name="New Section" label="New Section" type="master"></DragBox>
                        {isCustomField && <Box mt={2} >
                            <CustomField />
                        </Box>}
                    </Box>
                </Grid>
                <Grid item xs={9} >
                    <Box border={1} p={2} bgcolor="grey.100" borderColor="grey.300" className={classes.screenHeightAuto}>
                        <DropMaster
                            addSection={addSection}
                            setSection={setSection}
                            section={section}
                            addDeleteField={addDeleteField}
                            screenHeight={classes.screenHeight}
                        />
                    </Box>
                </Grid>
            </Grid>
        </DndProvider>
    </Box>);
}

