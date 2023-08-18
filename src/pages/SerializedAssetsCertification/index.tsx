import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import { Box, CircularProgress, IconButton, TextField } from '@material-ui/core';
import routes from '../../components/Helpers/Routes';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import {
  serializedAssetsCertification,
  serializedAsset,
  gridLoadingTimeout,
  ASSET_STATUS,
  COLOUR_MASTER,
  getLocalStorageArrayData,
  sidebarResource,
  dateFormatForInputControl
} from '../../constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { useData } from '../../StateProvider/Provider';
import HtmlTooltip from '../../components/CustomTooltipTitle';
import useColumns, { getStaticFields, getFrameworkComponents, gridFilterParser } from '../../constants/useColumns';
import { prepareDataForGrid } from '../../constants/helpers';
import { camelCase } from 'lodash';
import moment from 'moment';
import IssueCertificateDialog from './IssueCertificateDialog';
import CertificateHistoryDialog from './CertificateHistoryDialog';
import { isMobile, isTablet } from 'react-device-detect';
import SearchBox from 'src/components/Helpers/SearchBox';
import styles from '../Leads/Header.module.scss';
import NoteAddIcon from '@material-ui/icons/NoteAdd';
import HistoryIcon from '@material-ui/icons/History';
import { Autocomplete } from '@material-ui/lab';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';

const SerializedAssetsCertification = () => {
  const renderedFrom = camelCase(routes?.serializedAssetsCertification.title);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const toastConfig = useContext(CustomToastContext);
  const [issueCertificateDialog, setIssueCertificateDialog] = useState({ open: false, id: null, certificateExpiryDate: null });
  const [certificateHistoryDialog, setCertificateHistoryDialog] = useState({ open: false, id: null });
  const [gridApi, setGridApi] = useState(null);
  const [columns, setColumns] = useState(null);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
    state;

  const [assetOptions, setAssetOptions] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const [issueDuration, setIssueDuration] = useState({
    from: null,
    to: null
  });

  const [expireDuration, setExpireDuration] = useState({
    from: null,
    to: null
  });

  const {
    state: { permissions, user, selectedEntity }
  }: any = useData();
  const { getColumnData } = useColumns();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchAssetsOption = () => {
    axiosInstance()
      .get(`${serializedAssetsCertification.api}/asset`)
      .then(({ data }) => {
        setAssetOptions(data?.data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  useEffect(() => {
    fetchAssetsOption();
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, limit, filters, sorting, search, showFilteredRecordsOnly, issueDuration, expireDuration, selectedEntity, selectedAsset]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${serializedAsset.resource}`)
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.serializedAssetDetail.path);
          if (currentColumn !== null) {
            columns = [...columns, currentColumn?.columnData];
            if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
              rendererNames.push(currentColumn?.rendererName);
            }
          }
        });
        columns?.forEach((e) => {
          if (e.field === 'assetNumber') {
            e.cellRenderer = 'assetNumberRenderer';
          }
        });
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
          ...tempFrameworkComponent,
          assetNumberRenderer: AssetNumberRenderer,
          actionsRenderer: ActionsRenderer
        };
        setFrameWorkComponent({ ...tempFrameworkComponent });
        columns = [...columns, ...getStaticFields()];
        setColumns([...columns]);
      });
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    const queryString = getQueryString();
    axiosInstance()
      .get(`${serializedAssetsCertification.api}${queryString}`)
      .then(({ data }) => {
        let rows = data.data?.map((u, user) => {
          let finalObject = prepareDataForGrid(u);
          const dateToQuery = moment().add(30, 'days').toDate();
          const certificateExpiryDate = u.certificateExpiryDate ? moment(u.certificateExpiryDate).toDate() : null;
          finalObject['canIssueCertificate'] = !certificateExpiryDate || certificateExpiryDate <= dateToQuery;
          finalObject['isChecked'] = [...getLocalStorageArrayData(localStorageSelectedRecords)].some((s) => s._id === u._id);
          return {
            ...finalObject
          };
        });
        if (appendRows) {
          dispatch({
            type: 'initialize',
            data: [...dataRows, ...rows],
            count: data.data.count,
            selectedRecords: [...dataRows, ...rows].filter((f) => f.isChecked === true)
          });
        } else {
          dispatch({
            type: 'initialize',
            data: rows,
            count: data.count,
            selectedRecords: rows.filter((f) => f.isChecked === true)
          });
        }
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (issueDuration?.from && issueDuration?.from) {
      deepFilters.push({
        field: 'certificateIssueDate',
        term: {
          from: moment(issueDuration?.from).format('MM/DD/YYYY'),
          to: moment(issueDuration?.to).format('MM/DD/YYYY')
        }
      });
    }
    if (expireDuration?.from && expireDuration?.from) {
      deepFilters.push({
        field: 'certificateExpiryDate',
        term: {
          from: moment(expireDuration?.from).format('MM/DD/YYYY'),
          to: moment(expireDuration?.to).format('MM/DD/YYYY')
        }
      });
    }
    if (selectedAsset) {
      deepFilters.push({
        field: 'assetNumber',
        term: selectedAsset.optionLabel
      });
    }

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
      const savedRecords = [...getLocalStorageArrayData(localStorageSelectedRecords)];
      deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
    }

    return deepFilter;
  };

  const AssetNumberRenderer = (params) => (
    <Fragment>
      <p className="text-truncate">{params.value}</p>
    </Fragment>
  );

  const ActionsRenderer = (params) => (
    <>
      {params?.data?.canIssueCertificate && (
        <HtmlTooltip title="Attach Certificate">
          <IconButton
            size="small"
            aria-label="Issue"
            onClick={() => {
              setIssueCertificateDialog({
                open: true,
                id: params?.data?._id,
                certificateExpiryDate: params?.data?.certificateExpiryDate || null
              });
            }}
          >
            <NoteAddIcon color="primary" />
          </IconButton>
        </HtmlTooltip>
      )}
      <HtmlTooltip title="Certificate History">
        <IconButton
          size="small"
          aria-label="View"
          onClick={() => {
            setCertificateHistoryDialog({ open: true, id: params?.data?._id });
          }}
        >
          <HistoryIcon color="primary" />
        </IconButton>
      </HtmlTooltip>
    </>
  );

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[routes.serializedAssetsCertification]} />
        </Grid>
      </Grid>
      <div className="main-container">
        <div className="header-panel">
          <Grid container justifyContent="space-between" spacing={2}>
            <Grid item md={10}>
              <Grid container spacing={1}>
                <Grid item md={3}>
                  <Autocomplete
                    onChange={(event, value) => {
                      setSelectedAsset(value);
                    }}
                    fullWidth
                    options={assetOptions}
                    getOptionSelected={(option, val) => (option ? option.optionLabel === val.optionLabel : false)}
                    getOptionLabel={(option) => option.optionLabel}
                    size="small"
                    renderInput={(params) => <TextField {...params} label={'Asset'} variant="outlined" size="small" />}
                  />
                </Grid>
                <Grid item md={9}>
                  <MuiPickersUtilsProvider utils={DateFnsUtils}>
                    <Grid container spacing={1}>
                      <Grid item md={3}>
                        <KeyboardDatePicker
                          inputVariant="outlined"
                          variant="inline"
                          fullWidth
                          size="small"
                          format={dateFormatForInputControl}
                          maxDate={issueDuration.to}
                          label="From (Issue Date)"
                          autoOk
                          InputLabelProps={{
                            shrink: true
                          }}
                          views={['year', 'month', 'date']}
                          value={issueDuration.from}
                          onChange={(date) => {
                            setIssueDuration({ to: issueDuration.to, from: date });
                          }}
                        />
                      </Grid>
                      <Grid item md={3}>
                        <KeyboardDatePicker
                          inputVariant="outlined"
                          variant="inline"
                          fullWidth
                          size="small"
                          format={dateFormatForInputControl}
                          label="To (Issue Date)"
                          autoOk
                          InputLabelProps={{
                            shrink: true
                          }}
                          views={['year', 'month', 'date']}
                          value={issueDuration.to}
                          onChange={(date) => {
                            setIssueDuration({ from: issueDuration.from, to: date });
                          }}
                        />
                      </Grid>
                      <Grid item md={3}>
                        <KeyboardDatePicker
                          inputVariant="outlined"
                          variant="inline"
                          fullWidth
                          size="small"
                          format={dateFormatForInputControl}
                          maxDate={expireDuration.to}
                          label="From (Expiry Date)"
                          autoOk
                          InputLabelProps={{
                            shrink: true
                          }}
                          views={['year', 'month', 'date']}
                          value={expireDuration.from}
                          onChange={(date) => {
                            setExpireDuration({ to: expireDuration.to, from: date });
                          }}
                        />
                      </Grid>
                      <Grid item md={3}>
                        <KeyboardDatePicker
                          inputVariant="outlined"
                          variant="inline"
                          fullWidth
                          size="small"
                          format={dateFormatForInputControl}
                          label="To (Expiry Date)"
                          autoOk
                          InputLabelProps={{
                            shrink: true
                          }}
                          views={['year', 'month', 'date']}
                          value={expireDuration.to}
                          onChange={(date) => {
                            setExpireDuration({ from: expireDuration.from, to: date });
                          }}
                        />
                      </Grid>
                    </Grid>
                  </MuiPickersUtilsProvider>
                </Grid>
              </Grid>
            </Grid>
            <Grid item md={2} style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <SearchBox
                onChange={handleSearch}
                className={styles.search_box_input}
                width={isMobile ? '200px' : '210px'}
                size="small"
                value={search}
              />
            </Grid>
          </Grid>
        </div>
        {columns ? (
          Object.keys(frameWorkComponent).length > 0 && columns ? (
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
              actionWidth={150}
              loading={loading}
              renderedFrom={renderedFrom}
              refreshGrid={fetchData}
              showOnlyShowFilteredRecordSwitch={false}
              showFilters={true}
              resource={sidebarResource.serializedAsset}
              allowSelection={false}
            />
          ) : null
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </div>
      {issueCertificateDialog?.open && (
        <IssueCertificateDialog
          onClose={() => setIssueCertificateDialog({ open: false, id: null, certificateExpiryDate: null })}
          onSuccess={() => {
            setIssueCertificateDialog({ open: false, id: null, certificateExpiryDate: null });
            fetchData();
          }}
          assetId={issueCertificateDialog?.id}
          certificateExpiryDate={issueCertificateDialog.certificateExpiryDate}
        />
      )}
      {certificateHistoryDialog?.open && (
        <CertificateHistoryDialog
          onClose={() => setCertificateHistoryDialog({ open: false, id: null })}
          id={certificateHistoryDialog?.id}
          supplierAccount={user?.user?.supplierAccountId}
        />
      )}
    </Fragment>
  );
};

export default SerializedAssetsCertification;
