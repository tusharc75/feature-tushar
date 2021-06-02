import React, { useState, useEffect, useReducer } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Layout from "../../../components/Layout";
import { SearchFilter } from "../../../components/Activity/Report/SearchFilter";
import { useHistory } from "react-router-dom";
import queryString from 'query-string';
import { GetReferenceName, GetNotes } from "../../../axios/activity";
import { DataGrid } from "@material-ui/data-grid";
import moment from "moment";
import ActivityModelHandler from "../../../components/Activity/ActivityModelHandler";
import CustomBreadCrumbs from "../../../components/CustomBreadCrumbs";
import CustomDataGridToolbar from "../../../components/Helpers/DataGridHelpers/CustomDataGridToolbar";
import CustomDataGridNoDataFound from "../../../components/Helpers/DataGridHelpers/CustomDataGridNoDataFound";
import CustomContainer from "../../../components/CustomContainer";
import { GoNote } from "react-icons/go";
import CustomFloatingFilter from '../../../components/AgGridComponents/CustomAgGridFilter'
import {
    CommonRenderer,
    CreatedByRenderer,
    UpdatedByRenderer,
    CustomLoadingOverlay,
    CommonRendererWithCopy
} from "../../../components/AgGridComponents/CustomAgGridCellRenderers";
import styles from "../../Leads/Header.module.scss";
import CustomAgGrid from "../../../components/AgGridComponents/CustomAgGrid";
import { gridPageSizes } from "../../../constants/helpers";

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

        case "count":
            return {
                ...state,
                rowCount: action.count,
                loading: false
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

const Note = () => {
    const history = useHistory();
    const parsed = queryString.parse(history.location.search);
    const { referenceType, referenceId, activityType, activityId } = parsed;

    const [filter, setFilter] = useState([]);
    // const [notes, setNotes] = useState([]);
    // const [loading, setLoading] = useState(true);
    const [noteId, setNoteId] = useState(undefined)

    //  Grid Variables - Start
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes } = state;

    // const [showGridFilters, setShowGridFilters] = useState(true)
    const columns = [
        { field: "name", headerName: "Title", show: true, disabled: true, cellRenderer: "nameRenderer" },
        { field: "createdByDate", headerName: "Created At", filter: false, sortable: false, show: true, cellRenderer: "createdAtDateRenderer" },
        { field: "updatedByDate", headerName: "Updated At", filter: false, sortable: false, show: true, cellRenderer: "updatedAtDateRenderer" },
    ];
    //  Grid Variables - End

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
        fetchNotes()
    }, [filter]);

    const NameRenderer = params => (
        <span className="link cursor-pointer" onClick={() => handleActivityOpen(params.data.id)}>
            {params.value}
        </span>
    )

    const CreatedAtDateRenderer = params => (
        <span style={{ marginLeft: 5, fontSize: 12 }}>
            { moment(params.value).format("ddd MM/DD")}
        </span>
    )

    const UpdatedAtDateRenderer = params => (
        <span style={{ marginLeft: 5, fontSize: 12 }}>
            { moment(params.value).format("ddd MM/DD")}
        </span>
    )

    const frameworkComponents = {
        nameRenderer: NameRenderer,
        createdAtDateRenderer: CreatedAtDateRenderer,
        updatedAtDateRenderer: UpdatedAtDateRenderer
    }

    const fetchNotes = async () => {
        // setLoading(true)

        if (gridApi) {
            gridApi.setRowData([]);
            gridApi.showLoadingOverlay();
        }

        await GetNotes(JSON.stringify(filter))
            .then(({ data }) => {

                let rows = data.map((u) => {
                    const { createdBy, updatedBy, relatedTo, parentHierarchy, ...restProperties } = u;

                    let res = {
                        ...restProperties,
                        id: u._id,

                        createdBy: u.createdBy?.user?.concatedName,
                        createdByDate: u.createdBy?.date,
                        updatedBy: u.updatedBy?.user?.concatedName,
                        updatedByDate: u.updatedBy?.date,
                    };
                    return res;
                });

                dispatch({ type: "initialize", data: rows, count: data.length });
            })
            .catch((err) => {
            });
    };

    const handleChangeFilter = (value) => {
        setFilter(value)
    }


    const handleActivityOpen = (id) => {
        // history.push({
        //     pathname: '/activity/note',
        //     search: '?activityType=note&activityId=' + id
        // })
        setNoteId(id)
    }


    // const columns = [
    //     { field: 'id', headerName: 'id', hide: true },
    //     {
    //         field: 'name', headerName: 'Title',
    //         width: 300,
    //         renderCell: (params) =>
    //             <a onClick={() => handleActivityOpen(params.row.id)}>{params.row.name}</a>
    //     },
    //     {
    //         field: 'createdBy',
    //         headerName: 'Created At',
    //         width: 200,
    //         renderCell: (params) =>
    //             <span>{moment(params.row.createdBy.date).format("DD/MM/YYYY hh:mm A")}</span>
    //     },
    //     {
    //         field: 'updatedAt',
    //         headerName: 'Updated At',
    //         width: 200,
    //         renderCell: (params) =>
    //             <span>{moment(params.row.updatedAt).format("DD/MM/YYYY hh:mm A")}</span>
    //     },
    // ];


    return (<Layout>
        <Grid container className="headerbox">
            <Grid item xs={12}>
                <CustomBreadCrumbs routes={[{ title: "Note" }]} />
            </Grid>
        </Grid>

        <CustomContainer>
            <div className="header-panel">
                <Grid container className={styles.filter_side_container}>
                    <Grid item xs={2} className="d-flex align-items-center gap-1">
                        <GoNote className="headerLogo" />{" "}
                        <span className="listingHeader">Note ({dataRows.length})</span>
                    </Grid>
                    <Grid item xs={10} className={styles.filter_side}>
                        <Box component="div" className={styles.filter_side_header} style={{ width: '100%' }} >
                            <Box style={{ width: '90%' }}>
                                <SearchFilter
                                    handleChangeFilter={handleChangeFilter}
                                    filter={filter}
                                    chip={{ size: "small" }}
                                />
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </div>

            <CustomAgGrid columns={columns} dataRows={dataRows} frameworkComponents={frameworkComponents} setGridApi={setGridApi}
                dispatch={dispatch} rowCount={rowCount} limit={limit} pageSizes={pageSizes} page={page} allowAction={false} allowSelection={false}
                isClientSideGrid={true} />

            {/* <div className="listing-grid">
                <DataGrid
                    components={{
                        Toolbar: CustomDataGridToolbar,
                        NoRowsOverlay: CustomDataGridNoDataFound,
                    }}
                    loading={loading}
                    rows={notes}
                    disableSelectionOnClick
                    disableMultipleSelection
                    columns={columns}
                    pageSize={10}
                    density="compact"
                />
            </div> */}


            {noteId !== undefined && <ActivityModelHandler
                activityType="note"
                activityId={noteId}
                onClose={() => setNoteId(undefined)}
            />}
        </CustomContainer>
    </Layout>

    );
}

export default Note;
