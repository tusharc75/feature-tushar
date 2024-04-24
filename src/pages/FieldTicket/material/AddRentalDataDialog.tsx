import { Box, Dialog, IconButton } from '@material-ui/core';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { camelCase, startCase } from 'lodash';
import { useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { MATERIAL_TYPE, rentalManagement } from 'src/constants/helpers';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { fetch_rental_product_fields } from 'src/components/RentalManagment/helper';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { isMobile, isTablet } from 'react-device-detect';

const AddRentalDataDialog = ({
  onSuccess,
  onClose,
  rentalId,
  type, 
  isSubmitting = false,
  currency,
}) => {
  const renderedFrom = `${camelCase(routes?.rentalManagement.title)}_grid1`;

  const { state, dispatch } = useTableReducer();
  const { search, selectedRecords } = state;
  const { generateColumns } = useColumns();

  const [columns, setColumns] = useState(null);

  useEffect(() => {
    fetchFields();
    fetchData();
  }, []);

  const fetchFields = async () => {
    var data = [];
    data = await fetch_rental_product_fields(currency, false);
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
          accessor: 'type',
          Header: 'Type',
          disableFilters: true,
          disabled: true,
          sticky: isMobile || isTablet ? 'none' : 'left',
          width: 200,
          Cell: ({ row }) =>
            row.original['type'] ? (
              <p>
                {`${startCase(row.original?.type)} `}
                {row.original['type'] === MATERIAL_TYPE.product
                  ? row.original?.productDetail?.serializedProduct
                    ? '(Serialized)'
                    : '(Non-Serialized)'
                  : ''}
              </p>
            ) : (
              <NoDataCell />
            )
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
              <IconButton
                size="small"
                onClick={() => {
                    window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                }}
              >
                <OpenInNewIcon fontSize="small" color="primary" />
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

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    var data: any = [];
    var inventory: any = [];
    var material: any = [];   
  const response = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalId}`);
  data = response?.data?.data;

  material = data.material.filter((ele)=> ele.type===MATERIAL_TYPE.product).filter((e) => !e?.productDetail?.serializedProduct);
  let inventoryData = data?.inventory;
  inventory = data?.material.filter((ele)=> ele.type===MATERIAL_TYPE.product && inventoryData.some((e)=> e._id===ele._id));
  
   let rows = [];
   rows = type===MATERIAL_TYPE.product ? [...material] : [...inventory];
   
    rows.forEach((parent, i) => {
        parent.index = i + 1;
        parent.detail = `${parent.productDetail?.productName}`;
        parent.description = parent?.productDetail?.productDescription;
        parent.qtyDisplay = parent.qty;
      });
    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };


  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  return (
    <Dialog fullWidth maxWidth="md" fullScreen={true} open={true} onClose={onClose} aria-labelledby="assign-roles-dialog">
      <CustomDialogHeader title={type===MATERIAL_TYPE.product ?`Add Rental Consumables` : `Add Rental Assets`} showManimizeMaximize={false} showRequiredLabel={false} onClose={onClose} />
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
              onSuccess(selectedRecords);
            }}
            isAddButtonVisible
            setQueryString={false}
          />

          
          {columns ? (
            <CustomReactTable
              height={'calc(100vh - 250px)'}
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
