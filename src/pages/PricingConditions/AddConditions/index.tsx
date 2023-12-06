import React, { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import {
  MenuItem,
  Grid,
  Box,
  Button,
  IconButton,
  Menu
} from '@material-ui/core';
import { Autocomplete, Skeleton } from '@material-ui/lab';
import Add from '@material-ui/icons/Add';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import {
  pricingCondition,
  gridLoadingTimeout,
  PRICING_TYPE
} from '../../../constants/helpers';
import EditIcon from '@material-ui/icons/Edit';
import CustomAgGrid, { intialState, reducer } from '../../../components/AgGridComponents/CustomAgGrid';
import { CommonRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';
import GridDeleteIcon from '../../../components/Helpers/GridDeleteIcon';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import ConditionDialog from './ConditionDialog';
import { camelCase, startCase } from 'lodash';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { ExpandMore } from '@material-ui/icons';
import { isMobile, isTablet } from 'react-device-detect';
import styles from '../../Leads/Header.module.scss';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import AssignPackageDialog from 'src/components/AssignRolesDialog/AssignPackageDialog';

const AddConditions = ({ pricingConditionId, detailData }) => {
  const renderFrom = camelCase(`${routes?.pricingCondition.title}_condition_selected`);
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
  const [addMaterialDialog, setAddMaterialDialog] = useState({ open: false, materialType: '' });

  const [condition, setCondition] = useState(null);
  const [showDialog, setShowDialog] = useState({ open: false, isBulkedit: false });
  const [conditionData, setConditionData] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [addAnchorEl, setAddAnchorEl] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const localStorageSelectedRecords = `${renderFrom}_selected`;
  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCondition();
  }, [pricingConditionId]);

  const fetchCondition = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    setCondition(null);
    axiosInstance()
      .get(`${pricingCondition.api}/condition/${pricingConditionId}`)
      .then(({ data: { data } }) => {
        setCondition(JSON.parse(JSON.stringify(data)));
        data.forEach((element) => {
          element.detail = `${
            element.materialType === 'product'
              ? element.productDetail?.productName
              : element.materialType === 'service'
              ? element.serviceDetail?.serviceName
              : element.packageDetail?.packageName
          }`;
          element.materialType = startCase(element.materialType);
          element.conditionType = PRICING_TYPE?.filter((e) => element.conditionType?.includes(e.optionValue))
            ?.map((e) => e.optionLabel)
            ?.toString();
          element.unit = element.unit?.toString();
          element.pricingMethod = element.pricingMethod?.toString();
        });
        dispatch({ type: 'initialize', data: data, count: data.length });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
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
        localStorage.removeItem(localStorageSelectedRecords);
      })
      .catch((error) => {
        setDeleteRecord(null);
        setShowDeleteConfirmBox(false);
        localStorage.removeItem(localStorageSelectedRecords);
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

  const DetailRenderer = (params) => (
    <Fragment>
      <p
        onClick={() => {
          handleOpen(params.data._id);
        }}
        className="link text-truncate"
        title={params.data.detail}
      >
        {params.data.detail}
      </p>
      <Box ml={1}>
        <IconButton
          size="small"
          onClick={() => {
            window.open(
              `${
                params.data.materialType === 'Product'
                  ? routes.productDetail.path
                  : params.data.materialType === 'Service'
                  ? routes.serviceMasterDetail.path
                  : routes.packagesDetail.path
              }/${params.data.materialId}`
            );
          }}
        >
          <OpenInNewIcon fontSize="small" color="primary" />
        </IconButton>
      </Box>
    </Fragment>
  );

  const ActionsRenderer = (params) => (
    <>
      <HtmlTooltip title="Edit">
        <IconButton
          size="small"
          aria-label="Edit"
          onClick={() => {
            handleOpen(params.data._id);
          }}
        >
          <EditIcon color="primary" />
        </IconButton>
      </HtmlTooltip>
      <GridDeleteIcon
        hasDeletePermission={permissions?.pricingCondition?.isUpdate}
        ownerId={user?.user?._id}
        userId={user?.user?._id}
        onDelete={() => {
          setDeleteRecord(params.data);
          setShowDeleteConfirmBox(true);
        }}
        entity="pricingCondition"
      />
    </>
  );

  const frameworkComponents = {
    detailRenderer: DetailRenderer,
    actionsRenderer: ActionsRenderer,
    commonRenderer: CommonRenderer
  };

  const columns = [
    { field: 'detail', headerName: 'Detail', show: true, disabled: true, cellRenderer: 'detailRenderer' },
    { field: 'materialType', headerName: 'Type', show: true, disabled: true, cellRenderer: 'commonRenderer' },
    { field: 'conditionType', headerName: 'Pricing Type', disabled: true, show: true, cellRenderer: 'commonRenderer' },
    { field: 'unit', headerName: 'Unit', show: true, disabled: true, cellRenderer: 'commonRenderer' },
    { field: 'pricingMethod', headerName: 'Pricing Method', show: true, disabled: true, cellRenderer: 'commonRenderer' }
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
                closeAddActions();
                setAddMaterialDialog({ open: true, materialType: 'product' });
              }}
            >
              Add Products
            </MenuItem>
            <MenuItem
              onClick={() => {
                closeAddActions();
                setAddMaterialDialog({ open: true, materialType: 'package' });
              }}
            >
              Add Packages
            </MenuItem>
            <MenuItem
              onClick={() => {
                closeAddActions();
                setAddMaterialDialog({ open: true, materialType: 'service' });
              }}
            >
              Add Services
            </MenuItem>
          </Menu>
        </Box>
        <Box display="flex">
          <Button
            variant={isMobile && !isTablet ? 'text' : 'outlined'}
            color="default"
            size="small"
            className={`${isMobile && !isTablet ? 'mobile_button' : styles.action_submit_btn} new-dropdown-v1`}
            onClick={openActions}
            aria-controls="action-menu"
            disabled={selectedRecords.length ? false : true}
            endIcon={<ExpandMore />}
          >
            {isMobile && !isTablet ? '' : 'Actions'}
          </Button>
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
          </Menu>
          <Box ml={2}>
            <ImportExportLinks
              permissions={permissions.pricingCondition}
              module="pricingCondition(s)"
              api={pricingCondition.api}
              afterImportCompleted={() => {
                fetchCondition();
              }}
              isExportAllOrSomeFeature={true}
              total={rowCount}
              recordsToExport={selectedRecords.length}
              onExportToExcelSuccess={() => {
                if (gridApi) gridApi.deselectAll();
                else fetchCondition();
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
                  api: `${pricingCondition.api}/template?export=true&materialType=product&child=true&ids=${JSON.stringify([pricingConditionId])}`,
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
                  api: `${pricingCondition.api}/template?export=true&materialType=package&child=true&ids=${JSON.stringify([pricingConditionId])}`,
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
                  api: `${pricingCondition.api}/template?export=true&materialType=service&child=true&ids=${JSON.stringify([pricingConditionId])}`,
                  type: 'export'
                },
                {
                  title: 'Service Import',
                  api: `${pricingCondition.api}/import?materialType=service&child=true&ids=${JSON.stringify([pricingConditionId])}`,
                  type: 'import'
                }
              ]}
            />
          </Box>
        </Box>
      </Box>
      <Grid item xs={12} md={12} sm={12} className="mt-3">
        {columns && condition ? (
          <CustomAgGrid
            columns={columns}
            dataRows={dataRows}
            frameworkComponents={frameworkComponents}
            setGridApi={setGridApi}
            dispatch={dispatch}
            rowCount={rowCount}
            limit={limit}
            pageSizes={pageSizes}
            page={page}
            allowAction={true}
            loading={loading}
            isClientSideGrid={true}
            selectedRecords={selectedRecords}
            renderedFrom={renderFrom}
            refreshGrid={fetchCondition}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Grid>
      {addMaterialDialog.open && addMaterialDialog.materialType === 'product' && (
        <AssignProductDialog
          handleCloseDialog={() => setAddMaterialDialog({ open: false, materialType: '' })}
          onSuccess={(product) => {
            handleAdd(product);
          }}
          //ids={condition?.filter(c => c?.materialType === addMaterialDialog.materialType)?.map((e) => e.materialId)}
          isSubmitting={isSubmitting}
          hideQty={true}
        />
      )}
      {addMaterialDialog.open && addMaterialDialog.materialType === 'package' && (
        <AssignPackageDialog
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
          handleClose={() => {
            setAddMaterialDialog({ open: false, materialType: '' });
          }}
          //ids={condition?.filter(c => c?.materialType === addMaterialDialog.materialType)?.map((e) => e.materialId)}
          isSubmitting={isSubmitting}
          hideQty={true}
        />
      )}
      {addMaterialDialog.open && addMaterialDialog.materialType === 'service' && (
        <AssignServiceDialog
          onSuccess={(services) => {
            handleAdd(services);
          }}
          handleClose={() => {
            setAddMaterialDialog({ open: false, materialType: '' });
          }}
          //ids={condition?.filter(c => c?.materialType === addMaterialDialog.materialType)?.map((e) => e.materialId)}
          isSubmitting={isSubmitting}
          hideQty={true}
        />
      )}
      {showDialog.open && conditionData && (
        <ConditionDialog
          conditionData={conditionData}
          detailData={detailData}
          isBulkedit={showDialog.isBulkedit}
          pricingConditionId={pricingConditionId}
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
