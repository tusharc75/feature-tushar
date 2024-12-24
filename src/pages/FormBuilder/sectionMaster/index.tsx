import { Box, Button, Dialog, IconButton } from '@mui/material';
import { AddOutlined } from '@material-ui/icons';
import EditIcon from '@material-ui/icons/Edit';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { ListingPageHeader } from 'src/components/PageHeaders';
import ManageSectionMaster from './ManageSectionMaster';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { DynamicIcon, defaultIcons } from 'src/assets/IconGenerator';
import { ServiceManagementIcon } from 'src/assets/sidebar_assets/icons';
import { CustomDialogTransition } from 'src/constants/helpers';

const renderedFrom = `section-master`;

const SectionMaster = ({ close }) => {
  const toastConfig = useContext(CustomToastContext);
  const [columns, setColumns] = useState(null);
  const [openManageSectionMaster, setOpenManageSectionMaster] = useState({ open: false, data: null });

  const { state, dispatch } = useTableReducer({ renderedFrom });

  useEffect(() => {
    fetchColumn();
    fetchData();
  }, []);

  const fetchColumn = async () => {
    const column: any = [
      {
        accessor: 'sectionName',
        Header: 'Section Name',
        width: 500,
        disabled: true,
        Cell: ({ row }) => {
          const iconName = row.original?.iconName
            ? row.original?.iconName
            : defaultIcons.includes(row.original?.sectionName || '')
              ? row.original?.sectionName
              : '';
          return row?.original['sectionName'] ? (
            <p className="text-truncate">
              <span className="mr-2">{DynamicIcon(iconName, { size: 18 }) || <ServiceManagementIcon size={18} />}</span>
              {row?.original['sectionName']}
            </p>
          ) : (
            <NoDataCell />
          );
        }
      },
      {
        accessor: 'description',
        Header: 'Description',
        disabled: true,
        width: 500,
        Cell: ({ row }) => {
          return row?.original['description'] ? <p className="text-truncate">{row?.original['description']}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'action',
        Header: 'Actions',
        width: 100,
        sticky: 'right',
        disableFilters: true,
        disableSortBy: true,
        canDrag: false,
        Cell: ({ row }) => (
          <HtmlTooltip title="Edit">
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
      }
    ];
    setColumns(column);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    await axiosInstance()
      .get(`section-master`)
      .then(({ data: { data } }) => {
        dispatch({ type: 'initialize', data: data, count: data?.length });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
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
        TransitionComponent={CustomDialogTransition}
        maxWidth="md"
        fullScreen={true}
        fullWidth
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            close();
          }
        }}
      >
        <CustomDialogHeader title={`Sections`} onClose={close} showManimizeMaximize={false} showRequiredLabel={false} />
        <CustomDialogContent isFooterPresent={false}>
          <ListingPageHeader rightSideContents={<RightSideContents />} isActionButtonVisible={false} isAddButtonVisible={false} />
          {columns ? (
            <Box>
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
                showArrangeView={false}
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

export default SectionMaster;
