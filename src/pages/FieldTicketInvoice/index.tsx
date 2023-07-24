import { Box, Grid, IconButton, Tooltip } from '@material-ui/core';
import { Fragment, useEffect, useReducer, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import routes from 'src/components/Helpers/Routes';
import SearchBox from 'src/components/Helpers/SearchBox';
import { camelCase } from 'lodash';
import useColumns, { getStaticFields, getFrameworkComponents, gridFilterParser } from '../../constants/useColumns';
import { useData } from 'src/StateProvider/Provider';
import CustomAgGrid, { intialState, reducer } from '../../components/AgGridComponents/CustomAgGrid';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import axiosInstance from 'src/axios/axiosInstance';
import {
    gridLoadingTimeout,
    prepareDataForGrid,
    sidebarResource
} from 'src/constants/helpers';
import { useHistory } from 'react-router-dom';
import styles from '../Leads/Header.module.scss';
import queryString from 'query-string';
import { insertUpdate, objectStore } from 'src/constants/indexdbhelper';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import NoteAddIcon from '@material-ui/icons/NoteAdd';
import VisibilityIcon from '@material-ui/icons/Visibility';
import CreateInvoiceDialog from './ManageInvoice/CreateInvoiceDialog';
import ViewInvoice from '../Invoice/ViewInvoice';

const FieldTicketInvoice = () => {
    const FieldTicketType = [
        {
            key: `Pending ${routes.fieldTicket.title}`,
            value: 1
        },
        {
            key: `Invoiced ${routes.fieldTicket.title}`,
            value: 2
        }
    ];

    const renderedFrom = camelCase(routes?.fieldTicket.title);
    const localStorageSelectedRecords = `${renderedFrom}_selected`;

    const {
        state: { permissions, selectedEntity, user }
    }: any = useData();
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
        state;
    const history = useHistory();
    const { type }: any = queryString.parse(history.location.search);
    const [selectedType, setSelectedType] = useState(type ? parseInt(type) : 1);
    const [frameWorkComponent, setFrameWorkComponent] = useState({});
    const [columns, setColumns] = useState([]);
    const [gridApi, setGridApi] = useState(null);
    const { getColumnData } = useColumns();
    const [createInvoiceDialog, setCreateInvoiceDialog] = useState({ open: false, data: null })
    const [viewInvoiceDialog, setViewInvoiceDialog] = useState({ open: false, data: null })

    const fetchGridColumns = async () => {


        const response = await axiosInstance().get(`/field?resource=${sidebarResource?.fieldTicket}`);
        let data = response?.data?.data;
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
            let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.fieldTicketDetail.path, true);
            if (currentColumn !== null) {
                columns = [...columns, currentColumn?.columnData];
                if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                    rendererNames.push(currentColumn?.rendererName);
                }
            }
        });
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
            ...tempFrameworkComponent,
            actionsRenderer: ActionsRenderer
        };
        setFrameWorkComponent({ ...tempFrameworkComponent });
        columns = [...columns, ...getStaticFields()];
        setColumns([...columns]);
    };

    const fetchFieldTicketData = async () => {
        dispatch({ type: 'loading', loading: true });
        const queryString = getQueryString();
        if (gridApi) {
            gridApi.setRowData([]);
        }
        axiosInstance()
            .get(`${routes?.fieldTicketInvoice.path}${queryString}`)
            .then(({ data: { data, count } }) => {
                let rows = data?.map((u: any) => {
                    let finalObject: any = prepareDataForGrid(u);
                    finalObject['canDelete'] = permissions?.fieldTicket?.isDelete;
                    finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
                    finalObject['allowedToEdit'] = permissions?.fieldTicket?.isUpdate;
                    return {
                        ...finalObject
                    };
                });
                if (appendRows) {
                    dispatch({
                        type: 'initialize',
                        data: [...dataRows, ...rows],
                        count: count,
                        selectedRecords: [...dataRows, ...rows].filter((f) => f.isChecked === true)
                    });
                } else {
                    dispatch({
                        type: 'initialize',
                        data: rows,
                        count: count,
                        selectedRecords: rows.filter((f) => f.isChecked === true)
                    });
                }
                dispatch({ type: 'initialize', data: rows, count: count });
                setTimeout(() => {
                    dispatch({ type: 'loading', loading: false });
                }, gridLoadingTimeout);
            });

    };

    const getQueryString = (isExport = false) => {
        let deepFilter = !isExport ? `?page=${page}&limit=${limit}` : '?';

        if (selectedType) {
            deepFilter = deepFilter + `&type=${selectedType || 1}`;
        }

        if (selectedEntity) {
            deepFilter = `${deepFilter}&entity=${selectedEntity}`;
        }

        const { filterByIds, deepFilters } = gridFilterParser(filters);

        if (filterByIds?.length) {
            deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
        }
        if (deepFilters?.length) {
            deepFilter = `${deepFilter}&deepFilter=${encodeURI(JSON.stringify(deepFilters))}`;
        }
        if (filterByIds?.length || deepFilters?.length) {
            deepFilter = `${deepFilter}&filterType=and`;
        }

        if (sorting.length > 0) {
            deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
        }

        if (search) {
            deepFilter = `${deepFilter}&search=${encodeURI(search)}`;
        }
        if (showFilteredRecordsOnly) {
            const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
            deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
        }
        return deepFilter;
    };

    const handleSearch = (e) => {
        dispatch({ type: 'search', search: e.target.value });
    };

    const ActionsRenderer = (params) => (
        <Fragment>
            {!params.data.invoice ? (
                <Tooltip title="Create Invoice">
                    <IconButton
                        size="small"
                        onClick={() => {
                            setCreateInvoiceDialog({ open: true, data: params.data })
                        }}
                    >
                        <NoteAddIcon fontSize="small" color="primary" />
                    </IconButton>
                </Tooltip>
            ) : (
                <Tooltip title="View Invoice">
                    <IconButton size="small"
                        onClick={() => {
                            setViewInvoiceDialog({ open: true, data: params.data })
                        }}
                    >
                        <VisibilityIcon fontSize="small" color="primary" />
                    </IconButton>
                </Tooltip>
            )}
        </Fragment>
    );

    const onTypeChange = (event, type) => {
        const value = FieldTicketType.find((d) => d.key === type).value;
        setSelectedType(value);
        history.push(`?type=${value}`);
    };

    useEffect(() => {
        fetchGridColumns();
    }, []);

    useEffect(() => {
        fetchFieldTicketData();
    }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly, selectedType]);

    return (
        <Fragment>
            <Grid container className="headerbox">
                <Grid item md={4} sm={11} xs={10}>
                    <CustomBreadCrumbs routes={[{ title: routes.fieldTicketInvoice.title }]} />
                </Grid>
            </Grid>
            <CustomContainer>
                <div className="header-panel">
                    <Grid container className={styles.filter_side_container}>
                        <Grid item xs={12} md={6} sm={12} className={isMobile ? styles.mobile_panel : 'd-flex align-items-center gap-1'}>
                            <ToggleButtonGroup
                                size="small"
                                className="align-items-center gap-1 layout-for-mobile "
                                value={FieldTicketType[selectedType - 1].key}
                                exclusive
                                onChange={onTypeChange}
                            >
                                {FieldTicketType.map((k, index) => {
                                    return (
                                        <ToggleButton value={k.key} key={index}>
                                            {k.key}
                                        </ToggleButton>
                                    );
                                })}
                            </ToggleButtonGroup>
                        </Grid>
                        <Grid md={6} sm={12} xs={12} container className={styles.filter_side}>
                            <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
                                <Grid>
                                    <SearchBox
                                        onChange={handleSearch}
                                        className={styles.search_box_input}
                                        width={isMobile ? '200px' : '242px'}
                                        style={isMobile ? { flex: 1 } : {}}
                                        size="small"
                                        value={search}
                                    />
                                </Grid>
                            </Box>
                        </Grid>
                    </Grid>
                </div>
                {Object.keys(frameWorkComponent).length > 0 ? (
                    isMobile && !isTablet ? (
                        <CustomSwipableList
                            allowSelection={true}
                            allowSwipe={true}
                            permissions={permissions.fieldticketInvoice}
                            primaryField={columns?.find((d) => d.primaryField)}
                            onClick={(data) => { }}
                            dataRows={dataRows}
                            selectedRecords={selectedRecords}
                            dispatch={dispatch}
                            onEdit={(data) => {
                            }}
                            extraParamsToCheckDelete={true}
                            onDelete={(data) => {
                            }}
                            rowCount={rowCount}
                            page={page}
                            loading={loading}
                            additionalDetails={[]}
                            owerCollaboratorInitialsOrImages=""
                            onCreate={false}
                            showClone={true}
                            onClone={(data) => {
                            }}
                            chips={[]}
                            renderedFrom={renderedFrom}
                        />
                    ) : (
                        <CustomAgGrid
                            columns={columns}
                            dataRows={dataRows}
                            frameworkComponents={frameWorkComponent}
                            setGridApi={setGridApi}
                            dispatch={dispatch}
                            rowCount={rowCount}
                            limit={limit}
                            pageSizes={pageSizes}
                            page={page}
                            allowAction={true}
                            loading={loading}
                            renderedFrom={renderedFrom}
                            refreshGrid={fetchFieldTicketData}
                            showOnlyShowFilteredRecordSwitch={true}
                            showFilters={true}
                            resource={sidebarResource.fieldTicket}
                        />
                    )
                ) : null}
            </CustomContainer>
            {
                createInvoiceDialog.open && <CreateInvoiceDialog
                    fieldTicketData={createInvoiceDialog.data}
                    onClose={() => setCreateInvoiceDialog({ open: false, data: null })}
                    onSuccess={() => {
                        setCreateInvoiceDialog({ open: false, data: null });
                        fetchFieldTicketData();
                    }}
                />
            }
            {viewInvoiceDialog.open && (
                <ViewInvoice
                    pageData={null}
                    invoiceData={{ ...viewInvoiceDialog.data, invoiceNumber: viewInvoiceDialog?.data?.invoice, _id: viewInvoiceDialog?.data?.invoiceId }}
                    estimateStartDate={null}
                    onClose={() => {
                        setViewInvoiceDialog({ open: false, data: null });
                    }}
                    onSuccess={() => {
                        setViewInvoiceDialog({ open: false, data: null });
                    }}
                />
            )}
        </Fragment>
    );
};

export default FieldTicketInvoice;
