import { Box, Button, Dialog, IconButton } from '@material-ui/core';
import { AddOutlined } from '@material-ui/icons';
import EditIcon from '@material-ui/icons/Edit';
import { useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { ListingPageHeader } from 'src/components/PageHeaders';
import ManageSectionMaster from './ManageSectionMaster';

const sectionMaster = ({ open, close }) => {
  const renderedFrom = `section-master`;
  const [fullScreen, setFullScreen] = useState(true);
  const [columns, setColumns] = useState(null);
  const [openManageSectionMaster, setOpenManageSectionMaster] = useState({ open: false, data: null });

  const { state, dispatch } = useTableReducer();

  useEffect(() => {
    fetchColumn();
    fetchData();
  }, []);
console.log(state)
  const fetchColumn = async () => {
    const column: any = [
      {
        accessor: 'sectionName',
        Header: 'Section Name',
        disableFilters: true,
        width: 150,
        disabled: true,
        Cell: ({ row }) => {
          return row?.original['sectionName'] ? <p className="text-truncate">{row?.original['sectionName']}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'description',
        Header: 'Description',
        width: 150,
        disabled: true,
        Cell: ({ row }) => {
          return row?.original['description'] ? <p className="text-truncate">{row?.original['description']}</p> : <NoDataCell />;
        }
      }
    ];
    const actionColumn = {
      accessor: 'action',
      Header: 'Actions',
      minWidth: 60,
      width: 60,
      sticky: 'right',
      disableFilters: true,
      disableSortBy: true,
      canDrag: false,
      Cell: ({ row }) => (
        <HtmlTooltip title="Edit section">
          <IconButton
            size="small"
            aria-label="Issue"
            onClick={() => {
              setOpenManageSectionMaster({ open: true, data: row?.original });
            }}
          >
            <EditIcon fontSize="small" color="primary" />
          </IconButton>
        </HtmlTooltip>
      )
    };
    setColumns([...column, actionColumn]);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    const { data } = await axiosInstance().get(`section-master`);
    dispatch({ type: 'initialize', data: data?.data, count: data?.data?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const RightSideContents = () => {
    return (
      <>
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => {
            setOpenManageSectionMaster({ open: true, data: null });
          }}
          startIcon={<AddOutlined />}
        >
          Add
        </Button>
      </>
    );
  };

  return (
    <>
      <Dialog
        open
        fullScreen={fullScreen}
        maxWidth="md"
        fullWidth
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            close();
          }
        }}
      >
        <CustomDialogHeader
          title={`Section Master`}
          onClose={close}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen((prevState) => !prevState);
          }}
          showRequiredLabel={false}
          showManimizeMaximize={true}
        />
        <CustomDialogContent isFooterPresent={false}>
          <ListingPageHeader rightSideContents={<RightSideContents />} isActionButtonVisible={false} isAddButtonVisible={false} />
          {columns ? (
            <Box zIndex={5} width={'100%'} height={'calc(100vh - 200px)'}>
              <CustomReactTable
                height={'calc(100vh - 200px)'}
                columns={columns}
                state={state}
                dispatch={dispatch}
                refreshGrid={fetchData}
                hideSelection={true}
                renderedFrom={renderedFrom}
                isClientSideGrid={true}
                hideExportTable={true}
              />
            </Box>
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </CustomDialogContent>
      </Dialog>

      {openManageSectionMaster.open && (
        <ManageSectionMaster
          onClose={() => {
            setOpenManageSectionMaster({ open: false, data: null });
          }}
          onSuccess={() => {
            setOpenManageSectionMaster({ open: false, data: null });
            fetchData();
          }}
          sectionData={openManageSectionMaster.data}
        />
      )}
    </>
  );
};

export default sectionMaster;
