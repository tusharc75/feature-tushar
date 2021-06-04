import React, { useState, FC, useEffect, useContext, useReducer } from "react";
import {
  Grid,
  IconButton,
  Link as MuiLink,
  Tooltip,
} from "@material-ui/core";
import { Link, useHistory } from "react-router-dom";
import { entity, isObjectEmpty } from "../../constants/helpers";
import axiosInstance from "../../axios/axiosInstance";
import Layout from "../../components/Layout";
import routes from "./../../components/Helpers/Routes";
import CustomBreadCrumbs from "./../../components/CustomBreadCrumbs";
import EntityHeader from "./Header";
import { useData } from "../../StateProvider/Provider";
import CreateEntity from "./CreateEntity";
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

let entityTimeout;

const Entity: FC = () => {

  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, permissions },
  }: any = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [renderCount, setRenderCount] = useState(0);
  const [entityPermissions, setEntityPermissions] = useState({
    isCreate: false,
    isUpdate: false,
    isRead: false,
    isDelete: false,
  });


  const [usersDialogOpen, setUsersDialogOpen] = useState(false);
  const [usersDialogLoding, setUsersDialogLoding] = useState(false);
  const [users, setUsers] = useState([]);
  const [singleSelectEntity, setSingleSelectEntity] = useState(null);
  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [columnApi, setColumnApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

  // const [showGridFilters, setShowGridFilters] = useState(true)
  const [columns, setColumns] = useState([
    { field: "entityName", headerName: "Name", show: true, disabled: true, cellRenderer: "nameRenderer" },
    { field: "address", headerName: "Address", show: true, cellRenderer: "commonRenderer" },
    { field: "createdBy", headerName: "Created By", show: true, cellRenderer: "createdByRenderer" },
    { field: "updatedBy", headerName: "Updated By", show: true, cellRenderer: "updatedByRenderer" },
  ]);
  //  Grid Variables - End


  const { entityResource, entityApi } = entity;

  useEffect(() => {
    if (permissions && permissions[entityResource]) {
      setEntityPermissions(permissions[entityResource]);
    }
  }, [permissions]);

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
  }, [selectedRecords]);

  const fetchEntityUser = async (entityId) => {
    setUsersDialogLoding(true)
    await axiosInstance()
      .get(`/user?filterById=[{"field": "entities.entity", "term": "${entityId}"}]`)
      .then(({ data: { data } }) => {
        setUsers(data);
        setSingleSelectEntity(entityId)
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

    {entityPermissions.isUpdate ?

      <Tooltip title="Assign users">
        <IconButton
          aria-label="Assign users"
          onClick={() => {
            fetchEntityUser(params.data._id)
            setUsersDialogOpen(true)
          }}
        >
          <FaUser size={18} className="text-primary" />
        </IconButton>
      </Tooltip>
      :
      <Tooltip className="cursor-stop" title={`You don't have permission to update this entity`}>
        <IconButton aria-label="Assign users">
          <FaUser size={18} className="text-primary" />
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

      Object.keys(filters).map(field => {
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
      gridApi.showLoadingOverlay();
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
        // if (gridApi && rows.length > 0) {
        //   gridApi.hideOverlay();
        // }
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


  return (
    <Layout>
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
            module="entity(s)"
            api={entityApi}
            onSuccessfulImport={(isImportedSuccessfully) => {
              if (isImportedSuccessfully) { fetchEntity(); }
            }}
          />
        </Grid>
      </Grid>

      <CustomContainer>
        <div className="header-panel">
          <EntityHeader
            onSearch={handleSearch}
            searchVal={search}
            entityPermissions={entityPermissions}
            onCreate={handleCreate}
            openUserDialog={handleOpenDialog}
            userActionDiabled={selectedRecords.length !== 1} //single select entity can assign user
          />
        </div>

        <CustomAgGrid columns={columns} dataRows={dataRows} frameworkComponents={frameworkComponents} setGridApi={setGridApi}
          dispatch={dispatch} rowCount={rowCount} limit={limit} pageSizes={pageSizes} page={page} actionWidth={150} />

        {isOpen && (
          <CreateEntity
            open={isOpen}
            close={handleClose}
            fetchData={fetchEntity}
          />
        )}
        {usersDialogOpen && !usersDialogLoding && (
          <AssignUsersDialog
            entitiesDialogOpen={usersDialogOpen}
            handleCloseDialog={handleCloseDialog}
            type="user"
            ids={[singleSelectEntity]}
            assignedEntity={users}
            regionalRole={false}
            onSuccess={() => {
              // fetchEntity();
              handleCloseDialog();
            }}
          />
        )}
      </CustomContainer >
    </Layout >
  );

};

export default Entity;
