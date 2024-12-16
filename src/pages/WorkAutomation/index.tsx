import { Fragment, useContext, useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Collapse } from '@material-ui/core';
import {
  ASSET_STATUS,
  GenerateResourceLineNumber,
  getObjKeys,
  gridLoadingTimeout,
  prepareDataForGrid,
  rentalManagement,
  sidebarResource,
  yupSchema
} from 'src/constants/helpers';
import routes from 'src/components/Helpers/Routes';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { useHistory } from 'react-router-dom';
import axios, { CancelTokenSource } from 'axios';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { camelCase } from 'lodash';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomButton from 'src/components/Helpers/CustomButton';
import { Form, Formik } from 'formik';
import InputField from 'src/components/Helpers/InputField';
import { BooleanLocale } from 'yup/lib/locale';

const ACCORDION_TYPE = {
  asset: 'asset',
  service: 'service',
  technician: 'technician',
  customerInfo: 'customerInfo'
}

const initialState: any = {
  asset: false,
  service: false,
  technician: false,
  customerInfo: false
};

const WorkAutomation = () => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { resources }
  }: any = useData();

  const [selectedAssets, setSelectedAssets] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedTechnicians, setSelectedTechnicians] = useState([]);
  const [isExpand, setIsExpand] = useState({ ...initialState, asset: true });
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  const handleOpen = (key: string) => {
    setIsExpand({ ...initialState, [key]: true });
  };

  const handleSave = (values) => {
    setLoading(true);
    const materialData = {
      assets: selectedAssets?.filter((s) => s?.warehouseId === values?.warehouse)?.map((a) =>{ return {
        asset: a?._id 
    }}) || [],
      services: selectedServices?.map((s) => s._id) || [],
      technicians: selectedTechnicians?.filter((s) => s?.warehouseId === values?.warehouse)?.map((a) => a?._id) || []
    };
    axiosInstance()
      .post(`${rentalManagement.api}/workAutomation`, { ...values, materialData })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        history.push(`${routes.rentalManagementDetail?.path}/${data?.data?._id}`);
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
            <CustomBreadCrumbs routes={[{ ...routes.workAutomation, title: resources?.workAutomation?.titleSingular }]} />
          </Box>
        </Box>
          <Box className={`detail-container-v1`}>
            <div className="mt-2 flex w-full flex-col gap-6">
              <div>
                <AddSerializedAsset
                  setSelectedAssets={setSelectedAssets}
                  isExpand={isExpand}
                  resources={resources}
                  handleOpen={handleOpen}
                />
              </div>
              <div>
                <AddServices
                  setSelectedServices={setSelectedServices}
                  selectedAssets={selectedAssets}
                  isExpand={isExpand}
                  handleOpen={handleOpen}
                />
              </div>
              <div>
                <AddTechnicians
                  selectedServices={selectedServices}
                  setSelectedTechnicians={setSelectedTechnicians}
                  isExpand={isExpand}
                  resources={resources}
                  handleOpen={handleOpen}
                />
              </div>
              <div>
                <AddCustomerInformation isExpand={isExpand} handleSave={handleSave} loading={loading} handleOpen={handleOpen} />
              </div>
            </div>
          </Box>
      </Box>
    </Fragment>
  );
};

export default WorkAutomation;

const AddSerializedAsset = ({ setSelectedAssets, isExpand, resources, handleOpen }) => {
  const [records, setRecords] = useState(null);
  const handleAdd = () => {
    handleOpen(ACCORDION_TYPE.service);
    setSelectedAssets(records);
  };

  return (
    <>
      <div className={`'bg-[var(--dark-secondary,white)] rounded-[5px] [border:1px_solid_var(--common-border-color)]`}>
        <div className="flex items-center justify-between p-4 ">
          <h3 className="line-clamp-2 font-semibold md:line-clamp-1">{`Add ${resources?.serializedAsset?.titlePlural}`}</h3>
        </div>
        <Collapse in={isExpand.asset}>
          <div className="flex flex-col gap-2 p-3 [border-top:1px_solid_var(--common-border-color)]">
            <RenderTable key={ACCORDION_TYPE.asset} resource={sidebarResource.serializedAsset} setRecords={setRecords} />
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

const AddServices = ({ setSelectedServices, selectedAssets, isExpand, handleOpen }) => {
  const [records, setRecords] = useState(null);

  const handleAdd = () => {
    handleOpen(ACCORDION_TYPE.technician);
    setSelectedServices(records);
  };

  return (
    <>
      <div className={`'bg-[var(--dark-secondary,white)] rounded-[5px] [border:1px_solid_var(--common-border-color)]`}>
        <div className="flex items-center justify-between p-4">
          <h3 className="line-clamp-2 font-semibold md:line-clamp-1">{`Add Services`}</h3>
        </div>
        <Collapse in={isExpand.service}>
          <div className="flex flex-col gap-2 p-3 [border-top:1px_solid_var(--common-border-color)]">
            {selectedAssets?.length ? <RenderTable key={ACCORDION_TYPE.service} resource={sidebarResource.serviceMaster} setRecords={setRecords} /> : null}
            <div className="flex justify-end gap-2">
              <Button variant="outlined" color="secondary" size="small" onClick={() => handleOpen(ACCORDION_TYPE.asset)}>
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

const AddTechnicians = ({ setSelectedTechnicians, selectedServices, isExpand, resources, handleOpen }) => {
  const [records, setRecords] = useState(null);

  const handleAdd = () => {
    setSelectedTechnicians(records);
    handleOpen(ACCORDION_TYPE.customerInfo);
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
        </div>
        <Collapse in={isExpand.technician}>
          <div className="flex flex-col gap-2 p-3 [border-top:1px_solid_var(--common-border-color)]">
            {selectedServices?.length ? <RenderTable key={ACCORDION_TYPE.technician} resource={sidebarResource.employeeMaster} setRecords={setRecords} /> : null}
            <div className="flex justify-end gap-2">
              <Button variant="outlined" color="secondary" size="small" onClick={() => handleOpen(ACCORDION_TYPE.service)}>
                Back
              </Button>
              <CustomButton
                disabled={false}
                variant="contained"
                size="small"
                color="primary"
                onClick={() => {
                  handleAdd();
                }}
              >
                Save & Next
              </CustomButton>
            </div>
          </div>
        </Collapse>
      </div>
    </>
  );
};

const AddCustomerInformation = ({ isExpand, handleSave, loading, handleOpen }) => {
  const [initialData, setInitialData] = useState({ fields: [], values: null });

  useEffect(() => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.rentalManagement}`)
      .then(({ data: { data } }) => {
        let fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);

        let createValues: any = getObjKeys('', fieldsDataForCreate);
        createValues['rentalJobName'] = GenerateResourceLineNumber(fieldsDataForCreate);
        fieldsDataForCreate = fieldsDataForCreate?.filter((_f) => _f.required && !createValues[_f.fieldName]);
        setInitialData({
          fields: fieldsDataForCreate,
          values: createValues
        });
      })
      .catch((error) => {
        // toastConfig.setToastConfig(error);
      });
  }, []);

  const handleSubmit = (values) => {
    const updatedData = {...initialData.values,...values};
    handleSave(updatedData);
  };

  return (
    <>
      <div className={`'bg-[var(--dark-secondary,white)] rounded-[5px] [border:1px_solid_var(--common-border-color)]`}>
        <div className="flex items-center justify-between p-4">
          <h3 className="line-clamp-2 font-semibold md:line-clamp-1">{`Add Customer Information`}</h3>
        </div>
        <Collapse in={isExpand.customerInfo}>
          <div className="flex flex-col gap-2 p-3 [border-top:1px_solid_var(--common-border-color)]">
            {initialData?.fields?.length ? (
              <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData?.fields)} validateOnMount onSubmit={handleSubmit}>
                {({ values, errors, touched, setFieldValue, submitForm }) => (
                  <Fragment>
                    <Form autoComplete="off" autoCorrect="off" noValidate>
                      <InputField
                        errors={errors}
                        values={values}
                        setFieldValue={setFieldValue}
                        touched={touched}
                        fieldsData={initialData.fields}
                        size="small"
                        fullWidth
                      />
                    </Form>
                    <div className="flex justify-end gap-2">
                      <Button
                        disabled={false}
                        type="button"
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={() => {
                          handleOpen('technician');
                        }}
                      >
                        Back
                      </Button>
                      <CustomButton
                        loading={loading}
                        variant="contained"
                        color="primary"
                        startIcon={loading && <CircularProgress size={20} color="inherit" />}
                        disabled={false}
                        onClick={(e) => {
                          e.preventDefault();
                          submitForm();
                        }}
                      >
                        Save
                      </CustomButton>
                    </div>
                  </Fragment>
                )}
              </Formik>
            ) : (
              <Box p={2} height={500}>
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
              </Box>
            )}
          </div>
        </Collapse>
      </div>
    </>
  );
};

const RenderTable = ({ resource, setRecords }) => {
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

    // if (warehouse && resource !== sidebarResource.serviceMaster) {
    //   filterByIds.push({ field: 'warehouse', term: warehouse });
    // }
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
