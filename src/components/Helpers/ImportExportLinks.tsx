import React, { useContext } from 'react'
import { Divider, makeStyles } from '@material-ui/core';
import axiosInstance from '../../axios/axiosInstance';
import { downloadExcel } from '../../constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';

const useStyles = makeStyles((theme) => ({
    root: {
        width: "100%",
        border: "none",
        borderRadius: 8,
        padding: theme.spacing(3, 2),
    },
    linksContainer: {
        display: "flex",
    },
    links: {
        color: theme.palette.primary.main,   //  textDark
        fontSize: "0.90rem"
    },
    linkDivider: {
        backgroundColor: theme.palette.primary.main,  //  darkBg
        margin: "0 1rem",
    },
    delBtn: {
        color: 'red'
    }
}));

export default function ImportExportLinks({ module, api, onSuccessfulImport }) {

    const classes = useStyles();
    const toastConfig = useContext(CustomToastContext);

    const uploadData = (event) => {
        if (event.target.files && event.target.files.length) {
            toastConfig.setToastConfig({ open: true, type: "info", message: `Uploading ${module}, Please wait...` });
            const file = event.target.files[0];

            let formData = new FormData();
            formData.append("file", file);
            axiosInstance()
                .post(`/${api}/import`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                })
                .then((response) => {
                    if (response.data.message) {
                        toastConfig.setToastConfig({ open: true, type: "success", message: response.data.message });
                        onSuccessfulImport();
                    }
                    else {
                        const fileName = response.headers["content-disposition"].split("filename=")[1];
                        downloadExcel(response.data, fileName);
                        toastConfig.setToastConfig({ open: true, type: "error", message: `Found some issue(s) while importing ${module}` });
                    }
                })
                .catch((error) => {
                    toastConfig.setToastConfig(error)
                });
        }
    };

    return (
        <>
            <label htmlFor="importFromExcel" className={`${classes.links} cursor-pointer`}>
                <input
                    id="importFromExcel"
                    name="importFromExcel"
                    onChange={uploadData}
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    style={{
                        opacity: "0",
                        position: "absolute",
                        zIndex: -1,
                    }}
                    type="file"
                />
                Import from Excel
            </label>
            <Divider
                orientation="vertical"
                flexItem
                className={classes.linkDivider}
            />
            <label
                onClick={(e) => {
                    axiosInstance().get(`/${api}/template?export=true`, { responseType: "arraybuffer" })
                        .then((response) => {
                            const fileName = response.headers["content-disposition"].split("filename=")[1];
                            downloadExcel(response.data, fileName)
                        }).catch((error) => {
                            toastConfig.setToastConfig(error);
                        });
                }}
                className={`${classes.links} cursor-pointer`}
            >
                Export to Excel
            </label>
            <Divider
                orientation="vertical"
                flexItem
                className={classes.linkDivider}
            />
            <label
                onClick={(e) => {
                    axiosInstance().get(`/${api}/template`, { responseType: "arraybuffer" }).then((response) => {
                        const fileName = response.headers["content-disposition"].split("filename=")[1];
                        downloadExcel(response.data, fileName)
                    }).catch((error) => {
                        toastConfig.setToastConfig(error);
                    });
                }}
                className={`${classes.links} cursor-pointer`}
            >
                Download Template
            </label>
            <Divider
                orientation="vertical"
                flexItem
                className={classes.linkDivider}
            />
            <label
                onClick={(e) => e.preventDefault()}
                className={`${classes.links} cursor-pointer`}
            >
                Email a Link
            </label>
        </>
    )
}
