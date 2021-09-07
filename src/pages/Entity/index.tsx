import { useState, FC, useEffect, useContext, useReducer, Fragment } from "react";
import {
  Dialog,
  Grid,
  IconButton,
  Tooltip,
} from "@material-ui/core";
import { Link } from "react-router-dom";
import { entity, gridLoadingTimeout, isObjectEmpty } from "../../constants/helpers";
import axiosInstance from "../../axios/axiosInstance";
import routes from "./../../components/Helpers/Routes";
import CustomBreadCrumbs from "./../../components/CustomBreadCrumbs";
import EntityHeader from "./Header";
import { useData } from "../../StateProvider/Provider";
import ManageEntity from "./ManageEntity";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import AssignUsersDialog from "../../components/AssignRolesDialog/AssignEntityDialog";
import {
  CommonRenderer,
  CreatedByRenderer,
  UpdatedByRenderer
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import ImportExportLinks from "../../components/Helpers/ImportExportLinks";
import CustomContainer from "../../components/CustomContainer";
import { FaUser } from "react-icons/fa";
import { utils, writeFile } from 'xlsx';

let entityTimeout;

const Entity: FC = () => {

  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, permissions },
  }: any = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [renderCount, setRenderCount] = useState(0);
  const [usersDialogOpen, setUsersDialogOpen] = useState(false);
  const [usersDialogLoding, setUsersDialogLoding] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null);

  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

  // const [showGridFilters, setShowGridFilters] = useState(true)
  const columnState = JSON.parse(localStorage.getItem("entityPage"));
  const [columns, setColumns] = useState([
    { field: "entityName", headerName: "Name", show: true, disabled: true, cellRenderer: "nameRenderer" },
    { field: "address", headerName: "Address", show: true, cellRenderer: "commonRenderer" },
    { field: "createdBy", headerName: "Created By", show: true, cellRenderer: "createdByRenderer" },
    { field: "updatedBy", headerName: "Updated By", show: true, cellRenderer: "updatedByRenderer" },
  ]);
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
  }, [page, limit, filters, sorting]);

  useEffect(() => {
    if (selectedRecords.length === 1) {
      fetchEntityUser(selectedRecords[0].id);
    }
    else {
      setUsers([]);
    }
  }, [selectedRecords]);

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
  const NameRenderer = params => <Link className="link"
    to={`${routes.entityDetails.path}/${params.data._id}`} title={params.value}>
    {params.value}
  </Link>;

  const ActionsRenderer = params => <>

    {permissions[entityResource]?.isUpdate ?

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
      </Tooltip>
      :
      <Tooltip className="cursor-stop" title={`You don't have permission to update this entity`}>
        <IconButton size="small" aria-label="Assign users">
          <FaUser className="text-primary" />
        </IconButton>
      </Tooltip>
    }
  </>

  const frameworkComponents = {
    nameRenderer: NameRenderer,
    commonRenderer: CommonRenderer,
    createdByRenderer: CreatedByRenderer,
    updatedByRenderer: UpdatedByRenderer,
    actionsRenderer: ActionsRenderer
  };


  const replaceFieldName = (field) => {
    switch (field) {
      case "createdBy":
        return "createdBy.user.concatedName";

      case "updatedBy":
        return "updatedBy.user.concatedName";

      default:
        return field;
    }
  }



  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;

    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];

      Object.keys(filters).forEach(field => {
        updatedFilters.push({
          field: replaceFieldName(field),
          term: filters[field].filter
        })
      });
      deepFilter = `${deepFilter}&deepFilter=${JSON.stringify(updatedFilters)}&filterType=and`
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${replaceFieldName(sorting[0].colId)}&orderBy=${sorting[0].sort}`
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
    }

    return deepFilter;
  };

  const fetchEntity = () => {
    const queryString = getQueryString();
    dispatch({ type: "loading", loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
    }

    axiosInstance()
      .get(`${entityApi}${queryString}`)
      .then(({ data: { data, count } }) => {

        let rows = data.map((u) => {

          const { owner, collaborator, createdBy, updatedBy, staticData, ...restProperties } = u;

          let res = {
            ...restProperties,
            id: u._id,
            createdBy: u.createdBy?.user?.concatedName,
            createdByDate: u.createdBy?.date,
            updatedBy: u.updatedBy?.user?.concatedName,
            updatedByDate: u.updatedBy?.date,
          };
          return res;
        });

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
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };
  const handleOpenDialog = () => {
    setUsersDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setUsersDialogOpen(false);
  };

  const exportSelectedEntities = () => {
    const data = [];
    
    selectedRecords.forEach((record) => {
      data.push({
        "ENTITY NAME": record.entityName,
        "PARENT ENTITY": record.parentEntity?.optionLabel || "",
        "TAX JURISDICTION": record.taxJurisdiction || "",
        "CURRENCY": record.currency,
        "ADDRESS": record.address,
      })
    })

    var ws = utils.json_to_sheet(data, { header: ["ENTITY NAME", "PARENT ENTITY", "TAX JURISDICTION", "CURRENCY", "ADDRESS"] });
    var wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Sheet1");
    writeFile(wb, "Selected_Entities.xlsx");
  }

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
            openUserDialog={handleOpenDialog}
            anyEntitySelected={selectedRecords.length > 0} //single select entity can assign user
            exportSelectedEntities={exportSelectedEntities}
          />
        </div>

        <CustomAgGrid columns={columns} dataRows={dataRows} frameworkComponents={frameworkComponents} setGridApi={setGridApi}
          dispatch={dispatch} rowCount={rowCount} limit={limit} pageSizes={pageSizes} page={page} actionWidth={150}
          loading={loading} renderedFrom="entityPage" />

        {isOpen && (
          <ManageEntity
            open={isOpen}
            close={handleClose}
            fetchData={fetchEntity}
            isNew={true}
          />
        )}
        {usersDialogOpen && !usersDialogLoding && (
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
        )}
      </CustomContainer >
    </Fragment >
  );

};

export default Entity;
