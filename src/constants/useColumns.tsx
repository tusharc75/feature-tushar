import { leadDetailPage } from '../routes/Lead';
import routes from '../components/Helpers/Routes';
import camelCase from 'lodash/camelCase';
import {
  CommonRenderer,
  CreatedByRenderer,
  UpdatedByRenderer,
  CommonRendererWithCopy,
  DateRenderer,
  DateTimeRenderer,
  LinkRenderer,
  ImageRenderer,
  NameRenderer,
  CheckboxRenderer
} from '../components/AgGridComponents/CustomAgGridCellRenderers';

import { sidebarResourceObjectFromValues, supplierContact } from './helpers';
import { useData } from '../StateProvider/Provider';
import moment from 'moment';

const permissionForLinks = sidebarResourceObjectFromValues();

export const staticFrameworkRender = {
  createdByRenderer: CreatedByRenderer,
  updatedByRenderer: UpdatedByRenderer
};

export const headerName = {
  firstName: 'Name'
};
export const isRenderWithCopy = (name) => {
  return ['mobileNumber', 'phone', 'email'].indexOf(name) >= 0;
};
const hideColumns = ['salutation', 'middleName', 'lastName', 'suffix'];
export const detailPagePath = {
  leads: leadDetailPage.path,
  owner: routes?.userDetail?.path,
  user: routes?.userDetail?.path,
  collaborator: routes?.userDetail?.path,
  rental: routes.rentalManagementDetail.path,
  deliveryPerson: routes?.userDetail?.path,
  pDFTemplate: routes?.quotePdfTemplateDetail?.path,
  subMarketSegment: routes?.marketSegment?.path,
  customerContact: routes?.customerContactDetail?.path,
  supplierContact: routes?.supplierContactDetail?.path
};
export const hasDetailPageAsPopup = {
  subMarketSegment: routes?.marketSegment?.path,
  marketSegment: routes?.marketSegment?.path,
  productCategory: routes?.productCategory?.path,
  termsConditions: routes?.termsAndConditions?.path
};
export const popupResources = ['Product Category', 'Market Segment', 'Warehouse', 'Terms & Conditions'];

export const disabledColumns = {
  [routes.rentalManagementDetail.title]: [],
  [routes.deliveryTicketDetail.title]: [],
  [routes.lead.title]: ['firstName']
};
export const getFrameworkComponents = (rendererNameList, showStaticRenderers = false) => {
  let result = {};
  rendererNameList.forEach((o) => {
    if (o === 'commonRenderer') {
      result = {
        ...result,
        commonRenderer: CommonRenderer
      };
    } else if (o === 'linkRenderer') {
      result = {
        ...result,
        linkRenderer: LinkRenderer
      };
    } else if (o === 'commonRendererWithCopy') {
      result = {
        ...result,
        commonRendererWithCopy: CommonRendererWithCopy
      };
    } else if (o === 'dateRenderer') {
      result = {
        ...result,
        filter: 'agDateColumnFilter',
        filterParams: dateFilterParams,
        dateRenderer: DateRenderer
      };
    } else if (o === 'dateTimeRenderer') {
      result = {
        ...result,
        filter: 'agDateColumnFilter',
        filterParams: dateFilterParams,
        dateTimeRenderer: DateTimeRenderer
      };
    } else if (o === 'checkboxRenderer') {
      result = {
        ...result,
        checkboxRenderer: CheckboxRenderer
      };
    } else if (o === 'imageRenderer') {
      result = {
        ...result,
        imageRenderer: ImageRenderer
      };
    } else if (o === 'nameRenderer') {
      result = {
        ...result,
        nameRenderer: NameRenderer
      };
    }
  });
  if (showStaticRenderers) {
    result = {
      ...result,
      ...staticFrameworkRender
    };
  }
  return result;
};
export const getStaticFields = () => {
  return [
    { field: 'createdBy', headerName: 'Created By', show: true, filter: false, sortable: false, cellRenderer: 'createdByRenderer' },
    { field: 'updatedBy', headerName: 'Updated By', show: true, filter: false, sortable: false, cellRenderer: 'updatedByRenderer' }
  ];
};

export const getColumnHiddenStatus = (renderedFrom, fieldName) => {
  let data = localStorage.getItem('gridMetaData');
  let gridMetaData = data == 'undefined' ? {} : JSON.parse(data);
  if (gridMetaData[renderedFrom]?.hide && gridMetaData[renderedFrom].hide.length) {
    return gridMetaData[renderedFrom].hide.indexOf(fieldName) >= 0 ? false : true;
  }
  return true;
};

export const checkStaticField = (renderedFrom, fieldData) => {
  let data = localStorage.getItem('gridMetaData');
  let gridMetaData = data == 'undefined' ? {} : JSON.parse(data);
  if (gridMetaData[renderedFrom]?.hide && gridMetaData[renderedFrom].hide.length) {
    return {
      ...fieldData,
      show: gridMetaData[renderedFrom].hide.indexOf(fieldData?.field) >= 0 ? false : true
    };
  }
  return fieldData;
};
export const getSortedColumns = (columns = []) => {
  return columns.sort(function (a, b) {
    let columnNameA = a?.headerName?.toUpperCase(); // ignore upper and lowercase
    let columnNameB = b?.headerName?.toUpperCase(); // ignore upper and lowercase
    if (columnNameA < columnNameB) {
      return -1;
    }
    if (columnNameA > columnNameB) {
      return 1;
    }
    return 0;
  });
};
export const staticColumns = ['createdBy', 'updatedBy'];

export const dateFilterParams = {
  comparator: (filterLocalDateAtMidnight: Date, cellValue: string) => {
    var dateAsString = moment(cellValue).toISOString();
    if (dateAsString == null) return -1;
    var dateParts = dateAsString.split('/');
    var cellDate = new Date(Number(dateParts[2]), Number(dateParts[1]) - 1, Number(dateParts[0]));

    if (filterLocalDateAtMidnight.getTime() === cellDate.getTime()) {
      return 0;
    }

    if (cellDate < filterLocalDateAtMidnight) {
      return -1;
    }

    if (cellDate > filterLocalDateAtMidnight) {
      return 1;
    }
    return 0;
  }
};

export default function useColumns() {
  const {
    state: { permissions, user, selectedEntity }
  }: any = useData();

  const getColumnData = (title, field, detailScreenRoute = null, hasPopup = false) => {
    let data = localStorage.getItem('gridMetaData');

    if (field.type === 'date') {
      field = { ...field, filter: 'agDateColumnFilter', filterParams: dateFilterParams };
    }

    let gridMetaData = data == 'undefined' ? {} : JSON.parse(data);

    if (!gridMetaData) {
      gridMetaData = {};
    }

    let updatedTitle = camelCase(title);
    if (gridMetaData[title]?.hidden && gridMetaData[title]?.hidden.indexOf(field?.fieldName) >= 0) {
      return null;
    } else if (hideColumns.indexOf(field?.fieldName) >= 0) {
      return null;
    } else {
      let fieldHeaderName = headerName[field?.fieldName] ?? field?.fieldLabel;
      let commonFieldData = {
        field: field?.fieldName,
        headerName: fieldHeaderName,
        show: gridMetaData[title]?.hide && gridMetaData[title]?.hide.indexOf(field?.fieldName) >= 0 ? false : true,
        disabled: gridMetaData[title]?.disabled && gridMetaData[title]?.disabled.indexOf(field?.fieldName) >= 0 ? true : false,
        primaryField: field?.primaryField ?? false
      };
      if (field?.fieldName === 'firstName' && field?.primaryField === false) {
        let combinedTitle = camelCase(updatedTitle);
        let pathName = detailPagePath[combinedTitle] ? detailPagePath[combinedTitle] : routes.userDetail.path ? routes.userDetail.path : '';
        return {
          columnData: {
            ...commonFieldData,
            field: 'concatedName',
            cellRenderer: 'nameRenderer',
            cellRendererParams: { pathName: pathName }
          },
          rendererName: 'nameRenderer'
        };
      } else if (field?.primaryField === true && detailScreenRoute) {
        return {
          columnData: {
            // pivotIndex: 0,
            lockPosition: true,
            ...commonFieldData,
            disabled: true,
            field: field?.fieldName === 'firstName' ? 'concatedName' : field.fieldName,
            cellRenderer: permissions[permissionForLinks[field?.resource]]?.isRead ? 'linkRenderer' : 'commonRenderer',
            cellRendererParams: { pathName: detailScreenRoute, property: '_id', isForPopup: hasPopup }
          },
          rendererName: permissions[permissionForLinks[field?.resource]]?.isRead ? 'linkRenderer' : 'commonRenderer'
        };
      } else if (field?.lookup) {
        let joinedFieldName = field?.fieldName.indexOf(' ') > 0 ? camelCase(field?.fieldName) : field?.fieldName;
        let pathName = '';
        let isForPopup = false;
        if (hasDetailPageAsPopup[joinedFieldName]) {
          isForPopup = true;
          pathName = `${hasDetailPageAsPopup[joinedFieldName]}`;
        } else if (field?.lookupResource && popupResources.indexOf(field?.lookupResource) >= 0) {
          pathName = routes[`${camelCase(field?.lookupResource)}`]?.path ?? '';
          isForPopup = true;
        } else {
          pathName = detailPagePath[joinedFieldName]
            ? detailPagePath[joinedFieldName]
            : field?.lookupResource && routes[`${camelCase(field?.lookupResource)}Detail`]?.path
            ? routes[`${camelCase(field?.lookupResource)}Detail`]?.path
            : routes[joinedFieldName]?.path
            ? routes[joinedFieldName]?.path
            : routes[`${joinedFieldName}Detail`]?.path
            ? routes[`${joinedFieldName}Detail`]?.path
            : '';
        }
        return {
          columnData: {
            ...commonFieldData,
            cellRenderer: isForPopup
              ? permissions[permissionForLinks[field?.lookupResource]]?.isUpdate
                ? 'linkRenderer'
                : 'commonRenderer'
              : 'linkRenderer',
            cellRendererParams: {
              pathName: pathName,
              property: joinedFieldName + 'Id',
              isForPopup: isForPopup,
              more: `rest${joinedFieldName}`
            }
          },
          rendererName: isForPopup
            ? permissions[permissionForLinks[field?.lookupResource]]?.isUpdate
              ? 'linkRenderer'
              : 'commonRenderer'
            : 'linkRenderer'
        };
      } else if (isRenderWithCopy(field?.type)) {
        return {
          columnData: {
            ...commonFieldData,
            cellRenderer: 'commonRendererWithCopy'
          },
          rendererName: 'commonRendererWithCopy'
        };
      } else if (field?.type === 'imageUpload') {
        return {
          columnData: {
            ...commonFieldData,
            filter: false,
            sortable: false,
            cellRenderer: 'imageRenderer',
            width: 100
          },
          rendererName: 'imageRenderer'
        };
      } else if (field?.type === 'date') {
        return {
          columnData: {
            ...commonFieldData,
            cellRenderer: 'dateRenderer',
            filter: false,
            filterParams: dateFilterParams
          },
          filter: 'agDateColumnFilter',
          filterParams: dateFilterParams,
          rendererName: 'dateRenderer'
        };
      } else if (field?.type === 'dateTime') {
        return {
          columnData: {
            ...commonFieldData,
            cellRenderer: 'dateTimeRenderer',
            filter: true,
            filterParams: dateFilterParams
          },
          filter: 'agDateColumnFilter',
          filterParams: dateFilterParams,
          rendererName: 'dateTimeRenderer'
        };
      } else if (field?.type === 'checkBox') {
        return {
          columnData: {
            ...commonFieldData,
            // filter: false, sortable: false,
            cellRenderer: 'checkboxRenderer'
          },
          rendererName: 'checkboxRenderer'
        };
      } else if (field?.type === 'colorPicker') {
        return {
          columnData: {
            ...commonFieldData,
            cellRenderer: 'commonRenderer',
            filter: false
          },
          rendererName: 'commonRenderer'
        };
      } else {
        return {
          columnData: {
            ...commonFieldData,
            cellRenderer: 'commonRenderer'
          },
          rendererName: 'commonRenderer'
        };
      }
    }
  };
  return { getColumnData };
}
