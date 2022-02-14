import { useState, useEffect, useContext, useReducer, Fragment } from "react";
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import AddIcon from "@material-ui/icons/Add";
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../axios/axiosInstance";
import { GiStockpiles } from 'react-icons/gi';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import { AddOutlined, ExpandMore } from "@material-ui/icons";
import { Box, Chip, Menu, MenuItem, TextField } from "@material-ui/core";
import SearchBox from '../../components/Helpers/SearchBox'
import styles from "../Leads/Header.module.scss";
import routes from "../../components/Helpers/Routes";
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import CustomAgGridEditable from "../../components/AgGridComponents/CustomAgGridEditable"
import { serializedAsset, isObjectEmpty, gridLoadingTimeout, RESOURCE_LABEL, product } from '../../constants/helpers';
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import { useData } from "../../StateProvider/Provider";
import ManageRepairJob from '../RepairJob/ManageRepairJob'
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { useHistory } from "react-router-dom";
import HtmlTooltip from "../../components/CustomTooltipTitle";
import ImportExportLinks from "../../components/Helpers/ImportExportLinks";
import useColumns, { getStaticFields, getFrameworkComponents } from "../../constants/useColumns"
import { prepareDataForGrid } from "../../constants/helpers"
import { MdAccountCircle } from "react-icons/md";
import { AiFillCrown, MdAdd } from "react-icons/all";
import CustomSwipableList from "../../components/SwipableListComponents/CustomSwipableList";
import { isMobile, isTablet } from 'react-device-detect';
import { Autocomplete } from "@material-ui/lab";
import { CommonRenderer, CreatedByRenderer, UpdatedByRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';
const storedRoutes = localStorage.getItem("routes") ? JSON.parse(localStorage.getItem("routes")) : null;


const InventoryProduct = () => {
    const toastConfig = useContext(CustomToastContext)
    const [showManageProductInventoryDialog, setShowManageProductInventoryDialog] = useState({ open: false, isClone: false, idToClone: null });
    const [showRepairJobDialog, setShowRepairJobDialog] = useState(false);
    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
    const [deleteRecord, setDeleteRecord] = useState(null)
    const [anchorEl, setAnchorEl] = useState(null);
    const [gridApi, setGridApi] = useState(null);
    // const [columns, setColumns] = useState(null)
    // const [frameWorkComponent, setFrameWorkComponent] = useState({})
    const [disableSaveButton, setDisableSaveButton] = useState(false);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows } = state;
    const [isAllChecked, setIsAllChecked] = useState(false);
    const [clonedData, setClonedData] = useState([])
    const localStorageSelectedRecords = "warehouse_selected";
    const [plant, setPlant] = useState('')
    const [plantOptions, setPlantOptions] = useState([])
    const [productCategoryList, setProductCategoryList] = useState([]);
    const [productFilterList, setProductFilterList] = useState([]);
    const [productCategory, setProductCategory] = useState(null);
    const [productFilter, setProductFilter] = useState(null);
    const [plantId, setPlantId] = useState('');

    const {
        state: { permissions },
    }: any = useData();
    const { getColumnData } = useColumns();
    const history = useHistory();

    const [warehouse, setWarehouse] = useState(history.location?.state?.warehouse);
  
    const [redirectProduct, setRedirectProduct] = useState(history.location?.state?.product);
    


    useEffect(() => {

        getPlants()
        fetchProductInventory()
    }, [page, limit, filters, sorting, search, warehouse, redirectProduct,productCategory, productFilter]);

 

    useEffect(() => {
        setDisableSaveButton(selectedRecords.some(d => d.quantity === 0))
    }, [selectedRecords])





    const getPlants = () => {
        axiosInstance()
            .get(`/warehouse`)
            .then(({ data: { data, count } }) => {
                setPlantId(data[0]._id)
                setPlantOptions(data);
                setPlant(data[0].warehouseName);
               
                

            });
    }





    let columns = [
        { field: 'productName', headerName: 'Product Description', show: true, cellRenderer: 'commonRenderer' },
        { field: 'plant', headerName: 'Plant', show: true, disabled: false, cellRenderer: 'commonRenderer' },
        { field: 'inventory', headerName: 'Inventory', show: true, disabled: false, cellRenderer: 'commonRenderer', cellEditor: "numericCellEditor", editable: true },
        { field: 'minInventory', headerName: 'Min Inventory', show: true, disabled: false, cellRenderer: 'commonRenderer', cellEditor: "numericCellEditor", editable: true },
    ]



    const fetchProductInventory = () => {
        dispatch({ type: "loading", loading: true });

        if (gridApi) {
            gridApi.setRowData([]);
        }

        const queryString = getQueryString();
        axiosInstance().get(`/product-inventory?wareHouse=61e54c3e8b18de57f0ec5587&${queryString}`).then(({ data }) => {
            let rows = data.data?.map((u, user) => {
                let finalObject = prepareDataForGrid(u);
                finalObject["canDelete"] = permissions?.serializedAsset?.isDelete
                finalObject["isChecked"] = selectedRecords.some(s => s._id === u._id);
                finalObject["allowedToEdit"] = permissions?.serializedAsset.isUpdate
                finalObject['plant'] = plant ;
           
                return {
                    ...finalObject,

                };
            });
            setIsAllChecked(false);

            setClonedData(data.data);





            if (appendRows) {
                dispatch({
                    type: "initialize", data: [...dataRows, ...rows],
                    count: data.data.count, selectedRecords: [...dataRows, ...rows].filter(f => f.isChecked === true)
                });
            } else {
                dispatch({
                    type: "initialize", data: rows, count: data.count,
                    selectedRecords: rows.filter(f => f.isChecked === true)
                });
            }
            dispatch({ type: "initialize", data: rows, count: data.count });
            setTimeout(() => {
                dispatch({ type: "loading", loading: false });
            }, gridLoadingTimeout);

        }).catch((error) => {
            toastConfig.setToastConfig(error);
            dispatch({ type: "loading", loading: false });
        });
    };

    const getQueryString = () => {
        let deepFilter = `page=${page}&limit=${limit}`;



        if (!isObjectEmpty(filters)) {
            const updatedFilters = [];

            Object.keys(filters).forEach(field => {
                updatedFilters.push({
                    field: replaceFieldName(field),
                    term: filters[field].filter
                })
            });
            deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}`
        }

        if (sorting.length > 0) {
            deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`
        }

        if (search) {
            deepFilter = `${deepFilter}&search=${search}`;
        }

        return `${deepFilter}&filterType=and`;
    };

   


    const onCellValueChanged = (row) => {
    
       if(row?.data?.inventory && row?.data?.minInventory){
          let inputData = {
            

                plant:"61e54c3e8b18de57f0ec5587",
            
                product:"61f8e15bb55f66174938a46f",
            
                inventory:row?.data?.inventory,
            
                minInventory:row?.data?.minInventory,
            
            
           }
           axiosInstance().put(`/product-inventory`,inputData);
       }


       if(row?.data?.inventory) {
           let inputData = {
               plant:'61e54c3e8b18de57f0ec5587',
               product:'61f8e15bb55f66174938a46f',
               inventory:row?.data?.inventory,
            
           }
           axiosInstance().put(`/product-inventory`,inputData);
       }

       if(row?.data?.minInventory){
           let inputData ={
               plant:'61e54c3e8b18de57f0ec5587',
               product:'61f8e15bb55f66174938a46f',
               minInventory:row?.data?.minInventory
           }
           axiosInstance().put(`/product-inventory`,inputData);
       }
      
    }


    const frameworkComponents = {
        commonRenderer: CommonRenderer,
    };




    const replaceFieldName = (field) => {
        switch (field) {
            case "productName":
                return "productName";
            case "plant":
                return "plant";
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
                <CustomBreadCrumbs routes={[routes.productInventory]} />
            </Grid>
            <Grid item md={8} sm={1} xs={2}>
                <ImportExportLinks
                    permissions={permissions?.serializedAsset}
                    module="product inventory"
                    api={serializedAsset.api}
                    afterImportCompleted={() => {
                        fetchProductInventory();
                    }}
                    isExportAllOrSomeFeature={true}
                    total={rowCount}
                    recordsToExport={selectedRecords.length}
                    ids={selectedRecords.length ? selectedRecords.map((obj) => obj._id) : []}
                    onExportToExcelSuccess={() => {
                        if (gridApi) gridApi.deselectAll()
                        else fetchProductInventory()
                    }}
                />
            </Grid>

        </Grid>
        <div className="main-container">
            <div className="header-panel">
                <Grid container className={styles.filter_side_container}>
                    <Grid item xs={12} sm={12} md={6} className="d-flex align-items-center gap-1">
                        <div className="d-flex align-items-center">
                            <GiStockpiles size={20} style={{ paddingBottom: "3px" }} className="headerLogo" />
                            <span className="listingHeader">{routes.productInventory?.title} </span>
                        </div>


                        <>


                            <Autocomplete
                                style={{ width: "250px" }}
                                options={plantOptions}
                                getOptionLabel={(option: any) =>  option.warehouseName }
                                getOptionSelected={(option: any, val) =>
                                    option._id === val
                                }
                                value={plantOptions.filter((data) => data._id === plantOptions).length
                                    ? plantOptions.filter((data) => data._id === plantOptions)[0]
                                    : ""
                                }
                                onChange={(e, val) => {
                                    setPlantId(val && val._id ? val._id : "")
                                    fetchProductInventory();
                                }}
                                renderInput={(params) => (

                                    isMobile && !isTablet ?
                                        <TextField
                                            {...params}
                                            margin="dense"
                                            name="plant"
                                            placeholder="Plant"
                                            variant="standard"
                                            fullWidth
                                            className={isMobile ? "serchBox" : ""}


                                        /> :
                                        <TextField
                                            {...params}
                                            margin="dense"
                                            name="plant"
                                            label="Plant"
                                            variant="outlined"
                                            fullWidth
                                        />
                                )}
                            />


                        </>

                    </Grid>

                </Grid>
            </div>
            {columns ?
                isMobile && !isTablet ? <CustomSwipableList
                    allowSelection={true}
                    allowSwipe={true}
                    permissions={permissions?.serializedAsset}
                    primaryField={columns?.find(d => d.field === "assetNumber")}
                    onClick={(d) => {
                        history.push(`${routes.serializedAssetDetail.path}/${d._id}`)
                    }}
                    dataRows={dataRows}
                    selectedRecords={selectedRecords}
                    dispatch={dispatch}
                    onEdit={(d) => {
                        history.push(`${routes.serializedAssetDetail.path}/${d._id}`)
                    }}
                    extraParamsToCheckDelete={false}
                    onDelete={(d) => {
                        setDeleteRecord(d);
                        setShowDeleteConfirmBox(true)
                    }}
                    rowCount={rowCount}
                    page={page}
                    loading={loading}
                    additionalDetails={[]}
                    chips={[
                        {
                            label: "Serial Number : ",
                            field: "serialNumber",
                        },
                    ]}
                    owerCollaboratorInitialsOrImages=""
                    onCreate={false}
                    showClone={true}
                    onClone={(data) => { setShowManageProductInventoryDialog({ open: true, isClone: true, idToClone: data._id }); }}
                    renderedFrom={routes.serializedAsset?.title} /> :
                    Object.keys(frameworkComponents).length > 0 ?
                        <CustomAgGridEditable
                            allowSelection={false}
                            allowAction={false}
                            columns={columns}
                            dataRows={dataRows}
                            frameworkComponents={frameworkComponents}
                            setGridApi={setGridApi}
                            dispatch={dispatch}
                            rowCount={rowCount}
                            limit={limit}
                            pageSizes={pageSizes}
                            page={page}
                            onCellValueChanged={onCellValueChanged}
                            actionWidth={150}
                            loading={loading}
                            renderedFrom={routes.serializedAsset?.title}
                            refreshGrid={fetchProductInventory}
                        /> : null
                : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
        </div>
    </Fragment >
    );
}

export default InventoryProduct;