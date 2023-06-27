import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import { Box, Button, Chip, Menu, MenuItem, TextField } from '@material-ui/core';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
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
} from '../../constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { useData } from '../../StateProvider/Provider';
import HtmlTooltip from '../../components/CustomTooltipTitle';
import useColumns, { getStaticFields, getFrameworkComponents, gridFilterParser } from '../../constants/useColumns';
import { prepareDataForGrid } from '../../constants/helpers';
import { camelCase } from 'lodash';
import { Link } from 'react-router-dom';
import WarningIcon from '@material-ui/icons/Warning';
import moment from 'moment';
import IssueCertificateDialog from './IssueCertificateDialog';
import { Autocomplete } from '@material-ui/lab';
import CertificateHistoryDialog from './CertificateHistoryDialog';

const SerializedAssetsCertification = () => {

  const renderedFrom = camelCase(routes?.serializedAssetsCertification.title);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const toastConfig = useContext(CustomToastContext);
  const [openDialog, setOpenDialog] = useState({open: false, id: null})
  const [gridApi, setGridApi] = useState(null);
  const [columns, setColumns] = useState(null);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
    state;
  const [certificateStatus, setCertificateStatus] = useState<{_id: string, name: string}>({ _id: "Pending", name: "Pending" });

  const {
    state: { permissions, user }
  }: any = useData();
  const { getColumnData } = useColumns();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchProductInventory();
  }, [page, limit, filters, sorting, search, showFilteredRecordsOnly, certificateStatus]);

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
              if (
                [ASSET_STATUS.lost, ASSET_STATUS.scrap, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert].includes(
                  params?.data?.status
                )
              ) {
                return { backgroundColor: COLOUR_MASTER.lostAssets.background };
              }
              return null;
            };
          }
        });

        columns.push({ field: 'ownerType', headerName: 'Actual Owner Type', show: true, disabled: true, cellRenderer: 'commonRenderer' });
        columns.push({ field: 'owner', headerName: 'Actual Owner', show: true, disabled: true, cellRenderer: 'commonRenderer' });

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

  const fetchProductInventory = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }

    axiosInstance()
      .get(`${serializedAssetsCertification.api}?certificateStatus=${certificateStatus.name}`)
      .then(({ data }) => {
        let rows = data.data?.map((u, user) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['canDelete'] = permissions?.serializedAsset?.isDelete;
          finalObject['isChecked'] = [...getLocalStorageArrayData(localStorageSelectedRecords)].some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions?.serializedAsset.isUpdate;
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

  const AssetNumberRenderer = (params) => (
     <Fragment>
      <p 
      className="link text-truncate" 
      onClick={() => {
        setOpenDialog({open: true, id: params?.data?._id})
      }}>
        {params.value}
      </p>
      {params.data?.recertDate && new Date(params.data?.recertDate)?.getTime() <= new Date()?.getTime() && (
        <Box ml={1} pt={1}>
          <HtmlTooltip title="Asset needs to be recert">
            <WarningIcon style={{ fontSize: '14px' }} fontSize="small" color="error" />
          </HtmlTooltip>
        </Box>
      )}
    </Fragment>
  );

  const ActionsRenderer = (params) => (
    <>
    </>
  );


  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[routes.serializedAssetsCertification]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>

        </Grid>
      </Grid>
      <div className="main-container">
        <div className="header-panel">
        <Autocomplete
          style={{ width: '250px' }}
          options={[{ _id: "Pending", name: "Pending" },{ _id: "Completed", name: "Completed" }]}
          getOptionLabel={(option: any) => (option ? option.name : '')}
          getOptionSelected={(option: any, val) => option._id === val._id}
          value={certificateStatus}
          onChange={(e, val) => {
            setCertificateStatus(val ? val : { _id: "Pending", name: "Pending" });
          }}
          renderInput={(params) => (
            <TextField {...params} margin="dense" name="certificateStatus" label="Certificate Status" variant="outlined" fullWidth />
          )}
        />
        </div>
        {columns ? (Object.keys(frameWorkComponent).length > 0 && columns ? (
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
            refreshGrid={fetchProductInventory}
            showOnlyShowFilteredRecordSwitch={true}
            rowClassRules={{
              'light-red-data-row': function (params) {
                if (params.data?.recertDate) {
                  var a = moment(params.data?.recertDate);
                  var b = moment();
                  const days = a.diff(b, 'days');
                  if (days < 15 && days >= 0) {
                    return true;
                  } else if (days < 0) {
                    return true;
                  }
                }
                return false;
              },
              'light-yellow-data-row': function (params) {
                if (params.data?.recertDate) {
                  var a = moment(params.data?.recertDate);
                  var b = moment();
                  const days = a.diff(b, 'days');
                  if (days < 30 && days >= 15) {
                    return true;
                  }
                }
                return false;
              },
              'light-green-data-row': function (params) {
                if (params.data?.recertDate) {
                  var a = moment(params.data?.recertDate);
                  var b = moment();
                  const days = a.diff(b, 'days');
                  if (days <= 60 && days >= 30) {
                    return true;
                  }
                }
                return false;
              }
            }}
            showFilters={true}
            resource={sidebarResource.serializedAsset}
          />
        ) : null
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </div>
      {openDialog?.open && certificateStatus._id === "Pending" && (
        <IssueCertificateDialog 
        onClose={()=>  setOpenDialog({open: false, id: null})}
        onSuccess={()=>{
          setOpenDialog({open: false, id: null});
          fetchProductInventory()
        }}
        assetId={openDialog?.id}
        />
      )}
      {openDialog?.open && certificateStatus._id === "Completed" && (
        <CertificateHistoryDialog 
        onClose={()=>  setOpenDialog({open: false, id: null})}
        id={openDialog?.id}
        />
      )}
    </Fragment>
  );
};

export default SerializedAssetsCertification;
