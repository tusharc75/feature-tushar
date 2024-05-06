import { Box, Dialog, IconButton } from '@material-ui/core';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { camelCase } from 'lodash';
import { useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { MATERIAL_TYPE, RENTAL_INTERNAL_ASSET_STATUS, rentalManagement } from 'src/constants/helpers';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { fetch_rental_product_fields } from 'src/components/RentalManagment/helper';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { isMobile, isTablet } from 'react-device-detect';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';

const AddRentalDataDialog = ({
  onSuccess,
  onClose,
  rentalId,
  type,
  isSubmitting = false,
  currency,
  ids = []
}) => {

  const renderedFrom = `${camelCase(routes?.fieldTicket.title)}_Rental_Material`;

  const { state, dispatch } = useTableReducer();
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
    setAllFields(JSON.parse(JSON.stringify(data)));
    data?.forEach((e) => {
      e.isColumnEditable = false;
    });
    const newColumns = generateColumns(renderedFrom, data?.map((e) => { return { ...e, fieldName: e.fieldName === 'qty' ? 'qtyDisplay' : e.fieldName } }),
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
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {row.original['detail'] ? <p className="text-truncate">{row.original.detail}</p> : <NoDataCell />}
            <Box pl={1}>
              <IconButton
                size="small"
                onClick={() => {
                  if (row.original['type'] === MATERIAL_TYPE.product) {
                    window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                  }
                  else if (row.original['type'] === MATERIAL_TYPE.serializedAsset) {
                    window.open(`${routes.serializedAssetDetail.path}/${row.original.materialId}`);
                  } else if (row.original['type'] === MATERIAL_TYPE.package) {
                    window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
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
      }
    ];
    column = [...column, ...newColumns];
    setColumns(column);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    var data: any = [];
    let rows = [];
    const response = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalId}`);
    data = response?.data?.data;
    if (type === MATERIAL_TYPE.product) {
      rows = data?.material?.filter((e) => e?.status && e?.status !== RENTAL_INTERNAL_ASSET_STATUS.reserved &&
        e.type === MATERIAL_TYPE.product && !e?.productDetail?.serializedProduct && !ids?.some((ele) => ele === e.materialId));
      rows.forEach((parent, i) => {
        parent.index = i + 1;
        parent.type = MATERIAL_TYPE.product;
        parent.detail = parent?.productDetail?.productName;
        parent.description = parent?.productDetail?.productDescription;
        parent.qtyDisplay = parent.qty;
      });
    } else if (type === MATERIAL_TYPE.serializedAsset) {
      let inventoryData = data?.inventory || [];
      inventoryData = inventoryData?.filter((e) => e?.status !== RENTAL_INTERNAL_ASSET_STATUS.reserved && !ids?.some((ele) => ele === e?.inventoryDetail?._id))
      inventoryData.forEach((parent, i) => {
        const product = data?.material?.find((e) => e._id === parent._id);
        const obj: any = { ...product }
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
      rows = data?.material?.filter((e) => e.type === MATERIAL_TYPE.package && !ids?.some((ele) => ele === e.materialId));
      rows.forEach((parent, i) => {
        parent.index = i + 1;
        parent.type = MATERIAL_TYPE.package;
        parent.detail = parent?.packageDetail?.packageName;
        parent.description = parent?.packageDetail?.packageDescription;
        parent.qtyDisplay = parent.qty;
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
      open={true}
      onClose={onClose}
      aria-labelledby="assign-roles-dialog">
      <CustomDialogHeader
        title={type === MATERIAL_TYPE.product ? `Add Rental Consumables` : type === MATERIAL_TYPE.package ? `Add Rental Packages` : `Add Rental Assets`}
        showManimizeMaximize={false}
        showRequiredLabel={false}
        onClose={onClose} />
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
