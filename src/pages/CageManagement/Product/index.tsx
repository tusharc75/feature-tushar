import React, { useState, useEffect, useContext, Fragment } from 'react';
import { Box, IconButton } from '@material-ui/core';
import { isMobile } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import { useData } from 'src/StateProvider/Provider';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { cageManagement, gridLoadingTimeout, isObjectEmpty } from 'src/constants/helpers';
import CustomReactTable, { gridFilterParser, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import { prepareDataForGrid } from '../../../constants/helpers';
import AddToPhotosOutlinedIcon from '@material-ui/icons/AddToPhotosOutlined';

const ProductGridLayout = ({ renderedFrom, setAssignHistoryProductQty, plantId, searchVal, productCategory, refreshData }) => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, permissions }
  }: any = useData();
  const [columns, setColumns] = useState(null);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, search, filters, sorting, selectedRecords } = state;

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = () => {
    let columns = [
      {
        accessor: 'productName',
        Header: 'Product Name',
        width: 120,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.productName}</p>
      },
      {
        accessor: 'availableInventory',
        Header: 'Inventory',
        width: 120,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.availableInventory}</p>
      },
      ActionsRenderer
    ];
    setColumns(columns);
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 60,
    width: 60,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title={row?.original?.inventory ? 'Pickup' : 'No inventory'}>
          <span>
            <IconButton
              size="small"
              disabled={!row?.original?.inventory || row?.original?.inventory === 0}
              aria-label="Pickup"
              onClick={() => {
                setAssignHistoryProductQty(row?.original);
              }}
              color={row?.original?.inventory ? 'primary' : 'inherit'}
            >
              <AddToPhotosOutlinedIcon fontSize="small" color={'primary'} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  };

  useEffect(() => {
    if (plantId) {
      fetchProducts();
    }
  }, [page, limit, filters, sorting, plantId, productCategory, search, refreshData]);

  useEffect(() => {
    dispatch({ type: 'search', search: searchVal });
  }, [searchVal]);

  const getQueryString = () => {
    let deepFilter = `&page=${page}&limit=${limit}`;

    const { deepFilters } = gridFilterParser(filters);
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    const filterById = [];
    if (productCategory && productCategory !== '') {
      filterById.push({ field: 'productCategory', term: productCategory });
    }
    if (filterById.length) {
      deepFilter = deepFilter + '&filterById=' + JSON.stringify(filterById);
    }
    if (filterById?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }
    return deepFilter;
  };
  const fetchProducts = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    let api = `${cageManagement.api}?warehouse=${plantId}${queryString}`;
    axiosInstance()
      .get(api)
      .then(({ data: { data, count } }) => {
        let rows = data?.map((u) => {
          let finalObject = prepareDataForGrid(u);
          return {
            plantId: plantId,
            ...finalObject
          };
        });
        dispatch({ type: 'initialize', data: rows, count: count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  return (
    <Fragment>
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 200px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          refreshGrid={fetchProducts}
          showOnlyShowFilteredRecordSwitch={false}
          showFilters={false}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Fragment>
  );
};

export default ProductGridLayout;
