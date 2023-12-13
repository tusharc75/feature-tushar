import { Box, Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { BiChevronDown } from 'react-icons/bi';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTableNew';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { flattenArray } from 'src/constants/columns';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@material-ui/icons/Delete';
import routes from 'src/components/Helpers/Routes';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import MaterialQtyDialog from './MaterialQtyDialog';
import { fetch_field_ticket_material_fields } from '../helper';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import { calculatePrice, calculateRowsField } from 'src/components/RentalManagment/helper';
import Consumables from './Consumables';
import { FIELD_TICKET_STATUS, MATERIAL_TYPE, SERVICE_TYPE, fieldTicket } from 'src/constants/helpers';
import EditIcon from '@material-ui/icons/Edit';
import { Add, ExpandMore } from '@material-ui/icons';
import ManageServiceMaster from 'src/pages/ServiceMaster/ManageServiceMaster';
import { useData } from 'src/StateProvider/Provider';
import { isEmpty } from 'lodash';

const Material = ({ fieldTicketData, renderedFrom, allowedToEdit, setNextStep, handleChangeStatus }) => {
  const toastConfig = useContext(CustomToastContext);

  const [columns, setColumns] = useState(null);
  const [serviceDialog, setServiceDialog] = useState({ open: false, type: '' });
  const [allFields, setAllFields] = useState([]);
  const [isServiceEdit, setIsServiceEdit] = useState({ open: false, data: null, showSaveAndNext: false });
  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [isUpdating, setUpdating] = useState(false);
  const [addAnchorEl, setAddAnchorEl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    state: { permissions }
  }: any = useData();

  const { state, dispatch } = useTableReducer();
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();

  const fetchFields = async () => {
    setColumns(null);
    var data = await fetch_field_ticket_material_fields(fieldTicketData?.currency);
    if (!allowedToEdit) {
      data?.forEach((e) => {
        e.isColumnEditable = false;
      });
    }
    setAllFields(JSON.parse(JSON.stringify(data)));
    const newColumns = generateColumns(renderedFrom, data, null, false, fieldTicketData?.currency);
    let qtyIndex = newColumns.findIndex((d) => d.accessor === 'qty');
    if (qtyIndex > -1) {
      newColumns[qtyIndex].accessor = 'qtyDisplay';
    }
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
            {!allowedToEdit ? (
              <p> {row.original.detail}</p>
            ) : (
              <p
                onClick={() => {
                  openMaterial(row, table.getRowModel().rows);
                }}
                className="link text-truncate"
                title={row.original.detail}
              >
                {row.original.detail}
              </p>
            )}
            <Box ml={1}>
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
                    setDeleteData([{ id: row.original._id, service: row?.original?.materialId }]);
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
    const data = response?.data?.data?.material;

    data.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = `${parent?.serviceDetail?.serviceName}`;
      parent.description = `${parent?.serviceDetail?.serviceDescription || ''}`;
      parent.competencyType = `${parent?.serviceDetail?.competencyType?.optionLabel || ''}`;
      parent.qtyDisplay = parent.qty;
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

    dispatch({ type: 'initialize', data: data, count: data?.lenght });
    dispatch({ type: 'loading', loading: false });
  };

  const openMaterial = (data, rows) => {
    setIsServiceEdit({
      open: true,
      data: data.original,
      showSaveAndNext: data?.index < rows?.filter((e) => e?.depth === 0)?.length - 1 && data?.depth === 0 ? true : false
    });
    setIsBulkEdit(false);
  };

  useEffect(() => {
    fetchFields();
  }, [fieldTicketData]);

  useEffect(() => {
    if (columns) {
      fetchMaterial();
    }
  }, [columns]);

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAdd = async (rows) => {
    setIsSubmitting(true);
    const tax: any = {};
    if (fieldTicketData?.taxCode) {
      const {
        data: { data }
      } = await axiosInstance().get(`${routes?.taxMaster.path}/by-zipcode?taxCode=${fieldTicketData?.taxCode?.optionValue}`);
      tax.taxCode = fieldTicketData?.taxCode?.optionValue;
      tax.taxPercentage = data?.length ? data[0]?.taxRate : 0;
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
      if (!isEmpty(tax)) {
        element.taxCode = tax?.taxCode;
        element.taxPercentage = tax?.taxPercentage;
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

  const handleDelete = (rows) => {
    setDeleting(true);
    axiosInstance()
      .put(`${fieldTicket.api}/${fieldTicketData?._id}/material/delete`, { ids: rows })
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
  };

  const handleSaveData = async (rows: any, saveAndNext = false) => {
    setUpdating(true);
    axiosInstance()
      .put(`${fieldTicket.api}/${fieldTicketData?._id}/material`, { material: rows })
      .then(() => {
        fetchMaterial();
        if (saveAndNext) {
          const rowIndex = dataRows?.findIndex((d) => d._id === rows[0]?._id);
          setIsServiceEdit({ open: true, data: dataRows[rowIndex + 1], showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false });
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
    if (inputField.hasOwnProperty('qtyDisplay')) {
      if (parseInt(inputField?.qtyDisplay) === 0) {
        toastConfig.setToastConfig({
          open: true,
          type: 'error',
          message: 'Qty can not be 0'
        });
        return;
      }
      inputField['qty'] = inputField['qtyDisplay'];
    }
    let rows: any = [{ ...rowData, ...updatedData }];
    rows = await calculateRowsField(flattenArray(dataRows), inputField, allFields, updatedData);
    handleSaveData(rows);
  };

  const openAddActions = (event) => {
    setAddAnchorEl(event.currentTarget);
  };

  const closeAddActions = () => {
    setAddAnchorEl(null);
  };

  return (
    <>
      {allowedToEdit && (
        <Box display="flex" justifyContent="space-between" m={1}>
          <Box display="flex" gridGap={'8px'} flexWrap={'wrap'}>
            <Button variant={'outlined'} color="primary" size="small" startIcon={<Add />} onClick={openAddActions} aria-controls="add-menu">
              {'Add'}
              <ExpandMore fontSize="small" />
            </Button>
            <Menu
              anchorEl={addAnchorEl}
              keepMounted
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left'
              }}
              id="add-menu"
              open={Boolean(addAnchorEl)}
              onClose={closeAddActions}
            >
              <MenuItem
                onClick={() => {
                  setServiceDialog({ open: true, type: 'service' });
                  closeAddActions();
                }}
              >
                Add Existing Service
              </MenuItem>
              {permissions?.serviceMaster?.isCreate && (
                <MenuItem
                  onClick={() => {
                    setServiceDialog({ open: true, type: 'newService' });
                    closeAddActions();
                  }}
                >
                  Add New Service
                </MenuItem>
              )}
            </Menu>
          </Box>
          <Box display="flex" ml={1}>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              id="demo-positioned-button"
              onClick={handleClick}
              disabled={!Boolean(selectedRecords?.length)}
              endIcon={<BiChevronDown />}
              className="new-dropdown-v1"
            >
              Actions
            </Button>
            <Menu
              anchorEl={anchorEl}
              keepMounted
              open={open}
              onClose={handleClose}
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right'
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right'
              }}
            >
              <HtmlTooltip title={Boolean(selectedRecords?.length) ? 'Bulk edit selected records' : 'Select records to edit'}>
                <MenuItem
                  onClick={() => {
                    setIsServiceEdit({ open: true, data: null, showSaveAndNext: false });
                    setIsBulkEdit(true);
                    handleClose();
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
                          service: d?.materialId
                        };
                      })
                    );
                    handleClose();
                  }}
                >
                  Delete
                </MenuItem>
              </HtmlTooltip>
            </Menu>
          </Box>
        </Box>
      )}
      {columns ? (
        <Box zIndex={5} width={'100%'}>
          <CustomReactTable
            height={'300px'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
            hideSelection={!allowedToEdit}
            hideAction={!allowedToEdit}
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
        <Consumables allowedToEdit={allowedToEdit} services={dataRows} fieldTicketData={fieldTicketData} renderedFrom={`${renderedFrom}_1`} />
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
    </>
  );
};

export default Material;
