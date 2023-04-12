import React, { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import { Box, Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { formatAmountWithCurrency, rentalManagement } from '../../../constants/helpers';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import AdditionalCostDialog from './AdditionalCostDialog';
import { isMobile, isTablet } from 'react-device-detect';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import { objectStore, findOne } from '../../../constants/indexdbhelper';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import { calculateRowsField, fetch_rental_cost_fields } from '../../../components/RentalManagment/helper';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import { BiChevronDown } from 'react-icons/bi';
import { flattenArray } from 'src/constants/columns';

const AdditionalCost = ({ rentalManagementData, setNextStep, renderedFrom, stepFullScreen, currencySymbol, allowedToEdit }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [showCostDialog, setShowCostDialog] = useState(false);
  const [selectedCostData, setSelectedCostData] = useState(null);
  const { isOffline } = useContext(CustomOfflineContext);

  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isRateRequired, setIsRateRequired] = useState(false);
  const [allFields, setAllFields] = useState([]);

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    setNextStep(false);
    const fields = await fetch_rental_cost_fields(rentalManagementData.currency, isOffline);
    setAllFields(fields)
    const column: any = [
      {
        accessor: 'srno',
        Header: 'Index',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.srno}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
    ];
    fields.forEach(element => {
      if (element.type === 'currencyAmount') {
        element.displayCurrency.forEach((_currency) => {
          let fieldName = element.fieldName + '_' + _currency.toLowerCase();
          let fieldLabel = element.fieldLabel + ' ' + _currency;
          column.push({
            accessor: fieldName,
            Header: fieldLabel,
            width: 200,
            editable: Boolean(element?.isColumnEditable),
            Cell: ({ row }) =>
              row.original[fieldName] ? (
                <p>{formatAmountWithCurrency(rentalManagementData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p>
              ) : (
                <NoDataCell />
              ),
            Footer: (info) => {
              const total = info?.rows
                ?.filter((f) => f.values.hasOwnProperty(fieldName) && !isNaN(f.values[fieldName]))
                .reduce((sum, row) => row.values[fieldName] + sum, 0);
              return (
                <>
                  {currencySymbol} {formatAmountWithCurrency(rentalManagementData?.currency, total)?.amountWithouCurrencyCode ?? total}
                </>
              );
            }
          });
        });
      } else {
        let fieldName = element.fieldName;
        let fieldLabel = element.fieldLabel;
        column.push({
          accessor: fieldName,
          Header: fieldLabel,
          width: 200,
          editable: Boolean(element?.isColumnEditable),
          Cell: ({ row }) => (row.original[fieldName] ? <p>{row.original[fieldName]}</p> : <NoDataCell />)
        });
      }
    });

    const isPriceRequired = fields.filter((el) => el.fieldName === 'price' && el.required).length > 0;
    setIsRateRequired(isPriceRequired);

    column.push({
      accessor: 'action',
      Header: '',
      minWidth: 50,
      width: 50,
      sticky: 'right',
      disableFilters: true,
      canDrag: false,
      Cell: ({ row }) =>
        !isOffline && (
          <Fragment>
            <HtmlTooltip title="Edit">
              <IconButton
                size="small"
                aria-label="Clone"
                onClick={() => {
                  setShowCostDialog(true);
                  setSelectedCostData(row?.original);
                }}
              >
                <EditIcon color="primary" fontSize='small' />
              </IconButton>
            </HtmlTooltip>
            {permissions?.rentalManagement?.isUpdate && allowedToEdit ? (
              <HtmlTooltip title="Delete" >
                <IconButton size="small" aria-label="Delete" onClick={() => {
                  setDeleteData([row?.original?._id]);
                }}>
                  <DeleteIcon color="error" fontSize='small' />
                </IconButton>
              </HtmlTooltip>
            ) : (
              <HtmlTooltip className="cursor-stop" title={`You do not have permission to delete rentalManagement`}>
                <IconButton size="small" aria-label="Delete">
                  <DeleteIcon fontSize='small' />
                </IconButton>
              </HtmlTooltip>
            )}
          </Fragment>
        )
    });

    setColumns(column);
    fetchAdditionalCost();
    setNextStep(false);
  };

  const fetchAdditionalCost = async () => {
    setNextStep(false);
    try {
      var data: any = [];
      if (isOffline) {
        data = await findOne(objectStore.rentalManagement, rentalManagementData._id);
        data = data?.additionalCost;
      } else {
        const response = await axiosInstance().get(`${rentalManagement.api}/additionalcost/${rentalManagementData._id}`);
        data = response?.data?.data;
      }

      data.forEach((parent, i) => {
        parent.srno = i + 1;
        parent.qtyDisplay = parent.qty;
        parent.isValid = parent['finalPrice_' + rentalManagementData?.currency?.toLowerCase()] ? true : !isRateRequired;
      });

      setRowsData(data);
      setNextStep(true);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleAddCost = (rows) => {
    axiosInstance()
      .post(`${rentalManagement.api}/additionalcost/${rentalManagementData._id}/add`, { additionalCost: rows })
      .then(() => {
        fetchAdditionalCost();
        setShowCostDialog(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleUpdateCost = (rows) => {
    axiosInstance()
      .put(`${rentalManagement.api}/additionalcost/${rentalManagementData._id}/update`, { additionalCost: rows })
      .then(() => {
        fetchAdditionalCost();
        setShowCostDialog(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = (ids) => {
    setDeleting(true);
    axiosInstance()
      .post(`${rentalManagement.api}/additionalcost/${rentalManagementData._id}/delete`, { ids })
      .then(() => {
        fetchAdditionalCost();
        setDeleting(false);
        setDeleteData(null);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setDeleteData(null);
      });
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const rowData = flattenArray(rowsData)?.find((d) => d._id === updatedData._id);
    let rows: any = [{ ...rowData, ...updatedData }];
    rows = await calculateRowsField(flattenArray(rowsData), inputField, allFields, updatedData);
    handleUpdateCost(rows)
  };

  return (
    <Fragment>
      {allowedToEdit && (
        <Box display="flex" justifyContent="space-between" m={1}>
          <Box display="flex">
            <Button
              color="primary"
              variant="contained"
              size="small"
              disabled={isOffline}
              onClick={() => {
                setShowCostDialog(true);
                setSelectedCostData(null);
              }}
            >
              Add
            </Button>
          </Box>
          <Box display="flex" ml={1}>
            <Button
              variant={'outlined'}
              color="primary"
              size="small"
              onClick={handleClick}
              disabled={!Boolean(selectedProducts && selectedProducts.filter((e) => !e.hideSelection).length)}
              endIcon={<BiChevronDown />}
            >
              Actions
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={open}
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left'
              }}
              onClose={handleClose}
            >
              <HtmlTooltip title={Boolean(selectedProducts && selectedProducts.length) ? 'Delete selected records' : 'Select records to delete'}>
                <MenuItem
                  disabled={isDeleting}
                  onClick={() => {
                    setDeleteData(selectedProducts?.map(({ _id }: any) => _id));
                    handleClose()
                  }}
                >
                  Delete
                </MenuItem>
              </HtmlTooltip>
            </Menu>
          </Box>
        </Box>
      )}
      {columns && rowsData ? (
        <Box zIndex={5} width={'100%'} height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}>
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
            columns={columns}
            data={rowsData}
            setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
            onSelect={setSelectedProducts}
            childrenProperty="subRows"
            uniqueKey="_id"
            hideSelection={isOffline || !allowedToEdit}
            hideAction={isOffline || !allowedToEdit}
            renderedFrom="rental_management_sevices_1"
            onSaveEdit={onSaveInlineEdit}
            isClientSideGrid={true}
            hideExpander={true}
          />
        </Box>
      )
        : (
          <Box p={2} height={500} bgcolor="white">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      {showCostDialog && (
        <AdditionalCostDialog
          onClose={() => {
            setShowCostDialog(false);
            setSelectedCostData(null);
          }}
          handleAddCost={handleAddCost}
          handleUpdateCost={handleUpdateCost}
          currency={rentalManagementData?.currency}
          costData={selectedCostData}
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
    </Fragment>
  );
};

export default AdditionalCost;
