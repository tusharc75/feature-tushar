import { leadDetailPage } from "../routes/Lead"
import routes from "../components/Helpers/Routes"
import camelCase from "lodash/camelCase"
import capitalize from "lodash/capitalize"
import {
    CommonRenderer,
    CreatedByRenderer,
    UpdatedByRenderer,
    CommonRendererWithCopy,
    DateRenderer,
    LinkRenderer,
    ImageRenderer
} from '../components/AgGridComponents/CustomAgGridCellRenderers';


export const staticFrameworkRender = {
    "createdByRenderer": CreatedByRenderer,
    "updatedByRenderer": UpdatedByRenderer
}

export const headerName = {
    firstName: "Name",
    owner: "Owner Alies"
}
export const isRenderWithCopy = (name) => {
    return ["mobile", "phone", "email"].indexOf(name) >= 0
}
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
    marketSegment: routes?.marketSegment?.path
}
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
        else if (o === "imageRenderer") {
            result = {
                ...result,
                "imageRenderer": ImageRenderer
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

export const checkStaticField = (renderedFrom, fieldData) => {
    let data = localStorage.getItem("gridMetaData")
    let gridMetaData = (data == 'undefined') ? {} : JSON.parse(data)
    if (gridMetaData[renderedFrom]?.hide && gridMetaData[renderedFrom].hide.length) {
        return {
            ...fieldData,
            show: gridMetaData[renderedFrom].hide.indexOf(fieldData?.field) >= 0 ? false : true
        }
    }
    return fieldData
}

export const staticColumns = ["createdBy", "updatedBy"]
export const getColumnData = (title, field, detailScreenRoute = null) => {
    let data = localStorage.getItem("gridMetaData")

    let gridMetaData = (data == 'undefined') ? {} : JSON.parse(data)
    if (!gridMetaData) {
        gridMetaData = {}
    }

    let updatedTitle = camelCase(title)
    if (gridMetaData[updatedTitle]?.hidden && gridMetaData[updatedTitle]?.hidden.indexOf(field?.fieldName) >= 0) {
        return null
    }
    else {
        let fieldHeaderName = headerName[field?.fieldName] ?? capitalize(field?.fieldLabel)
        let commonFieldData = {
            field: field?.fieldName,
            headerName: fieldHeaderName,
            show: gridMetaData[updatedTitle]?.hide && gridMetaData[updatedTitle]?.hide.indexOf(field?.fieldName) >= 0 ? false : true,
            disabled: gridMetaData[updatedTitle]?.disabled && gridMetaData[updatedTitle]?.disabled.indexOf(field?.fieldName) >= 0 ? true : false
        }
        if (field?.fieldName === "firstName" && field?.primaryField === false) {
            let combinedTitle = camelCase(updatedTitle)
            let pathName = detailPagePath[combinedTitle] ? detailPagePath[combinedTitle] :
                routes.userDetail.path ? routes.userDetail.path : ""
            return {
                columnData: {
                    ...commonFieldData,
                    field: "concatedName",
                    cellRenderer: (params) => `<a id="link-a" href='${pathName}/${params?.data?._id}' title='${params?.value}'>${params?.value}</a >`,
                }
            }
        }
        else if (field?.primaryField === true && detailScreenRoute) {
            return {
                columnData: {
                    pivotIndex: 0,
                    ...commonFieldData,
                    field: field?.fieldName === "firstName" ? "concatedName" : field.fieldName,
                    cellRenderer: "linkRenderer",
                    cellRendererParams: { "pathName": detailScreenRoute, "property": "_id" }
                },
                rendererName: 'linkRenderer',
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
                    cellRenderer: "linkRenderer",
                    cellRendererParams: { "pathName": pathName, "property": joinedFieldName + 'Id', isForPopup: isForPopup }
                },
                rendererName: 'linkRenderer',
            }
        }
        else if (isRenderWithCopy(field?.fieldName)) {
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
                    cellRenderer: 'imageRenderer'
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