import React, { useState, useEffect, useContext, Fragment } from 'react';
import { Box, IconButton } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import { useData } from 'src/StateProvider/Provider';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { gridLoadingTimeout, isObjectEmpty } from 'src/constants/helpers';
import CustomReactTable, { gridFilterParser, useTableReducer } from 'src/components/CustomReactTable';
import { MdAddShoppingCart } from 'react-icons/md';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import { prepareDataForGrid } from '../../../constants/helpers';
import { Link } from 'react-router-dom';
import { Image } from '@material-ui/icons';
import routes from '../../../components/Helpers/Routes';
import NoDataCell from '../../../components/Helpers/NoDataCell';

const ProductGridLayout = ({ renderedFrom, setAssignCartProductQty, plantId, searchVal, productCategory, refreshData }) => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, permissions }
  }: any = useData();
  const [columns, setColumns] = useState([]);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, search, filters, sorting } = state;

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = () => {
    let columns = [
      {
        accessor: 'productName',
        Header: 'Product Name',
        width: 200,
        Cell: ({ row }) => {
          return row.original?.productName ? (
            <Link
              className="link text-truncate"
              title={row?.original?.productName}
              to={`${routes.posProductDetail.path}/${row?.original?._id}/${row?.original?.plantId}`}
            >
              {row.original?.productName}
            </Link>
          ) : (
            <NoDataCell />
          );
        }
      },
      {
        accessor: 'availableInventory',
        Header: 'Available Inventory',
        width: 200,
        Cell: ({ row }) => {
          return row.original?.availableInventory ? <p className="text-truncate">{row.original.availableInventory}</p> : <NoDataCell />;
        }
      },
      // {
      //   accessor: 'productCategory',
      //   Header: 'Product Category',
      //   isVisible: false,
      //   width: 200,
      //   Cell: ({ row }) => {
      //     return row.original?.productCategory ? <p className="text-truncate">{row.original.productCategory}</p> : <NoDataCell />;
      //   }
      // },
      // {
      //   accessor: 'productImage',
      //   Header: 'Product Image',
      //   show: false,
      //   width: 200,
      //   Cell: ({ row }) => {
      //     return row?.original?.productImage ? <div><Avatar className="grid-avatar" src={row?.original?.productImage}>
      //     <Image style={{ fontSize: 18 }} />
      //   </Avatar> </div> : <NoDataCell />;
      //   }
      // },
      ActionsRenderer
    ];
    setColumns(columns);
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 110,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title={row?.original?.availableInventory ? 'Add to cart' : 'No inventory'}>
          <span>
            <IconButton
              size="small"
              disabled={!row?.original?.availableInventory || row?.original?.availableInventory === 0}
              aria-label="Add to cart"
              onClick={() => {
                setAssignCartProductQty(row?.original);
              }}
              color={row?.original?.availableInventory ? 'secondary' : 'inherit'}
            >
              <MdAddShoppingCart />
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
  }, [page, limit, filters, sorting, search, plantId, productCategory, refreshData]);

  useEffect(() => {
    dispatch({ type: 'search', search: searchVal });
  }, [searchVal]);

  const getQueryString = () => {
    let deepFilter = `&page=${page}&limit=${limit}`;

    const { deepFilters } = gridFilterParser(filters);

    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}&filterType=and`;
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
    let api = `/pos?warehouse=${plantId}${queryString}`;
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
          hideSelection={true}
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
