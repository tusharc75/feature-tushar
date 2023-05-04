import React, { useState, useEffect, Fragment, useContext, useReducer } from 'react';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import AddIcon from '@material-ui/icons/Add';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import { Link } from 'react-router-dom';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import { RiPriceTag2Fill } from 'react-icons/ri';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import MessageDialog from '../../components/Helpers/MessageDialog';
import CustomContainer from '../../components/CustomContainer';
import routes from '../../components/Helpers/Routes';
import CreateNewDialog from './CreateNewDialog';
import { CreatedByRenderer, UpdatedByRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';
import CustomAgGrid, { intialState, reducer } from '../../components/AgGridComponents/CustomAgGrid';
import { Menu, MenuItem } from '@material-ui/core';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import { gridLoadingTimeout, prepareDataForGrid } from '../../constants/helpers';
import { useData } from '../../StateProvider/Provider';
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import { isMobile } from 'react-device-detect';
import { useHistory } from 'react-router-dom';
import styles from '../Leads/Header.module.scss';
import { MdAdd } from 'react-icons/all';
import { camelCase } from 'lodash';

const ProductBuilder = () => {
  const renderedFrom = camelCase(routes?.productBuilder.title);
  const {
    state: {
      permissions: { productBuilder: permission },
      user: { user }
    }
  } = useData();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [isCreate, setIsCreate] = useState(false);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false);
  // const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [okButtonLoading] = useState(false);

  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;

  const columns = [
    {
      field: 'name',
      headerName: 'Name',
      show: true,
      disabled: true,
      cellRenderer: 'nameRenderer'
    },
    {
      field: 'createdBy',
      headerName: 'Created By',
      show: true,
      sortable: false,
      cellRenderer: 'createdByRenderer'
    }
  ];
  //  Grid Variables - End

  useEffect(() => {
    fetchProductBuilder();
  }, []);

  const NameRenderer = (params) => (
    <Link className="link" to={`${routes.productBuilder.path}/${params.data.id}`}>
      {params.data.name}
    </Link>
  );

  const ActionsRenderer = (params) => {
    const hasPermission = permission?.isDelete;
    return (
      <span title={hasPermission ? '' : "You don't have permission to delete"}>
        <IconButton
          disabled={hasPermission ? false : true}
          size="small"
          aria-label="Delete"
          onClick={() => {
            setDeleteRecord(params.data);
            setShowDeleteConfirmBox(true);
          }}
        >
          <DeleteIcon color={hasPermission ? 'error' : 'disabled'} />
        </IconButton>
      </span>
    );
  };

  const fetchProductBuilder = () => {
    dispatch({ type: 'loading', loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
    }

    axiosInstance()
      .get(`/productbuilder`)
      .then(({ data: { data } }) => {
        let rows = data.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['canDelete'] = permission.isDelete;
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permission.isUpdate;
          return {
            ...finalObject
          };
        });

        dispatch({ type: 'initialize', data: rows, count: data.length });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const handleDelete = () => {
    if (deleteRecord) {
      axiosInstance()
        .delete(`/productbuilder/` + deleteRecord._id)
        .then(() => {
          fetchProductBuilder();
          setShowDeleteConfirmBox(false);
          setDeleteRecord(null);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .put(
          `/productbuilder/remove`,
          selectedRecords.map((d) => d._id)
        )
        .then(() => {
          fetchProductBuilder();
          setShowDeleteConfirmBox(false);
          setDeleteRecord(null);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const frameworkComponents = {
    nameRenderer: NameRenderer,
    createdByRenderer: CreatedByRenderer,
    updatedByRenderer: UpdatedByRenderer,
    actionsRenderer: ActionsRenderer
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const showConfirmBox = (row) => {
    if (row) {
      setShowDeleteConfirmBox(true);
      if (row) {
        setDeleteRecord({ id: row.id, name: row.name });
      }
    } else {
      const notYou = selectedRecords.filter((d) => d.createdById !== user?._id);
      if (notYou.length) {
        setShowDeleteWarningConfirmBox(true);
      } else {
        setShowDeleteConfirmBox(true);
      }
    }
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={12} sm={12} xs={12}>
          <CustomBreadCrumbs routes={[{ title: routes.productBuilder.title }]} />
        </Grid>
      </Grid>
      <CustomContainer>
        <div className="header-panel">
          <Grid container>
            <Grid item xs={6} className="d-flex align-items-center gap-1"></Grid>
            <Grid item xs={6} className="d-flex justify-content-end">
              {permission?.isCreate && (
                <Button
                  onClick={() => setIsCreate(true)}
                  variant={isMobile ? 'text' : 'contained'}
                  size="small"
                  color="primary"
                  className={isMobile ? 'mobile_button' : styles.add_submit_btn}
                  startIcon={isMobile ? null : <AddOutlined />}
                >
                  {isMobile ? <MdAdd size={23} /> : 'Add'}
                </Button>
              )}
              {permission?.isDelete && (
                <Button
                  className={isMobile ? 'mobile_button ml-2' : `${styles.action_submit_btn} ${'ml-2'}`}
                  // className={styles.action_submit_btn}
                  variant={isMobile ? 'text' : 'outlined'}
                  color="default"
                  size="small"
                  onClick={openActions}
                  aria-controls="action-menu"
                  disabled={selectedRecords.length > 0 ? false : true}
                  endIcon={<ExpandMore />}
                >
                  {isMobile ? '' : 'Actions'}
                </Button>
              )}
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
                  onClick={() => {
                    showConfirmBox(null);
                    closeActions();
                  }}
                >
                  Delete
                </MenuItem>
              </Menu>
            </Grid>
          </Grid>
        </div>
        {isMobile ? (
          <CustomSwipableList
            allowSelection={true}
            allowSwipe={true}
            permissions={permission}
            primaryField={columns?.find((d) => d.field === 'name')}
            onClick={(d) => {
              history.push(`${routes.productBuilder.path}/${d.id}`);
            }}
            dataRows={dataRows}
            selectedRecords={selectedRecords}
            dispatch={dispatch}
            onEdit={(d) => {
              history.push(`${routes.productBuilder.path}/${d.id}`);
            }}
            extraParamsToCheckDelete={true}
            onDelete={(d) => {
              setDeleteRecord(d);
              setShowDeleteConfirmBox(true);
            }}
            rowCount={rowCount}
            page={page}
            loading={loading}
            additionalDetails={[]}
            chips={[]}
            owerCollaboratorInitialsOrImages=""
            onCreate={false}
            showClone={false}
            onClone={() => {}}
            renderedFrom={renderedFrom}
          />
        ) : (
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
            allowSelection={true}
            actionWidth={100}
            isClientSideGrid={true}
            loading={loading}
            renderedFrom={renderedFrom}
            refreshGrid={fetchProductBuilder}
          />
        )}
        {showDeleteWarningConfirmBox ? (
          <MessageDialog
            open={showDeleteWarningConfirmBox}
            message={`You are trying to delete records which you do not have permission to delete, Please remove those records from selection and try again.`}
            onClose={() => setShowDeleteWarningConfirmBox(false)}
          />
        ) : null}
        {showDeleteConfirmBox && (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete ${deleteRecord ? deleteRecord.name : 'selected product(s)'}?`}
            onClose={() => {
              setDeleteRecord(null);
              setShowDeleteConfirmBox(false);
            }}
            onOk={handleDelete}
            okBtnLoading={okButtonLoading}
          />
        )}
        {isCreate && <CreateNewDialog handleClose={() => setIsCreate(false)} />}
      </CustomContainer>
    </Fragment>
  );
};

export default ProductBuilder;
