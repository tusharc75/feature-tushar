import { Box, MenuItem } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { Autocomplete } from '@material-ui/lab';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { RiBillLine } from 'react-icons/ri';
import { useHistory } from 'react-router-dom';
import AssignDynamicDialog from 'src/components/AssignRolesDialog/AssignDynamicDialog';
import CustomContainer from 'src/components/CustomContainer';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { childDisable, cloneDisable, deleteDisable } from 'src/constants/messageHelpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import routes from '../../components/Helpers/Routes';
import CreateProduct from '../../components/Product/CreateProduct';
import ImportExportLinks from '../../components/Product/ImportExportLinks';
import { gridLoadingTimeout, prepareDataForGrid, product, sidebarResource } from '../../constants/helpers';
import axios, { CancelTokenSource } from 'axios';
import { useSetWalkmeData } from 'src/components/CustomIntro';
import { createResourceFlow } from 'src/components/CustomIntro/walkmeSteps';

const ignoreField = ['qty', 'priceTemplate'];

const Product = () => {
  const renderedFrom = camelCase(routes?.product.title);
  const { setWalkmeData } = useSetWalkmeData();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState(null);
  const [isClone, setIsClone] = useState(false);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [columns, setColumns] = useState(null);

  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const [productCategoryList, setProductCategoryList] = useState([]);
  const [productTemplateList, setProductTemplateList] = useState([]);
  const [productCategory, setProductCategory] = useState(null);
  const [productTemplate, setProductTemplate] = useState(null);
  const [isProductTemplate, setIsProductTemplate] = useState(true);

  const [productType, setProductType] = useState(null);
  const [productTypeList, setProductTypeList] = useState([]);
  const [isProductType, setIsProductType] = useState(false);
  const [productColumns, setProductColumns] = useState(null);
  const {
    state: { permissions, selectedEntity }
  }: any = useData();
  const { generateColumns } = useColumns();
  useEffect(() => {
    if (permissions?.productCategory?.isRead) {
      axiosInstance()
        .get('/product-category?sortBy=name&orderBy=asc')
        .then(({ data: { data } }) => {
          setProductCategoryList(data);
        });
    }
  }, [selectedEntity]);

  useEffect(() => {
    if (isProductTemplate) {
      if (productCategory && productCategory !== '') {
        axiosInstance()
          .post(`/product-template/template/` + productCategory, { entity: null })
          .then(({ data: { data } }) => {
            setProductTemplateList(data.data);
            setProductTemplate(null);
          });
      } else {
        setProductTemplateList([]);
        setProductTemplate(null);
      }
    }
  }, [productCategory]);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    if (productColumns && productColumns.length) {
      const cancelTokenSource = axios.CancelToken.source();
      fetchData(cancelTokenSource);
      return () => cancelTokenSource.cancel();
    }
  }, [page, limit, filters, sorting, search, selectedEntity, productCategory, productTemplate, productType, showFilteredRecordsOnly, productColumns]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.product}&view=true`)
      .then(({ data: { data } }) => {
        setWalkmeData([createResourceFlow(sidebarResource.product, data)]);
        if (data.filter((e) => e.fieldData.fieldName === 'productTemplate').length === 0) {
          setIsProductTemplate(false);
        }
        const productTypes = data.find((e) => e.fieldData.fieldName === 'productType');
        if (productTypes) {
          setIsProductType(true);
          setProductTypeList([...productTypes.fieldData.option]);
          let defaultOptions = productTypes.fieldData?.option?.filter((item: any) => item.default === true);
          if (defaultOptions.length) {
            setProductType(defaultOptions[0].optionValue);
          }
        } else {
          setIsProductType(false);
        }
        const newColumns = generateColumns(
          renderedFrom,
          data?.filter((d) => !ignoreField.includes(d?.fieldData.fieldName)),
          routes.productDetail.path,
          true
        );
        setProductColumns([...newColumns]);
      });
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 150,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title={permissions?.product?.isCreate ? 'Clone' : cloneDisable}>
          <span>
            <IconButton
              disabled={permissions?.product.isCreate ? false : true}
              size="small"
              aria-label="Clone"
              onClick={() => {
                setProductId(row?.original._id);
                setOpen(true);
                setIsClone(true);
              }}
            >
              <FileCopyIcon fontSize="small" color={permissions?.product?.isCreate ? 'primary' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>

        <HtmlTooltip title={permissions?.product?.isDelete ? 'Delete' : deleteDisable}>
          <span>
            <IconButton
              disabled={permissions?.product.isDelete ? false : true}
              size="small"
              aria-label="Delete"
              onClick={() => {
                setDeleteRecord(row?.original);
                setShowDeleteConfirmBox(true);
              }}
            >
              <DeleteIcon color={permissions?.product.isDelete ? 'error' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
        {(permissions?.serializedAsset?.isRead || permissions?.productionOrder?.isRead) && (
          <HtmlTooltip title={permissions?.product?.isUpdate ? 'Child Product' : childDisable}>
            <span>
              <IconButton
                disabled={permissions?.product?.isUpdate ? false : true}
                size="small"
                aria-label="View Child Product"
                onClick={() => {
                  history.push(`${routes.productDetail.path}/${row?.original._id}/bom`, { productName: row?.original.productName });
                }}
              >
                <RiBillLine fontSize={'20px'} color={permissions?.product?.isUpdate ? 'primary' : 'disabled'} />
              </IconButton>
            </span>
          </HtmlTooltip>
        )}
      </>
    )
  };

  const fetchData = (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${product.api}${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data }) => {
        let rows = data?.data?.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['canDelete'] = permissions?.product.isDelete;
          return finalObject;
        });
        let columns = [...productColumns];
        data.productTemplate?.forEach((ele) => {
          const newColumns = generateColumns(renderedFrom, ele.fields);
          columns = [...columns, ...newColumns];
        });
        columns = columns.filter((item, index, self) => index === self.findIndex((t) => t.accessor === item.accessor));
        columns = [...columns, ...getStaticFields()];
        setColumns([...columns, ActionsRenderer]);
        dispatch({ type: 'initialize', data: rows, count: data?.count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = !isExport ? `?page=${page}&limit=${limit}` : '?';
    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (productType && productType !== '') {
      deepFilters.push({ field: 'productType', term: productType });
    }
    if (productType && productType !== '') {
      deepFilters.push({ field: 'productType', term: productType });
    }
    if (productCategory && productCategory !== '') {
      filterByIds.push({ field: 'productCategory', term: productCategory });
    }
    if (productTemplate && productTemplate !== '') {
      filterByIds.push({ field: 'productTemplate', term: productTemplate });
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
    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }

    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify(selectedRecords.map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((d) => d._id);
    }
    axiosInstance()
      .put(`/product/remove`, { ids })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleSubmit = (ids: string[]) => {
    setSubmitting(true);
    axiosInstance()
      .post(`${routes.product.path}/assign-repair-type`, {
        repairType: ids,
        ids: selectedRecords.map((d: { _id: string }) => d._id)
      })
      .then(() => {
        fetchData();
        setSubmitting(false);
        setOpenAddDialog(false);
      })
      .catch((err) => {
        setSubmitting(false);
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: routes.product.title }]} />
        <ImportExportLinks
          module={routes.product.title}
          permission={permissions.product}
          api={product.api}
          refrenceId={null}
          onSuccessfulImport={(isImportedSuccessfully) => {
            if (isImportedSuccessfully) {
              fetchData();
            }
          }}
          isExportAllOrSomeFeature={true}
          total={rowCount}
          recordsToExport={selectedRecords?.length}
          ids={selectedRecords?.map((obj) => obj._id)}
          onExportToExcelSuccess={() => {
            fetchData();
          }}
          additionalParams={getQueryString(true)}
          extraImportExportLinks={[
            {
              title: 'Child Product Template',
              api: `${product.api}/unknown/bom/template`,
              type: 'download'
            },
            {
              title: 'Child Product Export',
              api: `${product.api}/unknown/bom/template?export=true${selectedRecords.length ? `&ids=${selectedRecords.map((obj) => obj._id)}` : ''}`,
              type: 'export'
            },
            {
              title: 'Child Product Import',
              api: `${product.api}/unknown/bom/import`,
              type: 'import'
            },
            {
              title: 'Service/Consumable Template',
              api: `${product.api}/unknown/service-master/template`,
              type: 'download'
            },
            {
              title: 'Service/Consumable Export',
              api: `${product.api}/unknown/service-master/template?export=true${
                selectedRecords.length ? `&ids=${selectedRecords.map((obj) => obj._id)}` : ''
              }`,
              type: 'export'
            },
            {
              title: 'Service/Consumable Import',
              api: `${product.api}/unknown/service-master/import`,
              type: 'import'
            },
            {
              title: 'Service Package Template',
              api: `${product.api}/unknown/package/template`,
              type: 'download'
            },
            {
              title: 'Service Package Export',
              api: `${product.api}/unknown/package/template?export=true${
                selectedRecords.length ? `&ids=${selectedRecords.map((obj) => obj._id)}` : ''
              }`,
              type: 'export'
            },
            {
              title: 'Service Package Import',
              api: `${product.api}/unknown/package/import`,
              type: 'import'
            }
          ]}
        />
      </div>
      <CustomContainer>
        <ListingPageHeader
          leftSideContents={
            <LeftSideContent
              {...{
                permissions,
                productCategoryList,
                productCategory,
                setProductCategory,
                isProductTemplate,
                productTemplateList,
                productTemplate,
                setProductTemplate,
                isProductType,
                productTypeList,
                productType,
                setProductType
              }}
            />
          }
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={true}
          actionButtonProps={{ disabled: selectedRecords.length ? false : true }}
          actionMenuItems={<ActionMenuItems {...{ permissions, selectedRecords, setOpenAddDialog, setShowDeleteConfirmBox }} />}
          addButtonOnclick={() => {
            setOpen(true);
          }}
          isAddButtonVisible={permissions?.product?.isCreate}
        />
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            resource={sidebarResource.product}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomContainer>
      {open && (
        <CreateProduct
          isClone={isClone}
          productId={productId}
          handleClose={() => {
            setProductId(null);
            setOpen(false);
            fetchData();
          }}
          isRedirectToDetailPage={true}
          openFrom="productMaster"
        />
      )}
      {openAddDialog && (
        <AssignDynamicDialog
          resource={sidebarResource?.repairType}
          onSuccess={(data) => {
            handleSubmit(data?.map((d) => d?._id));
          }}
          handleClose={() => {
            setOpenAddDialog(false);
          }}
          ids={[]}
          isSubmitting={isSubmitting}
        />
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete the product ${deleteRecord?._id ? deleteRecord?.productName : ''} ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
    </section>
  );
};

export default Product;

const LeftSideContent = ({
  permissions,
  productCategoryList,
  productCategory,
  setProductCategory,
  isProductTemplate,
  productTemplateList,
  productTemplate,
  setProductTemplate,
  isProductType,
  productTypeList,
  productType,
  setProductType
}) => {
  return (
    <>
      {permissions?.productCategory?.isRead ? (
        <div className="w-full md:w-auto">
          <Autocomplete
            className="flex-grow sm:max-w-[250px] md:min-w-[250px] md:flex-grow-0"
            options={productCategoryList}
            getOptionLabel={(option: any) => (option ? option.name : '')}
            size="small"
            getOptionSelected={(option: any, val) => option._id === val}
            value={
              productCategoryList.filter((data) => data._id === productCategory).length
                ? productCategoryList.filter((data) => data._id === productCategory)[0]
                : ''
            }
            onChange={(e, val) => {
              setProductCategory(val && val._id ? val._id : '');
            }}
            renderInput={(params) => (
              <TextField {...params} margin="none" size="small" name="productCategory" label="Product Category" variant="outlined" fullWidth />
            )}
          />
        </div>
      ) : null}
      {isProductTemplate && (
        <Autocomplete
          className="flex-grow sm:max-w-[250px] md:min-w-[250px] md:flex-grow-0"
          options={productTemplateList}
          getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
          getOptionSelected={(option: any, val) => option.optionValue === val}
          value={
            productTemplateList.filter((data) => data.optionValue === productTemplate).length
              ? productTemplateList.filter((data) => data.optionValue === productTemplate)[0]
              : ''
          }
          onChange={(e, val) => {
            setProductTemplate(val && val.optionValue ? val.optionValue : '');
          }}
          renderInput={(params) => (
            <TextField {...params} margin="none" size="small" name="productTemplate" label="Product Template" variant="outlined" fullWidth />
          )}
        />
      )}
      {isProductType && (
        <Autocomplete
          className="flex-grow sm:max-w-[250px] md:min-w-[250px] md:flex-grow-0"
          options={productTypeList}
          getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
          getOptionSelected={(option: any, val) => option.optionValue === val}
          value={
            productTypeList.filter((data) => data.optionValue === productType).length
              ? productTypeList.filter((data) => data.optionValue === productType)[0]
              : ''
          }
          onChange={(e, val) => {
            setProductType(val && val.optionValue ? val.optionValue : '');
          }}
          renderInput={(params) => (
            <TextField {...params} margin="none" size={'small'} name="productType" label="Product Type" variant="outlined" fullWidth />
          )}
        />
      )}
    </>
  );
};

const ActionMenuItems = ({ permissions, selectedRecords, setOpenAddDialog, setShowDeleteConfirmBox }) => {
  return (
    <>
      <MenuItem
        disabled={selectedRecords.every((e) => e.canDelete) ? false : true}
        onClick={() => {
          setShowDeleteConfirmBox(true);
        }}
      >
        {`Delete (${selectedRecords.length})`}
      </MenuItem>
      {permissions?.repairType?.isRead && (
        <MenuItem
          disabled={!permissions?.product.isUpdate && !permissions?.hasOwnProperty('repairType')}
          onClick={() => {
            setOpenAddDialog(true);
          }}
        >
          {`Assign ${routes?.repairType?.title} (${selectedRecords.length})`}
        </MenuItem>
      )}
    </>
  );
};
