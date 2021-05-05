import { useState, FC, useCallback, useEffect, useContext } from "react";
import { Checkbox, Link as MuiLink } from "@material-ui/core";
import { DataGrid } from "@material-ui/data-grid";
import moment from "moment";
import { Link } from "react-router-dom";

import axiosInstance from "../../axios/axiosInstance";
import Layout from "../../components/Layout";
import routes from "../../components/Helpers/Routes";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import ProjectStrategyHeader from "./Header";
import DataGridCustomToolbar from "../../components/Helpers/DataGridCustomToolbar";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import MessageDialog from "../../components/Helpers/MessageDialog";
import { getSearchQuery } from "../../services/util";
import { useData } from "../../StateProvider/Provider";
import CreateProjectStrategy from "./CreateProjectSales";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import NoDataCell from "../../components/Helpers/NoDataCell";
import CustomDataGridNoDataFound from "../../components/Helpers/CustomDataGridNoDataFound";

const ProjectSales: FC = () => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions },
  }: any = useData();

  const [searchVal, setSearchVal] = useState("");
  const [query, setQuery] = useState({ page: 0, limit: 25 });
  const [selectedProjects, setSelectedProjects] = useState<any[]>([]);
  const [dataRows, setDataRows] = useState<any[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [checkAllProjects, setCheckAllProjects] = useState(false);
  const [deleteRec, setDeleteRec] = useState<any>({});
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [
    showDeleteWarningConfirmBox,
    setShowDeleteWarningConfirmBox,
  ] = useState(false);

  const fetchProjects = useCallback(() => {
    let searchParams: any = { ...query };
    searchParams = searchVal
      ? { ...searchParams, search: searchVal }
      : { ...searchParams };
    let api = getSearchQuery("/project-sales", searchParams);
    setLoadingProjects(true);
    axiosInstance()
      .get(api)
      .then(({ data: { data, count } }) => {
        getRows(data);
        setRowCount(count);
        setCheckAllProjects(false);
        setLoadingProjects(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setLoadingProjects(false);
      });
    // eslint-disable-next-line
  }, [searchVal, query]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const getRows = (data: []) => {
    const rows = data.length
      ? data.map((project: any) => ({
          id: project._id,
          isChecked: false,
          name: project.projectName,
          projectOwner: project.projectOwner?.optionLabel,
          createdAt: moment(project.createdAt).format("MMM Do, YYYY"),
          createdBy: project?.createdBy,
          updatedBy: project?.updatedBy,
        }))
      : [];
    setDataRows(rows);
  };

  const columns = [
    {
      field: "isChecked",
      headerName: "Checkbox",
      renderHeader: () => (
        <Checkbox
          color="primary"
          checked={checkAllProjects}
          onChange={(ev) => {
            setCheckAllProjects(ev.target.checked);
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
          checked={params.value}
          onChange={(ev) => {
            updateCheckedStatus(params, ev);
          }}
        />
      ),
      disableColumnMenu: true,
      sortable: false,
      filterable: false,
      width: 75,
    },
    {
      field: "name",
      headerName: "Name",
      width: 250,
      renderCell: (params: any) => (
        <MuiLink
          title={params.value}
          className="text-truncate"
          component={Link}
          to={`${routes.projectSalesDetail.path}/${params.row.id}`}
        >
          {params.value}
        </MuiLink>
      ),
    },

    // {
    //   field: "createdAt",
    //   headerName: "Created At",
    //   width: 150,
    //   renderCell: (params: any) => (
    //     <p title={`Created At • ${params.value}`} className="text-truncate">
    //       {params?.value}
    //     </p>
    //   ),
    // },
    {
      field: "createdBy",
      headerName: "Created By",
      width: 250,
      disableColumnMenu: true,
      sortable: false,
      filterable: false,
      renderCell: (params: any) =>
        params?.value && params?.value?.user ? (
          <h5 className="createBy">
            {params?.value?.user?.firstName}
            <span
              className="createdAtTime badge-date"
              title={`${params?.value?.user?.firstName} • ${moment(
                params?.value?.date?.slice(0, 10)
              ).format("MMM Do, YYYY")}`}
            >
              {moment(params?.value?.date?.slice(0, 10)).format("MMM Do, YYYY")}
            </span>
          </h5>
        ) : (
          <NoDataCell />
        ),
    },
    {
      field: "updatedBy",
      headerName: "Updated By",
      width: 250,
      renderCell: (params: any) =>
        params?.value && params?.value?.user ? (
          <h5 className="updateBy">
            {params.value.user.firstName}
            <span
              className="updatedAtTime badge-date"
              title={`${params.value.user.firstName} • ${moment(
                params.value.date.slice(0, 10)
              ).format("MMM Do, YYYY")}`}
            >
              {moment(params.value.date.slice(0, 10)).format("MMM Do, YYYY")}
            </span>
          </h5>
        ) : (
          <NoDataCell />
        ),
      disableColumnMenu: true,
      sortable: false,
      filterable: false,
    },
  ];

  const updateCheckedStatus = (params, ev) => {
    const gridData = [...dataRows];
    const indexOfRecord = gridData.findIndex((d) => d.id === params.row.id);
    gridData[indexOfRecord].isChecked = ev.target.checked;

    setDataRows([...gridData]);

    const checkedRecords = gridData.filter((d) => d.isChecked === true);

    if (checkedRecords.length === gridData.length) {
      setCheckAllProjects(true);
    } else {
      setCheckAllProjects(false);
    }

    handleSelectedProjects(params.row.id, ev.target.checked);
  };

  const showConfirmBox = (row) => {
    setIsConformDialogVisible(true);
    if (row && row.id) {
      setDeleteRec(row);
    }
  };

  const handleDeleteProjects = async () => {
    setDeleteLoading(true);
    let recs = [];
    if (deleteRec?.id) {
      recs.push(deleteRec?.id);
    } else {
      dataRows.forEach((obj) => {
        if (obj.isChecked) recs.push(obj.id);
      });
    }
    if (recs && recs.length > 0) {
      axiosInstance()
        .put(`/project-sales/remove`, { ids: [...recs] })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
          if (deleteRec) setDeleteRec({});
          fetchProjects();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
        });
    }
  };

  const handleSearch = (e) => {
    if (query.page !== 0) {
      setQuery((prevState) => ({ ...prevState, page: 0 }));
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
  };

  // Handle project selection
  const handleSelectedProjects = (id, isChecked) => {
    let tempSelectedProjects = [...selectedProjects],
      curRecIndex = selectedProjects.indexOf(id);
    if (isChecked && curRecIndex < 0) {
      tempSelectedProjects = [...selectedProjects, id];
    } else if (!isChecked && curRecIndex >= 0) {
      tempSelectedProjects.splice(curRecIndex, 1);
    }
    setSelectedProjects(tempSelectedProjects);
  };

  const handleCreate = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const onFilterChange = useCallback((params) => {
    if (params.filterModel.items[0].value) {
      setQuery((prevState) => ({
        ...prevState,
        [params.filterModel.items[0].columnField]:
          params.filterModel.items[0].value,
      }));
    } else {
      setQuery({ page: 0, limit: 25 });
    }
  }, []);

  return (
    <>
      {isOpen && (
        <CreateProjectStrategy
          open={isOpen}
          close={handleClose}
          fetchData={fetchProjects}
        />
      )}
      <Layout>
        <CustomBreadCrumbs routes={[routes.projectSales]} />
        <div className="main-container">
          <div className="header-panel">
            <ProjectStrategyHeader
              onSearch={handleSearch}
              searchVal={searchVal}
              permissions={permissions}
              onCreate={handleCreate}
              showConfirmBox={showConfirmBox}
              canDelete={dataRows.filter((d) => d.isChecked).length === 0}
            />
          </div>
          <div className="listing-grid">
            <DataGrid
              components={{
                Toolbar: DataGridCustomToolbar,
                NoRowsOverlay: CustomDataGridNoDataFound,
              }}
              loading={loadingProjects}
              rows={loadingProjects ? [] : dataRows}
              columns={columns}
              disableSelectionOnClick
              disableMultipleSelection
              paginationMode="server"
              pagination
              rowCount={rowCount}
              onPageChange={handlePage}
              onPageSizeChange={handlePageSize}
              pageSize={query.limit}
              page={query.page}
              onSortModelChange={handleSortModelChange}
              rowsPerPageOptions={[25, 50, 75]}
              density="compact"
              onFilterModelChange={onFilterChange}
            />
          </div>
        </div>
        {showDeleteWarningConfirmBox ? (
          <MessageDialog
            open={showDeleteWarningConfirmBox}
            message={`You are trying to delete records which you do not have permission to delete, Please remove those records from selection and try again.`}
            onClose={() => setShowDeleteWarningConfirmBox(false)}
          />
        ) : null}

        {isConfirmDialogVisible ? (
          <ConfirmationDialog
            open={isConfirmDialogVisible}
            message={`Are you sure, you want to delete this record ${
              deleteRec.name || ""
            }?`}
            onClose={() => {
              if (deleteRec) setDeleteRec({});
              setIsConformDialogVisible(false);
            }}
            okBtnLoading={deleteLoading}
            onOk={handleDeleteProjects}
          />
        ) : null}
      </Layout>
    </>
  );
};

export default ProjectSales;
