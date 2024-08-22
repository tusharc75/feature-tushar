import { useState, useEffect, useContext, Fragment } from 'react';
import { MenuItem, Grid, Box, Button, IconButton, Menu } from '@material-ui/core';
import Add from '@material-ui/icons/Add';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { pricingCondition, gridLoadingTimeout, PRICING_TYPE, sidebarResource, MATERIAL_TYPE } from '../../../constants/helpers';
import EditIcon from '@material-ui/icons/Edit';
import VisibilityIcon from '@material-ui/icons/Visibility';
import DeleteIcon from '@material-ui/icons/Delete';
import CustomReactTable, { gridFilterParser, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import ConditionDialog from './ConditionDialog';
import { camelCase, startCase } from 'lodash';
import { ExpandMore } from '@material-ui/icons';
import { isMobile, isTablet } from 'react-device-detect';
import styles from '../../Leads/Header.module.scss';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import AssignDynamicDialog from 'src/components/AssignRolesDialog/AssignDynamicDialog';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { addDisable, deleteDisable, editDisable, updateDisable } from 'src/constants/messageHelpers';
import { FiExternalLink } from 'react-icons/fi';

const AddConditions = ({ pricingConditionId, detailData }) => {
  const renderFrom = camelCase(`${routes?.pricingCondition.title}_condition_selected`);
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions }
  }: any = useData();

  const { state, dispatch } = useTableReducer();
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly, dataRows } = state;
  const [addMaterialDialog, setAddMaterialDialog] = useState({ open: false, materialType: '' });
  const [condition, setCondition] = useState(null);
  const [showDialog, setShowDialog] = useState({ open: false, isBulkedit: false });
  const [conditionData, setConditionData] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [addAnchorEl, setAddAnchorEl] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCondition();
  }, [page, limit, sorting, pricingConditionId, filters, showFilteredRecordsOnly, search]);

  const fetchCondition = () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    const queryString = getQueryString();

    axiosInstance()
      .get(`${pricingCondition.api}/condition/${pricingConditionId}${queryString}`)
      .then(({ data: { data, count } }) => {
        setCondition(JSON.parse(JSON.stringify(data)));
        data.forEach((element) => {
          element.detail = `${
            element.materialType === MATERIAL_TYPE.product
              ? element.productDetail?.productName
              : element.materialType === MATERIAL_TYPE.service
                ? element.serviceDetail?.serviceName
                : element.materialType === MATERIAL_TYPE.package
                  ? element.packageDetail?.packageName
                  : element.competencyDetail.competencyName
          }`;
          element.materialType = startCase(element.materialType);
          element.conditionType = PRICING_TYPE?.filter((e) => element.conditionType?.includes(e.optionValue))
            ?.map((e) => e.optionLabel)
            ?.toString();
          element.unit = element.unit?.toString();
          element.pricingMethod = element.pricingMethod?.toString();
        });
        dispatch({ type: 'initialize', data: data, count: count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;

    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

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
    return deepFilter;
  };

  const handleAdd = (rows) => {
    setSubmitting(true);
    const condition: any = [];
    rows.forEach((d) => {
      const element: any = {};
      element.materialId = d._id;
      element.materialType = addMaterialDialog.materialType;
      condition.push(element);
    });

    axiosInstance()
      .post(`${pricingCondition.api}/condition/${pricingConditionId}`, { condition })
      .then(({ data: { data } }) => {
        setAddMaterialDialog({ open: false, materialType: '' });
        fetchCondition();
        setSubmitting(false);
      })
      .catch((error) => {
        setSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((d) => d._id);
    }
    axiosInstance()
      .post(`${pricingCondition.api}/condition/remove/${pricingConditionId}`, { ids: ids })
      .then(() => {
        fetchCondition();
        setAnchorEl(null);
        setDeleteRecord(null);
        setShowDeleteConfirmBox(false);
      })
      .catch((error) => {
        setDeleteRecord(null);
        setShowDeleteConfirmBox(false);
        toastConfig.setToastConfig(error);
      });
  };
  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const closeActions = () => {
    setAnchorEl(null);
  };

  const handleOpen = (id) => {
    const result = condition.filter((e) => e._id === id);
    if (result.length) {
      setShowDialog({ open: true, isBulkedit: false });
      setConditionData(result[0]);
    }
  };

  const columns = [
    {
      accessor: 'detail',
      Header: 'Detail',
      disabled: true,
      Cell: ({ row }) =>
        row?.original?.detail ? (
          <div className="flex items-center gap-2">
            <h5
              className="link text-truncate"
              onClick={() => {
                handleOpen(row?.original._id);
              }}
            >
              {row?.original?.detail}
            </h5>
            <IconButton
              size="small"
              onClick={() => {
                window.open(
                  `${
                    row?.original?.materialType === 'Product'
                      ? routes.productDetail.path
                      : row?.original?.materialType === 'Service'
                        ? routes.serviceMasterDetail.path
                        : row?.original?.materialType === 'Package'
                          ? routes.packagesDetail.path
                          : routes?.competenciesDetail.path
                  }/${row?.original?.materialId}`
                );
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>
        ) : (
          <NoDataCell />
        )
    },
    {
      accessor: 'materialType',
      Header: 'Type',
      disabled: true,
      Cell: ({ row }) => (row?.original?.materialType ? <h5 className="text-truncate">{row?.original?.materialType}</h5> : <NoDataCell />)
    },
    {
      accessor: 'conditionType',
      Header: 'Pricing Type',
      disabled: true,
      Cell: ({ row }) => (row?.original?.conditionType ? <h5 className="text-truncate">{row?.original?.conditionType}</h5> : <NoDataCell />)
    },
    {
      accessor: 'unit',
      Header: 'Unit',
      disabled: true,
      Cell: ({ row }) => (row?.original?.unit ? <h5 className="text-truncate">{row?.original?.unit}</h5> : <NoDataCell />)
    },
    {
      accessor: 'pricingMethod',
      Header: 'Pricing Method',
      disabled: true,
      Cell: ({ row }) => (row?.original?.pricingMethod ? <h5 className="text-truncate">{row?.original?.pricingMethod}</h5> : <NoDataCell />)
    },
    {
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
          {permissions?.pricingCondition?.isUpdate ? (
            <HtmlTooltip title="Edit">
              <IconButton
                size="small"
                aria-label="Edit"
                onClick={() => {
                  handleOpen(row?.original?._id);
                }}
              >
                <EditIcon fontSize="small" color="primary" />
              </IconButton>
            </HtmlTooltip>
          ) : (
            <HtmlTooltip title="View">
              <IconButton
                size="small"
                aria-label="View"
                onClick={() => {
                  handleOpen(row?.original?._id);
                }}
              >
                <VisibilityIcon fontSize="small" color="primary" />
              </IconButton>
            </HtmlTooltip>
          )}
          <HtmlTooltip title={permissions?.pricingCondition?.isUpdate ? 'Delete' : deleteDisable}>
            <span>
              <IconButton
                size="small"
                aria-label="Delete"
                disabled={!permissions?.pricingCondition?.isUpdate}
                onClick={() => {
                  setDeleteRecord(row?.original);
                  setShowDeleteConfirmBox(true);
                }}
              >
                <DeleteIcon fontSize="small" color={permissions?.pricingCondition?.isUpdate ? 'error' : 'disabled'} />
              </IconButton>
            </span>
          </HtmlTooltip>
        </>
      )
    }
  ];

  const openAddActions = (event) => {
    setAddAnchorEl(event.currentTarget);
  };

  const closeAddActions = () => {
    setAddAnchorEl(null);
  };

  return (
    <Fragment>
      <Box display="flex" justifyContent="space-between" m={1} mt={2}>
        <Box display="flex" gridGap={'8px'} flexWrap={'wrap'}>
          <HtmlTooltip title={permissions?.pricingCondition?.isUpdate ? 'Add' : addDisable}>
            <span>
              <Button
                variant={'outlined'}
                color="primary"
                size="small"
                startIcon={<Add />}
                onClick={openAddActions}
                disabled={!permissions?.pricingCondition?.isUpdate}
                aria-controls="add-menu"
              >
                {'Add'}
                <ExpandMore fontSize="small" />
              </Button>
            </span>
          </HtmlTooltip>
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
            {permissions?.product?.isRead && (
              <MenuItem
                onClick={() => {
                  closeAddActions();
                  setAddMaterialDialog({ open: true, materialType: MATERIAL_TYPE.product });
                }}
              >
                Add Existing Products
              </MenuItem>
            )}
            {permissions?.packages?.isRead && (
              <MenuItem
                onClick={() => {
                  closeAddActions();
                  setAddMaterialDialog({ open: true, materialType: MATERIAL_TYPE.package });
                }}
              >
                Add Existing Packages
              </MenuItem>
            )}
            {permissions?.serviceMaster?.isRead && (
              <MenuItem
                onClick={() => {
                  closeAddActions();
                  setAddMaterialDialog({ open: true, materialType: MATERIAL_TYPE.service });
                }}
              >
                Add Existing Services
              </MenuItem>
            )}
            {permissions?.competencies?.isRead && (
              <MenuItem
                onClick={() => {
                  closeAddActions();
                  setAddMaterialDialog({ open: true, materialType: 'competency' });
                }}
              >
                Add Existing Competencies
              </MenuItem>
            )}
          </Menu>
        </Box>
        <Box display="flex">
          <Box>
            <ImportExportLinks
              permissions={permissions.pricingCondition}
              module={routes.pricingCondition.title}
              api={pricingCondition.api}
              afterImportCompleted={() => {
                fetchCondition();
              }}
              isExportAllOrSomeFeature={true}
              total={rowCount}
              recordsToExport={selectedRecords.length}
              onExportToExcelSuccess={() => {
                fetchCondition();
              }}
              hideDefaultImportExport={true}
              extraImportExportLinks={[
                {
                  title: 'Product Template',
                  api: `${pricingCondition.api}/template?materialType=product&child=true&ids=${JSON.stringify([pricingConditionId])}`,
                  type: 'download'
                },
                {
                  title: 'Product Export',
                  api: `${pricingCondition.api}/template?export=true&materialType=product&child=true&ids=${JSON.stringify([pricingConditionId])}&uniqueIds=${JSON.stringify(selectedRecords?.map((e) => e._id))}`,
                  type: 'export'
                },
                {
                  title: 'Product Import',
                  api: `${pricingCondition.api}/import?materialType=product&child=true&ids=${JSON.stringify([pricingConditionId])}`,
                  type: 'import'
                },
                {
                  title: 'Package Template',
                  api: `${pricingCondition.api}/template?materialType=package&child=true&ids=${JSON.stringify([pricingConditionId])}`,
                  type: 'download'
                },
                {
                  title: 'Package Export',
                  api: `${pricingCondition.api}/template?export=true&materialType=package&child=true&ids=${JSON.stringify([pricingConditionId])}&uniqueIds=${JSON.stringify(selectedRecords?.map((e) => e._id))}`,
                  type: 'export'
                },
                {
                  title: 'Package Import',
                  api: `${pricingCondition.api}/import?materialType=package&child=true&ids=${JSON.stringify([pricingConditionId])}`,
                  type: 'import'
                },
                {
                  title: 'Service Template',
                  api: `${pricingCondition.api}/template?materialType=service&child=true&ids=${JSON.stringify([pricingConditionId])}`,
                  type: 'download'
                },
                {
                  title: 'Service Export',
                  api: `${pricingCondition.api}/template?export=true&materialType=service&child=true&ids=${JSON.stringify([pricingConditionId])}&uniqueIds=${JSON.stringify(selectedRecords?.map((e) => e._id))}`,
                  type: 'export'
                },
                {
                  title: 'Service Import',
                  api: `${pricingCondition.api}/import?materialType=service&child=true&ids=${JSON.stringify([pricingConditionId])}`,
                  type: 'import'
                }
              ]}
              ids={[pricingConditionId]}
            />
          </Box>
          <Box ml={2}>
            <HtmlTooltip title={permissions?.pricingCondition?.isUpdate ? '' : updateDisable}>
              <span>
                <Button
                  variant={isMobile && !isTablet ? 'text' : 'outlined'}
                  color="default"
                  size="small"
                  className={`${isMobile && !isTablet ? 'mobile_button' : styles.action_submit_btn} new-dropdown-v1`}
                  onClick={openActions}
                  aria-controls="action-menu"
                  disabled={selectedRecords.length && permissions?.pricingCondition?.isUpdate ? false : true}
                  endIcon={<ExpandMore />}
                >
                  {isMobile && !isTablet ? '' : 'Actions'}
                </Button>
              </span>
            </HtmlTooltip>
            <Menu
              anchorEl={anchorEl}
              keepMounted
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left'
              }}
              id="action-menu"
              open={Boolean(anchorEl)}
              onClose={closeActions}
            >
              <span onClick={closeActions}>
                <MenuItem
                  disabled={!Boolean(selectedRecords && selectedRecords?.length > 1 && dataRows?.length > 1)}
                  onClick={() => {
                    setShowDialog({ open: true, isBulkedit: true });
                    setConditionData(condition.filter((data) => selectedRecords.some((rec) => rec._id === data._id)));
                  }}
                >
                  Bulk Edit
                </MenuItem>
                <MenuItem
                  disabled={!Boolean(selectedRecords && selectedRecords.length && dataRows?.length)}
                  onClick={() => {
                    setShowDeleteConfirmBox(true);
                  }}
                >
                  Delete
                </MenuItem>
              </span>
            </Menu>
          </Box>
        </Box>
      </Box>
      <Grid item xs={12} md={12} sm={12} className="mt-3">
        {columns && condition ? (
          <CustomReactTable
            height={'calc(100vh - 393px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderFrom}
            refreshGrid={fetchCondition}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Grid>
      {addMaterialDialog.open && addMaterialDialog.materialType === MATERIAL_TYPE.product && (
        <AssignDynamicDialog
          resource={sidebarResource?.product}
          onSuccess={(data) => {
            handleAdd(data);
          }}
          handleClose={() => {
            setAddMaterialDialog({ open: false, materialType: '' });
          }}
          ids={condition?.filter((c) => c?.materialType === addMaterialDialog.materialType)?.map((e) => e.materialId)}
          isSubmitting={isSubmitting}
        />
      )}
      {addMaterialDialog.open && addMaterialDialog.materialType === MATERIAL_TYPE.package && (
        <AssignDynamicDialog
          resource={sidebarResource?.packages}
          onSuccess={(data) => {
            handleAdd(data);
          }}
          handleClose={() => {
            setAddMaterialDialog({ open: false, materialType: '' });
          }}
          ids={condition?.filter((c) => c?.materialType === addMaterialDialog.materialType)?.map((e) => e.materialId)}
          isSubmitting={isSubmitting}
        />
      )}
      {addMaterialDialog.open && addMaterialDialog.materialType === MATERIAL_TYPE.service && (
        <AssignDynamicDialog
          resource={sidebarResource?.serviceMaster}
          onSuccess={(data) => {
            handleAdd(data);
          }}
          handleClose={() => {
            setAddMaterialDialog({ open: false, materialType: '' });
          }}
          ids={condition?.filter((c) => c?.materialType === addMaterialDialog.materialType)?.map((e) => e.materialId)}
          isSubmitting={isSubmitting}
        />
      )}
      {addMaterialDialog.open && addMaterialDialog.materialType === 'competency' && (
        <AssignDynamicDialog
          resource={sidebarResource?.competencies}
          onSuccess={(data) => {
            handleAdd(data);
          }}
          handleClose={() => {
            setAddMaterialDialog({ open: false, materialType: '' });
          }}
          ids={condition?.filter((c) => c?.materialType === addMaterialDialog.materialType)?.map((e) => e.materialId)}
          isSubmitting={isSubmitting}
        />
      )}
      {showDialog.open && conditionData && (
        <ConditionDialog
          conditionData={conditionData}
          detailData={detailData}
          isBulkedit={showDialog.isBulkedit}
          pricingConditionId={pricingConditionId}
          allowedToEdit={permissions?.pricingCondition?.isUpdate}
          handleClose={() => {
            setShowDialog({ open: false, isBulkedit: false });
          }}
          handleSuccess={() => {
            setShowDialog({ open: false, isBulkedit: false });
            fetchCondition();
          }}
        />
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete pricing setup condition  ${
            deleteRecord?.productDetail?.productName || deleteRecord?.packageDetail?.packageName || ''
          } ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
    </Fragment>
  );
};

export default AddConditions;
