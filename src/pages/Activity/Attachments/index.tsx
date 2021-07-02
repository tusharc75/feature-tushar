import React, { useState, useEffect, useContext, useReducer } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Layout from "../../../components/Layout";
import { SearchFilter } from "../../../components/Activity/Report/SearchFilter";
import { useHistory } from "react-router-dom";
import queryString from 'query-string';
import { GetReferenceName } from "../../../axios/activity";
import CustomBreadCrumbs from "../../../components/CustomBreadCrumbs";
import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import Dialog from '@material-ui/core/Dialog';
import ManageAttachment from "../../../components/Activity/Attachments/ManageAttachment";
import CustomContainer from '../../../components/CustomContainer'
import ConfirmationDialog from "../../../components/Helpers/ConfirmationDialog";
import styles from "../../Leads/Header.module.scss";
import { AiOutlinePaperClip } from 'react-icons/ai'
import { AddOutlined } from "@material-ui/icons";
import { Button, Tooltip, IconButton, MenuItem, Menu } from '@material-ui/core'
import { useData } from "../../../StateProvider/Provider";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition, gridLoadingTimeout } from "../../../constants/helpers";
import { Delete as DeleteIcon } from "@material-ui/icons";
import CustomAgGrid from "../../../components/AgGridComponents/CustomAgGrid";
import {
    gridPageSizes,
    isObjectEmpty,
    displayDate
} from "../../../constants/helpers";
import {
    CommonRenderer,
    CommonRendererWithCopy
} from "../../../components/AgGridComponents/CustomAgGridCellRenderers";
import { GoArrowDown } from "react-icons/go"
import { ExpandMore } from "@material-ui/icons";

function reducer(state, action) {
    switch (action.type) {
        case "loading":
            return {
                ...state,
                loading: action.loading
            }

        case "initialize":
            return {
                ...state,
                dataRows: action.data,
                rowCount: action.count
            }

        case "selection":
            return {
                ...state,
                selectedRecords: action.selectedRecords,
            }

        case "update":
            return {
                ...state,
                dataRows: action.data,
                loading: false
            }

        case "filter":
            return {
                ...state,
                loading: true,
                filters: action.filters,
                page: 0
            }

        case "sort":
            return {
                ...state,
                sorting: action.sorting,
                loading: true
            }

        case "search":
            return {
                ...state,
                search: action.search,
                loading: true
            }

        case "pageChange":
            return {
                ...state,
                page: action.page
            }

        case "pageSizeChange":
            return {
                ...state,
                limit: action.limit,
                page: 0,
                loading: true
            }

        case "complete":
            return {
                ...state,
                loading: false
            }

        default:
            break;
    }

    return state;
}

const intialState = {
    dataRows: [],
    rowCount: 0,
    loading: false,
    page: 0,
    limit: 25,
    pageSizes: gridPageSizes,
    search: "",
    filters: {},
    sorting: [],
    selectedRecords: []
}
export default function Attachment(props) {


    const history = useHistory();
    const parsed = queryString.parse(history.location.search);
    const { referenceType, referenceId, activityType, activityId } = parsed;

    const [anchorEl, setAnchorEl] = useState(null);
    const [filter, setFilter] = useState([]);
    const [open, setOpen] = useState(false)
    const [attachmentData, setAttachmentData] = useState(null)
    const [deleteRecord, setDeleteRecord] = useState(null)
    const [isConfirmDialogVisible, setIsConfirmDialogVisible] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const toastConfig = useContext(CustomToastContext);
    const {
        state: { user },
    }: any = useData();

    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

    const [columns, setColumns] = useState([
        { field: "name", headerName: "Name", show: true, disabled: true, cellRenderer: "nameRenderer" },
        {
            field: "createdAt", headerName: "Created At", show: true,
            cellRenderer: "createdByRenderer", filter: false, sortable: false
        },
        {
            field: "updatedAt", headerName: "Updated At", show: true,
            cellRenderer: "updatedByRenderer", filter: false, sortable: false
        },
    ]);
    useEffect(() => {
        if (referenceType) {
            GetReferenceName(referenceType, referenceId)
                .then(({ data }) => {
                    setFilter([{ "_id": referenceId, "type": referenceType, "name": data.name }])
                })
                .catch((err) => {
                });
        }
    }, [referenceId]);

    useEffect(() => {
        fetchAttachments()
    }, [page, limit, filter, filters, sorting]);

    const NameRenderer = params => (
        <a className="link cursor-pointer"
            onClick={() => handleActivityOpen(params.data)}>{params.data.name}</a>
    )
    const downloadFile = (fileName) => {
        setIsDownloading(true);
        axiosInstance()
            .get(`user/download?fileName=${fileName}`, {
                responseType: "blob",
                onDownloadProgress: (progressEvent) => {
                    let percentCompleted = Math.floor(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );

                    if (percentCompleted === 100) {
                        toastConfig.setToastConfig({
                            message: "File Downloaded Successfully",
                            open: true,
                            type: "success",
                        });
                        setTimeout(() => {
                            setIsDownloading(false);
                        }, 2000);
                    }
                },
            })
            .then(({ data }) => {
                const url = window.URL.createObjectURL(new Blob([data]));
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", fileName);
                document.body.appendChild(link);
                link.click();
                setTimeout(() => setIsDownloading(false), 2000);
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
                setIsDownloading(false);
            });
    };
    const ActionsRenderer = params => (
        (
            <>
                <Tooltip title="Download">
                    <IconButton
                        size="small"
                        aria-label="Download"
                        color="primary"
                        disabled={isDownloading}
                        onClick={() => downloadFile(params.data.fileUrl)}
                    >
                        <GoArrowDown size={26} />
                    </IconButton>
                </Tooltip>
                {params.data.canEdit ?
                    <Tooltip title="Delete">
                        <IconButton
                            size="small"
                            aria-label="Delete"
                            onClick={() => showConfirmBox(params.data)}>
                            <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                    </Tooltip> :
                    <Tooltip
                        className="cursor-stop"
                        title="Signed Quote Attachment can not be deleted"
                    >

                        <IconButton
                            size="small"
                            aria-label="Delete"
                        >
                            <DeleteIcon fontSize="small" color="disabled" />
                        </IconButton>
                    </Tooltip>}
            </>
        )
    )

    const CreatedByRenderer = params => (
        <span>{displayDate(params.data?.createdByDate)}</span>
    )
    const UpdatedByRenderer = params => (
        < span > {displayDate(params.data?.updatedAtDate)}</span>
    )

    const frameworkComponents = {
        nameRenderer: NameRenderer,
        commonRenderer: CommonRenderer,
        commonRendererWithCopy: CommonRendererWithCopy,
        createdByRenderer: CreatedByRenderer,
        updatedByRenderer: UpdatedByRenderer,
        actionsRenderer: ActionsRenderer
    };

    const getQueryString = () => {
        let deepFilter = `&page=${page}&limit=${limit}`;

        if (!isObjectEmpty(filters)) {
            const updatedFilters = [];

            Object.keys(filters).forEach(field => {
                updatedFilters.push({
                    field: field,
                    term: filters[field].filter
                })
            });
            deepFilter = `${deepFilter}&deepFilter=${JSON.stringify(updatedFilters)}`
        }

        if (sorting.length > 0) {
            deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`
        }

        if (search) {
            deepFilter = `${deepFilter}&search=${search}`;
        }

        return deepFilter;
    };

    const fetchAttachments = async () => {
        const queryString = getQueryString();
        dispatch({ type: "loading", loading: true });

        if (gridApi) {
            gridApi.setRowData([]);
        }
        let api = `/attachment?relatedTo=${JSON.stringify(filter)}${queryString}`
        axiosInstance().get(api)
            .then(({ data: { data: { data, count } } }) => {
                let rows = data.map(u => {
                    const { createdBy, updatedBy, ...rest } = u
                    return {
                        ...rest,
                        canEdit: u.canEdit ? u.canEdit:true,
                        createdByDate: u.createdBy.date ?? "",
                        updatedByDate: u?.updatedBy?.date ?? ""
                    }
                })
                dispatch({ type: "initialize", data: rows, count: count });

                setTimeout(() => {
                    dispatch({ type: "loading", loading: false });
                }, gridLoadingTimeout);
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
                dispatch({ type: "loading", loading: false });
            });
    };

    const handleChangeFilter = (value) => {
        setFilter(value)
    }

    const handleActivityOpen = (data) => {
        setOpen(true)
        setAttachmentData(data)
    }
    const handleClose = () => {
        setOpen(false)
        setAttachmentData(null)
    }
    const showConfirmBox = (row) => {
        if (row) {
            if (row && row.id) {
                setDeleteRecord(row);
            }
        }
        setIsConfirmDialogVisible(true);
    };

    const handleDeleteEmails = async () => {
        // .put('/email',
        //             { emails: deleteRecord?.id ? [deleteRecord.id] : selectedRecords.map(d => d._id) })
        setDeleteLoading(true);
        if (deleteRecord?.id || selectedRecords.length > 0)
            axiosInstance()
                .put('attachment/deletemany ',
                    { ids: deleteRecord?.id ? [deleteRecord.id] : selectedRecords.map(d => d._id) })
                .then(({ data }) => {
                    toastConfig.setToastConfig({
                        open: true,
                        type: "success",
                        message: "Deleted Succesfully",
                    });
                    setIsConfirmDialogVisible(false);
                    setDeleteLoading(false);
                    if (deleteRecord) setDeleteRecord(null);
                    fetchAttachments();
                })
                .catch((error) => {
                    toastConfig.setToastConfig(error);
                    setIsConfirmDialogVisible(false);
                    setDeleteLoading(false);
                });
    };

    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
    };

    const allowMultipleDeletes = () => {
        let result = selectedRecords.some((record)=>record.canEdit === true).length > 0 ? true:false
        return result;
    }

    return <Layout>
        
        <Grid container className="headerbox">
            <CustomBreadCrumbs routes={[{ title: "Attachment" }]} />
        </Grid>
        <CustomContainer>
            <div className="header-panel">
                <Grid container className={styles.filter_side_container}>
                    <Grid item xs={5} className="d-flex align-items-center gap-1">
                        <AiOutlinePaperClip className="headerLogo" />{" "}
                        <span className="listingHeader">Attachment ({rowCount})</span>
                    </Grid>
                    <Grid item xs={7} className={styles.filter_side}>
                        <Box component="div" className={styles.filter_side_header} style={{ width: "100%" }} >
                            <SearchFilter handleChangeFilter={handleChangeFilter}
                                filter={filter}
                                chip={{ size: "small" }}
                            />
                            <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                className={styles.add_submit_btn}
                                onClick={() => setOpen(true)}
                                startIcon={<AddOutlined />}>
                                Add
                            </Button>
                            <Button
                                className={styles.action_submit_btn}
                                variant="outlined"
                                color="default"
                                size="small"
                                onClick={openActions}
                                aria-controls="action-menu"
                                disabled={selectedRecords.length > 0 ? false : true}
                            >
                                Actions <ExpandMore />
                            </Button>
                            {console.log(selectedRecords.some((records)=>records.canEdit))}
                            <Menu
                                anchorEl={anchorEl}
                                keepMounted
                                getContentAnchorEl={null}
                                anchorOrigin={{
                                    vertical: "bottom",
                                    horizontal: "left",
                                }}
                                id="action-menu"
                                open={Boolean(anchorEl)}
                                onClose={closeActions}>
                                <MenuItem
                                    disabled={!selectedRecords.some((records)=>records.canEdit)}
                                    onClick={() => {
                                        showConfirmBox(null);
                                        closeActions();
                                    }}
                                >
                                    Delete
                                </MenuItem>
                            </Menu>
                        </Box>
                    </Grid>
                </Grid>

            </div>
            <CustomAgGrid
                columns={columns}
                dataRows={dataRows}
                frameworkComponents={frameworkComponents}
                setGridApi={setGridApi}
                dispatch={dispatch}
                rowCount={rowCount}
                limit={limit}
                pageSizes={pageSizes}
                page={page}
                actionWidth={150}
                loading={loading} />
            {open ?
                < Dialog
                    open={open}
                    fullScreen={isMobile || isTablet}
                    TransitionComponent={CustomDialogTransition}
                    aria-labelledby="customized-dialog-title"
                    maxWidth={"md"}
                    onClose={handleClose}
                    fullWidth
                >
                    <ManageAttachment
                        attachmentId={attachmentData?.id}
                        relatedTo={[{ type: "my", name: user?.user?._id }]}
                        handleClose={handleClose}
                        attachmentData={attachmentData}
                        fetchData={fetchAttachments}
                    />
                </Dialog>
                : null
            }
            {isConfirmDialogVisible ? (
                <ConfirmationDialog
                    open={isConfirmDialogVisible}
                    message={`Are you sure you want to delete ${deleteRecord?.id ? deleteRecord?.name ?? 'this attachment?' : "these attachments?"}`}
                    onClose={() => {
                        if (deleteRecord) setDeleteRecord(null);
                        setIsConfirmDialogVisible(false);
                    }}
                    okBtnLoading={deleteLoading}
                    onOk={handleDeleteEmails}
                />
            ) : null}
        </CustomContainer>

    </Layout>
}
