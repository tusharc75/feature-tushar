import DateFnsUtils from '@date-io/date-fns';
import { Box, IconButton, TextField } from '@mui/material';
import Grid from '@mui/material/Grid';
import HistoryIcon from '@mui/icons-material/History';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import Autocomplete from '@mui/material/Autocomplete';
import { camelCase } from 'lodash';
import moment from 'moment';
import { Fragment, useContext, useEffect, useState } from 'react';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import SearchBox from 'src/components/Helpers/SearchBox';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import HtmlTooltip from '../../components/CustomTooltipTitle';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import routes from '../../components/Helpers/Routes';
import {
  CHILD_RESOURCE,
  displayDate,
  gridLoadingTimeout,
  prepareDataForGrid,
  serializedAsset,
  serializedAssetsCertification,
  sidebarResource
} from '../../constants/helpers';
import CertificateHistoryDialog from './CertificateHistoryDialog';
import IssueCertificateDialog from './IssueCertificateDialog';
import axios, { CancelTokenSource } from 'axios';
import CustomDatePicker from 'src/components/CustomDatePicker';

const renderedFrom = camelCase(CHILD_RESOURCE?.serializedAssetsCertification);

const SerializedAssetsCertification = () => {
  const toastConfig = useContext(CustomToastContext);
  const [issueCertificateDialog, setIssueCertificateDialog] = useState({ open: false, id: null, certificateExpiryDate: null });
  const [certificateHistoryDialog, setCertificateHistoryDialog] = useState({ open: false, id: null });
  const [columns, setColumns] = useState(null);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

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
    state: { permissions, user, selectedEntity, resources }
  }: any = useData();

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
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [search, page, limit, filters, sorting, showFilteredRecordsOnly, issueDuration, expireDuration, selectedEntity, selectedAsset]);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${serializedAsset.resource}`);
    data = response?.data?.data;
    let newColumns = generateColumns(renderedFrom, data, routes.serializedAssetDetail.path, true);
    setColumns([...newColumns, ...getStaticFields(), ActionsRenderer]);
  };

  const fetchData = (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${serializedAssetsCertification.api}${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data }) => {
        let rows = data?.data?.map((u, user) => {
          let finalObject = prepareDataForGrid(u, user);
          const dateToQuery = moment().add(30, 'days').toDate();
          const certificateExpiryDate = u.certificateExpiryDate ? moment(u.certificateExpiryDate).toDate() : null;
          finalObject['canIssueCertificate'] = !certificateExpiryDate || certificateExpiryDate <= dateToQuery;
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows, count: rows?.length });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      })
      .finally(() => {
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (isExport) {
      deepFilter = `?`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (issueDuration?.from && issueDuration?.from) {
      deepFilters.push({
        field: 'certificateIssueDate',
        term: {
          from: displayDate(issueDuration?.from),
          to: displayDate(issueDuration?.to)
        }
      });
    }
    if (expireDuration?.from && expireDuration?.from) {
      deepFilters.push({
        field: 'certificateExpiryDate',
        term: {
          from: displayDate(expireDuration?.from),
          to: displayDate(expireDuration?.to)
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
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
    }

    if (filterByIds?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }

    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }

    return deepFilter;
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 100,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        {row?.original?.canIssueCertificate && (
          <HtmlTooltip title="Attach Certificate">
            <IconButton
              size="small"
              aria-label="Issue"
              onClick={() => {
                setIssueCertificateDialog({
                  open: true,
                  id: row?.original?._id,
                  certificateExpiryDate: row?.original?.certificateExpiryDate || null
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
              setCertificateHistoryDialog({ open: true, id: row?.original?._id });
            }}
          >
            <HistoryIcon color="primary" />
          </IconButton>
        </HtmlTooltip>
      </>
    )
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[{ ...routes.serializedAssetsCertification, title: resources?.serializedAssetsCertification?.titlePlural }]} />
        </Grid>
      </Grid>
      <div className="main-container">
        <div className="header-panel">
          <div className="grid grid-cols-1 gap-x-2 gap-y-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            <Autocomplete
              onChange={(event, value) => {
                setSelectedAsset(value);
              }}
              fullWidth
              options={assetOptions}
              isOptionEqualToValue={(option, val) => (option ? option.optionLabel === val.optionLabel : false)}
              getOptionLabel={(option) => option.optionLabel}
              size="small"
              renderInput={(params) => <TextField {...params} label={'Asset'} variant="outlined" size="small" />}
            />
            <CustomDatePicker
              fullWidth
              size="small"
              maxDate={issueDuration.to}
              label="From (Issue Date)"
              value={issueDuration.from}
              onChange={(date) => {
                setIssueDuration({ to: issueDuration.to, from: date });
              }}
              InputProps={{
                style: { minHeight: '38px' }
              }}
            />
            <CustomDatePicker
              inputVariant="outlined"
              variant="inline"
              fullWidth
              size="small"
              label="To (Issue Date)"
              value={issueDuration.to}
              onChange={(date) => {
                setIssueDuration({ from: issueDuration.from, to: date });
              }}
              InputProps={{
                style: { minHeight: '38px' }
              }}
            />
            <CustomDatePicker
              fullWidth
              size="small"
              maxDate={expireDuration.to}
              label="From (Expiry Date)"
              value={expireDuration.from}
              onChange={(date) => {
                setExpireDuration({ to: expireDuration.to, from: date });
              }}
              InputProps={{
                style: { minHeight: '38px' }
              }}
            />
            <CustomDatePicker
              fullWidth
              size="small"
              label="To (Expiry Date)"
              value={expireDuration.to}
              onChange={(date) => {
                setExpireDuration({ from: expireDuration.from, to: date });
              }}
              InputProps={{
                style: { minHeight: '38px' }
              }}
            />
            <SearchBox onChange={handleSearch} width={'150px'} value={search} />
          </div>
        </div>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={false}
            showFilters={true}
            resource={sidebarResource.serializedAsset}
          />
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
