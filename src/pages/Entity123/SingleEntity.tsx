import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Typography,
} from "@material-ui/core";
import { useHistory, useLocation, useParams } from "react-router-dom";
import moment from "moment";

import Layout from "../../components/Layout";
import Container from "../../components/Container";
import BoxWithBorder from "../../components/BoxWithBorder";
import TabPanel from "../../components/TabPanel";
import CustomTabs from "../../components/Helpers/CustomTabs";
import CustomToast from "../../components/Helpers/CustomToast";
import { Details, UserRoles, Users } from "../../components/EntityTabs";
import { SVG } from "../../assets";
import { useData } from "../../StateProvider/Provider";
import { GetEntities, GetEntityById, UpdateEntity } from "../../axios";
import { removeObjKey } from "../../constants/helpers";

let entityTimeout;

const SingleEntity = () => {
  let { id } = useParams();
  const history = useHistory();
  const { state } = useLocation();
  const {
    state: { allBrands, entityFormFields },
  }: any = useData();

  const [open, setOpen] = useState(false);
  const [errorMsg, setErroMsg] = useState("");
  const [msgType, setMsgType] = useState("");
  const [entitiesData, setEntitiesData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isUpdating, setUpdating] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [dataRows, setDataRows] = useState([]);
  const [brandSelectList, setBrandSelectList] = useState([]);

  const [initialVals, setValues] = useState(null);

  const [value, setValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(
    state ? state.brandData : null
  );
  const [roles, setRoles] = useState([]);
  const [searchVal, setSearchVal] = useState("");
  const [checkAllEntities, setCheckAllEntities] = useState(false);

  useEffect(() => {
    const _id = id.split("&&")[1];
    getEntiy(_id);

    return () => setSelectedEntity(null);
    // eslint-disable-next-line
  }, []);

  // useEffect(() => {
  //   getBrandList();

  //   // eslint-disable-next-line
  // }, [allBrands]);

  // useEffect(() => {
  //   const _id = selectedBrand ? selectedBrand.id : "";

  //   let millisec = Object.keys(searchVal).length > 0 ? 400 : 5;
  //   if (entityTimeout) {
  //     clearTimeout(entityTimeout);
  //   }
  //   entityTimeout = setTimeout(() => {
  //     getEntities(_id);
  //   }, millisec);
  //   // eslint-disable-next-line
  // }, [searchVal]);

  // ******** GET BRANDS LIST ********
  // const getBrandList = () => {
  //   const list = allBrands?.map((b) => ({ id: b._id, name: b.companyName }));

  //   setBrandSelectList(list);
  // };

  // ****** GET SELECTED BRAND ENTITIES *****
  const getEntities = (id) => {
    let searchParams = searchVal ? { search: searchVal } : {};
    setLoading(true);
    setSelectedEntity(null);
    GetEntities(id, searchParams)
      .then(({ data }) => {
        setEntitiesData(data);
        getRows(data);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        console.log(err);
        openSnackbar("Something went wrong", "error");
      });
  };

  // ***** GET ROWS DATA ******
  const getRows = (ent) => {
    const en_Id = state ? state.entityId : "";
    let rows = ent?.map((e) => ({
      id: e._id,
      isChecked: e._id === en_Id,
      entityName: e.entityName,
      brandName: e.brand.companyName,
      createdAt: moment(e.createdAt).format("MMM Do, YYYY"),
    }));

    setDataRows(rows);
  };

  /**
   * ADD ADDITIONAL STUFF FOR INITIAL CHECKBOX SELECTION IN COLUMNS :))
   * NOTHING SPECIAL (Don't get confused) 😀😀
   */

  // const columns = [
  //   {
  //     field: "isChecked",
  //     headerName: "Checkbox",
  //     renderHeader: () => (
  //       <Checkbox
  //         color="primary"
  //         checked={checkAllEntities}
  //         onChange={(ev) => {
  //           setCheckAllEntities(ev.target.checked);
  //           const gridData = dataRows;
  //           gridData.map((d) => {
  //             d.isChecked = ev.target.checked;

  //             return d;
  //           });
  //           setDataRows([...gridData]);
  //         }}
  //       />
  //     ),
  //     renderCell: (params) => (
  //       <Checkbox
  //         color="primary"
  //         checked={params.value}
  //         onChange={(ev) => {
  //           const gridData = dataRows;
  //           const indexOfRecord = gridData.findIndex(
  //             (d) => d.id === params.row.id
  //           );
  //           gridData[indexOfRecord].isChecked = ev.target.checked;

  //           setDataRows([...gridData]);

  //           const checkedRecords = gridData.filter((d) => d.isChecked === true);

  //           if (checkedRecords.length === gridData.length) {
  //             setCheckAllEntities(true);
  //           } else {
  //             setCheckAllEntities(false);
  //           }

  //           if (checkedRecords.length === 1) {
  //             const id = checkedRecords[0].id;
  //             findSingleEntity(id);
  //           } else {
  //             setSelectedEntity(null);
  //             if (selectedBrand) {
  //               entitiesData.forEach((en) => {
  //                 if (en.brand !== selectedBrand.id) {
  //                   setSelectedBrand(null);
  //                 }
  //               });
  //             }
  //           }
  //         }}
  //       />
  //     ),
  //     disableColumnMenu: true,
  //     sortable: false,
  //     filterable: false,
  //     width: 75,
  //   },
  //   { field: "entityName", headerName: "Entity Name", width: 150 },
  //   { field: "brandName", headerName: "Brand Name", width: 150 },
  //   { field: "taxJurisdiction", headerName: "Tax Jurisdiction", width: 180 },
  //   { field: "address", headerName: "Address", width: 150 },
  //   { field: "createdAt", headerName: "Created At", width: 150 },
  // ];

  // ***** COLUMNS STUFF ENDS  ☝☝ THERE *****

  // ******* GET SINGLE ENTITY FOR ENTITY SELECTION *******

  const findSingleEntity = async (id) => {
    const entity = await entitiesData?.find((_entity) => _entity._id === id);
    setSelectedEntity(entity);
  };

  const getEntiy = (id) => {
    GetEntityById(id).then(({ data }) => setSelectedEntity(data));
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
  const handleUpdateEntity = () => {
    setUpdating(true);
    const roleData = roles.map((role) => role._id);
    let filteredObj = removeObjKey(selectedEntity, "brand");
    filteredObj = removeObjKey(selectedEntity, "user");
    filteredObj = removeObjKey(selectedEntity, "createdAt");

    const updatedData = {
      ...filteredObj,
      role: roleData,
    };
    // console.log(data);

    UpdateEntity(updatedData)
      .then(({ data }) => {
        findSingleEntity(data._id);
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
    setSearchVal(e.target.value);
  };
  /**
   *  (**__**)
   */
  const tabs = ["Details", "User Roles", "Users"];

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
          {/* <BrandHeader total={entitiesData.length} heading="Entities">
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
              disabled={Boolean(!selectedEntity)}
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
              onClose={closeActions}
            >
              <MenuItem>Delete</MenuItem>
            </Menu>
          </BrandHeader> */}
          <Container>
            {/*<Box width="200px" marginBottom={2}>
              <Autocomplete
                value={selectedBrand}
                onChange={handleChangeBrand}
                options={brandSelectList}
                getOptionLabel={(option) => option.name}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Brand"
                    variant="outlined"
                  />
                )}
              />
            </Box>
            <div style={{ width: "100%", height: "400px" }}>
              <DataGrid
                showToolbar
                rows={dataRows}
                columns={columns}
                loading={loading}
                pageSize={5}
                disableSelectionOnClick
                disableMultipleSelection
              />
            </div>
            <Box marginY={5} /> */}
            <BoxWithBorder styles={{ minHeight: "300px", padding: "0px" }}>
              {!selectedEntity || entityFormFields?.length == 0 ? (
                <Box textAlign="center" marginTop={5}>
                  <img src={SVG("Contacts Placeholder")} alt="Placeholder" />
                  <Box marginY={2} />
                  <Typography paragraph>
                    {loading ? "Loading entities..." : "Select an entity."}
                  </Typography>
                </Box>
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
                    <Box>
                      {isUpdating ? (
                        <CircularProgress />
                      ) : (
                        <Button
                          variant="text"
                          color="primary" // ******* HANDLE UPDATE ENTITY ******* :)
                          onClick={handleUpdateEntity}
                        >
                          Save
                        </Button>
                      )}
                    </Box>
                  </Box>
                  <Divider />
                  <CustomTabs value={value} setValue={setValue} tabs={tabs} />
                  <TabPanel value={value} index={0}>
                    <Details
                      entity={selectedEntity}
                      fields={entityFormFields}
                      initialVals={initialVals}
                      setValues={setValues}
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
                  <TabPanel value={value} index={2}>
                    <Users entity={selectedEntity} />
                  </TabPanel>
                </>
              )}
            </BoxWithBorder>
          </Container>
        </div>
      </Layout>
    </>
  );
};

export default SingleEntity;
