import { Box, IconButton, MenuItem, MenuList, Popover } from '@mui/material';
import { default as Add } from '@mui/icons-material/Add';
import DateRangeIcon from '@mui/icons-material/DateRange';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { camelCase, isArray, startCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import AssignPackageDialog from 'src/components/AssignRolesDialog/AssignPackageDialog';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { getNestedSubRows } from 'src/components/RentalManagment/helper';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import routes from '../../../components/Helpers/Routes';
import { autoCalculateSpecificFields } from '../../../constants/formulaUtility';
import {
  CHILD_RESOURCE,
  MATERIAL_TYPE,
  PRICING_SETUP_TYPE,
  SALES_ORDER_STATUS,
  pricingCondition,
  salesOrder,
  sidebarResource
} from '../../../constants/helpers';
import SalesOrderQtyDialog from './SalesOrderQtyDialog';
import { flattenArray } from 'src/constants/columns';
import AdditionalCostDialog from './AdditionalCostDialog';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import { FiExternalLink } from 'react-icons/fi';
import ManageLeadTime from 'src/components/LeadTime/ManageLeadTime';
import { ownerAndColaborator } from 'src/constants/messageHelpers';

const renderedFrom = `${camelCase(sidebarResource.salesOrder)}_Material`;

const Material = ({ salesOrderData, setNextStep, stepFullScreen, fetchSalesOrderData, updateJobStatus, allowedToEdit }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();
  const [isUpdating, setUpdating] = useState(false);
  const [isProductEdit, setIsProductEdit] = useState({ open: false, isBulkedit: false, showSaveAndNext: false });
  const [recordToUpdate, setRecordToUpdate] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [material, setMaterial] = useState([]);
  const [addDialog, setAddDialog] = useState({ open: false, type: '', parentId: null });
  const [addchildDialog, setAddchildDialog] = useState({ open: false, parentId: null, top: null, bottom: null });
  const [columns, setColumns] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [isRateRequired, setIsRateRequired] = useState(false);
  const [leadTimeDialog, setLeadTimeDialog] = useState({ open: false, data: null });
  const [showCostDialog, setShowCostDialog] = useState({ open: false, showSaveAndNext: false });
  const [costFields, setCostFields] = useState(null);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();

  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    fetchData();
  }, [columns]);

  const fetchFields = async () => {
    var data = await fetch_child_resource_fields(CHILD_RESOURCE.salesOrderProduct, salesOrderData?.currency, allowedToEdit);
    const c_fields = await fetch_child_resource_fields(CHILD_RESOURCE.salesOrderCost, salesOrderData?.currency, allowedToEdit);
    setCostFields(c_fields);
    setAllFields(JSON.parse(JSON.stringify(data)));
    const newColumns = generateColumns(renderedFrom, data, null, false, salesOrderData?.currency);
    const isPriceRequired = data.filter((el) => el.fieldName === 'price' && el.required).length > 0;
    setIsRateRequired(isPriceRequired);
    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 100,
        sticky: 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        width: 100,
        disableFilters: false,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p>{`${startCase(row.original?.type)} `}</p>
          </div>
        )
      },
      {
        accessor: 'detail',
        Header: 'Detail',
        disableFilters: false,
        sticky: isMobile || isTablet ? 'none' : 'left',
        minWidth: 300,
        width: 300,
        Cell: ({ row, table }) => (
          <div className="flex items-center gap-2">
            {row.original?.detail ? (
              allowedToEdit ? (
                <p
                  onClick={() => {
                    handleOpen(row, table.getRowModel().rows);
                  }}
                  className="link text-truncate"
                  title={row.original?.detail}
                >
                  {row.original?.detail}
                </p>
              ) : (
                <p className=" text-truncate">{row.original?.detail}</p>
              )
            ) : (
              <NoDataCell />
            )}
            {allowedToEdit && ![MATERIAL_TYPE.service, MATERIAL_TYPE.manualEntry]?.includes(row?.original?.type) && (
              <>
                {row.original?.subRows?.length > 0 && (
                  <span title={`There are ${row.original?.subRows?.length} product(s) in this package`}>({row.original?.subRows?.length})</span>
                )}
                <HtmlTooltip title="Add">
                  <IconButton
                    onClick={(event) => setAddchildDialog({ open: true, parentId: row.original?._id, top: event.clientY, bottom: event.clientX })}
                    size="small"
                  >
                    <Add color="disabled" fontSize="small" />
                  </IconButton>
                </HtmlTooltip>
              </>
            )}
            {row.original.type !== MATERIAL_TYPE.manualEntry && (
              <IconButton
                size="small"
                onClick={() => {
                  if (row.original.type === MATERIAL_TYPE.service) {
                    window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === MATERIAL_TYPE.product) {
                    window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                  } else {
                    window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                  }
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            )}
          </div>
        )
      },
      {
        accessor: 'description',
        Header: 'Description',
        width: 200,
        Cell: ({ row }) => {
          return row.original['description'] ? (
            <div>
              <p className="text-truncate">{row.original.description}</p>
            </div>
          ) : (
            <NoDataCell />
          );
        }
      },
      {
        accessor: 'leadTime',
        Header: 'Lead Time (Days)',
        Cell: ({ row }) => <div>{<p>{row.original['leadTime'] || 0}</p>}</div>,
        Footer: (info) => {
          let rows = info.table.getExpandedRowModel().rows;
          const total = rows
            ?.filter((f) => f.original.hasOwnProperty('leadTime') && !isNaN(f.original['leadTime']))
            .reduce((sum, row) => parseInt(row.original['leadTime']) + sum, 0);
          return <>{total}</>;
        }
      }
    ];
    coloum = [...coloum, ...newColumns];
    coloum.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 140,
      width: 140,
      sticky: 'right',
      disableFilters: true,
      disableSortBy: true,
      canDrag: false,
      Cell: ({ row, table }) => (
        <>
          <HtmlTooltip title={'Edit'} placement="top" enterTouchDelay={0} arrow>
            <IconButton
              size="small"
              aria-label="Details"
              onClick={() => {
                handleOpen(row, table.getRowModel().rows);
              }}
            >
              <EditIcon fontSize="small" color="primary" />
            </IconButton>
          </HtmlTooltip>
          {row.original.type !== MATERIAL_TYPE.manualEntry && (
            <HtmlTooltip title={'Lead Time'} placement="top" enterTouchDelay={0} arrow>
              <IconButton
                size="small"
                aria-label="Details"
                onClick={() => {
                  setLeadTimeDialog({ open: true, data: row.original });
                }}
              >
                <DateRangeIcon fontSize="small" color="primary" />
              </IconButton>
            </HtmlTooltip>
          )}
          <HtmlTooltip title={'Delete'} placement="top" enterTouchDelay={0} arrow>
            <IconButton
              size="small"
              aria-label="Details"
              onClick={() => {
                const obj: any = [{ id: row.original._id, type: row.original?.type, materialId: row.original?.materialId }];
                getNestedSubRows(obj, row.original);
                setDeleteData(obj);
              }}
            >
              <DeleteIcon fontSize="small" color="error" />
            </IconButton>
          </HtmlTooltip>
        </>
      )
    });
    setColumns(coloum);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    setNextStep(false);
    var data: any = [];
    const response = await axiosInstance().get(`${salesOrder.api}/material/${salesOrderData._id}`);
    const additionalData = await axiosInstance().get(`${salesOrder.api}/additionalcost/${salesOrderData._id}`);
    data = response?.data?.data;
    let additionalCost = additionalData?.data?.data;
    additionalCost = additionalCost?.map((e: any) => {
      return { ...e, type: MATERIAL_TYPE.manualEntry };
    });

    setMaterial(JSON.parse(JSON.stringify(data.material)));
    let rows = data.material.filter((e) => e.parentId === null);
    rows = [...rows, ...additionalCost];
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = `${
        parent.type === MATERIAL_TYPE.product
          ? parent.productDetail?.productName
          : parent.type === MATERIAL_TYPE.service
            ? parent.serviceDetail?.serviceName
            : parent.type === MATERIAL_TYPE.package
              ? parent.packageDetail?.packageName
              : parent.detail || ''
      }`;
      parent.description =
        parent.type === MATERIAL_TYPE.product
          ? parent?.productDetail?.productDescription || ''
          : parent.type === MATERIAL_TYPE.package
            ? parent?.packageDetail?.packageDescription || ''
            : parent.type === MATERIAL_TYPE.service
              ? parent?.serviceDetail?.serviceDescription || ''
              : parent.description || '';

      parent.leadTimeData = Array.isArray(parent.leadTime) ? parent.leadTime : [];
      parent.leadTime = Array.isArray(parent.leadTime) ? `${parent?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0;
      parent.isValid = parent['finalPrice_' + salesOrderData?.currency?.toLowerCase()] ? true : !isRateRequired;
      parent.subRows = generateNestedData(data.material, parent);
    });
    if (rows.filter((_rows) => _rows.isValid === false).length > 0 || rows.length === 0) {
      setNextStep(false);
    } else {
      setNextStep(true);
    }

    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, index) => {
      _subRow.index = parent.index + '.' + `${index + 1}`;
      _subRow.detail = `${
        _subRow.type === MATERIAL_TYPE.product
          ? _subRow.productDetail?.productName
          : _subRow.type === MATERIAL_TYPE.service
            ? _subRow.serviceDetail?.serviceName
            : _subRow.packageDetail?.packageName
      }`;
      _subRow.description =
        _subRow.type === MATERIAL_TYPE.product
          ? _subRow?.productDetail?.productDescription
          : _subRow.type === MATERIAL_TYPE.package
            ? _subRow?.packageDetail?.packageDescription
            : _subRow?.serviceDetail?.serviceDescription;
      _subRow.leadTimeData = Array.isArray(_subRow.leadTime) ? _subRow.leadTime : [];
      _subRow.leadTime = Array.isArray(_subRow.leadTime) ? `${_subRow?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0;
      _subRow.isValid = _subRow['finalPrice_' + salesOrderData?.currency?.toLowerCase()] ? true : false;
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    if (subRows.length === 0 && parent.type === MATERIAL_TYPE.package) {
      parent.isValid = false;
    }
    if (parent.type === MATERIAL_TYPE.package) {
      parent.hideSelection = subRows.filter((e) => e.hideSelection).length ? true : false;
    }
    return subRows;
  };

  const handleAdd = async (rows) => {
    setSubmitting(true);
    const material: any = [];
    rows.forEach((d) => {
      const element: any = {};
      element.materialId = d._id;
      element.type = addDialog.type;
      element.unit = d?.unit && d?.unitMain?.length ? d?.unitMain[0] : '';
      element.qty = d.qty ? parseFloat(d.qty) : 1;
      element.parentId = addDialog.parentId;
      material.push(element);
    });

    const priceData: any = await calculatePrice(material);
    material.forEach((element) => {
      const rateResult = priceData?.filter(
        (e) =>
          e.materialId === element.materialId &&
          e.materialType === element.type &&
          e.unit === element.unit &&
          e.pricingMethod === element.pricingMethod
      );
      if (rateResult.length && rateResult[0].mrp) {
        const priceFieldName = `price_${salesOrderData?.currency?.toLowerCase()}`;
        element[priceFieldName] = rateResult[0].mrp;
        const calValues = autoCalculateSpecificFields({ [priceFieldName]: rateResult[0].mrp }, element, allFields);
        Object.assign(element, calValues);
      }
    });

    axiosInstance()
      .post(`${salesOrder.api}/material/${salesOrderData._id}`, { material })
      .then(() => {
        setAddDialog({ open: false, type: '', parentId: null });
        fetchData();
        fetchSalesOrderData();
        setSubmitting(false);
        if (salesOrderData?.status === SALES_ORDER_STATUS.new) {
          updateJobStatus(SALES_ORDER_STATUS.inProgress);
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setSubmitting(false);
      });
  };

  const handleAddCost = (rows) => {
    setUpdating(true);
    axiosInstance()
      .post(`${salesOrder.api}/additionalcost/${salesOrderData._id}/add`, { additionalCost: rows })
      .then(({ data }) => {
        fetchData();
        setShowCostDialog({ open: false, showSaveAndNext: false });
        setUpdating(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleSaveData = async (rows: any, saveAndNext = false) => {
    setUpdating(true);
    axiosInstance()
      .put(`${salesOrder.api}/material/${salesOrderData._id}`, { material: rows })
      .then(({ data }) => {
        setUpdating(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        if (saveAndNext) {
          const row = flattenArray(dataRows).find((ele) => ele._id === rows[0]?._id);
          if (!row?.parentId) {
            const rowIndex = dataRows.findIndex((d) => d._id === rows[0]?._id);
            setRecordToUpdate(dataRows[rowIndex + 1]);
            if (dataRows[rowIndex + 1]?.type === MATERIAL_TYPE.manualEntry) {
              setIsProductEdit({
                open: false,
                isBulkedit: false,
                showSaveAndNext: false
              });
              setShowCostDialog({ open: true, showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false });
            } else {
              setIsProductEdit({
                open: true,
                isBulkedit: false,
                showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false
              });
            }
          } else {
            const allSubRowData = flattenArray(dataRows).filter((ele) => ele.parentId === row.parentId);
            const subRowIdx = allSubRowData?.findIndex((d) => d._id === row?._id);
            setRecordToUpdate(allSubRowData[subRowIdx + 1]);
            setIsProductEdit({
              open: true,
              isBulkedit: false,
              showSaveAndNext: subRowIdx + 1 < allSubRowData?.length - 1 ? true : false
            });
          }
        } else {
          setIsProductEdit({ open: false, isBulkedit: false, showSaveAndNext: false });
        }
        fetchData();
        fetchSalesOrderData();
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleUpdateCost = (rows: any, saveAndNext = false) => {
    setUpdating(true);
    axiosInstance()
      .put(`${salesOrder.api}/additionalcost/${salesOrderData._id}/update`, { additionalCost: rows })
      .then(({ data }) => {
        setUpdating(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        if (saveAndNext) {
          const rowIndex = dataRows.findIndex((d) => d._id === rows[0]?._id);
          setRecordToUpdate(dataRows[rowIndex + 1]);
          if (dataRows[rowIndex + 1]?.type === MATERIAL_TYPE.manualEntry) {
            setShowCostDialog({ open: true, showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false });
          } else {
            setShowCostDialog({ open: false, showSaveAndNext: false });
            setIsProductEdit({
              open: true,
              isBulkedit: false,
              showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false
            });
          }
        } else {
          setShowCostDialog({ open: false, showSaveAndNext: false });
        }
        fetchData();
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = (rows) => {
    setDeleting(true);
    const cost = rows?.filter((ele) => ele.type === MATERIAL_TYPE.manualEntry).map((e) => e?.id);
    const products = rows?.filter((ele) => ele.type !== MATERIAL_TYPE.manualEntry);
    if (products?.length) {
      axiosInstance()
        .put(`${salesOrder.api}/material/${salesOrderData?._id}/delete`, { ids: rows })
        .then(() => {
          setDeleting(false);
          fetchData();
          fetchSalesOrderData();
          setDeleteData(null);
          fetchSalesOrderData();
        })
        .catch((error) => {
          setDeleting(false);
          toastConfig.setToastConfig(error);
          setDeleteData(null);
        });
    }
    if (cost?.length) {
      axiosInstance()
        .post(`${salesOrder.api}/additionalcost/${salesOrderData._id}/delete`, { ids: cost })
        .then(({ data }) => {
          setDeleting(false);
          fetchData();
          fetchSalesOrderData();
          setDeleteData(null);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleOpen = (row, rows) => {
    let showSaveAndNext;
    if (row.depth != 0) {
      const allRows = rows.filter((ele) => ele.parentId === row.parentId);
      showSaveAndNext = row?.index < allRows.length - 1 ? true : false;
    } else {
      showSaveAndNext = row?.index < rows?.filter((e) => e?.depth === 0)?.length - 1 && row?.depth === 0 ? true : false;
    }

    if (row?.original?.type === MATERIAL_TYPE.manualEntry) {
      setShowCostDialog({ open: true, showSaveAndNext: row?.index < rows?.length - 1 ? true : false });
    } else {
      setIsProductEdit({
        open: true,
        isBulkedit: false,
        showSaveAndNext: showSaveAndNext
      });
    }
    setRecordToUpdate(row.original);
  };

  const calculatePrice = (arr: any[]) => {
    if (salesOrderData) {
      const data: any = {};
      data.conditionType = [PRICING_SETUP_TYPE.price];
      const material: any = [];
      arr?.forEach((ele) => {
        const obj = {
          materialId: ele?.materialId,
          materialType: ele?.type,
          qty: ele?.qty,
          pricingMethod: ele?.pricingMethod,
          currency: salesOrderData?.currency
        };
        if (isArray(ele?.unit)) {
          ele?.unit?.forEach((e) => {
            material.push({ ...obj, unit: e });
          });
        } else {
          material.push({ ...obj, unit: ele?.unit });
        }
      });
      data.material = material;
      data.supplier = [];
      data.customer = [salesOrderData?.customerAccount?.optionValue];
      data.warehouse = [salesOrderData?.warehouse?.optionValue];
      data.address = salesOrderData?.shippingAddress?.optionValue ? [salesOrderData?.shippingAddress?.optionValue] : [];
      return new Promise((resolve, reject) => {
        axiosInstance()
          .post(pricingCondition.api + `/calculatePrice`, data)
          .then(({ data: { data } }) => {
            resolve(data);
          })
          .catch((err) => {
            reject(err);
          });
      });
    }
  };

  const addButtonMenuItems = () => {
    return (
      <>
        {permissions?.product?.isRead && (
          <MenuItem
            color="primary"
            onClick={() => {
              setAddDialog({ open: true, type: MATERIAL_TYPE.product, parentId: null });
            }}
          >
            {`Add Existing Products`}
          </MenuItem>
        )}

        {permissions?.packages?.isRead && (
          <MenuItem
            color="primary"
            onClick={() => {
              setAddDialog({ open: true, type: MATERIAL_TYPE.package, parentId: null });
            }}
          >
            {`Add Existing Packages`}
          </MenuItem>
        )}
        {permissions?.serviceMaster?.isRead && (
          <MenuItem
            color="primary"
            onClick={() => {
              setAddDialog({ open: true, type: MATERIAL_TYPE.service, parentId: null });
            }}
          >
            {`Add Existing Services`}
          </MenuItem>
        )}
        {costFields?.length > 0 && (
          <MenuItem
            onClick={() => {
              setShowCostDialog({ open: true, showSaveAndNext: false });
            }}
          >
            Add Manual Entry
          </MenuItem>
        )}
      </>
    );
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={selectedRecords.length === 0 || selectedRecords.some((e) => e.type === MATERIAL_TYPE.manualEntry)}
          onClick={() => {
            setIsProductEdit({ open: true, isBulkedit: true, showSaveAndNext: false });
          }}
        >
          Bulk Edit
        </MenuItem>

        <MenuItem
          onClick={() => {
            const dataToDelete =
              selectedRecords &&
              selectedRecords
                .filter((e) => !e.hideSelection)
                .map((rec: any) => {
                  const obj: any = {};
                  obj.id = rec._id;
                  obj.type = rec?.type;
                  obj.materialId = rec?.materialId;
                  return obj;
                });
            setDeleteData(dataToDelete);
          }}
        >
          Delete
        </MenuItem>
      </>
    );
  };

  const handleSaveLeadTime = (data) => {
    setSubmitting(true);
    const value = {
      leadTime: data?.steps || [],
      _id: leadTimeDialog?.data?._id
    };

    axiosInstance()
      .put(`${salesOrder.api}/material/${salesOrderData?._id}/lead-time`, value)
      .then(({ data }) => {
        fetchData();
        setLeadTimeDialog({ open: false, data: null });
        setSubmitting(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((err) => {
        setSubmitting(false);
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <Fragment>
      <DetailsPageHeader
        isAddButtonVisible={true}
        addButtonMenuItems={addButtonMenuItems()}
        isActionButtonVisible={allowedToEdit}
        actionButtonMenuItems={actionButtonMenuItems()}
        actionButtonProps={{
          tooltip: Boolean(selectedRecords && selectedRecords.length) ? 'Delete selected records' : 'Select records to delete',
          disabled: !Boolean(selectedRecords && selectedRecords.filter((e) => !e.hideSelection).length)
        }}
        addButtonProps={{
          disabled: !allowedToEdit,
          tooltip: salesOrderData?.quotation ? `Converted from Quotation you can not perform this action` : !allowedToEdit ? ownerAndColaborator : ``
        }}
        leftSideContents
        rightSideContents
        hasXpadding
      />
      {columns ? (
        <>
          <Box zIndex={5} width={'100%'}>
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              expander={true}
              refreshGrid={fetchData}
              renderedFrom={renderedFrom}
              setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
              isClientSideGrid={true}
              hideSelection={!allowedToEdit}
              hideAction={!allowedToEdit}
            />
          </Box>
        </>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {deleteData && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to delete the record(s)?`}
          onClose={() => setDeleteData(null)}
          onOk={() => handleDelete(deleteData)}
          okBtnLoading={isDeleting}
        />
      )}
      {isProductEdit.open && (
        <SalesOrderQtyDialog
          calculatePrice={calculatePrice}
          onClose={() => {
            setIsProductEdit({ open: false, isBulkedit: false, showSaveAndNext: false });
            setRecordToUpdate(null);
          }}
          isBulkedit={isProductEdit.isBulkedit}
          handleSaveData={handleSaveData}
          rowData={recordToUpdate}
          material={material}
          selectedProducts={selectedRecords}
          salesOrderData={salesOrderData}
          loadingEdit={isUpdating}
          showSaveAndNext={isProductEdit?.showSaveAndNext}
        />
      )}
      {addchildDialog.open && (
        <Popover
          anchorReference="anchorPosition"
          anchorPosition={{ top: addchildDialog.top, left: addchildDialog.bottom }}
          anchorOrigin={{
            vertical: 'center',
            horizontal: 'left'
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left'
          }}
          open={addchildDialog.open}
          onClose={() => {
            setAddchildDialog({ open: false, parentId: null, top: null, bottom: null });
          }}
        >
          <MenuList>
            <MenuItem
              onClick={() => {
                setAddDialog({ open: true, type: MATERIAL_TYPE.product, parentId: addchildDialog.parentId });
                setAddchildDialog({ open: false, parentId: null, top: null, bottom: null });
              }}
            >
              Add Existing Products
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAddDialog({ open: true, type: MATERIAL_TYPE.package, parentId: addchildDialog.parentId });
                setAddchildDialog({ open: false, parentId: null, top: null, bottom: null });
              }}
            >
              Add Existing Packages
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAddDialog({ open: true, type: MATERIAL_TYPE.service, parentId: addchildDialog.parentId });
                setAddchildDialog({ open: false, parentId: null, top: null, bottom: null });
              }}
            >
              Add Existing Services
            </MenuItem>
          </MenuList>
        </Popover>
      )}
      {leadTimeDialog.open && (
        <ManageLeadTime
          onClose={() => {
            setLeadTimeDialog({ open: false, data: null });
          }}
          onSuccess={(data) => {
            handleSaveLeadTime(data);
          }}
          referenceType={sidebarResource.salesOrder}
          referenceId={null}
          referenceData={leadTimeDialog?.data}
          referenceLabel={
            leadTimeDialog?.data?.productDetail?.productName ||
            leadTimeDialog?.data?.serviceDetail?.serviceName ||
            leadTimeDialog?.data?.packageDetail?.packageName
          }
          loading={isSubmitting}
        />
      )}
      {addDialog.open && addDialog.type === MATERIAL_TYPE.product && (
        <AssignProductDialog
          handleCloseDialog={() => setAddDialog({ open: false, type: '', parentId: null })}
          onSuccess={(d) => {
            handleAdd(d);
          }}
          isSubmitting={isSubmitting}
          extraDeepFilter={[{ field: 'expenseItem', term: 'No' }]}
          serialized={false}
        />
      )}
      {addDialog.open && addDialog.type === MATERIAL_TYPE.service && (
        <AssignServiceDialog
          handleClose={() => setAddDialog({ open: false, type: '', parentId: null })}
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
          isSubmitting={isSubmitting}
        />
      )}
      {addDialog.open && addDialog.type === MATERIAL_TYPE.package && (
        <AssignPackageDialog
          handleClose={() => setAddDialog({ open: false, type: '', parentId: null })}
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
          isSubmitting={isSubmitting}
        />
      )}
      {showCostDialog.open && (
        <AdditionalCostDialog
          onClose={() => {
            setShowCostDialog({ open: false, showSaveAndNext: false });
            setRecordToUpdate(null);
          }}
          handleAddCost={handleAddCost}
          handleUpdateCost={handleUpdateCost}
          currency={salesOrderData?.currency}
          costData={recordToUpdate}
          loadingEdit={isUpdating}
          showSaveAndNext={showCostDialog.showSaveAndNext}
        />
      )}
    </Fragment>
  );
};

export default Material;
