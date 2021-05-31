import React, { useState, useEffect, useContext, useReducer } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Layout from "../../../components/Layout";
import { SearchFilter } from "../../../components/Activity/Report/SearchFilter";
import { useHistory } from "react-router-dom";
import queryString from 'query-string';
import { GetReferenceName, GetEmails } from "../../../axios/activity";
import moment from "moment";
import CustomBreadCrumbs from "../../../components/CustomBreadCrumbs";
import { useData } from "../../../StateProvider/Provider";
import CustomContainer from "../../../components/CustomContainer";
import { Button, MenuItem, Menu, Typography, Tooltip, IconButton, TablePagination } from '@material-ui/core'
import { ExpandMore } from "@material-ui/icons";
import axiosInstance from "../../../axios/axiosInstance";
import ConfirmationDialog from "../../../components/Helpers/ConfirmationDialog";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import MessageDialog from "../../../components/Helpers/MessageDialog";
import { Delete as DeleteIcon } from "@material-ui/icons";
import reactHtmlparser, { convertNodeToElement } from 'react-html-parser'
import { HiOutlineMail } from "react-icons/hi";
import Dialog from '@material-ui/core/Dialog';
import { CreateEmail } from '../../../components/Activity/Email/CreateEmail'
import ToggleButton from "@material-ui/lab/ToggleButton";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";
import { AgGridColumn, AgGridReact } from 'ag-grid-react';
import CustomFloatingFilter from '../../../components/AgGridComponents/CustomAgGridFilter'
import { isMobile, isTablet } from "react-device-detect";
import {
    CustomLoadingOverlay
} from "../../../components/AgGridComponents/CustomAgGridCellRenderers";
import CustomGridHeaderOptions from "../../../components/AgGridComponents/CustomGridHeaderOptions";
import {
    gridPageSizes,
    isObjectEmpty,
} from "../../../constants/helpers";
import styles from "../../Leads/Header.module.scss";
import emailStyles from './email.module.scss'
import './email.scss'

const tabs = {
    Inbox: 1,
    Sent: 2
}

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
                rowCount: action.count,
                loading: false
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
const Email = () => {

    const toastConfig = useContext(CustomToastContext);
    const history = useHistory();
    const {
        state: { user },
    }: any = useData();
    const parsed = queryString.parse(history.location.search);
    const { referenceType, referenceId } = parsed;

    const [filter, setFilter] = useState([]);
    const [emailsCopy, setEmailsCopy] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [deleteRecord, setDeleteRecord] = useState(null)
    const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false)
    const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [query, setQuery] = useState({ page: 0, limit: 25 });
    const [open, setOpen] = useState(false);
    const [emailId, setEmailId] = useState(null);
    const [currentTab, setCurrentTab] = useState(1)

    const [gridApi, setGridApi] = useState(null);
    const [columnApi, setColumnApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

    const [columns, setColumns] = useState([
        { field: "to", headerName: "Recipient", show: true, disabled: true, cellRenderer: "recipentRenderer" },
        {
            field: "subject", headerName: "Subject - Message", show: true,
            width: 700,
            cellRenderer: "subjectMessageRenderer"
        },
        { field: "createdAt", headerName: "Created At", show: true, cellRenderer: "createdByDate" },
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
        fetchEmails()
    }, [page, limit, filters, sorting]);


    const fetchEmails = async () => {

        const queryString = getQueryString();
        dispatch({ type: "loading", loading: true });

        if (gridApi) {
            gridApi.setRowData([]);
            gridApi.showLoadingOverlay();
        }

        await GetEmails(JSON.stringify(filter), queryString)
            .then(({ data, count }) => {
                data = data.map(obj => {
                    return {
                        ...obj,
                        id: obj._id,
                        createdByDate: obj?.createdBy?.date ?? '',
                        isCreatedByMe: obj?.createdBy?.user === user?.user?._id ? true : false,
                    }
                })
                dispatch({ type: "initialize", data: data, count: count });
                setEmailsCopy(data)
            })
            .catch((error) => {
                dispatch({ type: "loading", loading: false });
                toastConfig.setToastConfig(error);
            });
    };


    const handleChangeFilter = (value) => {
        dispatch({ type: "pageChange", page: 0 });
        setFilter(value)
    }

    const getToEmailList = (toList) => {
        return (currentTab === tabs.Sent ? "To: " : "") + (toList.map(email => email === user?.user?.email ? 'me' : email).join(','))
    }

    const transform = (node, index) => {
        if (node.type === 'tag' && ["h2", "h1", "h3", "h4", "h5", "h6", "strong", "em", "u", "ul", "ol", "li", "del"].indexOf(node.name) >= 0) {
            node.name = 'p';
            return convertNodeToElement(node, index, transform);
        }
    }

    const ActionsRenderer = params => <>
        <Tooltip title="Delete">
            <IconButton
                aria-label="Delete"
                onClick={() => showConfirmBox(params.data)}>
                <DeleteIcon fontSize="small" color="error" />
            </IconButton>
        </Tooltip>
    </>

    const RecipentRenderer = params => (
        <span
            className="link cursor-pointer"
            onClick={(e) => {
                setOpen(true)
                setEmailId(params.data.id)
            }}>
            {
                (typeof params.data.to == "string") ?
                    <span> {params.data.to}</span > :
                    <span>
                        {params.data?.isCreatedByMe ? getToEmailList(params.data.to) : params.data?.mailbox ?? ''}
                    </span>
            }
        </span>
    )

    const SubjectMessageRenderer = params => (<div className={emailStyles.emailMessageConatiner} >
        <Typography > {params.data?.subject ?? "(no subject) "} - </Typography>
        <Typography noWrap={false} display="inline"
            className={emailStyles.emailMessage}> {params.data.message ? reactHtmlparser(params.data.message, { transform }) : null}
        </Typography>
    </div >)

    const CreatedByDateRenderer = params => (
        <span className={emailStyles.emailCreatedAt}>
            { moment(params.data.createdByDate).format("ddd MM/DD")}
        </span >)

    const frameworkComponents = {
        recipentRenderer: RecipentRenderer,
        subjectMessageRenderer: SubjectMessageRenderer,
        createdByDate: CreatedByDateRenderer,
        actionsRenderer: ActionsRenderer,
        customLoadingOverlay: CustomLoadingOverlay,
        customFloatingFilter: CustomFloatingFilter,
        // customLoadingCellRenderer: CustomLoadingCellRenderer,
        // customNoRowsOverlay: CustomNoRowsOverlay
    };

    const onGridReady = (params) => {
        setGridApi(params.api);
        setColumnApi(params.columnApi)
    }

    const generateColumns = columns.map((column: any, index) => {
        return <AgGridColumn
            key={index}
            width={column.width}
            field={column.field}
            headerName={column.headerName}
            filter={column.filter ?? "agTextColumnFilter"}
            cellRenderer={column.cellRenderer ?? null}
        // floatingFilterComponent={column.floatingFilterComponent ?? null}
        // floatingFilterComponentParams={column.floatingFilterComponentParams ?? {
        //   suppressFilterButton: true,
        // }}
        >
        </AgGridColumn>
    })

    const getQueryString = () => {
        console.log('get filetr')
        let deepFilter = `&page=${page}&limit=${limit}`;

        if (!isObjectEmpty(filters)) {
            const updatedFilters = [];

            Object.keys(filters).map(field => {
                console.log('field', field, '----', filters[field])
                if (filters[field].filter === "me") {
                    filters[field].filter = user?.user?.email
                }
                updatedFilters.push({
                    field: field,
                    term: filters[field].filter
                })
            });
            deepFilter = `${deepFilter}&deepFilter=${JSON.stringify(updatedFilters)}&filterType=and`
        }

        if (sorting.length > 0) {
            deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`
        }

        if (search) {
            console.log("🚀 ~ file: index.tsx ~ line 327 ~ getQueryString ~ search", search)

            deepFilter = `${deepFilter}&search=${search}`;
        }

        return deepFilter;
    };

    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
    };

    const showConfirmBox = (row) => {
        if (row) {
            setIsConformDialogVisible(true);
            if (row && row.id) {
                setDeleteRecord(row);
            }
        } else {
            setIsConformDialogVisible(true);
        }
    };

    const handleDeleteEmails = async () => {
        setDeleteLoading(true);

        if (deleteRecord?.id || selectedRecords.length > 0) {
            axiosInstance()
                .put('/email',
                    { emails: deleteRecord?.id ? [deleteRecord.id] : selectedRecords.map(d => d._id) })
                .then(({ data }) => {
                    toastConfig.setToastConfig({
                        open: true,
                        type: "success",
                        message: "Email deleted succesfully",
                    });
                    setIsConformDialogVisible(false);
                    setDeleteLoading(false);
                    if (deleteRecord) setDeleteRecord({});
                    fetchEmails();
                })
                .catch((error) => {
                    toastConfig.setToastConfig(error);
                    setIsConformDialogVisible(false);
                    setDeleteLoading(false);
                });
        }
    };

    const handleClose = () => {
        setEmailId(null)
        setOpen(false)
    }

    const handleTab = (e, currentTab) => {
        let filteredEmails = [...emailsCopy]
        if (currentTab === tabs.Sent) {
            filteredEmails = emailsCopy.filter(email => email.isCreatedByMe)
        }
        dispatch({ type: "initialize", data: filteredEmails, count: filteredEmails.length });
        setCurrentTab(currentTab)
    }

    return (<Layout>
        <Grid container className="headerbox">
            <Grid item xs={12}>
                <CustomBreadCrumbs routes={[{ title: "Email" }]} />
            </Grid>
        </Grid>
        <CustomContainer>
            <div className="header-panel">
                <Grid container className={styles.filter_side_container}>
                    <Grid item xs={3} className="d-flex align-items-center gap-1">
                        <HiOutlineMail className="headerLogo" />{" "}
                        <span className="listingHeader">Email({rowCount}) </span>
                        <ToggleButtonGroup
                            size="small"
                            className="ml-8"
                            value={currentTab}
                            exclusive
                            onChange={handleTab}>
                            {Object.keys(tabs).map((k, index) => (
                                <ToggleButton value={tabs[k]} key={index} className="l-2">
                                    {k} {currentTab === tabs[k] ? `(${rowCount})` : ""}
                                </ToggleButton>
                            ))}
                        </ToggleButtonGroup>
                    </Grid>
                    <Grid item xs={9} className={styles.filter_side}>
                        <Box component="div" className={styles.filter_side_header} style={{ width: '100%' }} >
                            <Box style={{ width: '90%' }}>
                                <SearchFilter
                                    handleChangeFilter={handleChangeFilter}
                                    filter={filter}
                                    chip={{ size: "small" }}
                                    dontShowMyActivity={true}
                                />
                            </Box>
                            <Button
                                className={styles.action_submit_btn}
                                variant="outlined"
                                color="default"
                                size="small"
                                onClick={openActions}
                                aria-controls="action-menu"
                            >
                                Actions <ExpandMore />
                            </Button>
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
            <CustomGridHeaderOptions columns={columns} setColumns={setColumns} columnApi={columnApi} />

            <div className="ag-theme-material ag-grid-listing-grid">
                <AgGridReact
                    rowData={dataRows}
                    onGridReady={onGridReady}
                    suppressDragLeaveHidesColumns={true}
                    suppressCellSelection={true}
                    rowHeight={40}
                    frameworkComponents={frameworkComponents}
                    defaultColDef={{
                        resizable: true,
                        floatingFilter: true,
                        sortable: true,
                        width: 250,
                        suppressMenu: true,
                        // headerCheckboxSelection: true,
                        // checkboxSelection: true,
                        floatingFilterComponentParams: { suppressFilterButton: true }
                    }}
                    onSortChanged={(e) => {
                        dispatch({ type: "sort", sorting: e.api.getSortModel() })
                    }}
                    onFilterChanged={(e) => {
                        dispatch({ type: "filter", filters: e.api.getFilterModel() });
                    }}
                    enableCellTextSelection={true}
                    ensureDomOrder={false}
                    loadingOverlayComponent={'customLoadingOverlay'}
                    loadingOverlayComponentParams={{
                        loadingMessage: 'Loading...',
                    }}
                    animateRows={false}
                    suppressAnimationFrame={true}
                    suppressMaintainUnsortedOrder={true}

                    rowBuffer={limit}
                    // suppressMaxRenderedRowRestriction={true}

                    // loadingCellRenderer={'customLoadingCellRenderer'}
                    // loadingCellRendererParams={{
                    //   loadingMessage: 'One moment please...',
                    // }}

                    suppressRowClickSelection={true}
                    rowSelection={'multiple'}
                    onSelectionChanged={(event: any) => {
                        dispatch({ type: "selection", selectedRecords: event.api.getSelectedRows() })
                    }}
                    immutableData={true}
                    getRowNodeId={(data) => {
                        return data._id;
                    }}
                >
                    <AgGridColumn width={70} filter={false} pinned="left" lockPinned={true}
                        headerCheckboxSelection={true}
                        headerCheckboxSelectionFilteredOnly={true}
                        checkboxSelection={true}
                        resizable={false} sortable={false}
                    >
                    </AgGridColumn>

                    {generateColumns}

                    <AgGridColumn width={150} headerName="Actions"
                        pinned={(isMobile || isTablet) ? false : "right"}
                        lockPinned={(isMobile || isTablet) ? false : true}
                        resizable={false} sortable={false}
                        filter={false} cellRenderer="actionsRenderer">
                    </AgGridColumn>

                </AgGridReact>
            </div>

            <TablePagination
                component="div"
                count={rowCount}
                page={page}
                onChangePage={(event, newPage) => {
                    dispatch({ type: "pageChange", page: newPage })
                }}
                rowsPerPage={limit}
                onChangeRowsPerPage={(event) => {
                    dispatch({ type: "pageSizeChange", limit: event.target.value })
                }}
                rowsPerPageOptions={pageSizes}
            />

            {showDeleteWarningConfirmBox ? (
                <MessageDialog
                    open={showDeleteWarningConfirmBox}
                    message={`You are trying to delete records which you do not have permission to delete, Please remove those records from selection and try again.`}
                    onClose={() => setShowDeleteWarningConfirmBox(false)}
                />
            ) : null}
            {isConfirmDialogVisible ? (
                <ConfirmationDialog
                    open={isConfirmDialogVisible}
                    message={`Are you sure, you want to delete ${deleteRecord?.id ? "this email" : "these emails"} ?`}
                    onClose={() => {
                        if (deleteRecord) setDeleteRecord({});
                        setIsConformDialogVisible(false);
                    }}
                    okBtnLoading={deleteLoading}
                    onOk={handleDeleteEmails}
                />
            ) : null}
            {
                open ?
                    <Dialog
                        open={open}
                        aria-labelledby="customized-dialog-title"
                        maxWidth="md"
                        onClose={handleClose}
                        fullWidth
                    >
                        <CreateEmail emailId={emailId} handleClose={handleClose} relatedTo={filter} />
                    </Dialog> : null
            }
        </CustomContainer>
    </Layout >
    );
}

export default Email;
