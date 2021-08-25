import { useState, useEffect, useContext, useReducer, Fragment } from "react";
import Grid from '@material-ui/core/Grid';
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../axios/axiosInstance";
import { GiAbstract055 } from 'react-icons/gi';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import { Box } from "@material-ui/core";
import SearchBox from '../../components/Helpers/SearchBox'
import styles from "../Leads/Header.module.scss";
import routes from "../../components/Helpers/Routes";
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import { productInventory, isObjectEmpty, gridLoadingTimeout, displayDate } from '../../constants/helpers';
import {
    CommonRenderer,
    CreatedByRenderer,
    DateRenderer,
    UpdatedByRenderer
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import { useData } from "../../StateProvider/Provider";

const EquipmentRentalMaster = () => {

    const toastConfig = useContext(CustomToastContext)
    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
    const [deleteRecord, setDeleteRecord] = useState(null)
    const [anchorEl, setAnchorEl] = useState(null);
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;
    
    const {
        state: { permissions },
    }: any = useData();

    useEffect(() => {
        fetchProductInventory()
    }, [page, limit, filters, sorting, search]);

    const columns = [
        { field: "productName", headerName: "Product Name", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "assetNumber", headerName: "Asset Number", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "serialNumber", headerName: "Serial Number", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "rentalStartDate", headerName: "Rental Start Date", show: true, disabled: true, filter: false, sortable: false, cellRenderer: "commonRenderer" },
        { field: "rentalBackDate", headerName: "Rental Back Date", show: true, disabled: true, filter: false, sortable: false, cellRenderer: "commonRenderer" },
        { field: "warehouse", headerName: "Warehouse", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "createdBy", headerName: "Created By", show: true, cellRenderer: "createdByRenderer" },
        { field: "updatedBy", headerName: "Updated By", show: true, cellRenderer: "updatedByRenderer" },
    ];

    const fetchProductInventory = () => {
        dispatch({ type: "loading", loading: true });

        if (gridApi) {
            gridApi.setRowData([]);
        }

        const queryString = getQueryString();
        axiosInstance().get(`${productInventory.api}${queryString}`).then(({ data }) => {
            data.data = data.data?.map((u) => ({
                ...u,
                id: u._id,
                productName: u.product?.optionLabel,
                rentalStartDate: u.createdBy?.date ? displayDate(u.createdBy?.date) : "",
                rentalBackDate: u.createdBy?.date ? displayDate(u.createdBy?.date) : "",
                warehouse: "warehouse",
                createdBy: u.createdBy?.user?.concatedName,
                createdByDate: u.createdBy?.date,
                updatedBy: u.updatedBy?.user?.concatedName,
                updatedByDate: u.updatedBy?.date,
            }));

            dispatch({ type: "initialize", data: data.data, count: data.count });
            setTimeout(() => {
                dispatch({ type: "loading", loading: false });
            }, gridLoadingTimeout);

        }).catch((error) => {
            toastConfig.setToastConfig(error);
            dispatch({ type: "loading", loading: false });
        });
    };

    const getQueryString = () => {
        let deepFilter = `?page=${page}&limit=${limit}`;

        if (!isObjectEmpty(filters)) {
            const updatedFilters = [];

            Object.keys(filters).forEach(field => {
                updatedFilters.push({
                    field: replaceFieldName(field),
                    term: filters[field].filter
                })
            });
            deepFilter = `${deepFilter}&deepFilter=${JSON.stringify(updatedFilters)}&filterType=and`
        }

        if (sorting.length > 0) {
            deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`
        }

        if (search) {
            deepFilter = `${deepFilter}&search=${search}`;
        }

        return deepFilter;
    };

    const handleDelete = () => {
        let ids = []
        if (deleteRecord) {
            ids.push(deleteRecord._id)
        }
        else {
            ids = selectedRecords.map(d => d._id);
        }
        axiosInstance().put(`${productInventory.api}/remove`, { "ids": ids }).then(() => {
            fetchProductInventory();
            setShowDeleteConfirmBox(false)
            setDeleteRecord(null)
            setAnchorEl(null)
        }).catch((error) => {
            toastConfig.setToastConfig(error)
        });
    }



    const handleSearch = (e) => {
        dispatch({ type: "search", search: e.target.value });
    };


    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
    };

    const frameworkComponents = {
        createdByRenderer: CreatedByRenderer,
        updatedByRenderer: UpdatedByRenderer,
        commonRenderer: CommonRenderer,
        dateRenderer: DateRenderer
    };

    const replaceFieldName = (field) => {
        switch (field) {
            case "createdBy":
                return "createdBy.user.concatedName";

            case "updatedBy":
                return "updatedBy.user.concatedName";

            default:
                return field;
        }
    };

    return (<Fragment>
        <Grid container className="headerbox">
            <Grid item md={4} sm={11} xs={10}>
                <CustomBreadCrumbs routes={[{ title: routes.equipmentRentalMaster.title }]} />
            </Grid>
        </Grid>
        <div className="main-container">
            <div className="header-panel">
                <Grid container className={styles.filter_side_container}>
                    <Grid item xs={6} className="d-flex align-items-center gap-1">
                        <GiAbstract055 className="headerLogo" /> <span className="listingHeader">{routes.equipmentRentalMaster.title} </span>
                    </Grid>
                    <Grid xs={6} container className={styles.filter_side} >
                        <Box className={styles.filter_side_header} component="div" >

                            <SearchBox
                                onSearch={handleSearch}
                                searchbox={styles.search_box_input}
                                width="242px"
                                size="small"
                                value={search}
                            />
                        </Box>
                    </Grid>
                </Grid>
            </div>
            {columns ?
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
                    allowAction={false}
                    loading={loading}
                    renderedFrom="productPage"
                />
                : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
        </div>
        {showDeleteConfirmBox &&
            <ConfirmationDialog
                open={showDeleteConfirmBox}
                message={`Are you sure you want to delete the product inventory ${deleteRecord?._id ? deleteRecord?.assetNumber : ""} ?`}
                onClose={() => setShowDeleteConfirmBox(false)}
                onOk={handleDelete}
            />
        }
    </Fragment>
    );
}

export default EquipmentRentalMaster;
