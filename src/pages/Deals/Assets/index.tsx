import { Box, IconButton, MenuItem, MenuList, Popover } from '@material-ui/core';
import Add from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import _, { camelCase, startCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { AssetAvailabilityIcon } from 'src/assets/svg/svgIcons';
import AssignSerializedAssetDialog from 'src/components/AssignRolesDialog/AssignSerializedAssetDialog';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import CalculatePriceDialog from 'src/components/RentalManagment/CalculatePriceDialog';
import { flattenArray } from 'src/constants/columns';
import { ownerAndColaborator, quotationApprovedMessage, rentalManagementMessage } from 'src/constants/messageHelpers';
import ManagePackageDialog from 'src/pages/Packages/ManagePackageDialog';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import routes from '../../../components/Helpers/Routes';
import { calculateRowsField, fetch_rental_product_fields, getNestedSubRows } from '../../../components/RentalManagment/helper';
import { autoCalculateSpecificFields } from '../../../constants/formulaUtility';
import { CHILD_RESOURCE, MATERIAL_TYPE, prepareDataForGrid, rentalManagement, sidebarResource } from '../../../constants/helpers';
import { findOne, objectStore } from '../../../constants/indexdbhelper';

const Assets = ({
  dealId,
}) => {
  const renderedFrom = camelCase(`${routes?.deals.title}_assets`);
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [allFields, setAllFields] = useState(null);
  const { state, dispatch } = useTableReducer();
  const { dataRows, selectedRecords } = state;

  const { generateColumns } = useColumns();
  const { isOffline } = useContext(CustomOfflineContext);

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    fetchData();
  }, [allFields]);


  const fetchFields = async () => {
    const response = await axiosInstance().get(`/field?resource=${sidebarResource.serializedAsset}`);
    setAllFields(JSON.parse(JSON.stringify(response?.data?.data)));
    const newColumns = generateColumns(renderedFrom, response?.data?.data, routes.serializedAssetDetail.path, true);
    setColumns([...newColumns, ...getStaticFields()]);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    const response = await axiosInstance().get(`${routes.deals.path}/asset/${dealId}`);
    const data = response?.data?.data;
    const count = response?.data?.data?.count;
    let rows = response?.data?.data?.map((u, i) => {
      let finalObject: any = prepareDataForGrid(u, user);
      return finalObject;
    });
    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  return (
    <Fragment>
      {columns ? (
        <Box zIndex={5}>
          <CustomReactTable
            height={'calc(100vh - 393px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            refreshGrid={fetchData}
            hideSelection={true}
            hideAction={true}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
          />
        </Box>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Fragment>
  );
};

export default Assets;
