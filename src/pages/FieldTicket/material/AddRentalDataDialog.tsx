import { Box, Dialog, IconButton } from '@material-ui/core';
import { camelCase } from 'lodash';
import { useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { CustomDialogTransition, MATERIAL_TYPE, RENTAL_INTERNAL_ASSET_STATUS, rentalManagement, sidebarResource } from 'src/constants/helpers';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { fetch_rental_product_fields } from 'src/components/RentalManagment/helper';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { isMobile, isTablet } from 'react-device-detect';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';
import { FiExternalLink } from 'react-icons/fi';

const AddRentalDataDialog = ({ onSuccess, onClose, rentalId, type, isSubmitting = false, currency, ids = [] }) => {
  const renderedFrom = `${camelCase(sidebarResource.fieldTicket)}_Rental_Material`;

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { search, selectedRecords } = state;
  const { generateColumns } = useColumns();

  const [columns, setColumns] = useState(null);
  const [allFields, setAllFields] = useState([]);

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    if (allFields?.length) {
      fetchData();
    }
  }, [allFields]);

  const fetchFields = async () => {
    var data = [];
    data = await fetch_rental_product_fields(currency, false);
    data = data?.filter((f) => f?.isRead);
    setAllFields(JSON.parse(JSON.stringify(data)));
    data?.forEach((e) => {
      e.isColumnEditable = false;
    });
    const newColumns = generateColumns(
      renderedFrom,
      data?.map((e) => {
        return { ...e, fieldName: e.fieldName === 'qty' ? 'qtyDisplay' : e.fieldName };
      }),
      null,
      false,
      currency
    );
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
          <div className="flex items-center gap-2">
            {row.original['detail'] ? <p className="text-truncate">{row.original.detail}</p> : <NoDataCell />}
            <IconButton
              size="small"
              onClick={() => {
                if (row.original['type'] === MATERIAL_TYPE.product) {
                  window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                } else if (row.original['type'] === MATERIAL_TYPE.serializedAsset) {
                  window.open(`${routes.serializedAssetDetail.path}/${row.original.materialId}`);
                } else if (row.original['type'] === MATERIAL_TYPE.package) {
                  window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                }
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
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
      }
    ];
    column = [...column, ...newColumns];
    setColumns(column);
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.index = parent.index + '.' + (j + 1);
      _subRow.detail =
        _subRow.type === MATERIAL_TYPE.product
          ? _subRow?.productDetail?.productName
          : _subRow.type === MATERIAL_TYPE.service
            ? _subRow?.serviceDetail?.serviceName
            : _subRow.type === MATERIAL_TYPE.package
              ? _subRow?.packageDetail?.packageName
              : _subRow.type === MATERIAL_TYPE.manualEntry
                ? _subRow?.detail || ''
                : '';
      _subRow.description =
        _subRow.type === MATERIAL_TYPE.service
          ? _subRow?.serviceDetail?.serviceDescription || ''
          : _subRow.type === MATERIAL_TYPE.product
            ? _subRow?.productDetail?.productDescription || ''
            : _subRow.type === MATERIAL_TYPE.package
              ? _subRow?.packageDetail?.packageDescription || ''
              : _subRow.description || '';
      _subRow.qtyDisplay = _subRow.qty * parent.qtyDisplay;
      _subRow.subRows = generateNestedData(material, _subRow);
      _subRow.hideSelection = true;
    });
    return subRows;
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    var data: any = [];
    let rows = [];
    const response = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalId}`);
    data = response?.data?.data;
    if (type === MATERIAL_TYPE.product) {
      rows = data?.material?.filter(
        (e) =>
          e?.status &&
          e?.status !== RENTAL_INTERNAL_ASSET_STATUS.reserved &&
          e.type === MATERIAL_TYPE.product &&
          !e?.productDetail?.serializedProduct &&
          !ids?.some((ele) => ele === e.materialId)
      );
      rows.forEach((parent, i) => {
        parent.index = i + 1;
        parent.type = MATERIAL_TYPE.product;
        parent.detail = parent?.productDetail?.productName;
        parent.description = parent?.productDetail?.productDescription;
        parent.qtyDisplay = parent.qty;
      });
    } else if (type === MATERIAL_TYPE.serializedAsset) {
      let inventoryData = data?.inventory || [];
      inventoryData = inventoryData?.filter(
        (e) => e?.status !== RENTAL_INTERNAL_ASSET_STATUS.reserved && !ids?.some((ele) => ele === e?.inventoryDetail?._id)
      );
      inventoryData.forEach((parent, i) => {
        const product = data?.material?.find((e) => e._id === parent._id);
        const obj: any = { ...product };
        const calValues = autoCalculateSpecificFields({ qty: 1 }, obj, allFields);
        Object.assign(obj, calValues);
        obj.index = i + 1;
        obj.type = MATERIAL_TYPE.serializedAsset;
        obj.detail = parent?.inventoryDetail?.assetNumber;
        obj.qtyDisplay = 1;
        obj.qty = 1;
        obj.materialId = parent?.inventoryDetail?._id;
        obj._id = parent?.inventoryDetail?._id;
        rows.push(obj);
      });
    } else if (type === MATERIAL_TYPE.package) {
      let material = data?.material?.filter((e) => e.type === MATERIAL_TYPE.package && !ids?.some((ele) => ele === e._id));
      rows = material?.filter((e) => !e?.parentId);
      rows.forEach((parent, i) => {
        parent.index = i + 1;
        parent.type = MATERIAL_TYPE.package;
        parent.detail = parent?.packageDetail?.packageName;
        parent.description = parent?.packageDetail?.packageDescription;
        parent.qtyDisplay = parent.qty;
        parent.subRows = generateNestedData(material, parent);
      });
    }
    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      fullScreen={true}
      TransitionComponent={CustomDialogTransition}
      open={true}
      onClose={onClose}
      aria-labelledby="assign-roles-dialog"
    >
      <CustomDialogHeader
        title={
          type === MATERIAL_TYPE.product ? `Add Rental Consumables` : type === MATERIAL_TYPE.package ? `Add Rental Packages` : `Add Rental Assets`
        }
        showManimizeMaximize={false}
        showRequiredLabel={false}
        onClose={onClose}
      />
      <CustomDialogContent isFooterPresent={false}>
        <>
          <ListingPageHeader
            searchValue={search}
            onSearch={handleSearch}
            isActionButtonVisible={false}
            addButtonProps={{
              iconsEnabled: false,
              disabled: isSubmitting || selectedRecords?.length === 0,
              loading: isSubmitting,
              text: selectedRecords?.length > 0 ? `(${selectedRecords?.length})` : ''
            }}
            addButtonOnclick={() => {
              onSuccess(selectedRecords, allFields);
            }}
            isAddButtonVisible
            setQueryString={false}
          />
          {columns ? (
            <CustomReactTable
              height={'calc(100vh - 200px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              refreshGrid={fetchData}
              isClientSideGrid={true}
              expander={type === MATERIAL_TYPE.package}
            />
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </>
      </CustomDialogContent>
    </Dialog>
  );
};

export default AddRentalDataDialog;
