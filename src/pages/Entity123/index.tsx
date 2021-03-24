import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  Menu,
  MenuItem,
  TextField,
  Typography,
} from "@material-ui/core";
import { ExpandMore, DeleteOutlined } from "@material-ui/icons";
import { DataGrid, GridToolbar } from "@material-ui/data-grid";
import { Autocomplete } from "@material-ui/lab";
import { useHistory, useLocation } from "react-router-dom";
import moment from "moment";
import Layout from "../../components/Layout";
import Container from "../../components/Container";
import BoxWithBorder from "../../components/BoxWithBorder";
import TabPanel from "../../components/TabPanel";
import BrandHeader from "../../components/BrandHeader";
import CustomTabs from "../../components/Helpers/CustomTabs";
import CustomToast from "../../components/Helpers/CustomToast";
import { UserRoles } from "../../components/EntityTabs";
import DetailsPage from "../../components/Shared/DetailsPage";
import NoDataCell from '../../components/Helpers/NoDataCell'
import { SVG } from "../../assets";
import axiosInstance from '../../axios/axiosInstance'
import SearchBox from "../../components/Helpers/SearchBox";
import Loader from "../../components/Loader";
import { createRole } from "../../routes/roles";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import DataGridCustomToolbar from '../../components/Helpers/DataGridCustomToolbar';
import { getSearchQuery } from '../../services/util'
let entityTimeout;
const Entities = () => {
  const history = useHistory();
  const { state, pathname } = useLocation();

  const [open, setOpen] = useState(false);
  const [errorMsg, setErroMsg] = useState("");
  const [msgType, setMsgType] = useState("");
  const [entitiesData, setEntitiesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingEntity, setLoadingEntity] = useState(false);
  const [loadingEntityFields, setLoadingEntityFields] = useState(false);
  const [entityFormFields, setEntityFormFields] = useState([]);

  const [entitiesCount, setEntitiesCount] = useState(0);

  const [isUpdating, setUpdating] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [dataRows, setDataRows] = useState([]);
  const [brandSelectList, setBrandSelectList] = useState([]);

  const [value, setValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(
    state ? state.brandData : null
  );
  const [roles, setRoles] = useState([]);
  const [searchVal, setSearchVal] = useState("");
  const [checkAllEntities, setCheckAllEntities] = useState(false);
  const [query, setQuery] = useState({ page: 1, limit: 5 });
  const [renderCount, setRenderCount] = useState(0);
  const [rowCount, setRowCount] = useState(0);
  const [selectedRecs, setSelectedRecs] = useState([]);
  const [showConfirmBox, setShowConfirmBox] = useState(false);

  useEffect(() => {
    if (state) {
      getEntity(state.entityId);
    }

    getEntityCount();

    return () => setSelectedEntity(null);
  }, []);

  useEffect(() => {
    getBrandList();

    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const _id = selectedBrand ? selectedBrand.id : "";

    let millisec = Object.keys(searchVal).length > 0 ? 600 : 5;
    if (entityTimeout) {
      clearTimeout(entityTimeout);
    }
    entityTimeout = setTimeout(() => {
      getEntities(_id);
    }, millisec);
  }, [searchVal]);

  useEffect(() => {
    const _id = selectedBrand ? selectedBrand.id : "";
    if (renderCount > 0) {
      getEntities(_id);
    } else setRenderCount((preCount) => preCount + 1);
  }, [query]);

  // *** GET ENTITIES COUNT ***
  const getEntityCount = () => {
    axiosInstance().get(`/entity/count`).then(({ data: { data } }) => {
      setEntitiesCount(data);
  }).catch(err => {
      setLoading(false)
  })

  };

  // ******** GET BRANDS LIST ********
  const getBrandList = () => {
    const params = { select: "companyName" };
    let api = getSearchQuery("/brand", params)
    try {
      axiosInstance()
        .get(api).then(({ data }) => {
          const list = data.map((item) => ({
            id: item._id,
            name: item.companyName,
          }));
          setBrandSelectList(list);
        })

    }
    catch (err) {
      setLoading(false);
    }

  };

  // ****** GET SELECTED BRAND ENTITIES *****
  const getEntities = (id) => {
    let searchParams: any = { ...query };
    searchParams = searchVal
      ? { ...searchParams, search: searchVal }
      : { ...searchParams };

    setLoading(true);
    setSelectedEntity(null);

      let url = id ? `/entity?brand=${id}` : `/entity`;
      let api = getSearchQuery(url, searchParams)
    try {
      axiosInstance()
        .get(api).then(({ data }) => {
          // setRowCount(count);
          setEntitiesData(data);
          getRows(data);
          setLoading(false);
          setCheckAllEntities(false);
        })

    }
    catch (err) {
      setLoading(false);
      openSnackbar("Something went wrong", "error");

    }
  };

  // ***** GET ROWS DATA ******
  const getRows = (ent) => {
    // const en_Id = state ? state.entityId : "";
    let rows = ent?.map((e) => ({
      id: e._id,
      isChecked: selectedEntity
        ? selectedEntity._id === e._id
          ? true
          : false
        : false,
      entityName: e.entityName,
      brandName: e.brand.companyName,
      taxJurisdiction: e.taxJurisdiction,
      address: e.address,
      createdAt: moment(e.createdAt).format("MMM Do, YYYY"),
      actions: "",
    }));

    setDataRows(rows);
  };

  /**
   * ADD ADDITIONAL STUFF FOR INITIAL CHECKBOX SELECTION IN COLUMNS :))
   * NOTHING SPECIAL (Don't get confused) 😀😀
   */

  const columns = [
    {
      field: "isChecked",
      headerName: "Checkbox",
      renderHeader: () => (
        <Checkbox
          color="primary"
          checked={checkAllEntities}
          onChange={(ev) => {
            setCheckAllEntities(ev.target.checked);
            const gridData = dataRows;
            gridData.map((d) => {
              d.isChecked = ev.target.checked;

              return d;
            });
            setDataRows([...gridData]);
          }}
        />
      ),
      renderCell: (params) => (
        <Checkbox
          color="primary"
          disabled={loadingEntity || loadingEntityFields}
          checked={params.value}
          onChange={(ev) => {
            const gridData = dataRows;
            const indexOfRecord = gridData.findIndex(
              (d) => d.id === params.row.id
            );
            gridData[indexOfRecord].isChecked = ev.target.checked;

            setDataRows([...gridData]);

            const checkedRecords = gridData.filter((d) => d.isChecked === true);

            if (checkedRecords.length === gridData.length) {
              setCheckAllEntities(true);
            } else {
              setCheckAllEntities(false);
            }

            if (checkedRecords.length === 1) {
              const id = checkedRecords[0].id;
              findSingleEntity(id);
            } else {
              setSelectedEntity(null);
              if (selectedBrand) {
                entitiesData.forEach((en) => {
                  if (en.brand !== selectedBrand.id) {
                    setSelectedBrand(null);
                  }
                });
              }
            }
            handleSelectedEntities(params.row.id, ev.target.checked);
          }}
        />
      ),
      disableColumnMenu: true,
      sortable: false,
      filterable: false,
      width: 75,
    },
    {
      field: "entityName", headerName: "Entity Name",
      width: 150,
      renderCell: (params) => (
        <>
          {
            params?.value ?? <NoDataCell />
          }
        </>
      )
    },
    {
      field: "brandName", headerName: "Brand Name",
      width: 150,
      renderCell: (params) => (
        <>
          {
            params?.value ?? <NoDataCell />
          }
        </>
      )
    },
    {
      field: "taxJurisdiction", headerName: "Tax Jurisdiction",
      width: 180,
      renderCell: (params) => (
        <>
          {
            params?.value ?? <NoDataCell />
          }
        </>
      )
    },
    {
      field: "address", headerName: "Address",
      width: 200,
      renderCell: (params) => (
        <>
          {
            params?.value ?? <NoDataCell />
          }
        </>
      )
    },
    {
      field: "createdAt", headerName: "Created At",
      width: 150,
      renderCell: (params) => (
        <>
          {
            params?.value ?? <NoDataCell />
          }
        </>
      )
    },
    // {
    //   field: "actions", headerName: "Actions", width: 150,
    //   renderCell: (params) => (
    //     <DeleteOutlined
    //       onClick={() => handleDelete(params.row)}
    //       color="action"
    //       style={{ textAlign: 'center' }}
    //       button
    //     />
    //   )
    // },
  ];

  // ***** COLUMNS STUFF ENDS  ☝☝ THERE *****

  const handleSelectedEntities = (id, isChecked) => {
    let tempSelectedRecs = [...selectedRecs],
      curRecIndex = selectedRecs.indexOf(id);
    if (isChecked && curRecIndex < 0) {
      tempSelectedRecs = [...selectedRecs, id];
    } else if (!isChecked && curRecIndex >= 0) {
      tempSelectedRecs.splice(curRecIndex, 1);
    }
    setSelectedRecs(tempSelectedRecs);
  };

  // ******* GET SINGLE ENTITY FOR ENTITY SELECTION *******

  const findSingleEntity = (id) => {
    const entity = entitiesData?.find((_en) => _en._id === id);
    setSelectedEntity(entity);
    getEntityFields(entity.brand._id);
  };

  const getEntity = (id) => {
    let searchParams: any = { ...query };
    searchParams = searchVal
      ? { ...searchParams, search: searchVal }
      : { ...searchParams };

    setLoading(true);
    setSelectedEntity(null);

      let url = id ? `/entity?brand=${id}` : `entity`;
      let api = getSearchQuery(url, searchParams);
      try {
        axiosInstance()
          .get(api).then(({ data }) => {
            getEntityFields(data?.brand);
            setSelectedEntity(data);
            setLoadingEntity(false);
          })
  
      }
      catch (err) {
        setLoadingEntity(false);
        openSnackbar("Error", "error");
        console.log(err);
      }
      
  };

  const getEntityFields = (id) => {
    setLoadingEntityFields(true);
    setEntityFormFields([]);
    GetFields("Entity", id)
      .then(({ data }) => {
        setEntityFormFields(data);
        setLoadingEntityFields(false);
      })
      .catch((err) => {
        setLoadingEntityFields(false);
        console.log(err);
      });
  };

  // ***** CHANGE BRAND SELECTION ******
  // const changeBrand = (id) => {
  //   const _brand = allBrands.find((b) => b._id === id);

  //   if (!selectedBrand) {
  //     setSelectedBrand({ id, name: _brand.companyName });
  //   } else {
  //     if (selectedBrand.id !== id) {
  //       setSelectedBrand({ id, name: _brand.companyName });
  //     }
  //   }
  // };

  // ******* HANDLE UPDATE ENTITY ******* :)
  const handleUpdateEntity = (values) => {
    setUpdating(true);

    const updatedData = {
      ...values,
      _id: selectedEntity._id,
    };
    console.log(updatedData);

    UpdateEntity(updatedData)
      .then(({ data }) => {
        // getEntities();
        getEntity(data._id);
        openSnackbar("Successfully saved", "success");
        setUpdating(false);
      })
      .catch((err) => {
        console.log(err);
        setUpdating(false);
        openSnackbar("Something went wrong", "error");
      });
  };

  // ***** ACTIONS BUTTON STUFF ******
  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  // ***** BRAND SELCTION *****
  const handleChangeBrand = (_, newVal) => {
    if (query.page !== 1) {
      setQuery((prevState) => ({ ...prevState, page: 1 }));
    }
    setSelectedBrand(newVal);
    setSelectedEntity(null);
    const _id = newVal ? newVal.id : "";
    getEntities(_id);
    if (state) {
      history.replace();
    }
  };

  // ****** SNACKBAR STUFF ;) *******

  const openSnackbar = (msg, type) => {
    setErroMsg(msg);
    setMsgType(type);
    setOpen(true);
  };
  const closeSnackbar = () => setOpen(false);

  // ***** CLICK CREATE NEW ENTITY ****
  const clickCreateNew = () => {
    if (selectedBrand) {
      history.push({
        pathname: "/entities/new",
        state: {
          brand_id: selectedBrand.id,
        },
      });
    } else {
      openSnackbar("No Brand Selected", "warning");
    }
  };

  const handleSearch = (e) => {
    if (query.page !== 1) {
      setQuery((prevState) => ({ ...prevState, page: 1 }));
    }
    setSearchVal(e.target.value);
  };

  const handlePage = (params) => {
    if (query.page !== params.page) {
      setQuery((prevState) => ({ ...prevState, page: params.page }));
    }
  };
  const handlePageSize = (params) => {
    if (params.pageSize !== query.limit) {
      setQuery({ page: 1, limit: params.pageSize });
    }
  };
  const handleSortModelChange = (params) => {
    if (params?.sortModel && params.sortModel.length > 0) {
      let temp = params.sortModel[0];
      setQuery((prevState) => ({
        ...prevState,
        page: 1,
        sortBy: temp.field,
        orderBy: temp.sort,
      }));
    }
  };

  const handleDeleteEntity = async () => {
    setLoading(true);
    let recLen = selectedRecs.length;
    if (selectedRecs && recLen > 0) {
      selectedRecs.forEach(async (curId, i) => {
        let data = await deleteEntities({ _id: curId });
        if (i === recLen - 1 && data.status === 200) {
          setLoading(false);
          setOpen(true);
          openSnackbar(data.message, "success");
          const _id = selectedBrand ? selectedBrand.id : "";
          getEntities(_id);
          setSelectedEntity(null);
        } else {
          setLoading(false);
          openSnackbar("Something went wrong while deleting", "error");
        }
      });
      setShowConfirmBox(false);
      setSelectedRecs([]);
    }
  };

  const handleAddUserRole = () => {
    if (selectedBrand && selectedEntity) {
      history.push({
        pathname: createRole.path,
        state: {
          brandId: selectedBrand.id,
          entityId: selectedEntity._id,
          name: selectedBrand.name,
          prevPath: pathname,
        },
      });
    } else {
      openSnackbar("No Brand Selected", "warning");
    }
  };

  /**
   *  (**__**)
   */
  const tabs = ["Details", "User Roles"];

  return (
    <>
      <CustomToast
        open={open}
        close={closeSnackbar}
        errorMsg={errorMsg}
        type={msgType}
      />
      <Layout>
        <div>
          <Container>
            <BrandHeader
              total={entitiesCount}
              // style={{ width: "50%" }}
              heading="Entities"
              // showHeading={false}
            >
              <Autocomplete
                value={selectedBrand}
                onChange={handleChangeBrand}
                options={brandSelectList}
                style={{
                  width: "150px",
                  display: "inline-block",
                  verticalAlign: "top",
                }}
                size="small"
                getOptionLabel={(option) => option.name}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Brand"
                    variant="outlined"
                  />
                )}
              />
              <Box component="span" marginX={1} />
              <SearchBox onSearch={handleSearch} value={searchVal} />
              <Box component="span" marginX={1} />
              <Button
                variant="contained"
                color="primary"
                onClick={clickCreateNew}
              >
                Create Entity
            </Button>
              <Box component="span" marginX={1} />
              <Button
                disabled={selectedRecs.length > 0 ? false : true}
                variant="outlined"
                color="default"
                onClick={openActions}
                aria-controls="action-menu"
              >
                Actions <ExpandMore />
              </Button>
              <Menu
                anchorEl={anchorEl}
                keepMounted
                id="action-menu"
                open={Boolean(anchorEl)}
                style={{ marginTop: "5px" }}
                onClose={closeActions}
              >
                <MenuItem onClick={() => setShowConfirmBox(true)}>
                  Delete {selectedRecs.length > 1 ? "Entities" : "Entity"}
                </MenuItem>
                <MenuItem
                  disabled={selectedEntity ? false : true}
                  onClick={handleAddUserRole}
                >
                  Add Role
              </MenuItem>
              </Menu>
            </BrandHeader>

            <div style={{ width: "100%", height: "400px" }}>
              <DataGrid
                components={{
                  Toolbar: DataGridCustomToolbar,
                }}
                rows={loading ? [] : dataRows}
                density="compact"
                columns={columns}
                loading={loading}
                disableSelectionOnClick
                disableMultipleSelection
                paginationMode="server"
                pagination
                onPageChange={handlePage}
                onPageSizeChange={handlePageSize}
                pageSize={query.limit}
                page={query.page}
                rowCount={rowCount}
                rowsPerPageOptions={[5, 10, 20]}
                onSortModelChange={handleSortModelChange}
              />
            </div>
            <Box marginY={5} />
            <BoxWithBorder styles={{ minHeight: "300px", padding: "0px" }}>
              {!selectedEntity ? (
                <Box textAlign="center" marginTop={5}>
                  <img src={SVG("Contacts Placeholder")} alt="Placeholder" />
                  <Box marginY={2} />
                  <Typography paragraph>
                    {loadingEntity ? "Loading Data..." : "Select an entity."}
                  </Typography>
                </Box>
              ) : loadingEntityFields ? (
                <Loader style={{ marginTop: 40 }} text="Hang on" />
              ) : (
                <>
                  <Box
                    bgcolor="#E6F4FF"
                    padding={1}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography>{selectedEntity.entityName}</Typography>
                  </Box>

                  <Divider />
                  <CustomTabs value={value} setValue={setValue} tabs={tabs} />
                  <TabPanel value={value} index={0}>
                    <DetailsPage
                      data={selectedEntity}
                      fields={entityFormFields}
                      isUpdating={isUpdating}
                      handleUpdate={handleUpdateEntity}
                    />
                  </TabPanel>
                  <TabPanel value={value} index={1}>
                    <UserRoles
                      entity={selectedEntity}
                      openSnackbar={openSnackbar}
                      roles={roles}
                      setRoles={setRoles}
                    />
                  </TabPanel>
                </>
              )}
              {showConfirmBox && (
                <ConfirmationDialog
                  open={showConfirmBox}
                  message={`Are you sure you want to delete ${selectedRecs.length > 1 ? " these entities" : "this entity"
                    }`}
                  onClose={() => setShowConfirmBox(false)}
                  onOk={handleDeleteEntity}
                />
              )}
            </BoxWithBorder>
          </Container>
        </div>
      </Layout>
    </>
  );
};

export default Entities;
