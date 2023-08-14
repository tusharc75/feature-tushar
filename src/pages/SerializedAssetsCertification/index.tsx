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
  sidebarResource
} from '../../constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { useData } from '../../StateProvider/Provider';
import HtmlTooltip from '../../components/CustomTooltipTitle';
import useColumns, { getStaticFields, getFrameworkComponents, gridFilterParser } from '../../constants/useColumns';
import { prepareDataForGrid } from '../../constants/helpers';
import { camelCase } from 'lodash';
import WarningIcon from '@material-ui/icons/Warning';
import moment from 'moment';
import IssueCertificateDialog from './IssueCertificateDialog';
import CertificateHistoryDialog from './CertificateHistoryDialog';
import { isMobile, isTablet } from 'react-device-detect';
import SearchBox from 'src/components/Helpers/SearchBox';
import styles from '../Leads/Header.module.scss';
import DurationFilter from 'src/components/DurationFilter';
import NoteAddIcon from '@material-ui/icons/NoteAdd';
import HistoryIcon from '@material-ui/icons/History';
import { Autocomplete } from '@material-ui/lab';

const SerializedAssetsCertification = () => {
  const renderedFrom = camelCase(routes?.serializedAssetsCertification.title);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const toastConfig = useContext(CustomToastContext);
  const [issueCertificateDialog, setIssueCertificateDialog] = useState({ open: false, id: null });
  const [certificateHistoryDialog, setCertificateHistoryDialog] = useState({ open: false, id: null });
  const [gridApi, setGridApi] = useState(null);
  const [columns, setColumns] = useState(null);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
    state;
  const [assetOptions, setAssetOptions] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

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

  useEffect(() => {
    fetchData(true);
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, limit, filters, sorting, search, showFilteredRecordsOnly, issueDuration, expireDuration, selectedEntity]);

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
            e.cellStyle = (params) => {
              if ([ASSET_STATUS.lost, ASSET_STATUS.scrap, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert].includes(params?.data?.status)) {
                return { backgroundColor: COLOUR_MASTER.lostAssets.background };
              }
              return null;
            };
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

  const fetchData = (forAutocomplete = false, assetTerm = '') => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    const queryString = getQueryString(forAutocomplete, assetTerm);
    axiosInstance()
      .get(`${serializedAssetsCertification.api}${queryString}`)
      .then(({ data }) => {
        if (forAutocomplete) {
          setAssetOptions(data.data);
        }
        let rows = data.data?.map((u, user) => {
          let finalObject = prepareDataForGrid(u);
          const dateToQuery = moment().add(30, 'days').toDate();
          const certificateExpireDate = u.certificateExpireDate ? moment(u.certificateExpireDate).toDate() : null;
          finalObject['canIssueCertificate'] = !certificateExpireDate || certificateExpireDate <= dateToQuery;
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

  const getQueryString = (forAutocomplete = false, assetTerm = '') => {
    let deepFilter = `?page=${page}&limit=${limit}`;
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
    const updatedFilters = [];
    if (issueDuration?.from && issueDuration?.from) {
      updatedFilters.push({
        field: 'certificateIssueDate',
        term: {
          from: moment(issueDuration?.from).format('MM/DD/YYYY'),
          to: moment(issueDuration?.to).format('MM/DD/YYYY')
        }
      });
    }
    if (expireDuration?.from && expireDuration?.from) {
      updatedFilters.push({
        field: 'certificateExpireDate',
        term: {
          from: moment(expireDuration?.from).format('MM/DD/YYYY'),
          to: moment(expireDuration?.to).format('MM/DD/YYYY')
        }
      });
    }
    if (forAutocomplete && assetTerm) {
      updatedFilters.push({
        field: 'assetNumber',
        term: assetTerm
      });
    }
    if (updatedFilters?.length > 0) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURI(JSON.stringify(updatedFilters))}&filterType=and`;
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
    if (deepFilter !== '') {
      deepFilter = `${deepFilter}&filterType=and&filterByIdType=and`;
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
        <HtmlTooltip title="Issue Certificate">
          <IconButton
            size="small"
            aria-label="Issue"
            onClick={() => {
              setIssueCertificateDialog({ open: true, id: params?.data?._id });
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
          <div className="flex justify-between mb-4 sm:mb-5 flex-wrap gap-4">
            <div className="w-full min-[600px]:w-[250px]">
              <Autocomplete
                onInputChange={(event, value) => {
                  fetchData(true, value);
                }}
                onChange={(event, value) => {
                  fetchData(true, value);
                }}
                fullWidth
                options={assetOptions.map((option) => option.assetNumber)}
                loading={loadingAssets}
                getOptionLabel={(option) => option || ''}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={'Asset'}
                    variant="outlined"
                    size="small"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <Fragment>
                          {loadingAssets ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </Fragment>
                      )
                    }}
                  />
                )}
                style={{ minWidth: 250 }}
              />
            </div>

            <SearchBox onChange={handleSearch} className={styles.search_box_input} width={isMobile ? '200px' : '210px'} size="small" value={search} />
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <DurationFilter label={'Issue Date'} duration={issueDuration} setDuration={setIssueDuration} defaultTimeFrame="custom" />
            <DurationFilter label={'Expire Date'} duration={expireDuration} setDuration={setExpireDuration} defaultTimeFrame="custom" />
          </div>
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
          onClose={() => setIssueCertificateDialog({ open: false, id: null })}
          onSuccess={() => {
            setIssueCertificateDialog({ open: false, id: null });
            fetchData();
          }}
          assetId={issueCertificateDialog?.id}
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
