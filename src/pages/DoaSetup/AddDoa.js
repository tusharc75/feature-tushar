import React, {useState} from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Box,
  Button,
  TextField,
  InputAdornment,
} from "@material-ui/core";
import { Search } from "@material-ui/icons";
import { DataGrid } from "@material-ui/data-grid";
import Layout from "../../components/Layout";
import Container from "../../components/Container";
import BrandHeader from "../../components/BrandHeader";
import BoxWithBorder from "../../components/BoxWithBorder";
import NewStepper from "../../components/Helpers/NewStepper";
import { Edit, Delete } from "@material-ui/icons";

import user from "../../data/apimock";
import DoaDialog from "./DoaDialog";

const useStyles = makeStyles((theme) => ({
  actionBtn: {
    background: theme.palette.lightBg,
    color: "#fff",
    "&:hover": {
      background: theme.palette.lightBg,
    },
  },

  backButton: {
    marginRight: theme.spacing(1),
  },

  tabsContainer: {
    marginBottom: theme.spacing(2),
  },

  tab: {
    margin: theme.spacing(0, 2),
  },

  infoContainer: {
    display: "flex",
    marginTop: theme.spacing(2),
    justifyContent: "space-evenly",
    [theme.breakpoints.down("sm")]: "flex-start",
  },
  
  box: {
    backgroundColor: "#E9F1FF",
    borderRadius: 8,
    padding: theme.spacing(1.5, 2),
    margin: theme.spacing(0, 2),
    fontWeight: "normal",
    width:"141",
    height: "51"
  },

  btnMargin:{
    marginRight: theme.spacing(6)
  },

  newBox:{
    backgroundColor: "#11A1FD",
    borderRadius: 5,
    color: "#fff",
    display: "flex",
    padding: theme.spacing(1, 4),
    justifyContent: "space-evenly",
    [theme.breakpoints.down("sm")]: "flex-start",
  },

  container: {
    marginTop: theme.spacing(2)
  },

  doaInfo: {
    marginTop: theme.spacing(5),
    marginBottom: theme.spacing(2.25),
    marginLeft: theme.spacing(3.125)
  },

  headerCss: {
    paddingLeft: theme.spacing(3.125)
  },

  actionIcon: {
    "&:hover": {
      cursor: "pointer"
    },
      width: 18,
      height: 18,
      margin: 2
  },

  disabled: {
    "&:hover": {
      cursor: "no-drop"
    },
    color: "#91A2A9"
  }
}));

const AddDoa = () => {

  const classes = useStyles();
  const [dataRows, setDataRows] = useState(
    user
    ? user.data.map(
      (obj) => {
        return {
          ...obj,
          id: obj._id,
          name: `${obj.firstName} ${obj.lastName}`,
          doa: obj.doa
          ? obj.doa.map(
            (elm) => {
              return {
              name: `${elm.user.firstName} ${elm.user.lastName}`,
              id: elm.user._id,
              limit: elm.limit
            }
          })
          : []
        }
      }
    )
    : []
  );
  const [userSelected, setUserSelected] = useState(null);
  const [open, setOpen] = useState(false);
  const [postingData, setPostingData] = useState(false);
  let [doaDetails, setDoaDetails] = useState([]);


  const handleRowSelection = ({ rowIds }) => {
    if (rowIds.length > 1) {
      setUserSelected({});
    } else {
      const id = rowIds[0];
      const row = dataRows.find(({_id}) => id === _id);
      setUserSelected(row);
    }
  };

  const deleteUsers = () => {
    const newDataRows = dataRows.filter( ob => ob._id !== userSelected._id);
    setDataRows(newDataRows);
  }

  const columns = [
    { field: "name", headerName: "Name", width: 200, disableClickEventBubbling: true },
    { field: "contactDetails", headerName: "Contact Details", width: 200, disableClickEventBubbling: true },
    { field: "email", headerName: "Email", width: 200, disableClickEventBubbling: true },
    { field: "status", headerName: "Status", width: 150, disableClickEventBubbling: true },
    {
      field: "",
      headerName: "",
      renderCell: (params) => (
        <div>
          <span><Edit className={`${ userSelected && userSelected.id === params.row.id ? "": classes.disabled} ${classes.actionIcon}`} onClick={() => userSelected && userSelected.id === params.row.id? setOpen(true): void(0)}/></span>
          <span><Delete className={`${ userSelected && userSelected.id === params.row.id ? "": classes.disabled} ${classes.actionIcon}`} onClick={deleteUsers}/></span>
        </div>
      ),
      disableColumnMenu: true,
      sortable: false,
      filterable: false,
      width: 75
    }
  ];

  const updateUserDoa = (params) => {
    setUserSelected({
      ...userSelected,
      doa: params.users
    });
    const newDataRow = dataRows.map( elm => {
      if(elm._id === userSelected._id){
        elm.doa = params.users
      }
      return elm;
    })
    setDataRows(newDataRow);
  }

  return (
    <Layout>
      <Box component="div">
        {userSelected && (
          <DoaDialog
            user={dataRows}
            userSelected={userSelected && userSelected.hasOwnProperty("doa") && userSelected.doa.length > 0
              ? userSelected.doa.map( elm => {
                elm.selected=true;
                return elm;
              }) : []
            }
            open={open}
            setOpen={setOpen}
            updatedUser={updateUserDoa}
          />
        )}
        <BrandHeader
          total={dataRows.length}
          totalHeading={"Total no. of Users"}
          active={1,78,786}
          activeHeading={"DOA - Active"}
          inActive={1,78,786}
          inActiveHeading={"DOA - Incomplete"}
          heading="DOA Set up"
        >
          <TextField
            style={{ width: "150px" }}
            variant="outlined"
            type="search"
            placeholder="Search"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="disabled" />
                </InputAdornment>
              ),
            }}
          />
          <Box component="span" marginX={1} />
          <Button
            color="inherit"
            className={classes.actionBtn}
            onClick={() => {}}
          >
            Actions
          </Button>
        </BrandHeader>
        <Container>
          <div style={{ width: "100%", height: "300px" }}>
            <DataGrid
              GridLinesVisibility="None"
              rows={dataRows}
              columns={columns}
              pageSize={5}
              checkboxSelection
              disableSelectionOnClick
              onSelectionChange={handleRowSelection}
              disableMultipleSelection
            />
          </div>
          <Box marginY={5} />
          <BoxWithBorder styles={{ minHeight: "300px", padding: "0px" }}>
            {userSelected && !Object.keys(userSelected).length
            ? "Selection one DOA"
            : (userSelected ? 
              userSelected.hasOwnProperty("doa") && userSelected.doa.length > 0 
              ? (
                <NewStepper
                  heading={"DOA Details"}
                  steps={userSelected.doa}
                />
              ): (
                <React.Fragment>
                    <div style={{color: "#DD5052" }}>No DOA created </div>
                    <Button
                      color="inherit"
                      className={classes.actionBtn}
                      onClick={() => {}}
                    >
                      Add Doa
                    </Button>
                </React.Fragment>
              ): "Select a DOA"
            )}
          </BoxWithBorder>
        </Container>
      </Box>
    </Layout>
  )
};

export default AddDoa;
