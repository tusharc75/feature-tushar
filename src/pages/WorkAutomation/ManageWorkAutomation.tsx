import { Fragment, useContext, useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Collapse, Grid, IconButton } from '@material-ui/core';
import { ExpandMore, ExpandLess } from '@material-ui/icons';
import { ASSET_STATUS, gridLoadingTimeout, MATERIAL_TYPE, prepareDataForGrid, rentalManagement, sidebarResource } from 'src/constants/helpers';
import routes from 'src/components/Helpers/Routes';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { useHistory, useParams } from 'react-router-dom';
import axios, { CancelTokenSource } from 'axios';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { camelCase } from 'lodash';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomButton from 'src/components/Helpers/CustomButton';

const ManageWorkAutomation = () => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { resources }
  }: any = useData();

  const [rentalManagementData, setRentalManagementData] = useState(null);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedTechnicians, setSelectedTechnicians] = useState([]);
  const [isExpand, setIsExpand] = useState({ asset: false, service: false, technician: false });
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const { id } = useParams();

  useEffect(() => {
    axiosInstance()
      .get(`${rentalManagement.api}/${id}`)
      .then(({ data: { data } }) => {
        setRentalManagementData(data);
        setIsExpand({ asset: true, service: false, technician: false });
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        toastConfig.setToastConfig(error);
      });
  }, []);

  const handleSave = (technicians) => {
    setLoading(true);
    const values = {
      assets: selectedAssets || [],
      services: selectedServices || [],
      technicians: technicians || []
    };
    axiosInstance()
      .post(`${rentalManagement.api}/workAutomation/${rentalManagementData?._id}`, values)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        history.push(`${routes.rentalManagementDetail?.path}/${rentalManagementData?._id}`);
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Fragment>
      <Box className="main-container-v1">
        <Box className="headerbox-v1">
          <Box className="nav-v1">
            <CustomBreadCrumbs
              routes={[routes.workAutomation, { title: rentalManagementData ? rentalManagementData?.rentalJobName : '' }]}
              onBreadCrumbClick={(path) => {
                history.push(path);
              }}
            />
          </Box>
        </Box>
        {rentalManagementData ? (
          <Box className={`detail-container-v1`}>
            <div className="mt-2 flex w-full flex-col gap-6">
              <div>
                <AddSerializedAsset
                  rentalManagementData={rentalManagementData}
                  setSelectedAssets={setSelectedAssets}
                  selectedAssets={selectedAssets}
                  isExpand={isExpand}
                  setIsExpand={setIsExpand}
                  resources={resources}
                />
              </div>
              <div>
                <AddServices
                  rentalManagementData={rentalManagementData}
                  setSelectedServices={setSelectedServices}
                  selectedAssets={selectedAssets}
                  isExpand={isExpand}
                  setIsExpand={setIsExpand}
                />
              </div>
              <div>
                <AddTechnicians
                  rentalManagementData={rentalManagementData}
                  selectedServices={selectedServices}
                  setSelectedTechnicians={setSelectedTechnicians}
                  isExpand={isExpand}
                  setIsExpand={setIsExpand}
                  handleSave={handleSave}
                  loading={loading}
                  resources={resources}
                />
              </div>
            </div>
          </Box>
        ) : (
          <Grid container spacing={2} style={{ padding: '8px' }}>
            <CommonSkeleton lenArray={[...Array(7).keys()]} />
          </Grid>
        )}
      </Box>
    </Fragment>
  );
};

export default ManageWorkAutomation;

const AddSerializedAsset = ({ rentalManagementData, setSelectedAssets, selectedAssets, isExpand, setIsExpand, resources }) => {
  const [records, setRecords] = useState(null);
  const handleAdd = () => {
    const tempMaterial = records?.map((e) => {
      return {
        asset: e?._id
      };
    });
    setIsExpand({ asset: false, service: true, technician: false });
    setSelectedAssets(tempMaterial);
  };
  const disabled = !rentalManagementData;
  return (
    <>
      <div className={`'bg-[var(--dark-secondary,white)] rounded-[5px] [border:1px_solid_var(--common-border-color)]`}>
        <div className="flex items-center justify-between p-4 ">
          <h3 className="line-clamp-2 font-semibold md:line-clamp-1">{`Add ${resources?.serializedAsset?.titleSingular}`}</h3>
          {/* <div className="flex min-w-fit gap-3">
            <IconButton size="small" disabled={!rentalManagementData} onClick={() => {}}>
              {isExpand.asset ? (
                <ExpandLess fontSize="small" color={disabled ? 'disabled' : 'primary'} />
              ) : (
                <ExpandMore fontSize="small" color={disabled ? 'disabled' : 'primary'} />
              )}
            </IconButton>
          </div> */}
        </div>
        <Collapse in={isExpand.asset}>
          <div className="flex flex-col gap-2 p-3 [border-top:1px_solid_var(--common-border-color)]">
            <RenderTable
              resource={sidebarResource.serializedAsset}
              warehouse={rentalManagementData?.warehouse?.optionValue}
              setRecords={setRecords}
            />
            <div className="flex justify-end">
              <Button disabled={!records?.length} variant="contained" size="small" color="primary" onClick={() => handleAdd()}>
                Save & Next
              </Button>
            </div>
          </div>
        </Collapse>
      </div>
    </>
  );
};

const AddServices = ({ rentalManagementData, setSelectedServices, selectedAssets, isExpand, setIsExpand }) => {
  const [records, setRecords] = useState(null);

  const handleAdd = () => {
    const tempMaterial = records?.map((e) => e?._id) || [];
    setIsExpand({ asset: false, service: false, technician: true });
    setSelectedServices(tempMaterial);
  };

  return (
    <>
      <div className={`'bg-[var(--dark-secondary,white)] rounded-[5px] [border:1px_solid_var(--common-border-color)]`}>
        <div className="flex items-center justify-between p-4">
          <h3 className="line-clamp-2 font-semibold md:line-clamp-1">{`Add Services`}</h3>
          {/* <div className="flex min-w-fit gap-3">
            <IconButton size="small" disabled={true} onClick={() => {}}>
              {isExpand.service ? <ExpandLess fontSize="small" color={'disabled'} /> : <ExpandMore fontSize="small" color={'disabled'} />}
            </IconButton>
          </div> */}
        </div>
        <Collapse in={isExpand.service}>
          <div className="flex flex-col gap-2 p-3 [border-top:1px_solid_var(--common-border-color)]">
            {selectedAssets?.length ? (
              <RenderTable
                resource={sidebarResource.serviceMaster}
                warehouse={rentalManagementData?.warehouse?.optionValue}
                setRecords={setRecords}
              />
            ) : null}
            <div className="flex justify-end gap-2">
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                onClick={() => setIsExpand({ asset: true, service: false, technician: false })}
              >
                Back
              </Button>
              <Button disabled={false} variant="contained" size="small" color="primary" onClick={() => handleAdd()}>
                Save & Next
              </Button>
            </div>
          </div>
        </Collapse>
      </div>
    </>
  );
};

const AddTechnicians = ({ rentalManagementData, setSelectedTechnicians, selectedServices, isExpand, setIsExpand, handleSave, loading, resources }) => {
  const [records, setRecords] = useState(null);

  const handleAdd = () => {
    const tempMaterial = records?.map((e) => e?._id) || [];
    setIsExpand({ asset: false, service: false, technician: true });
    setSelectedTechnicians(tempMaterial);
    handleSave(tempMaterial);
  };

  useEffect(() => {
    if (!selectedServices?.length) {
      setSelectedTechnicians([]);
      setRecords([]);
    }
  }, [selectedServices]);

  return (
    <>
      <div className={`'bg-[var(--dark-secondary,white)] rounded-[5px] [border:1px_solid_var(--common-border-color)]`}>
        <div className="flex items-center justify-between p-4">
          <h3 className="line-clamp-2 font-semibold md:line-clamp-1">{`Add ${resources?.employeeMaster?.titlePlural}`}</h3>
          {/* <div className="flex min-w-fit gap-3">
            <IconButton size="small" disabled={true} onClick={() => {}}>
              {isExpand.technician ? <ExpandLess fontSize="small" color={'disabled'} /> : <ExpandMore fontSize="small" color={'disabled'} />}
            </IconButton>
          </div> */}
        </div>
        <Collapse in={isExpand.technician}>
          <div className="flex flex-col gap-2 p-3 [border-top:1px_solid_var(--common-border-color)]">
            {selectedServices?.length ? (
              <RenderTable
                resource={sidebarResource.employeeMaster}
                warehouse={rentalManagementData?.warehouse?.optionValue}
                setRecords={setRecords}
              />
            ) : null}
            <div className="flex justify-end gap-2">
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                onClick={() => setIsExpand({ asset: false, service: true, technician: false })}
              >
                Back
              </Button>
              <CustomButton
                disabled={false}
                variant="contained"
                size="small"
                color="primary"
                startIcon={loading && <CircularProgress size={20} color="inherit" />}
                onClick={() => {
                  handleAdd();
                }}
              >
                Save
              </CustomButton>
            </div>
          </div>
        </Collapse>
      </div>
    </>
  );
};

const RenderTable = ({ resource, warehouse, setRecords }) => {
  const renderedFrom = `${sidebarResource?.workAutomation}_${resource}`;
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, filters, sorting, selectedRecords } = state;
  const { generateColumns } = useColumns();
  const [columns, setColumns] = useState(null);
  const {
    state: { user, permissions }
  }: any = useData();
  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, filters, sorting]);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setRecords(selectedRecords);
  }, [selectedRecords]);

  const fetchGridColumns = async () => {
    axiosInstance()
      .get(`/field?resource=${resource}`)
      .then(({ data: { data } }) => {
        let newColumns = generateColumns(renderedFrom, data, routes.serializedAssetDetail.path, true);

        setColumns([...newColumns, ...getStaticFields()]);
      });
  };

  const fetchData = (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    axiosInstance()
      .get(`${routes[camelCase(resource)]?.path}${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data, count } }) => {
        if (resource === sidebarResource.employeeMaster) {
          data = data.data;
          count = data.count;
        }
        let rows = data.map((u) => {
          let finalObject: any = prepareDataForGrid(u);
          finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
          finalObject['canDelete'] = permissions?.serializedAsset?.isDelete && ![ASSET_STATUS.available]?.includes(u?.status) ? false : true;
          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows, count: count });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => {
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = !isExport ? `?page=${page}&limit=${limit}` : '?';

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (warehouse && resource !== sidebarResource.serviceMaster) {
      filterByIds.push({ field: 'warehouse', term: warehouse });
    }
    if (resource === sidebarResource.serializedAsset) {
      deepFilters.push({ field: 'status', term: ASSET_STATUS.available });
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
    return `${deepFilter}&filterType=and&filterByIdType=and`;
  };

  return (
    <>
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 393px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          refreshGrid={fetchData}
          resource={sidebarResource.serializedAsset}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </>
  );
};
