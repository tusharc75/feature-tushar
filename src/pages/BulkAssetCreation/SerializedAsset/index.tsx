
import Box from "@material-ui/core/Box/Box";
import { useState, useEffect, useReducer, useContext } from "react";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import CustomAgGrid, { intialState, reducer } from "src/components/AgGridComponents/CustomAgGrid";
import axiosInstance from "src/axios/axiosInstance";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import {
    bulkAssetCreation,
    gridLoadingTimeout, isObjectEmpty, prepareDataForGrid, serializedAsset
} from "src/constants/helpers";
import { useData } from "src/StateProvider/Provider";
import { isMobile, isTablet } from "react-device-detect";
import CustomSwipableList from "src/components/SwipableListComponents/CustomSwipableList";
import routes from "src/components/Helpers/Routes";
import CustomAgGridEditable from "src/components/AgGridComponents/CustomAgGridEditable";
import { useHistory } from "react-router-dom";
import { fetch_po_product_fields } from '../../../components/PurchaseOrder/helper';
import useColumns, { getFrameworkComponents, getStaticFields } from "src/constants/useColumns";
import ImportExportLinks from "src/components/Helpers/ImportExportLinks";
import { Grid } from "@material-ui/core";

const SerializedAsset = ({ bulkAssetCreationData, renderedFrom, }) => {
    const toastConfig = useContext(CustomToastContext);
    const {
        state: { user, permissions }
    }: any = useData();
    const history = useHistory();
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows } = state;
    const [gridApi, setGridApi] = useState(null);
    const [columns, setColumns] = useState(null)
    const [frameWorkComponent, setFrameWorkComponent] = useState(null)
    const { getColumnData } = useColumns();

    useEffect(() => {
        fetchColumns()
    }, []);

    const fetchColumns = () => {
        axiosInstance()
            .get(`/field?resource=${serializedAsset.resource}`)
            .then(({ data: { data } }) => {
                let columns = []
                let rendererNames = []
                data.filter(d => d?.fieldData?.fieldName !== "bornOnDate").forEach(o => {
                    let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.serializedAssetDetail.path)
                    if (currentColumn !== null) {
                        columns = [...columns, currentColumn?.columnData]
                        if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                            rendererNames.push(currentColumn?.rendererName)
                        }
                    }
                })
                let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
                tempFrameworkComponent = {
                    ...tempFrameworkComponent,
                }
                setFrameWorkComponent({ ...tempFrameworkComponent })
                columns = [...columns, ...getStaticFields()]
                setColumns([...columns])
                fetchProductInventory()
            })
    }

    const fetchProductInventory = () => {
        dispatch({ type: "loading", loading: true });
        if (gridApi) {
            gridApi.setRowData([]);
        }
        const queryString = getQueryString();
        axiosInstance().get(`${serializedAsset.api}${queryString}`).then(({ data }) => {
            let rows = data.data?.map((u, user) => {
                let finalObject = prepareDataForGrid(u);
                finalObject["canDelete"] = permissions?.serializedAsset?.isDelete
                finalObject["isChecked"] = selectedRecords.some(s => s._id === u._id);
                finalObject["allowedToEdit"] = permissions?.serializedAsset.isUpdate
                return {
                    ...finalObject,
                };
            });
            dispatch({
                type: "initialize", data: rows, count: data.count,
                selectedRecords: rows.filter(f => f.isChecked === true)
            });

            // dispatch({ type: "initialize", data: rows, count: data.count });
            setTimeout(() => {
                dispatch({ type: "loading", loading: false });
            }, gridLoadingTimeout);
        }).catch((error) => {
            toastConfig.setToastConfig(error);
            dispatch({ type: "loading", loading: false });
        });
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

    const getQueryString = () => {
        let deepFilter = `?page=${page}&limit=${limit}`;
        let filterById = [];
        filterById.push({ field: "bulkAssetCreation", term: bulkAssetCreationData?._id });
        deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterById)}`
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
        return `${deepFilter}&filterType=and&filterByIdType=and`;
    };

    const handleValueUpdate = async (row) => {
        if (!row || !row?.data) return;
        const assetId = row.data._id;
        console.log(row);
        const data = [
            {
                _id: assetId,
                [row.column.colId]: row.newValue
            }
        ];
        try {
            await axiosInstance()
                .post(`${routes.serializedAsset.path}/update-assets`, data)
                .then(() => {
                    fetchColumns();
                });
        } catch (err) {
            toastConfig.setToastConfig(err);
        }
    };

    return (<>
        <Box display="flex" justifyContent="flex-end" pt={1} alignItems="center" className="bg-white">
            <Box ml={2}>
                <ImportExportLinks
                    permissions={permissions?.packages}
                    module="packages-products"
                    api={`${serializedAsset.api}/custom-template`}
                    afterImportCompleted={() => {
                        fetchProductInventory();
                    }}
                    isExportAllOrSomeFeature={true}
                    total={rowCount}
                    recordsToExport={selectedRecords.length ? selectedRecords.length : dataRows.length}
                    ids={selectedRecords.length ? selectedRecords?.map((d: any) => d._id) : dataRows?.map((d: any) => d._id)}
                    isDownloadExcel={false}
                    isBackgroundWhite={true}
                />
            </Box>
            <Box mx={1} />
        </Box>
        <Grid item xs={12} md={12} sm={12} className="mt-3">
            {columns ?
                isMobile && !isTablet ? <CustomSwipableList
                    allowSelection={false}
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
                    onDelete={() => { }}
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
                    onClone={() => { }}
                    renderedFrom={renderedFrom} /> :
                    Object.keys(frameWorkComponent).length > 0 ?
                        <CustomAgGridEditable
                            columns={columns}
                            dataRows={dataRows}
                            frameworkComponents={frameWorkComponent}
                            setGridApi={setGridApi}
                            dispatch={dispatch}
                            rowCount={rowCount}
                            limit={limit}
                            pageSizes={pageSizes}
                            page={page}
                            actionWidth={150}
                            loading={loading}
                            allowSelection={false}
                            allowAction={false}
                            renderedFrom={renderedFrom}
                            refreshGrid={fetchProductInventory}
                            onCellValueChanged={handleValueUpdate}
                        /> : null
                : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
        </Grid>
    </>
    );
}

export default SerializedAsset;