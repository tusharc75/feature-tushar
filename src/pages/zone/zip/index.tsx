import { Box, Button, IconButton, MenuItem, useMediaQuery } from '@mui/material';
import { Delete } from '@mui/icons-material';
import React from 'react';
import { MobileExportIcon, MobileImportIcon } from 'src/assets/svg/svgIcons';
import CustomReactTable, { getStaticFields, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { DeleteButton, ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { read, utils, writeFile } from 'xlsx';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import CarouselDialog from '../../../components/CarouselDialog';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import routes from '../../../components/Helpers/Routes';
import { gridLoadingTimeout, prepareDataForGrid } from '../../../constants/helpers';
import CreateZip from '../CreateZip';

interface ConfigProps {
  id: string;
}

const renderedFrom = 'zone';

const Zipcode = (props: ConfigProps) => {
  const isMobile = useMediaQuery('(max-width:600px)');
  const { id } = props;
  const { setToastConfig, toastConfig } = React.useContext(CustomToastContext);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);
  const [showConfirmBox, setShowConfirmBox] = React.useState({
    open: false,
    zips: []
  });
  const [columns, setColumns] = React.useState([]);
  const [carouselDialog, setCarouselDialog] = React.useState({
    open: false,
    images: [],
    index: 0
  });
  const [section, setSection] = React.useState(null);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, page, limit, selectedRecords } = state;

  React.useEffect(() => {
    fetchGridColumns();
    getZipData();
  }, []);

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 100,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title="Delete">
          <IconButton
            size="small"
            aria-label="Delete"
            onClick={() => {
              setShowConfirmBox({
                open: true,
                zips: [row?.original?.zipCode]
              });
            }}
          >
            <Delete color="error" />
          </IconButton>
        </HtmlTooltip>
      </>
    )
  };

  const fetchGridColumns = () => {
    const columns = [
      {
        accessor: 'zipCode',
        Header: 'Zip Code',
        order: 1,
        Cell: ({ row }) => (
          <>
            <p className="text-truncate">{row?.original?.zipCode}</p>
          </>
        )
      },
      ...getStaticFields(),
      ActionsRenderer
    ];
    setColumns(columns);
  };

  const getZipData = () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`${routes.zone.path}/${id}/zip`)
      .then(({ data: { data, count } }) => {
        setSection(data);
        const rows = data.map((d, index) => {
          let finalObject = prepareDataForGrid(d);
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === d._id);
          finalObject['_id'] = index;

          return { ...finalObject };
        });
        dispatch({ type: 'initialize', data: rows, count: rows?.length });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const AddZip = (newZipCode: Array<any>) => {
    let newValues = { zoneZips: newZipCode };
    axiosInstance()
      .post(`/zone/${id}/zip`, newValues)
      .then(({ data: { data } }) => {
        setToastConfig({
          open: true,
          type: 'success',
          message: 'Zip Code imported Successfully'
        });
        getZipData();
      })
      .catch((error) => {
        setToastConfig(error);
      });
  };

  const removeData = () => {
    setRemoving(true);
    axiosInstance()
      .put(`${routes.zone.path}/${id}/zip/remove`, {
        zips: showConfirmBox.zips
      })
      .then(() => {
        dispatch({ type: 'selection', selectedRecords: [] });
        setShowConfirmBox({
          open: false,
          zips: []
        });
        getZipData();
        setRemoving(false);
        setToastConfig('Zipcode removed successfully');
      })
      .catch((err) => {
        setShowConfirmBox({
          open: false,
          zips: []
        });
        setRemoving(false);
        setToastConfig(err);
      });
  };

  const handleExportFields = () => {
    const header = ['Zip Code'];
    var ws = utils.json_to_sheet(section);
    if (header.length) {
      utils.sheet_add_aoa(ws, [header]);
    }
    var wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Sheet1');
    writeFile(wb, `Zip Code.xlsx`);
  };

  const handleImportFields = (e) => {
    e.preventDefault();
    var files = e.target.files,
      f = files[0];
    var reader = new FileReader();
    reader.onload = function (e) {
      var data: any = e.target.result;
      let readedData = read(data, { type: 'binary' });
      const wsname = readedData.SheetNames[0];
      const ws = readedData.Sheets[wsname];
      const dataParse = utils.sheet_to_json(ws, { header: 1 });
      let zipCode = dataParse.slice(1, dataParse?.length);
      let newZipCode = zipCode.map((item, i) => {
        return item[0];
      });
      AddZip(newZipCode);
    };
    reader.readAsBinaryString(f);
  };

  const addButtonMenuItems = () => {
    return (
      <>
        <MenuItem onClick={() => setOpenDialog(true)}>Add Zip Code</MenuItem>
      </>
    );
  };

  const rightSideContents = () => {
    return (
      <>
        <label className="cursor-pointer">
          <input
            onClick={(e: any) => (e.target.value = null)}
            id="importField"
            name="importField"
            onChange={handleImportFields}
            style={{
              opacity: '0',
              position: 'absolute',
              zIndex: -1
            }}
            type="file"
          />
          <ThemeButton iconForMobile={<MobileImportIcon />} mobileTooltip="Import from Excel">
            {isMobile ? '' : 'Import from Excel'}
          </ThemeButton>
        </label>
        <ThemeButton onClick={handleExportFields} mobileTooltip="Export to Excel" iconForMobile={<MobileExportIcon />}>
          Export to Excel
        </ThemeButton>
        <DeleteButton
          mode="light"
          onClick={() => {
            setShowConfirmBox({
              open: true,
              zips: selectedRecords.map((s) => s.zipCode)
            });
          }}
          size="small"
          disabled={selectedRecords.length === 0}
          disableElevation
          text={'Delete'}
        />
      </>
    );
  };

  return (
    <Box>
      <DetailsPageHeader
        isAddButtonVisible={true}
        addButtonMenuItems={addButtonMenuItems()}
        isActionButtonVisible={false}
        rightSideContents={rightSideContents()}
        hasXpadding
      />
      <Box className="flex flex-wrap justify-between gap-2">
        <Box className="flex flex-wrap gap-2"></Box>
      </Box>
      <Box>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={getZipData}
            showOnlyShowFilteredRecordSwitch={false}
            showFilters={false}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
      {openDialog && (
        <CreateZip
          isUpdateDisaCreateProductCategorybled={false}
          zoneId={id}
          isClone={false}
          onClose={() => setOpenDialog(false)}
          onSuccess={() => {
            setOpenDialog(false);
            getZipData();
          }}
        />
      )}
      {carouselDialog.open && (
        <CarouselDialog
          index={carouselDialog.index}
          close={() => {
            setCarouselDialog({
              open: false,
              images: [],
              index: 0
            });
          }}
          images={carouselDialog.images}
        />
      )}
      {showConfirmBox.open && (
        <ConfirmationDialog
          open={true}
          okBtnLoading={removing}
          message={`Are you sure you want to delete?`}
          onClose={() => {
            setShowConfirmBox({
              open: false,
              zips: []
            });
          }}
          onOk={removeData}
        />
      )}
    </Box>
  );
};
export default Zipcode;
