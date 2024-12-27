import Box from '@mui/material/Box/Box';
import { useState, useEffect, useContext } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import routes from '../../../components/Helpers/Routes';
import Grid from '@mui/material/Grid2';
import axiosInstance from 'src/axios/axiosInstance';
import {
  CHILD_RESOURCE,
  DELIVERY_TICKET_REFERENCE_TYPE,
  DELIVERY_TICKET_TYPE,
  MATERIAL_TYPE,
  deliveryTicket,
  sidebarResource
} from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { IconButton, MenuItem, TextField } from '@mui/material';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@mui/icons-material/Delete';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import { useData } from 'src/StateProvider/Provider';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { isMobile, isTablet } from 'react-device-detect';
import Autocomplete from '@mui/material/Autocomplete';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import EditIcon from '@mui/icons-material/Edit';
import { camelCase } from 'lodash';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import { FiExternalLink } from 'react-icons/fi';
import MaterialDialog from 'src/pages/SubcontractAssembly/Material/MaterialDialog';

const Consumables = ({ allowedToEdit, products, subcontractAssemblyData, material, fetchMaterial, stepFullScreen, productFields }) => {
  const renderedFrom = `${camelCase(sidebarResource?.subcontractAssembly)}_Consumables`;
  const toastConfig = useContext(CustomToastContext);
  const [columns, setColumns] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [consumablesDialog, setConsumablesDialog] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [productOption, setProductOption] = useState(null);
  const [selectedProductOption, setSelectedProductOption] = useState({ optionLabel: 'All', optionValue: 'All', receivedQty: 1 });
  const [allConsumables, setAllConsumables] = useState([]);
  const [isConsumableEdit, setIsConsumableEdit] = useState({ open: false, data: null });
  const [isSubmitting, setSubmitting] = useState(false);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();

  useEffect(() => {
    setProductOption([
      { optionLabel: 'All', optionValue: 'All' },
      ...products?.map((s) => {
        return {
          optionLabel: s?.productName,
          optionValue: s?._id,
          receivedQty: s?.receivedQty || 0
        };
      })
    ]);
    if (selectedProductOption?.optionValue !== 'All' && !products?.some((s) => s?._id === selectedProductOption?.optionValue)) {
      setSelectedProductOption({ optionLabel: 'All', optionValue: 'All', receivedQty: 1 });
    }
  }, [products]);

  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    fetchColumns();
  }, [subcontractAssemblyData]);

  useEffect(() => {
    if (columns) {
      fetchData();
    }
  }, [columns, material]);

  const fetchColumns = async () => {
    var fields = await fetch_child_resource_fields(CHILD_RESOURCE.subcontractAssemblyMaterial, subcontractAssemblyData?.currency, allowedToEdit);
    setAllFields(JSON.parse(JSON.stringify(fields)));
    const newColumns = generateColumns(renderedFrom, fields, null, false, subcontractAssemblyData?.currency);
    const column: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        cell: ({ row }) => <p className="text-truncate">{row?.original?.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      }
    ];

    productFields?.forEach((e) => {
      if (e?.fieldName === 'productName') {
        column.push({
          accessor: e?.fieldName,
          Header: e?.fieldLabel,
          width: 200,
          disabled: true,
          sticky: isMobile || isTablet ? 'none' : 'left',
          primaryField: true,
          cell: ({ row }) => (
            <div className="flex items-center gap-2">
              {allowedToEdit && row?.original?.canEdit ? (
                <p
                  onClick={() => {
                    setIsConsumableEdit({ open: true, data: row?.original });
                  }}
                  className="link text-truncate"
                  title={row?.original[e?.fieldName]}
                >
                  {row?.original[e?.fieldName]}
                </p>
              ) : (
                <p className="text-truncate">{row?.original[e?.fieldName]}</p>
              )}
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.productDetail.path}/${row.original?.materialId}`);
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </div>
          )
        });
      } else {
        column.push({
          accessor: e?.fieldName,
          Header: e?.fieldLabel,
          width: 200,
          cell: ({ row }) => {
            return row.original[e?.fieldName] ? <p className="text-truncate">{row.original[e?.fieldName]}</p> : <NoDataCell />;
          }
        });
      }
    });

    const extracolumns: any = [
      ...newColumns,
      {
        accessor: 'action',
        Header: 'Actions',
        width: 150,
        minWidth: 100,
        sticky: 'right',
        disableFilters: true,
        disableSortBy: true,
        canDrag: false,
        Cell: ({ row }: any) => (
          <>
            <HtmlTooltip title={'Edit'}>
              <IconButton
                size="small"
                aria-label="Delete"
                disabled={!row?.original?.canEdit}
                onClick={() => {
                  setIsConsumableEdit({ open: true, data: row?.original });
                }}
              >
                <EditIcon fontSize="small" color={row?.original?.canEdit ? 'primary' : 'disabled'} />
              </IconButton>
            </HtmlTooltip>
            <HtmlTooltip title={'Delete'}>
              <span>
                <IconButton
                  size="small"
                  aria-label="Delete"
                  disabled={!row?.original?.canDelete}
                  onClick={() => {
                    const obj: any = [{ id: row.original._id, materialId: row.original?.materialId }];
                    setDeleteData(obj);
                  }}
                >
                  <DeleteIcon fontSize="small" color={row?.original?.canDelete ? 'error' : 'disabled'} />
                </IconButton>
              </span>
            </HtmlTooltip>
          </>
        )
      }
    ];

    setColumns([...column, ...extracolumns]);
  };

  const fetchData = async () => {
    try {
      dispatch({ type: 'loading', loading: true });
      dispatch({ type: 'selection', selectedRecords: [] });

      const result = await axiosInstance().get(
        `${deliveryTicket.api}/typewise?referenceType=${DELIVERY_TICKET_REFERENCE_TYPE.subcontractAssembly}&referenceId=${subcontractAssemblyData._id}&ticketType=${DELIVERY_TICKET_TYPE.delivery}`
      );
      let deliveryTicketProducts = [];
      result?.data?.data?.forEach((e) => {
        deliveryTicketProducts = [...deliveryTicketProducts, ...e.products];
      });

      let rows = material?.filter((ele: any) => ele.parentId);
      rows?.forEach((parent, i) => {
        parent.productName = parent?.productDetail?.productName;
        parent.productDescription = parent?.productDetail?.productDescription;
        parent.productNumber = parent?.productDetail?.productNumber;
        parent.canEdit = !deliveryTicketProducts?.some((ele: any) => ele?.product === parent?.materialId && ele?.uniqueId === parent?._id);
        parent.canDelete = parent.canEdit;
        parent.parent = parent?.parentId;
        parent.parentId = null;
      });
      setAllConsumables(rows);
      if (selectedProductOption?.optionValue !== 'All') {
        rows = rows?.filter((ele: any) => ele.parent === selectedProductOption?.optionValue);
      }
      rows?.forEach((e, i) => {
        e.index = i + 1;
      });
      dispatch({ type: 'initialize', data: rows || [], count: rows?.length || 0 });
      dispatch({ type: 'loading', loading: false });
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    }
  };

  const addMaterial = async (rows) => {
    setSubmitting(true);
    const material: any = [];
    rows.forEach((d) => {
      const element: any = {};
      element.materialId = d._id;
      element.type = MATERIAL_TYPE.product;
      element.unit = d?.unitMain && d?.unitMain?.length ? d.unitMain[0] : d?.unit ? d?.unit : '';
      element.qty = d.qty ? parseFloat(d.qty) : 1;
      element.parentId = selectedProductOption?.optionValue;
      material.push(element);
    });

    await axiosInstance()
      .post(`${routes.subcontractAssembly.path}/${subcontractAssemblyData?._id}/material`, { material })
      .then(() => {
        fetchMaterial();
        setConsumablesDialog(false);
        setSubmitting(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setSubmitting(false);
      });
  };

  const handleDelete = async (rows) => {
    try {
      setDeleting(true);
      const material = rows?.map((ele) => ({ id: ele.id, materialId: ele.materialId }));
      if (material?.length) {
        await axiosInstance().put(`${routes.subcontractAssembly.path}/${subcontractAssemblyData?._id}/material/delete`, { ids: material });
      }
      setDeleting(false);
      fetchMaterial();
      setDeleteData(null);
    } catch (error) {
      setDeleting(false);
      toastConfig.setToastConfig(error);
      setDeleteData(null);
    }
  };

  const handleSaveData = async (rows: any) => {
    rows?.forEach((element: any) => {
      if (element.parent) {
        element.parentId = element.parent;
        delete element.parent;
      }
    });
    try {
      setSubmitting(true);
      await axiosInstance().put(`${routes.subcontractAssembly.path}/${subcontractAssemblyData?._id}/material`, { material: rows });
      fetchMaterial();
      setIsConsumableEdit({ open: false, data: null });
      setSubmitting(false);
    } catch (error) {
      setSubmitting(false);
      toastConfig.setToastConfig(error);
    }
  };

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    dispatch({ type: 'update', data: [] });
    setTabValue(newValue);
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={isDeleting || selectedRecords.some((ele) => !ele?.canDelete)}
          onClick={() => {
            setDeleteData(
              selectedRecords?.map((d) => {
                return {
                  id: d?._id,
                  materialId: d?.materialId
                };
              })
            );
          }}
        >
          Delete
        </MenuItem>
      </>
    );
  };

  return (
    <>
      {allowedToEdit && productOption?.length > 0 && state && (
        <Box style={{ maxWidth: '400px' }} mb={3}>
          <Autocomplete
            size="small"
            style={{ minWidth: '300px' }}
            fullWidth
            options={productOption ? productOption : []}
            autoHighlight
            id={'select-product-dropdown'}
            value={selectedProductOption}
            getOptionLabel={(option: any) => option?.optionLabel || ''}
            isOptionEqualToValue={(option, val) => (option ? option?.optionLabel === val?.optionLabel : false)}
            onChange={(_, val) => {
              let value = val;
              if (!val) {
                value = { optionLabel: 'All', optionValue: 'All' };
              }
              let rows = allConsumables;
              if (value.optionValue !== 'All') {
                rows = allConsumables?.filter((ele) => ele.parent === value.optionValue);
              }
              rows?.forEach((e, i) => {
                e.index = i + 1;
              });
              dispatch({ type: 'update', data: rows });
              setSelectedProductOption(value);
            }}
            renderInput={(params) => <TextField {...params} label={'Select Product'} variant="outlined" />}
          />
        </Box>
      )}
      <CustomTabs value={tabValue} onChange={handleMainTabChange} style={{ marginBottom: -1 }}>
        <CustomTab value={0} label={'Products/Consumables'} primaryColor={true} />
      </CustomTabs>
      <TabPanel value={tabValue} index={0}>
        <Box className="container-with-border" p={2} style={{ WebkitBorderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
          <DetailsPageHeader
            isAddButtonVisible={selectedProductOption?.optionValue !== 'All' && !selectedProductOption?.receivedQty}
            addButtonProps={{ onClick: () => setConsumablesDialog(true), id: 'add-consumable-button' }}
            actionButtonProps={{ disabled: !Boolean(selectedRecords && selectedRecords.length) }}
            actionButtonMenuItems={actionButtonMenuItems()}
            hasXpadding
            isActionButtonVisible={allowedToEdit}
          />
          <Grid container spacing={2}>
            <Grid size={{xs:12, md:12, sm:12}}>
              {columns ? (
                <CustomReactTable
                  height={stepFullScreen ? 'calc(100vh - 300px)' : '300px'}
                  columns={columns}
                  state={state}
                  dispatch={dispatch}
                  renderedFrom={renderedFrom}
                  isClientSideGrid={true}
                  hideSelection={!allowedToEdit}
                  hideAction={!allowedToEdit}
                  refreshGrid={fetchMaterial}
                />
              ) : (
                <Box p={2} height={300}>
                  <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Box>
              )}
            </Grid>
          </Grid>
        </Box>
      </TabPanel>
      {consumablesDialog && (
        <AssignProductDialog
          handleCloseDialog={() => setConsumablesDialog(false)}
          ids={dataRows?.map((d) => d?.materialId)}
          onSuccess={(rows) => {
            addMaterial(rows);
          }}
          serialized={false}
          isSubmitting={isSubmitting}
          pricingCondition={subcontractAssemblyData?.pricingCondition?.optionValue || null}
        />
      )}

      {isConsumableEdit.open && (
        <MaterialDialog
          onClose={() => {
            setIsConsumableEdit({ open: false, data: null });
          }}
          handleSaveData={handleSaveData}
          subcontractAssemblyData={subcontractAssemblyData}
          rowData={isConsumableEdit.data}
          material={[...products, ...allConsumables]}
          allFields={allFields}
          loading={isSubmitting}
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

export default Consumables;
