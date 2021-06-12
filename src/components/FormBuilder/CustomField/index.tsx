import React, { useCallback, useEffect, useContext, useState, Fragment } from 'react';
import { useDrop } from 'react-dnd';
import Divider from '@material-ui/core/Divider';
import Button from '@material-ui/core/Button';
import { AddField } from '../AddField';
import axiosInstance from '../../../axios/axiosInstance'
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import { Box, Typography, Grid } from "@material-ui/core";
import { DragBox } from "./DragBox";


export const CustomField = ({ }) => {

    const [fields, setFields] = useState([]);
    const [isAddField, setIsAddField] = useState(false);
    const [fieldData, setFieldData] = useState(null);
    const toastConfig = useContext(CustomToastContext)

    useEffect(() => {
        fetchCustomField();
    }, []);

    const fetchCustomField = () => {
        axiosInstance().get(`/sa-formbuilder/custom-field`).then(({ data: { data } }) => {
            setFields(data);
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    };

    const handleOpenAddField = () => {
        setIsAddField(true)
        setFieldData(null)
    }

    const handleAddField = (values) => {
        console.log(values)
        if (values._id && !Number.isInteger(values._id)) {
            axiosInstance().put(`/sa-formbuilder/custom-field`, values).then(({ data: { data } }) => {
                setIsAddField(false)
                setFieldData(null)
                fetchCustomField()
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            });
        }
        else {
            axiosInstance().post(`/sa-formbuilder/custom-field`, values).then(({ data: { data } }) => {
                setIsAddField(false)
                setFieldData(null)
                fetchCustomField()
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            });
        }
    }

    const handleCloseAddField = () => {
        setIsAddField(false)
    }

    const handleDelete = (id) => {
        axiosInstance().delete(`/sa-formbuilder/custom-field/` + id).then(() => {
            fetchCustomField();
        }).catch((error) => {
            toastConfig.setToastConfig(error)
        });
    }


    const handleEdit = (data) => {
        setFieldData(data)
        setIsAddField(true)
    }

    return (
        <Fragment>
            <Box mt={1} mb={1}>
                <Divider />
            </Box>
            <Button onClick={handleOpenAddField} size="small" color="primary">Add Custom Field</Button>
            <Box mt={1} mb={1}>
                <Grid container spacing={1} >
                    {fields && fields.map((data, i) => (
                        <DragBox data={data} handleDelete={handleDelete} handleEdit={handleEdit} />
                    ))}
                </Grid>
            </Box>
            {isAddField && <AddField refrence="custom" fieldData={fieldData} handleClose={handleCloseAddField} handleAddField={handleAddField} fields={fields} />}
        </Fragment>
    );
};
