import { Box, IconButton, MenuItem } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { calculatePrice, calculateRowsField } from 'src/components/RentalManagment/helper';
import { flattenArray } from 'src/constants/columns';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';
import { CHILD_RESOURCE, FIELD_TICKET_STATUS, MATERIAL_TYPE, SERVICE_TYPE, fieldTicket } from 'src/constants/helpers';
import ManageServiceMaster from 'src/pages/ServiceMaster/ManageServiceMaster';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { fetch_field_ticket_cost_fields, fetch_field_ticket_material_fields } from '../helper';
import Consumables from './Consumables';
import MaterialQtyDialog from './MaterialQtyDialog';
import AddCostDialog from './AddCostDialog';

const Material = ({ fieldTicketData, allowedToEdit, setNextStep, handleChangeStatus }) => {
  const renderedFrom = `${camelCase(routes?.fieldTicket.title)}_Material`;

  const toastConfig = useContext(CustomToastContext);

  const [columns, setColumns] = useState(null);
  const [serviceDialog, setServiceDialog] = useState({ open: false, type: '' });
  const [allFields, setAllFields] = useState([]);
  const [isServiceEdit, setIsServiceEdit] = useState({ open: false, data: null, showSaveAndNext: false });
  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [isUpdating, setUpdating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCostDialog, setShowCostDialog] = useState({ open: false, data: null, showSaveAndNext: false });
  const [costFields, setCostFields] = useState([]);

  const {
    state: { permissions }
  }: any = useData();

  const { state, dispatch } = useTableReducer();
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();
  const fetchFields = async () => {
    setColumns(null);
    var data = await fetch_field_ticket_material_fields(fieldTicketData?.currency);
    let costField: any = await fetch_field_ticket_cost_fields(fieldTicketData?.currency);
    setCostFields(costField);

    if (!allowedToEdit || fieldTicketData?.quotation) {
      data?.forEach((e) => {
        e.isColumnEditable = false;
      });
    }
    setAllFields(JSON.parse(JSON.stringify(data)));
    const newColumns = generateColumns(renderedFrom, data, null, false, fieldTicketData?.currency);
    let column: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'detail',
        Header: 'Details',
        minWidth: 300,
        width: 300,
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row, table }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {!allowedToEdit || fieldTicketData?.quotation ? (
              <p> {row.original.detail}</p>
            ) : row.original.detail ? (
              <p
                onClick={() => {
                  openMaterial(row, table.getRowModel().rows);
                }}
                className="link text-truncate"
                title={row.original.detail}
              >
                {row.original.detail}
              </p>
            ) : (
              <NoDataCell />
            )}
            {row.original.type !== MATERIAL_TYPE.manualEntry && (
              <Box ml={1} className=" flex-shrink-0">
                <IconButton
                  size="small"
                  onClick={() => {
                    if (row.original.type === 'service') {
                      window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                    }
                  }}
                >
                  <OpenInNewIcon fontSize="small" color="primary" />
                </IconButton>
              </Box>
            )}
          </div>
        )
      },
      {
        accessor: 'description',
        Header: 'Description',
        width: 200,
        Cell: ({ row }) => {
          return row.original['description'] ? <p className="text-truncate">{row.original.description}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'competencyType',
        Header: 'Competency Type',
        width: 250,
        Cell: ({ row }) => (row.original['competencyType'] ? <p>{row.original?.competencyType}</p> : <NoDataCell />)
      },
      {
        accessor: 'competencies',
        Header: 'Competencies',
        width: 250,
        Cell: ({ row }) => (row.original['competencies'] ? <p>{row.original?.competencies}</p> : <NoDataCell />)
      }
    ];
    column = [...column, ...newColumns];
    column.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 100,
      sticky: 'right',
      disableFilters: true,
      disableSortBy: true,
      canDrag: false,
      Cell: ({ row, table }) => {
        return (
          <>
            <HtmlTooltip title={allowedToEdit ? 'Edit' : ''}>
              <IconButton
                size="small"
                aria-label="Delete"
                disabled={!allowedToEdit}
                onClick={() => {
                  openMaterial(row, table.getRowModel().rows);
                }}
              >
                <EditIcon fontSize="small" color={allowedToEdit ? 'primary' : 'disabled'} />
              </IconButton>
            </HtmlTooltip>
            <HtmlTooltip title={'Delete'}>
              <span>
                <IconButton
                  size="small"
                  aria-label="Delete"
                  disabled={!allowedToEdit}
                  onClick={() => {
                    setDeleteData([{ id: row.original._id, service: row?.original?.materialId, type: row?.original?.type }]);
                  }}
                >
                  <DeleteIcon fontSize="small" color={allowedToEdit ? 'error' : 'disabled'} />
                </IconButton>
              </span>
            </HtmlTooltip>
          </>
        );
      }
    });
    setColumns(column);
  };

  const fetchMaterial = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    const response = await axiosInstance().get(`${fieldTicket.api}/${fieldTicketData?._id}/material?type=service`);
    const costResponse = await axiosInstance().get(`${fieldTicket.api}/${fieldTicketData?._id}/cost`);
    let costData = costResponse?.data?.data;

    costData = costData?.map((e: any) => {
      return { ...e, type: MATERIAL_TYPE.manualEntry };
    });

    const data = [...response?.data?.data?.material, ...costData];

    data.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = parent.type === MATERIAL_TYPE.service ? parent.serviceDetail?.serviceName || '' : parent.detail || '';
      parent.description = `${parent.type === MATERIAL_TYPE.service ? parent?.serviceDetail?.serviceDescription || '' : parent.description || ''}`;
      parent.competencyType = `${parent?.serviceDetail?.competencyType?.optionLabel || ''}`;
      parent.type = parent.type;
      parent.isValid = parent['finalPrice_' + fieldTicketData?.currency?.toLowerCase()] ? true : false;
    });
    if (data?.length) {
      if (data.filter((_rows) => _rows.isValid === false).length > 0) {
        setNextStep(false);
      } else {
        setNextStep(true);
      }
    }

    dispatch({ type: 'initialize', data: data, count: data?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const openMaterial = (data, rows) => {
    if (data?.original?.type === MATERIAL_TYPE.manualEntry) {
      setShowCostDialog({ open: true, data: data.original, showSaveAndNext: data?.index < rows?.length - 1 ? true : false });
    } else {
      setIsServiceEdit({
        open: true,
        data: data.original,
        showSaveAndNext: data?.index < rows?.filter((e) => e?.depth === 0)?.length - 1 && data?.depth === 0 ? true : false
      });
      setIsBulkEdit(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, [fieldTicketData]);

  useEffect(() => {
    if (columns) {
      fetchMaterial();
    }
  }, [columns]);

  const handleAdd = async (rows) => {
    setIsSubmitting(true);
    var taxCodeData: any = null;
    if (fieldTicketData?.taxCode) {
      const {
        data: { data }
      } = await axiosInstance().get(
        `${routes?.taxMaster.path}/by-zipcode?taxCode=${fieldTicketData?.taxCode?.optionValue}&materialType=${MATERIAL_TYPE.service}`
      );
      if (data?.length) {
        taxCodeData = data[0];
      }
    }
    const material: any = [];
    rows.forEach((d) => {
      const element: any = {};
      element.materialId = d._id;
      element.type = MATERIAL_TYPE.service;
      element.unit = d.unitMain && d.unitMain.length ? d.unitMain[0] : '';
      element.pricingMethod = d.pricingMethodMain && d.pricingMethodMain.length ? d.pricingMethodMain[0] : '';
      element.qty = d.qty ? parseFloat(d.qty) : 1;
      element.estimateStartDate = fieldTicketData ? fieldTicketData?.estimateStartDate : new Date();
      element.estimateEndDate = fieldTicketData ? fieldTicketData?.estimateEndDate : new Date();
      const calValues = autoCalculateSpecificFields({ pricingMethod: element.pricingMethod }, element, allFields);
      element.estimateJobDuration = 1;
      if (calValues && calValues['estimateJobDuration']) {
        element.estimateJobDuration = calValues['estimateJobDuration'];
      }
      if (calValues && calValues['finalQty']) {
        element.finalQty = calValues['finalQty'];
      }
      if (taxCodeData) {
        element.taxCode = taxCodeData?.optionValue;
        element.taxPercentage = taxCodeData?.taxRate || 0;
      }
      material.push(element);
    });
    if (fieldTicketData?.pricingCondition?.optionValue) {
      const priceData: any = await calculatePrice(fieldTicketData, material);
      AddMaterial(
        material,
        priceData?.filter((e) => e.conditionId === fieldTicketData?.pricingCondition?.optionValue)
      );
    } else {
      AddMaterial(material, null);
    }
  };

  const AddMaterial = async (material, priceData) => {
    const tempMaterial = [...material];
    if (priceData) {
      tempMaterial.forEach((element) => {
        const rateResult = priceData?.filter(
          (e) => e.materialId === element.materialId && e.materialType === element.type && e.unit === element.unit
        );
        if (element.listPrice) {
          const priceFieldName = `price_${fieldTicketData?.currency?.toLowerCase()}`;
          element[priceFieldName] = element.listPrice;
          const calValues = autoCalculateSpecificFields({ [priceFieldName]: element.listPrice }, element, allFields);
          Object.assign(element, calValues);
        } else if (rateResult.length && rateResult[0].mrp) {
          const priceFieldName = `price_${fieldTicketData?.currency?.toLowerCase()}`;
          element[priceFieldName] = rateResult[0].mrp;
          element['pricingCondition'] = rateResult[0].conditionId;
          element['pricingMethod'] = rateResult[0].pricingMethod?.trim();
          const calValues = autoCalculateSpecificFields({ [priceFieldName]: rateResult[0].mrp }, element, allFields);
          Object.assign(element, calValues);
        }
      });
    }

    await axiosInstance()
      .post(`${fieldTicket.api}/${fieldTicketData?._id}/material`, { material: tempMaterial })
      .then(() => {
        if (fieldTicketData?.status === FIELD_TICKET_STATUS.new) {
          handleChangeStatus(FIELD_TICKET_STATUS.inProgress);
        }
        fetchMaterial();
        setServiceDialog({ open: false, type: '' });
        setIsSubmitting(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
  };

  const handleAddCost = (rows) => {
    setUpdating(true);
    axiosInstance()
      .post(`${routes.fieldTicket?.path}/${fieldTicketData?._id}/cost`, [...rows])
      .then(() => {
        fetchMaterial();
        setShowCostDialog({ open: false, data: null, showSaveAndNext: false });
        setUpdating(false);
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleUpdateCost = (rows, saveAndNext = false) => {
    setUpdating(true);
    axiosInstance()
      .put(`${routes.fieldTicket?.path}/${fieldTicketData?._id}/cost`, [...rows])
      .then(() => {
        setUpdating(false);
        fetchMaterial();
        if (saveAndNext) {
          const rowIndex = dataRows.findIndex((d) => d._id === rows[0]?._id);
          if (dataRows[rowIndex + 1]?.type === MATERIAL_TYPE.manualEntry) {
            setShowCostDialog({ open: true, data: dataRows[rowIndex + 1], showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false });
          } else {
            setShowCostDialog({ open: false, data: null, showSaveAndNext: false });
            setIsServiceEdit({
              open: true,
              data: dataRows[rowIndex + 1],
              showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false
            });
          }
        } else {
          setShowCostDialog({ open: false, data: null, showSaveAndNext: false });
        }
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
    const updatedProducts = products?.map((ele) => ({
      id: ele.id,
      service: ele.service
    }));
    if (updatedProducts?.length) {
      axiosInstance()
        .put(`${fieldTicket.api}/${fieldTicketData?._id}/material/delete`, { ids: updatedProducts })
        .then(() => {
          setDeleting(false);
          fetchMaterial();
          setDeleteData(null);
        })
        .catch((error) => {
          setDeleting(false);
          toastConfig.setToastConfig(error);
          setDeleteData(null);
        });
    }
    if (cost?.length) {
      axiosInstance()
        .put(`${routes?.fieldTicket?.path}/${fieldTicketData?._id}/cost/remove`, { ids: cost })
        .then(() => {
          fetchMaterial();
          setDeleting(false);
          setDeleteData(null);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setDeleteData(null);
        });
    }
  };

  const handleSaveData = async (rows: any, saveAndNext = false) => {
    setUpdating(true);
    axiosInstance()
      .put(`${fieldTicket.api}/${fieldTicketData?._id}/material`, { material: rows })
      .then(() => {
        fetchMaterial();
        if (saveAndNext) {
          const rowIndex = dataRows?.findIndex((d) => d._id === rows[0]?._id);
          if (dataRows[rowIndex + 1]?.type === MATERIAL_TYPE.manualEntry) {
            setIsServiceEdit({
              open: false,
              data: null,
              showSaveAndNext: false
            });
            setShowCostDialog({ open: true, data: dataRows[rowIndex + 1], showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false });
          } else {
            setIsServiceEdit({
              open: true,
              data: dataRows[rowIndex + 1],
              showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false
            });
          }
        } else {
          setIsServiceEdit({ open: false, data: null, showSaveAndNext: false });
        }
        setUpdating(false);
        setIsBulkEdit(false);
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const rowData = flattenArray(dataRows)?.find((d) => d._id === updatedData._id);
    if (inputField.hasOwnProperty('qty')) {
      if (parseInt(inputField?.qty) === 0) {
        toastConfig.setToastConfig({
          open: true,
          type: 'error',
          message: 'Qty can not be 0'
        });
        return;
      }
    }
    let rows: any = [{ ...rowData, ...updatedData }];
    if (updatedData?.type === MATERIAL_TYPE.manualEntry) {
      rows = await calculateRowsField(flattenArray(dataRows), inputField, costFields, updatedData);
      handleUpdateCost(rows);
    } else {
      rows = await calculateRowsField(flattenArray(dataRows), inputField, allFields, updatedData);
      handleSaveData(rows);
    }
  };

  const AddButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setServiceDialog({ open: true, type: 'service' });
          }}
        >
          Add Existing Service
        </MenuItem>
        {permissions?.serviceMaster?.isCreate && (
          <MenuItem
            onClick={() => {
              setServiceDialog({ open: true, type: 'newService' });
            }}
          >
            Add New Service
          </MenuItem>
        )}
        {costFields?.length > 0 && (
          <MenuItem
            onClick={() => {
              setShowCostDialog({ open: true, data: null, showSaveAndNext: false });
            }}
          >
            Add Manual Entry
          </MenuItem>
        )}
      </>
    );
  };

  const ActionButtonMenuItms = () => {
    return (
      <>
        <HtmlTooltip title={Boolean(selectedRecords?.length) ? 'Bulk edit selected records' : 'Select records to edit'}>
          <MenuItem
            disabled={selectedRecords.some((e) => e.type === MATERIAL_TYPE.manualEntry)}
            onClick={() => {
              setIsServiceEdit({ open: true, data: null, showSaveAndNext: false });
              setIsBulkEdit(true);
            }}
          >
            Bulk Edit
          </MenuItem>
        </HtmlTooltip>
        <HtmlTooltip title={Boolean(selectedRecords?.length) ? 'Delete selected records' : 'Select records to delete'}>
          <MenuItem
            disabled={isDeleting}
            onClick={() => {
              setDeleteData(
                selectedRecords?.map((d) => {
                  return {
                    id: d?._id,
                    service: d?.materialId,
                    type: d?.type
                  };
                })
              );
            }}
          >
            Delete
          </MenuItem>
        </HtmlTooltip>
      </>
    );
  };

  return (
    <>
      {allowedToEdit && !fieldTicketData?.quotation && (
        <>
          <DetailsPageHeader
            isAddButtonVisible={true}
            addButtonMenuItems={<AddButtonMenuItems />}
            isActionButtonVisible={true}
            actionButtonMenuItems={<ActionButtonMenuItms />}
            actionButtonProps={{ disabled: !Boolean(selectedRecords?.length) }}
            hasXpadding
          />
        </>
      )}
      {columns ? (
        <Box zIndex={5} width={'100%'}>
          <CustomReactTable
            height={'300px'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
            hideSelection={allowedToEdit && !fieldTicketData?.quotation ? false : true}
            hideAction={allowedToEdit && !fieldTicketData?.quotation ? false : true}
            onSaveEdit={onSaveInlineEdit}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            refreshGrid={fetchMaterial}
          />
        </Box>
      ) : (
        <Box p={2} height={300}>
          <CommonSkeleton lenArray={[...Array(3).keys()]} xs={12} sm={12} md={12} lg={12} />
        </Box>
      )}
      <Box mt={3}>
        <Consumables allowedToEdit={allowedToEdit} services={dataRows} fieldTicketData={fieldTicketData} />
      </Box>
      {serviceDialog?.open && serviceDialog?.type === 'service' && (
        <AssignServiceDialog
          onSuccess={handleAdd}
          handleClose={() => {
            setServiceDialog({ open: false, type: '' });
          }}
          ids={dataRows?.map((row) => row?.materialId)}
          extraStaticFilter={[{ field: 'serviceType', term: SERVICE_TYPE.fieldService }]}
          isSubmitting={isSubmitting}
          pricingCondition={fieldTicketData?.pricingCondition?.optionValue || null}
        />
      )}
      {serviceDialog.open && serviceDialog.type === 'newService' && (
        <ManageServiceMaster
          isClone={false}
          serviceMasterId={null}
          onClose={() => setServiceDialog({ open: false, type: '' })}
          onSuccess={(data) => {
            const row = data?.data;
            row.unitMain = row?.unit;
            row.pricingMethodMain = row?.pricingMethod;
            handleAdd([row]);
            setServiceDialog({ open: false, type: '' });
          }}
          isRedirectToDetailPage={false}
          referenceData={{ serviceType: SERVICE_TYPE.fieldService }}
        />
      )}

      {isServiceEdit.open && (
        <MaterialQtyDialog
          onClose={() => {
            setIsServiceEdit({ open: false, data: null, showSaveAndNext: false });
            setIsBulkEdit(false);
          }}
          isBulkedit={isBulkEdit}
          handleSaveData={handleSaveData}
          fieldTicketData={fieldTicketData}
          rowData={!isBulkEdit ? isServiceEdit.data : selectedRecords}
          material={dataRows}
          selectedServices={selectedRecords}
          loading={isUpdating}
          showSaveAndNext={isServiceEdit.showSaveAndNext}
        />
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
      {showCostDialog.open && (
        <AddCostDialog
          onClose={() => {
            setShowCostDialog({ open: false, data: null, showSaveAndNext: false });
          }}
          handleAddCost={handleAddCost}
          handleUpdateCost={handleUpdateCost}
          fieldTicketData={fieldTicketData}
          costData={showCostDialog?.data}
          showSaveAndNext={showCostDialog.showSaveAndNext}
          loadingEdit={isUpdating}
        />
      )}
    </>
  );
};

export default Material;
