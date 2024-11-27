import { Fragment, useContext, useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Collapse, IconButton } from '@material-ui/core';
import { ExpandMore, ExpandLess } from '@material-ui/icons';
import ManageRentalJob from '../RentalManagement/ManageRental/index';
import { ASSET_STATUS, gridLoadingTimeout, MATERIAL_TYPE, prepareDataForGrid, rentalManagement, sidebarResource } from 'src/constants/helpers';
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
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';
import { calculatePrice, fetch_rental_product_fields, fetch_rental_technician_fields } from 'src/components/RentalManagment/helper';
import CustomButton from 'src/components/Helpers/CustomButton';

const ManageWorkAutomation = () => {
  const toastConfig = useContext(CustomToastContext);
  const [openRentalJobDialog, setOpenRentalJobDialog] = useState(false);
  const [rentalManagementData, setRentalManagementData] = useState(null);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedTechnicians, setSelectedTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  const handleSave = () => {
    setLoading(true);
    const values = {
      assets: selectedAssets || [],
      material: selectedServices || [],
      technicians: selectedTechnicians || []
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
              routes={[routes.workAutomation, { title: 'New' }]}
              onBreadCrumbClick={(path) => {
                history.push(path);
              }}
            />
          </Box>
        </Box>
        <Box className={`detail-container-v1 h-full flex flex-col justify-between`}>
          <div className="mt-2 flex w-full flex-col gap-6">
            <div>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  setOpenRentalJobDialog(true);
                }}
              >
                {`Add ${routes.rentalManagement.title} Data`}
              </Button>
            </div>
            <div>
              <AddSerializedAsset rentalManagementData={rentalManagementData} setSelectedAssets={setSelectedAssets} />
            </div>
            <div>
              <AddServices rentalManagementData={rentalManagementData} setSelectedServices={setSelectedServices} selectedAssets={selectedAssets} />
            </div>
            <div>
              <AddTechnicians
                rentalManagementData={rentalManagementData}
                selectedServices={selectedServices}
                setSelectedTechnicians={setSelectedTechnicians}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-3">
            <CustomButton
              variant="contained"
              color="primary"
              startIcon={loading && <CircularProgress size={20} color="inherit" />}
              onClick={handleSave}
              disabled={loading || !rentalManagementData || !selectedAssets?.length}
            >
              Save
            </CustomButton>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                history.push(routes?.workAutomation?.path);
              }}
            >
              Close
            </Button>
          </div>
        </Box>
      </Box>

      {openRentalJobDialog && (
        <ManageRentalJob
          open={openRentalJobDialog}
          isClone={false}
          rentalManagementId={null}
          onClose={() => {
            setOpenRentalJobDialog(false);
          }}
          onSuccess={(data) => {
            setRentalManagementData(data);
            setOpenRentalJobDialog(false);
          }}
          isAutomated={true}
        />
      )}
    </Fragment>
  );
};

export default ManageWorkAutomation;

const AddSerializedAsset = ({ rentalManagementData, setSelectedAssets, isExpanded: defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const handleAdd = (rows) => {
    const tempMaterial = rows?.map((e) => {
      return {
        asset: e?._id
      };
    });
    setIsExpanded(false);
    setSelectedAssets(tempMaterial);
  };
  const disabled = !rentalManagementData;
  return (
    <>
      <div className={`'bg-[var(--dark-secondary,white)] rounded-[5px] [border:1px_solid_var(--common-border-color)]`}>
        <div className="flex items-center justify-between p-4 ">
          <h3 className="line-clamp-2 font-semibold md:line-clamp-1">{`Add ${routes.serializedAsset.title}`}</h3>
          <div className="flex min-w-fit gap-3">
            <IconButton size="small" disabled={!rentalManagementData} onClick={() => setIsExpanded((prev) => !prev)}>
              {isExpanded ? (
                <ExpandLess fontSize="small" color={disabled ? 'disabled' : 'primary'} />
              ) : (
                <ExpandMore fontSize="small" color={disabled ? 'disabled' : 'primary'} />
              )}
            </IconButton>
          </div>
        </div>
        <Collapse in={isExpanded}>
          {rentalManagementData ? (
            <div className="p-3 [border-top:1px_solid_var(--common-border-color)]">
              <RenderTable
                resource={sidebarResource.serializedAsset}
                warehouse={rentalManagementData?.warehouse}
                handleAdd={handleAdd}
              />
            </div>
          ) : null}
        </Collapse>
      </div>
    </>
  );
};

const AddServices = ({ rentalManagementData, setSelectedServices, selectedAssets, isExpanded: defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [allFields, setAllFields] = useState(null);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      var data = await fetch_rental_product_fields(rentalManagementData?.currency, false);
      setAllFields(JSON.parse(JSON.stringify(data)));
    } catch (e) {}
  };
  const handleAdd = async (rows) => {
    const material: any = [];
    rows.forEach((d) => {
      const element: any = {};
      element.materialId = d._id;
      element.type = MATERIAL_TYPE.service;
      element.unit = d.unitMain && d.unitMain.length ? d.unitMain[0] : d.unit ? d.unit : '';
      element.pricingMethod = d.pricingMethodMain && d.pricingMethodMain.length ? d.pricingMethodMain[0] : d.pricingMethod ? d.pricingMethod : '';
      element.qty = d.qty ? parseFloat(d.qty) : 1;
      element.estimateStartDate = rentalManagementData ? rentalManagementData?.estimateStartDate : new Date();
      element.estimateEndDate = rentalManagementData ? rentalManagementData?.estimateEndDate : new Date();
      element.actualStartDate = '';
      element.actualEndDate = '';
      element.actualJobDuration = '';
      element.parentId = null;
      const calValues = autoCalculateSpecificFields({ pricingMethod: element.pricingMethod }, element, allFields);
      element.estimateJobDuration = 1;
      if (calValues && calValues['estimateJobDuration']) {
        element.estimateJobDuration = calValues['estimateJobDuration'];
      }
      material.push(element);
    });
    if (material.filter((d) => d.listPrice === null || d.listPrice === undefined || d.listPrice === 0).length === 0) {
      AddMaterial(material, []);
    } else {
      const priceData: any = await calculatePrice(rentalManagementData, material);
      AddMaterial(material, priceData);
    }
  };

  const AddMaterial = async (material, priceData) => {
    const tempMaterial = [...material];
    tempMaterial.forEach((element) => {
      const rateResult = priceData?.filter((e) => e.materialId === element.materialId && e.materialType === element.type && e.unit === element.unit);
      if (element.listPrice) {
        const priceFieldName = `price_${rentalManagementData?.currency?.toLowerCase()}`;
        element[priceFieldName] = element.listPrice;
        const calValues = autoCalculateSpecificFields({ [priceFieldName]: element.listPrice }, element, allFields);
        Object.assign(element, calValues);
      } else if (rateResult.length && rateResult[0].mrp) {
        const priceFieldName = `price_${rentalManagementData?.currency?.toLowerCase()}`;
        element[priceFieldName] = rateResult[0].mrp;
        element['pricingCondition'] = rateResult[0].conditionId;
        element['pricingMethod'] = rateResult[0].pricingMethod?.trim();
        const calValues = autoCalculateSpecificFields({ [priceFieldName]: rateResult[0].mrp }, element, allFields);
        Object.assign(element, calValues);
      }
    });
    setSelectedServices(tempMaterial);
    setIsExpanded(false);
  };

  const disabled = !rentalManagementData || !selectedAssets?.length;
  return (
    <>
      <div className={`'bg-[var(--dark-secondary,white)] rounded-[5px] [border:1px_solid_var(--common-border-color)]`}>
        <div className="flex items-center justify-between p-4">
          <h3 className="line-clamp-2 font-semibold md:line-clamp-1">{`Add Services`}</h3>
          <div className="flex min-w-fit gap-3">
            <IconButton size="small" disabled={disabled} onClick={() => setIsExpanded((prev) => !prev)}>
              {isExpanded ? (
                <ExpandLess fontSize="small" color={disabled ? 'disabled' : 'primary'} />
              ) : (
                <ExpandMore fontSize="small" color={disabled ? 'disabled' : 'primary'} />
              )}
            </IconButton>
          </div>
        </div>
        <Collapse in={isExpanded}>
          {!disabled ? (
            <div className="p-3 [border-top:1px_solid_var(--common-border-color)]">
              <RenderTable resource={sidebarResource.serviceMaster} warehouse={rentalManagementData?.warehouse} handleAdd={handleAdd} />
            </div>
          ) : null}
        </Collapse>
      </div>
    </>
  );
};

const AddTechnicians = ({ rentalManagementData, setSelectedTechnicians, selectedServices, isExpanded: defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [allFields, setAllFields] = useState(null);
  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      var data = await fetch_rental_technician_fields(rentalManagementData?.currency, false);
      setAllFields(JSON.parse(JSON.stringify(data)));
    } catch (e) {}
  };
  const handleAdd = async (rows) => {
    const technician: any = [];
    selectedServices?.map((s, idx) => {
      const d = rows[idx];
      if (d) {
        const element: any = {};
        element.technician = d?._id;
        // element.uniqueId = '';
        element.materialId = d?.competenciesId;
        element.type = 'competency';
        element.competence = d?.competenciesId;
        element.service = s?.materialId;
        element.pricingMethod = d.pricingMethodMain && d.pricingMethodMain.length ? d.pricingMethodMain[0] : d.pricingMethod ? d.pricingMethod : '';
        element.status = 'Assigned';
        element.rentalJob = rentalManagementData?._id;
        element.warehouse = rentalManagementData?.warehouse;
        element.startDate = rentalManagementData?.estimateStartDate || new Date();
        element.endDate = rentalManagementData?.estimateEndDate || new Date();
        const calValues = autoCalculateSpecificFields({ pricingMethod: element.pricingMethod }, element, allFields);
        element.duration = 1;
        if (calValues && calValues['duration']) {
          element.duration = calValues['duration'];
        }
        technician.push(element);
      }
    });

    const priceData = (await calculatePrice(rentalManagementData, technician)) || [];
    AddMaterial(technician, priceData);
  };

  const AddMaterial = async (technician, priceData) => {
    const tempMaterial = [...technician];
    tempMaterial.forEach((element) => {
      const rateResult = priceData?.filter((e) => e.materialId === element.materialId && e.materialType === element.type);
      if (rateResult?.length && rateResult[0]?.mrp) {
        const priceFieldName = `price_${rentalManagementData?.currency?.toLowerCase()}`;
        element[priceFieldName] = rateResult[0].mrp;
        element['pricingCondition'] = rateResult[0].conditionId;
        element['pricingMethod'] = rateResult[0].pricingMethod?.trim();
        const calValues = autoCalculateSpecificFields(
          { [priceFieldName]: rateResult[0].mrp, pricingMethod: element.pricingMethod },
          element,
          allFields
        );
        Object.assign(element, calValues);
      }
      delete element.materialId;
    });
    setSelectedTechnicians(tempMaterial);
    setIsExpanded(false);
  };
  const disabled = !rentalManagementData || !selectedServices?.length;
  return (
    <>
      <div className={`'bg-[var(--dark-secondary,white)] rounded-[5px] [border:1px_solid_var(--common-border-color)]`}>
        <div className="flex items-center justify-between p-4">
          <h3 className="line-clamp-2 font-semibold md:line-clamp-1">{`Add ${routes.employeeMaster.title}`}</h3>
          <div className="flex min-w-fit gap-3">
            <IconButton size="small" disabled={disabled} onClick={() => setIsExpanded((prev) => !prev)}>
              {isExpanded ? (
                <ExpandLess fontSize="small" color={disabled ? 'disabled' : 'primary'} />
              ) : (
                <ExpandMore fontSize="small" color={disabled ? 'disabled' : 'primary'} />
              )}
            </IconButton>
          </div>
        </div>
        <Collapse in={isExpanded}>
          {rentalManagementData && selectedServices?.length ? (
            <div className="p-3 [border-top:1px_solid_var(--common-border-color)]">
              <RenderTable resource={sidebarResource.employeeMaster} warehouse={rentalManagementData?.warehouse} handleAdd={handleAdd} />
            </div>
          ) : null}
        </Collapse>
      </div>
    </>
  );
};

const RenderTable = ({ handleAdd, resource, warehouse }) => {
  const renderedFrom = `${routes.workAutomation.title}_${resource}`;
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
      <div className="mt-3 flex justify-end">
        <Button disabled={!selectedRecords.length} variant="contained" size="small" color="primary" onClick={() => handleAdd(selectedRecords)}>
          Save
        </Button>
      </div>
    </>
  );
};
