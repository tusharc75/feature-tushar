import React, { useState, useEffect, useContext } from "react";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import {
  Grid,
  Divider,
  IconButton,
  Tooltip,
  Checkbox,
} from "@material-ui/core";
import { Link } from 'react-router-dom'
import { accountDetailPage } from '../../routes/Accounts'
import DeleteIcon from '@material-ui/icons/Delete';
import BlockIcon from '@material-ui/icons/Block';
import { DataGrid, GridToolbar } from "@material-ui/data-grid";
import { useData } from '../../StateProvider/Provider';
import Layout from "../../components/Layout";
import Container from "../../components/Container";
import axiosInstance from '../../axios/axiosInstance'
import { getSearchQuery, displayDate } from '../../services/util'
import OpportunitiesHeader from "./OpportunitiesHeader";
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import MessageDialog from '../../components/Helpers/MessageDialog'
import "./style.scss";
import DataGridCustomToolbar from "../../components/Helpers/DataGridCustomToolbar";
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import CustomRenderCell from '../../components/Helpers/CustomRenderCell'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { GiHiveMind } from 'react-icons/gi';
import ManageOpportunityDialog from "./ManageOpportunityDialog/ManageOpportunityDialog";
import { downloadExcel, opportunity, opportunityTemplateFileName, opportunityImportErrorFileName } from '../../constants/helpers'
import moment from "moment";
import NoDataCell from "../../components/Helpers/NoDataCell";

let opportunityTimeout
const useStyles = makeStyles((theme) => ({
  linksContainer: {
    display: "flex",
  },
  links: {
    color: theme.palette.primary.main,   //  textDark
    fontSize: "0.90rem"
  },
  linkDivider: {
    backgroundColor: theme.palette.primary.main,  //  darkBg
    margin: "0 1rem",
  },
}));

const OpportunityTypes = [
  {
    key: "All Opportunities",
    value: 1
  },
  {
    key: "My Opportunities",
    value: 2
  }
]

const Opportunities = () => {
  const toastConfig = useContext(CustomToastContext);
  const classes = useStyles();
  const { state: { user, selectedEntity, permissions } }: any = useData();
  const [searchVal, setSearchVal] = useState("");
  const [query, setQuery] = useState({ page: 0, limit: 25 });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedType, setSelectedType] = useState(1)
  const [isOpen, setIsOpen] = useState(false)
  const [checkAllOpprtunities, setCheckAllOpportunities] = useState(false);
  const [dataRows, setDataRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [renderCount, setRenderCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [opportunityData, setOpportunityData] = useState([]);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false)
  const [deleteRec, setDeleteRec] = useState<any>({})
  const [opportunityPermissions, setOpportunityPermissions] = useState({ isCreate: false, isUpdate: false, isRead: false, isDelete: false });
  const [showCreateOpportunityDialog, setShowCreateOpportunityDialog] = useState(false);
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false)
  const [singleOpportunityDelete, setSingleOpportunityDelete] = useState({ id: null, show: false, opportunityName: "" })

  const { opportunityResource, opportunityApi } = opportunity

  useEffect(() => {
    if (permissions && permissions[opportunityResource]) {
      setOpportunityPermissions(permissions[opportunityResource]);
    }
  }, [permissions]);

  useEffect(() => {
    let millisec = Object.keys(searchVal).length > 0 ? 600 : 5;
    if (opportunityTimeout) {
      clearTimeout(opportunityTimeout);
    }

    opportunityTimeout = setTimeout(() => {
      fetchOpportunities();
    }, millisec);

  }, [searchVal]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchOpportunities();
    } else setRenderCount((preCount) => preCount + 1);
  }, [query, selectedType, selectedEntity]);

  useEffect(() => {
    let rows = opportunityData?.map((u) => {
      let res = {
        ...u,
        isChecked: false,
        id: u._id,
        canDelete: u.owner?.optionValue === user?.user._id,
        owner: u.owner?.optionLabel ? u.owner.optionLabel : '',
        stage: u.stage ? u.stage : '',
        closeDate: u?.closeDate ? displayDate(u.closeDate) : '',
        // accountName: u?.accountName?.optionLabel || ''
      }
      return res
    });
    setDataRows([...rows]);
  }, [opportunityData])

  const handleSingleDeleteOpportunity = async () => {
    setLoading(true);

    axiosInstance()
      .put(`${opportunityApi}/remove?entity=${selectedEntity}`, { ids: [singleOpportunityDelete.id] }).then(({ data }) => {
        toastConfig.setToastConfig({ open: true, type: "success", message: data.message });
        fetchOpportunities();
        setLoading(false);
      })
    setSingleOpportunityDelete({ id: null, show: false, opportunityName: "" })
  }
  const fetchOpportunities = async () => {
    if (selectedEntity) {
      setLoading(true);
      let searchParams: any = { ...query, entity: selectedEntity, filterOpportunities: selectedType }
      searchParams = searchVal
        ? { ...searchParams, search: searchVal }
        : { ...searchParams };
      let api = getSearchQuery(opportunityApi, searchParams)
      try {
        axiosInstance()
          .get(api).then(({ data }) => {
            setRowCount(data.count)
            setOpportunityData(data.data)
            setLoading(false);
          })

      }
      catch (err) {
        setLoading(false);
      }
    }
  }

  const handleSearch = (e) => {
    if (query.page !== 0) {
      setQuery((prevState) => ({ ...prevState, page: 0 }));
    }
    setSearchVal(e.target.value);
  };



  // ****** ACTIONS BUTTON STUFF *********
  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const handleOpportunityTypeSel = (filterValues) => {
    setSelectedType(filterValues);
  };

  const onSuccess = () => {
    setShowCreateOpportunityDialog(false)
    fetchOpportunities();
  }

  const columns = [
    {
      field: "isChecked",
      headerName: "Checkbox",
      renderHeader: () => (
        <Checkbox
          color="primary"
          checked={checkAllOpprtunities}
          onChange={(ev) => {
            setCheckAllOpportunities(ev.target.checked);
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
          // color="primary"
          // checked={params.value}
          // onChange={(ev) => {
          //   updateCheckedStatus(params, ev)

          // }}

          color="primary"
          // disabled={!params.canDelete}
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
              setCheckAllOpportunities(true);
            } else {
              setCheckAllOpportunities(false);
            }
          }}
        />
      ),
      disableColumnMenu: true,
      sortable: false,
      filterable: false,
      width: 75,
    },
    {
      field: "opportunityName", headerName: "Opportunity Name", width: 400,
      renderCell: (params) => (
        getFirstName(params.row)
      )
    },
    {
      field: "accountName", headerName: "Account Name", width: 300,
      renderCell: (params) => (
        <Link className="link" to={`${accountDetailPage.path}/${params?.row?.accountName?.optionValue}`}>
          {params?.row?.accountName?.optionLabel ? params.row.accountName.optionLabel : ''}
        </Link>
      )
    },
    {
      field: "createdBy",
      headerName: "Created By",
      width: 250,
      disableColumnMenu: true,
      sortable: false,
      filterable: false,
      renderCell: (params) =>
        params?.value && params?.value?.user ? (
          <h5 className="createBy">
            {params.value.user.firstName}
            <span
              className="createdAtTime"
              title={`${params.value.user.firstName} • ${moment(
                params?.value?.date?.slice(0, 10)
              ).format('MMM Do, YYYY')}`}
            >
              {moment(params?.value?.date?.slice(0, 10)).format(
                'MMM Do, YYYY'
              )}
            </span>
          </h5>
        ) : <NoDataCell />
      // renderCell: (params) => <CustomRenderCell value={params?.value?.createdBy?.optionLabel} />
    },
    {
      field: "updatedBy",
      headerName: "Updated By",
      width: 250,
      sortable: false,
      filterable: false,
      renderCell: (params) =>
        params?.value?.user ? (
          <h5 className="updateBy">
            {params.value.user.firstName}
            <span
              title={params.value.date}
              className="updatedAtTime"
            >
              {moment(params?.value?.date?.slice(0, 10)).format(
                'MMM Do, YYYY'
              )}
            </span>
          </h5>
        ) :
          <NoDataCell />

      // renderCell: (params) => <CustomRenderCell value={params?.value?.updatedBy?.optionLabel} />
    },
    {
      field: "stage", headerName: "Stage", width: 250,
      renderCell: (params) => <CustomRenderCell value={params?.value} />
    },
    {
      field: "closeDate", headerName: "Close Date", width: 250,
      renderCell: (params) => <CustomRenderCell value={params?.value} />
    },
    // { field: "status", headerName: "Lead Status", width: 200 },
    {
      field: "owner", headerName: "Opportunity Owner", width: 250,
      renderCell: (params) => <CustomRenderCell value={params?.value} />
    },
    {
      field: "actions", headerName: "Actions ",
      renderCell: (params) => (
        <>
          {
            opportunityPermissions.isDelete ?
              params.row.canDelete ?
                <Tooltip
                  title="Delete" >
                  <IconButton aria-label="Delete" onClick={() => setSingleOpportunityDelete({ show: true, id: params.row._id, opportunityName: `${params.row.opportunityName}` })} >
                    <DeleteIcon
                      fontSize="small" color="error" />
                  </IconButton>
                </Tooltip > :
                <Tooltip className="cursor-stop" title="You must be the owner of this opportunity to get the delete functionality">
                  <IconButton aria-label="Delete">
                    <DeleteIcon fontSize="small" color="error" />
                  </IconButton>
                </Tooltip> :
              <Tooltip className="cursor-stop" title="You do not have permission to delete opportunity">
                <IconButton aria-label="Delete">
                  <DeleteIcon fontSize="small" color="error" />
                </IconButton>
              </Tooltip>
          }

        </>
      ),
      disableColumnMenu: true,
      sortable: false,
      filterable: false,
      width: 200
    },
  ];

  const showConfirmBox = (row) => {
    if (row) {
      setIsConformDialogVisible(true)
      if (row && row._id) {
        setDeleteRec(row)
      }
    }
    else {
      if (dataRows.find((d) => d.isChecked && d.canDelete == false)) {
        setShowDeleteWarningConfirmBox(true);
      } else {
        setIsConformDialogVisible(true)
      }
    }
  }
  const getFirstName = tData => {
    return <Link className="nameLink"
      to={`${routes.opportunityDetail.path}/${tData._id}`}
    >
      <span className="text-capitalize">{tData.opportunityName}</span>
    </Link>
  }

  const updateCheckedStatus = (params, ev) => {
    const gridData = [...dataRows];
    const indexOfRecord = gridData.findIndex(
      (d) => d.id === params.row.id
    );
    gridData[indexOfRecord].isChecked = ev.target.checked;

    setDataRows([...gridData]);

    const checkedRecords = gridData.filter((d) => d.isChecked === true);

    if (checkedRecords.length === gridData.length) {
      setCheckAllOpportunities(true);
    } else {
      setCheckAllOpportunities(false);
    }
  }

  const handlePage = (params) => {
    if (query.page !== params.page) {
      setQuery((prevState) => ({ ...prevState, page: params.page }));
    }
  };

  const handlePageSize = (params) => {
    if (params.pageSize !== query.limit) {
      setQuery({ page: 0, limit: params.pageSize });
    }
  };

  const handleSortModelChange = (params) => {
    if (params?.sortModel && params.sortModel.length > 0) {
      let temp = { ...params.sortModel[0] };
      setQuery((prevState) => ({
        ...prevState,
        page: 0,
        sortBy: temp.field,
        orderBy: temp.sort,
      }));
    }
  }

  const clickCreateNew = () => {
    setShowCreateOpportunityDialog(true);
  }

  const handleDeleteOpportunity = async () => {
    setDeleteLoading(true)
    let recs = []
    if (deleteRec?._id) {
      recs.push(deleteRec?._id)
    }
    else {
      recs = dataRows.filter(obj => obj.isChecked).map(o => o._id)
    }
    if (recs && recs.length > 0) {
      axiosInstance()
        .put(`${opportunityApi}/remove?entity=${selectedEntity}`, { ids: [...recs] }).then(({ data }) => {
          toastConfig.setToastConfig({ open: true, type: "success", message: data.message });
          setIsConformDialogVisible(false)
          setDeleteLoading(false)
          if (deleteRec) setDeleteRec({})
          fetchOpportunities()
        }).catch(error => {
          toastConfig.setToastConfig(error);
          setIsConformDialogVisible(false)
          setDeleteLoading(false)
        })
    }
  }

  const uploadOpportunities = (event) => {
    if (event.target.files && event.target.files.length) {
      toastConfig.setToastConfig({ open: true, type: "info", message: "Uploading opportunities, Please wait..." });
      const file = event.target.files[0];

      let formData = new FormData();
      formData.append("file", file);
      axiosInstance()
        .post(`/${opportunityApi}/import`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then(({ data }) => {
          if (data.message) {
            toastConfig.setToastConfig({ open: true, type: "success", message: data.message });
            fetchOpportunities();
          }
          else {
            downloadExcel(data, opportunityImportErrorFileName);
            toastConfig.setToastConfig({ open: true, type: "error", message: "Found some issue(s) while importing opportunities" });
          }
        })
        .catch((error) => {
          toastConfig.setToastConfig(error)
        });
    }
  };

  return (
    <>
      <Layout>
        <Grid container>
          <Grid item md={6} sm={12} xs={12}>
            <CustomBreadCrumbs routes={[routes.opportunity]} />
          </Grid>
          <Grid item md={6} sm={12} xs={12} className="d-flex align-items-center bg-white">
            <Grid container direction="row">
              <Grid item xs={12} sm={12} className="pr-3">
                <Grid container justify="flex-end">
                  <label htmlFor="importFromExcel" className={`${classes.links} cursor-pointer`}>
                    <input
                      id="importFromExcel"
                      name="importFromExcel"
                      onChange={uploadOpportunities}
                      accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                      style={{
                        opacity: "0",
                        position: "absolute",
                        zIndex: -1,
                      }}
                      type="file"
                    />
                Import from Excel
              </label>
                  <Divider
                    orientation="vertical"
                    flexItem
                    className={classes.linkDivider}
                  />
                  <label
                    onClick={(e) => {
                      axiosInstance().get(`/${opportunityApi}/template?export=true`, { responseType: "arraybuffer" })
                        .then((response) => {
                          downloadExcel(response.data, opportunityTemplateFileName)
                        }).catch((error) => {
                          toastConfig.setToastConfig(error);
                        });
                    }}
                    className={`${classes.links} cursor-pointer`}
                  >
                    Export to Excel
              </label>
                  <Divider
                    orientation="vertical"
                    flexItem
                    className={classes.linkDivider}
                  />
                  <label
                    onClick={(e) => {
                      axiosInstance().get(`/${opportunityApi}/template`, { responseType: "arraybuffer" }).then((response) => {
                        downloadExcel(response.data, opportunityTemplateFileName)
                      }).catch((error) => {
                        toastConfig.setToastConfig(error);
                      });
                    }}
                    className={`${classes.links} cursor-pointer`}
                  >
                    Download Template
              </label>
                  <Divider
                    orientation="vertical"
                    flexItem
                    className={classes.linkDivider}
                  />
                  <label
                    onClick={(e) => e.preventDefault()}
                    className={`${classes.links} cursor-pointer`}
                  >
                    Email a Link
              </label>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Tables Begins Here */}
        <Container>
          <div className="header-panel">
            <OpportunitiesHeader
              selectedType={selectedType}
              onTypeChange={handleOpportunityTypeSel}
              options={OpportunityTypes}
              onSearch={handleSearch}
              searchVal={searchVal}
              opportunityPermissions={opportunityPermissions}
              onCreate={clickCreateNew}
              showConfirmBox={showConfirmBox}
              canDelete={dataRows.filter((d) => d.isChecked).length == 0}
              icon={<GiHiveMind className="headerLogo" />}
              heading="Opportunities"
            />
          </div>
        </Container>
        <Container >
          <div className="listing-grid">
            <DataGrid
              components={{
                Toolbar: DataGridCustomToolbar,
              }}
              rows={loading ? [] : dataRows}
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
              rowsPerPageOptions={[25, 50, 75]}
              onSortModelChange={handleSortModelChange}
              density="compact"
            />
          </div>

          {
            showDeleteWarningConfirmBox ?
              <MessageDialog
                open={showDeleteWarningConfirmBox}
                message={`You are trying to delete records which you do not have permission to delete, Please remove those records from selection and try again.`}
                onClose={() => setShowDeleteWarningConfirmBox(false)}
              /> : null
          }
          {
            isConfirmDialogVisible ?
              <ConfirmationDialog
                open={isConfirmDialogVisible}
                message={`Are you sure, you want to delete ${deleteRec?.opportunityName ? "Opportunity" : "Opportunities"}   ${deleteRec.opportunityName || ''}?`}
                onClose={() => {
                  if (deleteRec) setDeleteRec({})
                  setIsConformDialogVisible(false)
                }}
                okBtnLoading={deleteLoading}
                onOk={handleDeleteOpportunity}
              /> : null
          }
          {/* {
            showCreateOpportunityDialog && <ManageOpportunityMain
              open={showCreateOpportunityDialog}
              onClose={() => setShowCreateOpportunityDialog(false)}
              onSuccess={() => {
                setShowCreateOpportunityDialog(false);
                fetchOpportunities()
              }}
            />
          } */}
          {
            singleOpportunityDelete.show ?
              <ConfirmationDialog
                open={singleOpportunityDelete.show}
                message={`Are you sure, you want to delete contact: ${singleOpportunityDelete.opportunityName} ?`}
                onClose={() => setSingleOpportunityDelete({ id: null, show: false, opportunityName: "" })}
                onOk={handleSingleDeleteOpportunity}
              /> : null
          }
        </Container>
      </Layout>

      {
        showCreateOpportunityDialog && <ManageOpportunityDialog
          open={showCreateOpportunityDialog}
          onSuccess={onSuccess}
          onClose={() => { setShowCreateOpportunityDialog(false) }}
          isNew={true}
          dataToUpdate={null}
          resource={null}
        />
      }
    </>
  );
};

export default Opportunities;
