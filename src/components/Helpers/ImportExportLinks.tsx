import React, { useContext, useState } from "react";
import {
  Divider,
  IconButton,
  makeStyles,
  useMediaQuery,
  Menu,
  MenuItem,
} from "@material-ui/core";
import { IoIosArrowDropdown } from "react-icons/io";
import axiosInstance from "../../axios/axiosInstance";
import { downloadExcel } from "../../constants/helpers";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
    flexGrow: 1,
    display: "flex",
    justifyContent: "flex-end",
  },
  linksContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    ["@media (max-width: 960px)"]: {
      display: "none",
    },
  },
  links: {
    color: theme.palette.info.light, //  textDark
    fontSize: 15,
  },
  linkDivider: {
    backgroundColor: "#ffffff42", //  darkBg
    margin: "0 10px",
  },
  delBtn: {
    color: "red",
  },
  expandIcon: {
    position: "absolute",
    right: "0",
    color: "white"
  }

}));

export default function ImportExportLinks({ ids = [], permissions, module, api,
  afterImportCompleted, recordsToExport = 0, exportSelectedRecords = null,
  onExportToExcelSuccess = () => { }
}) {
  const classes = useStyles();
  const isMobile = useMediaQuery("(max-width: 960px)");
  const toastConfig = useContext(CustomToastContext);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const uploadData = (event) => {
    if (event.target.files && event.target.files.length) {
      toastConfig.setToastConfig({
        hideDuration: null,
        open: true,
        type: "info",
        message: `Uploading ${module}, Please wait...`,
      });
      const file = event.target.files[0];

      let formData = new FormData();
      formData.append("file", file);
      axiosInstance()
        .post(`${api}/import`, formData, {
          responseType: "blob",
          headers: { "Content-Type": "multipart/form-data" },

        })
        .then((response) => {
          if (!response.headers["content-disposition"]) {
            toastConfig.setToastConfig({
              open: true,
              type: "success",
              message: "All Records Added Successfully",
            });
            afterImportCompleted();
          } else {
            const fileName = response.headers["content-disposition"].split(
              "filename="
            )[1];
            downloadExcel(response.data, fileName);
            toastConfig.setToastConfig({
              open: true,
              type: "error",
              message: `Found some issue(s) while importing ${module}`,
            });
            afterImportCompleted();
          }
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  /**
   * EXPORT TABLES INTO EXCEL
   */
  const exportToExcel = () => {
    let exportApi = `${api}/template?export=true`
    if (recordsToExport > 0) {
      if (exportSelectedRecords) {
        exportSelectedRecords()
        return
      }
      exportApi = exportApi + `&ids=${JSON.stringify(ids)}`
    }
    axiosInstance()
      .get(exportApi, {
        responseType: "arraybuffer",
      })
      .then((response) => {
        const fileName = response.headers["content-disposition"].split(
          "filename="
        )[1];
        downloadExcel(response.data, fileName);

        if (recordsToExport > 0) {
          onExportToExcelSuccess()
        }
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: "Exported to excel successfully.",
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });

  };

  /**
   * DOWNLOAD TEMPLATE
   */
  const downloadTemplate = () => {
    axiosInstance()
      .get(`${api}/template`, { responseType: "arraybuffer" })
      .then((response) => {
        const fileName = response.headers["content-disposition"].split(
          "filename="
        )[1];

        downloadExcel(response.data, fileName);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const ImportInput = (
    <input
      onClick={(e: any) => (e.target.value = null)}
      id="importFromExcel"
      name="importFromExcel"
      onChange={uploadData}
      accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
      style={{
        opacity: "0",
        position: "absolute",
        zIndex: -1,
      }}
      type="file"
    />
  );

  return (
    <div className={`${classes.root}`}>
      <div className={classes.linksContainer}>
        {permissions?.isCreate && <>
          <label
            htmlFor="importFromExcel"
            className={`${classes.links} cursor-pointer`}
          >
            {ImportInput}
            Import from Excel
          </label>
          <Divider
            orientation="vertical"
            flexItem
            className={classes.linkDivider}
          />
        </>
        }
        <label
          onClick={exportToExcel}
          className={`${classes.links} cursor-pointer`}
        >
          Export to Excel ({recordsToExport === 0 ? "All" : recordsToExport})
        </label>
        <Divider
          orientation="vertical"
          flexItem
          className={classes.linkDivider}
        />
        <label
          onClick={downloadTemplate}
          className={`${classes.links} cursor-pointer`}
        >
          Download Template
        </label>
        {/* <Divider
          orientation="vertical"
          flexItem
          className={classes.linkDivider}
        />
        <label
          onClick={(e) => e.preventDefault()}
          className={`${classes.links} cursor-pointer`}
        >
          Email a Link
        </label> */}
      </div>
      <Menu
        id="import-export-links"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem>
          <label htmlFor="importFromExcel" className="cursor-pointer">
            {ImportInput}
            Import from Excel
          </label>
        </MenuItem>
        <MenuItem
          onClick={() => {
            exportToExcel();
            handleClose();
          }}
        >
          Export to Excel ({recordsToExport === 0 ? "All" : recordsToExport})
        </MenuItem>
        <MenuItem
          onClick={() => {
            downloadTemplate();
            handleClose();
          }}
        >
          Download Template
        </MenuItem>
        {/* <MenuItem>Email a Link</MenuItem> */}
      </Menu>
      {isMobile && (
        <IconButton onClick={handleClick}>
          <IoIosArrowDropdown className={classes.expandIcon} />
        </IconButton>
      )}
    </div>
  );
}
