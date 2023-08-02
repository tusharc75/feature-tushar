import { useState, FC, useEffect, useContext, useReducer, Fragment } from "react";
import {
  Dialog,
  Grid,
  IconButton,
  Tooltip,
} from "@material-ui/core";
import { entity, gridLoadingTimeout, isObjectEmpty, sidebarResource } from "../../constants/helpers";
import axiosInstance from "../../axios/axiosInstance";
import routes from "./../../components/Helpers/Routes";
import CustomBreadCrumbs from "./../../components/CustomBreadCrumbs";
import EntityHeader from "./Header";
import { useData } from "../../StateProvider/Provider";
import ManageEntity from "./ManageEntity";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import AssignUsersDialog from "../../components/AssignRolesDialog/AssignEntityDialog";
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import ImportExportLinks from "../../components/Helpers/ImportExportLinks";
import CustomContainer from "../../components/CustomContainer";
import { FaUser, FaSuitcase, BsCurrencyExchange, FaAddressCard, IoCreate } from "react-icons/all";
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { prepareDataForGrid } from "../../constants/helpers"
import useColumns, { getStaticFields, getFrameworkComponents } from "../../constants/useColumns"
import GridDeleteIcon from '../../components/Helpers/GridDeleteIcon';
import ResourceTransferDialog from "../../components/ResourceTransferDialog"
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory } from 'react-router-dom'
import CustomSwipableList from "../../components/SwipableListComponents/CustomSwipableList";
import { camelCase } from "lodash";

let entityTimeout;

const Entity: FC = () => {

  const toastConfig = useContext(CustomToastContext);
  const history = useHistory()

  const renderedFrom = camelCase(routes?.entity.title)

  const {
    state: { permissions, user },
  }: any = useData();

  const { getColumnData } = useColumns();
  const [isOpen, setIsOpen] = useState({ open: false, isClone: false, entityId: null });
  const [renderCount, setRenderCount] = useState(0);
  const [usersDialogOpen, setUsersDialogOpen] = useState(false);
  const [usersDialogLoding, setUsersDialogLoding] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [columns, setColumns] = useState([])
  const [frameWorkComponent, setFrameWorkComponent] = useState({})
  const [deleteEntity, setDeleteEntity] = useState<any>({})
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const localStorageSelectedRecords = `${renderedFrom}_selected`

  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const columnState = JSON.parse(localStorage.getItem(renderedFrom));

  if (columnState) {
    columns.map((item) => {
      columnState.map((d) => {
        if (d.colId === item.field) {
          item.show = !d.hide;
        }
      });
    });
  }
  //  Grid Variables - End

  const { entityResource, entityApi } = entity;

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (entityTimeout) {
      clearTimeout(entityTimeout);
    }

    entityTimeout = setTimeout(() => {
      fetchEntity();
    }, millisec);
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchEntity();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, filters, sorting, showFilteredRecordsOnly]);

  useEffect(() => {
    if (selectedRecords.length === 1) {
      fetchEntityUser(selectedRecords[0].id);
    }
    else {
      setUsers([]);
    }
  }, [selectedRecords]);

  useEffect(() => {
    fetchGridColumns()
  }, [])

  const fetchGridColumns = () => {
    axiosInstance()
      .get("/field?resource=Entity")
      .then(({ data: { data } }) => {
        let columns = []
        let rendererNames = []
        data.forEach(o => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.entityDetail.path, true)

          if (currentColumn !== null) {
            columns = [...columns, currentColumn?.columnData]
            if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
              rendererNames.push(currentColumn?.rendererName)
            }
          }
        })
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
        tempFrameworkComponent = {
          ...tempFrameworkComponent,
          actionsRenderer: ActionsRenderer
        }
        setFrameWorkComponent({ ...tempFrameworkComponent })
        columns = [...columns, ...getStaticFields()]
        setColumns([...columns])
      })
  }

  const fetchEntityUser = async (entityId) => {
    setUsersDialogLoding(true)
    await axiosInstance()
      .get(`/user?filterById=[{"field": "entities.entity", "term": "${entityId}"}]`)
      .then(({ data: { data } }) => {
        setUsers(data);
        setUsersDialogLoding(false)
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setUsersDialogLoding(false)

      });
  };


  const ActionsRenderer = params => <>
    <Tooltip
      className={permissions[entityResource]?.isCreate ? "" : "cursor-stop"}
      title={permissions[entityResource]?.isCreate ? "Clone" : "You do not have permission to clone/create"} >
      <span>
        <IconButton
          size="small"
          aria-label="Clone"
          disabled={!permissions[entityResource]?.isCreate}
          onClick={() => {
            setIsOpen({ open: true, isClone: true, entityId: params.data._id })
          }}
        >
          <FileCopyIcon fontSize="small" color={permissions[entityResource]?.isCreate ? "primary" : "inherit"} />
        </IconButton>
      </span>
    </Tooltip>
    {permissions[entityResource]?.isUpdate && permissions?.role.isRead && permissions?.user.isRead ?
      <Tooltip title="Assign users">
        <IconButton
          size="small"
          aria-label="Assign users"
          onClick={() => {
            fetchEntityUser(params.data._id)
            setSelectedEntity(params.data._id)
            setUsersDialogOpen(true)
          }}
        >
          <FaUser className="text-primary" />
        </IconButton>
      </Tooltip> :
      <Tooltip className="cursor-stop" title={`You don't have permission to update this entity`}>
        <IconButton size="small" aria-label="Assign users">
          <FaUser />
        </IconButton>
      </Tooltip>
    }
    <GridDeleteIcon
      hasDeletePermission={permissions[entityResource]?.isDelete}
      ownerId={params.data.createdById}
      userId={user?.user?._id}
      onDelete={() => {
        setDeleteEntity(params?.data)
        setShowDeleteDialog(true)
      }}
      entity="entity"
    />
  </>

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;

    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];

      Object.keys(filters).forEach(field => {
        updatedFilters.push({
          field: field,
          term: filters[field].filter
        })
      });
      deepFilter = `${deepFilter}&deepFilter=${encodeURI(JSON.stringify(updatedFilters))}&filterType=and`
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURI(search)}`;
    }
    if (showFilteredRecordsOnly) {
      const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
      deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map(m => m._id))}`;
    }
    return deepFilter;
  };

  const fetchEntity = (setEntities = false) => {
    const queryString = getQueryString();
    dispatch({ type: "loading", loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
    }

    axiosInstance()
      .get(`${entityApi}${queryString}`)
      .then(({ data: { data, count } }) => {

        let rows = data.map((u) => {
          return prepareDataForGrid(u);
        });
        if (setEntities) {
          // let mappedEntities = []
          // if (data && data.length) {
          //   data.forEach(o => {
          //     mappedEntities = [...mappedEntities,
          //     { optionLabel: o?.entityName, optionValue: o?._id }]
          //   })
          // }
          // localStorage.setItem("mappedEntities", JSON.stringify(mappedEntities))
        }

        dispatch({ type: "initialize", data: rows, count: count });
        setTimeout(() => {
          dispatch({ type: "loading", loading: false });
        }, gridLoadingTimeout);

      }).catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: "loading", loading: false });
      });

  }

  const handleSearch = (e) => {
    dispatch({ type: "search", search: e.target.value });
  };


  const handleCreate = () => {
    setIsOpen({ open: true, isClone: false, entityId: null });
  };

  const handleClose = () => {
    setIsOpen({ open: false, isClone: false, entityId: null });
  };
  const handleOpenDialog = () => {
    setUsersDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setUsersDialogOpen(false);
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[routes.entity]} />
        </Grid>
        <Grid
          item
          md={8}
          sm={1}
          xs={2}>
          <ImportExportLinks
            permissions={permissions[entityResource]}
            module="entity(s)"
            api={entityApi}
            afterImportCompleted={() => {
              fetchEntity();
            }}
            isExportAllOrSomeFeature={true}
            total={rowCount}
            recordsToExport={selectedRecords.length}
            ids={selectedRecords.length ? selectedRecords.map((obj) => obj._id) : []}
            onExportToExcelSuccess={() => {
              if (gridApi) gridApi.deselectAll()
              else fetchEntity()
            }}
          />
        </Grid>
      </Grid>

      <CustomContainer>
        <div className="header-panel">
          <EntityHeader
            onSearch={handleSearch}
            searchVal={search}
            entityPermissions={permissions[entityResource]}
            onCreate={handleCreate}
            selectedRecords={selectedRecords}
            canDelete={selectedRecords[0] && selectedRecords[0].createdById === user?.user?._id}
            manageDeleteEntity={() => {
              if (selectedRecords[0] && selectedRecords[0]?._id) {
                setDeleteEntity(selectedRecords[0])
                setShowDeleteDialog(true)
              }
            }}
            dispatch={dispatch}
            columns={columns}
            openUserDialog={handleOpenDialog}
            anyEntitySelected={selectedRecords.length > 0} //single select entity can assign user
            filters={filters}
          />
        </div>

        {isMobile && !isTablet ?
          <CustomSwipableList
            allowSelection={true}
            allowSwipe={true}
            permissions={permissions.entity}
            primaryField={columns?.find(d => d.field === "entityName")}
            onClick={(d) => {
              history.push(`${routes.entityDetail.path}/${d._id}`)
            }}
            dataRows={dataRows}
            selectedRecords={selectedRecords}
            dispatch={dispatch}
            onEdit={(d) => {
              history.push(`${routes.entityDetail.path}/${d._id}`)
            }}
            extraParamsToCheckDelete={false}
            onDelete={(d) => {

            }}
            rowCount={rowCount}
            page={page}
            loading={loading}
            additionalDetails={[
              {
                icon: <FaSuitcase />,
                field: "parentEntity"
              },

            ]}
            chips={[
              {
                icon: <BsCurrencyExchange />,
                label: "Currency: ",
                field: "currency"
              },
              {
                icon: <FaAddressCard />,
                label: "Address: ",
                field: "address"
              },
              {
                icon: <IoCreate />,
                label: "Created By: ",
                field: "createdBy"
              }
            ]}
            owerCollaboratorInitialsOrImages=""
            onCreate={false}
            showClone={false}
            onClone={() => { }}
            renderedFrom={renderedFrom} />
          :
          Object.keys(frameWorkComponent).length > 0 ?
            <CustomAgGrid columns={columns} dataRows={dataRows} frameworkComponents={frameWorkComponent} setGridApi={setGridApi}
              dispatch={dispatch} rowCount={rowCount} limit={limit} pageSizes={pageSizes} page={page} actionWidth={150}
              loading={loading} renderedFrom={renderedFrom}
              refreshGrid={fetchEntity}
              showOnlyShowFilteredRecordSwitch={true}
              showFilters={true}
              resource={sidebarResource.entity}
            /> : null
        }

        {
          isOpen?.open && (
            <ManageEntity
              open={isOpen}
              close={handleClose}
              fetchData={fetchEntity}
              isNew={true}
              entityId={isOpen?.entityId}
              isClone={isOpen?.isClone}
            />
          )
        }
        {
          usersDialogOpen && !usersDialogLoding && (
            <Dialog
              fullWidth
              maxWidth="sm"
              open={usersDialogOpen}
              onClose={handleCloseDialog}
              aria-labelledby="assign-roles-dialog"
            >
              <AssignUsersDialog
                entitiesDialogOpen={usersDialogOpen}
                handleCloseDialog={handleCloseDialog}
                type="user"
                ids={selectedEntity ? [selectedEntity] : selectedRecords.map(rec => rec._id)}
                assignedEntity={users}
                regionalRole={false}
                onSuccess={() => {
                  setSelectedEntity(null)
                  handleCloseDialog();
                }}
              />
            </Dialog>
          )
        }
        {
          showDeleteDialog ?
            <ResourceTransferDialog
              open={true}
              fromResource={{ ...deleteEntity, name: deleteEntity.entityName ?? '' }}
              allResourceData={user?.entity?.filter(entity => entity._id !== deleteEntity?._id).map(e => ({ ...e, optionLabel: e?.entityName, optionValue: e?._id }))}
              onClose={() => {
                setDeleteEntity({})
                setShowDeleteDialog(false)
              }}
              handleDelete={() => {
                setDeleteEntity({})
                setShowDeleteDialog(false)
                fetchEntity()
              }}
              resource="Entity"
              selectedRecords={selectedRecords}
            />
            : null
        }
      </CustomContainer >
    </Fragment >
  );
};

export default Entity;
