import { Box, IconButton } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import queryString from 'query-string';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import { gridLoadingTimeout } from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import ArrangeView from './ArrangeView';
import { AddOutlined } from '@mui/icons-material';
import { useData } from 'src/StateProvider/Provider';
import { useHistory } from 'react-router-dom';
import SectionMaster from './sectionMaster';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@mui/icons-material/Delete';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';

const renderedFrom = 'form-builder';

const FormBuilder = () => {
  const toastConfig = useContext(CustomToastContext);
  const [arrangeViewOpen, setArrangeViewOpen] = useState(false);
  const [openSectionMaster, setOpenSectionMaster] = useState(false);
  const [resource, setResource] = useState([]);
  const [columns, setColumns] = useState(null);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const history = useHistory();
  let { dynamicResource }: any = queryString.parse(history.location.search);
  const { search } = state;

  const {
    state: { permissions, user, resources }
  }: any = useData();

  const [deleteRecord, setDeleteRecord] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = () => {
    const columns = [
      {
        accessor: 'resourceLabel',
        Header: 'Resource Label (Singular)',
        primaryField: true,
        width: 300,
        Cell: ({ row }) => (
          <div>
            <Link className="text-truncate link" to={'/form-builder/' + row?.original?.resource}>
              {row?.original?.resourceLabel || row?.original?.resource}
            </Link>
          </div>
        )
      },
      {
        accessor: 'homePageLabel',
        Header: 'Resource Label (Plural)',
        width: 300,
        Cell: ({ row }) => (row?.original?.homePageLabel ? <p className="text-truncate">{row?.original?.homePageLabel}</p> : <NoDataCell />)
      },
      {
        accessor: 'section',
        Header: 'Section',
        width: 300,
        Cell: ({ row }) => (row?.original?.section ? <p className="text-truncate">{row?.original?.section}</p> : <NoDataCell />)
      },
      {
        accessor: 'resource',
        Header: 'Resource',
        width: 300,
        Cell: ({ row }) => (row?.original?.resource ? <p className="text-truncate">{row?.original?.resource}</p> : <NoDataCell />)
      },
      {
        accessor: 'childResource',
        Header: 'Child Resource',
        accessorFn: (data) => (data?.childResource ? 'Yes' : 'No'),
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.childResource ? 'Yes' : 'No'}</p>
      },
      {
        accessor: 'dynamicResource',
        Header: 'Dynamic Resource',
        accessorFn: (data) => (data?.dynamicResource ? 'Yes' : 'No'),
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.dynamicResource ? 'Yes' : 'No'}</p>
      },
      {
        accessor: 'action',
        Header: 'Actions',
        minWidth: 100,
        width: 100,
        sticky: 'right',
        disableFilters: true,
        canDrag: false,
        Cell: ({ row }) => (
          <>
            {row?.original?.dynamicResource && (
              <HtmlTooltip title={'Delete'}>
                <span>
                  <IconButton
                    size="small"
                    aria-label="Delete"
                    onClick={() => {
                      setDeleteRecord(row.original);
                      setShowDeleteConfirmBox(true);
                    }}
                  >
                    <DeleteIcon fontSize="small" color={'error'} />
                  </IconButton>
                </span>
              </HtmlTooltip>
            )}
          </>
        )
      }
    ];
    setColumns(columns);
  };

  useEffect(() => {
    fetchGetBrandResource();
  }, [search]);

  const closeHandler = () => {
    setArrangeViewOpen(false);
    fetchGetBrandResource();
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const fetchGetBrandResource = () => {
    dispatch({ type: 'loading', loading: true });
    let api = `/sa-formbuilder/resource?allResource=true`;
    if (dynamicResource) {
      api = `${api}&dynamicResource=${dynamicResource}`;
    }
    axiosInstance()
      .get(api)
      .then(({ data: { data } }) => {
        data.forEach((d) => {
          d['_id'] = d.id;
        });
        setResource(data);
        dispatch({ type: 'initialize', data: data, count: data.length });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const RightSideContents = () => {
    return (
      <>
        {permissions.formBuilder?.isCreate && (
          <ThemeButton
            buttonType="theme"
            onClick={() => {
              history.push('/form-builder/0');
            }}
            startIcon={<AddOutlined />}
          >
            Add
          </ThemeButton>
        )}
      </>
    );
  };

  const handleDelete = () => {
    setIsDeleting(true);
    axiosInstance()
      .put(`/sa-formbuilder/remove`, { resourceName: deleteRecord?.resource })
      .then(() => {
        setIsDeleting(false);
        setDeleteRecord(null);
        setShowDeleteConfirmBox(false);
        fetchGetBrandResource();
      })
      .catch((error) => {
        setIsDeleting(false);
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ ...routes.formBuilder, title: resources?.formBuilder?.titlePlural }]} />
        <div className="flex items-center gap-1">
          <ThemeButton
            onClick={() => {
              setArrangeViewOpen(true);
            }}
            iconForMobile={false}
          >
            Change Resource Order
          </ThemeButton>
          <ThemeButton
            onClick={() => {
              setOpenSectionMaster(true);
            }}
            iconForMobile={false}
          >
            Sections
          </ThemeButton>
        </div>
      </div>
      <CustomContainer>
        <ListingPageHeader
          rightSideContents={<RightSideContents />}
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={false}
          isAddButtonVisible={false}
        />
        {arrangeViewOpen && <ArrangeView open={arrangeViewOpen} close={closeHandler} resourceData={resource} />}
        {openSectionMaster && <SectionMaster close={() => setOpenSectionMaster(false)} />}
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 250px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchGetBrandResource}
            isClientSideGrid={true}
            hideSelection={true}
            rememberClientFilters={true}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
        {showDeleteConfirmBox && (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete ${deleteRecord?.resourceLabel} ?`}
            okBtnLoading={isDeleting}
            onClose={() => {
              setDeleteRecord(null);
              setShowDeleteConfirmBox(false);
            }}
            onOk={handleDelete}
          />
        )}
      </CustomContainer>
    </section>
  );
};

export default FormBuilder;
