import { leadDetailPage } from "../routes/Lead"
import routes from "../components/Helpers/Routes"
import camelCase from "lodash/camelCase"
import {
    CommonRenderer,
    CreatedByRenderer,
    UpdatedByRenderer,
    CommonRendererWithCopy,
    DateRenderer,
    LinkRenderer,
    ImageRenderer,
    NameRenderer,
    CheckboxRenderer
} from '../components/AgGridComponents/CustomAgGridCellRenderers';

import { sidebarResourceObjectFromValues } from './helpers';

const permissions: any = {}

const permissionForLinks = sidebarResourceObjectFromValues();

export const staticFrameworkRender = {
    "createdByRenderer": CreatedByRenderer,
    "updatedByRenderer": UpdatedByRenderer
}

export const headerName = {
    firstName: "Name"
}
export const isRenderWithCopy = (name) => {
    return ["mobileNumber", "phone", "email"].indexOf(name) >= 0
}
const hideColumns = ["salutation", "middleName", "lastName", "suffix"]
export const detailPagePath = {
    leads: leadDetailPage.path,
    owner: routes?.userDetail?.path,
    user: routes?.userDetail?.path,
    collaborator: routes?.userDetail?.path,
    rental: routes.rentalManagementDetail.path,
    deliveryPerson: routes?.userDetail?.path,
    pDFTemplate: routes?.quotePdfTemplateDetail?.path,
    subMarketSegment: routes?.marketSegment?.path,
}
export const hasDetailPageAsPopup = {
    subMarketSegment: routes?.marketSegment?.path,
    marketSegment: routes?.marketSegment?.path,
    productCategory: routes?.productCategory?.path
}
export const popupResources = ["Product Category", "Market Segment", "Warehouse"]

export const disabledColumns = {
    [routes.rentalManagementDetail.title]: [],
    [routes.deliveryTicketDetail.title]: [],
    [routes.lead.title]: ["firstName"]
}
export const getFrameworkComponents = (rendererNameList, showStaticRenderers = false) => {
    let result = {}
    rendererNameList.forEach(o => {
        if (o === "commonRenderer") {
            result = {
                ...result,
                "commonRenderer": CommonRenderer
            }
        }
        else if (o === "linkRenderer") {
            result = {
                ...result,
                "linkRenderer": LinkRenderer
            }
        }
        else if (o === "commonRendererWithCopy") {
            result = {
                ...result,
                "commonRendererWithCopy": CommonRendererWithCopy
            }
        }
        else if (o === "dateRenderer") {
            result = {
                ...result,
                "dateRenderer": DateRenderer
            }
        }
        else if (o === "checkboxRenderer") {
            result = {
                ...result,
                "checkboxRenderer": CheckboxRenderer
            }
        }
        else if (o === "imageRenderer") {
            result = {
                ...result,
                "imageRenderer": ImageRenderer
            }
        }
        else if (o === "nameRenderer") {
            result = {
                ...result,
                "nameRenderer": NameRenderer
            }
        }

    })
    if (showStaticRenderers) {
        result = {
            ...result,
            ...staticFrameworkRender
        }
    }
    return result
}
export const getStaticFields = () => {
    return [
        { field: 'createdBy', headerName: 'Created By', show: true, cellRenderer: 'createdByRenderer' },
        { field: 'updatedBy', headerName: 'Updated By', show: true, cellRenderer: 'updatedByRenderer' }]
}

export const getColumnHiddenStatus = (renderedFrom, fieldName) => {
    let data = localStorage.getItem("gridMetaData")
    let gridMetaData = (data == 'undefined') ? {} : JSON.parse(data)
    if (gridMetaData[renderedFrom]?.hide && gridMetaData[renderedFrom].hide.length) {
        return gridMetaData[renderedFrom].hide.indexOf(fieldName) >= 0 ? false : true
    }
    return true
}

export const checkStaticField = (renderedFrom, fieldData) => {
    let data = localStorage.getItem("gridMetaData")
    let gridMetaData = (data == 'undefined') ? {} : JSON.parse(data)
    if (gridMetaData && gridMetaData[renderedFrom] && gridMetaData[renderedFrom]?.hide && gridMetaData[renderedFrom].hide.length) {
        return {
            ...fieldData,
            show: gridMetaData[renderedFrom].hide.indexOf(fieldData?.field) >= 0 ? false : true
        }
    }
    return fieldData
}

export const getSortedColumns = (columns = []) => {
    return columns.sort(function (a, b) {
        let columnNameA = a.headerName.toUpperCase(); // ignore upper and lowercase
        let columnNameB = b.headerName.toUpperCase(); // ignore upper and lowercase
        if (columnNameA < columnNameB) {
            return -1;
        }
        if (columnNameA > columnNameB) {
            return 1;
        }
        return 0;
    })
}
export const staticColumns = ["createdBy", "updatedBy"]

export const getColumnData = (title, field, detailScreenRoute = null, hasPopup = false) => {
    let data = localStorage.getItem("gridMetaData")

    let gridMetaData = (data == 'undefined') ? {} : JSON.parse(data)

    if (!gridMetaData) {
        gridMetaData = {}
    }

    let updatedTitle = camelCase(title)
    if (gridMetaData[title]?.hidden && gridMetaData[title]?.hidden.indexOf(field?.fieldName) >= 0) {
        return null
    }
    else if (hideColumns.indexOf(field?.fieldName) >= 0) {
        return null
    }
    else {
        let fieldHeaderName = headerName[field?.fieldName] ?? field?.fieldLabel
        let commonFieldData = {
            field: field?.fieldName,
            headerName: fieldHeaderName,
            show: gridMetaData[title]?.hide && gridMetaData[title]?.hide.indexOf(field?.fieldName) >= 0 ? false : true,
            disabled: gridMetaData[title]?.disabled && gridMetaData[title]?.disabled.indexOf(field?.fieldName) >= 0 ? true : false,
            primaryField: field?.primaryField ?? false
        }
        if (field?.fieldName === "firstName" && field?.primaryField === false) {
            let combinedTitle = camelCase(updatedTitle)
            let pathName = detailPagePath[combinedTitle] ? detailPagePath[combinedTitle] :
                routes.userDetail.path ? routes.userDetail.path : ""
            return {
                columnData: {
                    ...commonFieldData,
                    field: "concatedName",
                    cellRenderer: "nameRenderer",
                    cellRendererParams: { pathName: pathName }
                },
                rendererName: 'nameRenderer',
            }
        }
        else if (field?.primaryField === true && detailScreenRoute) {
            return {
                columnData: {
                    // pivotIndex: 0,
                    lockPosition: true,
                    ...commonFieldData,
                    disabled: true,
                    field: field?.fieldName === "firstName" ? "concatedName" : field.fieldName,
                    cellRenderer: permissions[permissionForLinks[field?.lookupResource]]?.isRead ? "linkRenderer" : "commonRenderer",
                    cellRendererParams: { "pathName": detailScreenRoute, "property": "_id", isForPopup: hasPopup }
                },
                rendererName: permissions[permissionForLinks[field?.lookupResource]]?.isRead ? "linkRenderer" : "commonRenderer",
            }
        }
        else if (field?.lookup) {

            let joinedFieldName = field?.fieldName.indexOf(" ") > 0 ? camelCase(field?.fieldName) : field?.fieldName
            let pathName = ""
            let isForPopup = false
            if (hasDetailPageAsPopup[joinedFieldName]) {
                isForPopup = true
                pathName = `${hasDetailPageAsPopup[joinedFieldName]}`
            }
            else if (field?.lookupResource && popupResources.indexOf(field?.lookupResource) >= 0) {
                pathName = routes[`${camelCase(field?.lookupResource)}`]?.path ?? ""
                isForPopup = true
            }
            else {
                pathName = detailPagePath[joinedFieldName] ? detailPagePath[joinedFieldName] :
                    field?.lookupResource && routes[`${camelCase(field?.lookupResource)}Detail`]?.path ?
                        routes[`${camelCase(field?.lookupResource)}Detail`]?.path :
                        routes[joinedFieldName]?.path ? routes[joinedFieldName]?.path :
                            routes[`${joinedFieldName}Detail`]?.path ? routes[`${joinedFieldName}Detail`]?.path : ""

            }
            return {
                columnData: {
                    ...commonFieldData,
                    cellRenderer: permissions[permissionForLinks[field?.lookupResource]]?.isRead ? "linkRenderer" : "commonRenderer",
                    cellRendererParams: {
                        "pathName": pathName, "property": joinedFieldName + 'Id',
                        isForPopup: isForPopup, "more": `rest${joinedFieldName}`
                    }
                },
                rendererName: permissions[permissionForLinks[field?.lookupResource]]?.isRead ? "linkRenderer" : "commonRenderer",
            }
        }
        else if (isRenderWithCopy(field?.type)) {
            return {
                columnData: {
                    ...commonFieldData,
                    cellRenderer: 'commonRendererWithCopy'
                },
                rendererName: 'commonRendererWithCopy'
            }
        }
        else if (field?.type === "imageUpload") {
            return {
                columnData: {
                    ...commonFieldData,
                    filter: false, sortable: false,
                    cellRenderer: 'imageRenderer',
                    width: 100
                },
                rendererName: 'imageRenderer'
            }
        }
        else if (field?.type === "date") {
            return {
                columnData: {
                    ...commonFieldData,
                    cellRenderer: "dateRenderer"
                },
                rendererName: 'dateRenderer'
            }
        }
        else if (field?.type === "checkBox") {
            return {
                columnData: {
                    ...commonFieldData,
                    // filter: false, sortable: false,
                    cellRenderer: "checkboxRenderer"
                },
                rendererName: 'checkboxRenderer'
            }
        }
        else {
            return {
                columnData: {
                    ...commonFieldData,
                    cellRenderer: 'commonRenderer'
                },
                rendererName: 'commonRenderer'
            }
        }
    }
}

export const genrateColoum = (fields, column, rendererNames, editable) => {
    let _fields = fields;
    _fields.forEach((ele) => {
        if (ele.type === "converter" || ele.type === "currencyAmount" || ele.isConverter === true) {
            if (ele.type !== "currencyAmount" && (ele.type === "converter" || ele.isConverter === true)) {
                ele.displayUnits.forEach((_unit) => {
                    let fieldName = ele.fieldName + "_" + _unit.toLowerCase()
                    let fieldLabel = ele.fieldLabel + " " + _unit
                    if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
                        let col: any = {}
                        col.field = fieldName
                        col.headerName = fieldLabel
                        col.width = 180
                        col.show = true
                        col.leval = ele.leval
                        if (!ele.isFormula && !ele.isUneditable && editable) {
                            col.cellRenderer = "commonRenderer";
                            col.cellEditor = "numericCellEditor";
                            col.editable = true;
                        } else {
                            col.cellRenderer = "commonRenderer";
                        }
                        column.push(col)
                    }
                })
            }
            else if (ele.type === "currencyAmount" && (ele.type === "converter" || ele.isConverter === true)) {
                ele.displayUnits.forEach((_unit) => {
                    ele.displayCurrency.forEach((_currency) => {
                        let fieldName = ele.fieldName + "_" + _currency.toLowerCase() + "_" + _unit.toLowerCase()
                        let fieldLabel = ele.fieldLabel + " " + _unit + "/" + _currency
                        if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
                            let col: any = {}
                            col.field = fieldName
                            col.headerName = fieldLabel
                            col.width = 180
                            col.show = true
                            col.leval = ele.leval
                            if (!ele.isFormula && !ele.isUneditable && editable) {
                                col.cellRenderer = "commonRenderer";
                                col.cellEditor = "numericCellEditor";
                                col.editable = true;
                            } else {
                                col.cellRenderer = "commonRenderer";
                            }
                            column.push(col)
                        }
                    })
                })
            }
            else if (ele.type === "currencyAmount") {
                ele.displayCurrency.forEach((_currency) => {
                    let fieldName = ele.fieldName + "_" + _currency.toLowerCase()
                    let fieldLabel = ele.fieldLabel + " " + _currency
                    if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
                        let col: any = {}
                        col.field = fieldName
                        col.headerName = fieldLabel
                        col.width = 180
                        col.show = true
                        col.leval = ele.leval
                        if (!ele.isFormula && !ele.isUneditable && editable) {
                            col.cellRenderer = "commonRenderer";
                            col.cellEditor = "numericCellEditor";
                            col.editable = true;
                        } else {
                            col.cellRenderer = "commonRenderer";
                        }
                        column.push(col)
                    }
                })
            }
        }
        else {
            if (column.filter((_c) => _c.field === ele.fieldName && _c.headerName === ele.fieldLabel).length === 0) {
                let currentColumn: any = getColumnData(routes.productBuilder.title, ele, routes.productBuilder.path, true)
                if (ele.type === "decimal" || ele.type === "percent" || ele.type === "singleLine" || ele.type === "multiLine") {
                    if (!ele.isFormula && !ele.isUneditable && editable) {
                        if (ele.type === "decimal" || ele.type === "percent") {
                            currentColumn.columnData.cellEditor = "numericCellEditor";
                        }
                        currentColumn.columnData.editable = true;
                    }
                }
                column.push({ ...currentColumn.columnData, leval: ele.leval });
                if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                    rendererNames.push(currentColumn?.rendererName)
                }
            }
        }
    })
}
