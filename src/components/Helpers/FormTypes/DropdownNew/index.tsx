import { Box, Grid, IconButton, ListSubheader, TextField, useMediaQuery } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import Autocomplete from '@mui/material/Autocomplete';
import { camelCase, has, isArray, isEmpty } from 'lodash';
import React, { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { ListChildComponentProps, VariableSizeList } from 'react-window';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import ManageAddressDialog from 'src/components/Address/ManageAddressDialog';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import routes from 'src/components/Helpers/Routes';
import {
  customerAccount,
  customerContact,
  getNestedlookupDependentOn,
  sidebarResource,
  supplierAccount,
  supplierContact
} from 'src/constants/helpers';
import ManageAccount from 'src/pages/Account/ManageAccount';
import ManageCompetencies from 'src/pages/Competencies/ManageCompetencies';
import ManageCompetencyType from 'src/pages/CompetencyType/ManageCompetencyType';
import ManageContactDialog from 'src/pages/Contact/ManageContact';
import ManageDynamicForm from 'src/pages/DynamicForm/ManageDynamicForm';
import ManageMarketSegmentDialog from 'src/pages/MarketSegment/ManageMarketSegmentDialog';
import ManageStorageLocation from 'src/pages/StorageLocation/ManageStorageLocation';
import ManageWarehouse from 'src/pages/Warehouse/ManageWarehouse';
import ManagePadMaster from 'src/pages/PadMaster/ManagePadMaster';
import ManageWellMaster from 'src/pages/WellMaster/ManageWellMaster';
import ManageWellNumber from 'src/pages/WellNumber/ManageWellNumber';
import { NewAddressOptionList } from '../../../StateProvider/AddressProvider';
import AddMultiple from '../../../pages/DynamicForm/AddMultiple';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import { isFieldVisible } from 'src/components/Helpers/FormTypes';
import { ManagePackageCategory } from 'src/pages/PackageCategory/ManagePackageCategory';

const DropdownNew = () => {
  return <div>DropdownNew</div>;
};

export default DropdownNew;
