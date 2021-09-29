import { leadDetailPage } from "../routes/Lead"
import routes from "../components/Helpers/Routes"
import { Link } from 'react-router-dom';
export const headerName = {
    firstName: "Name",
    owner: "Owner Alies"

}
export const detailPagePath = {
    leads: leadDetailPage.path,
    owner: routes?.userDetail?.path,
    user: routes?.userDetail?.path,
    collaborator: routes?.userDetail?.path,
}
export const getColumnData = (title, field) => {
    let tempMetaData = {
        leads: {
            hide: ["middleName", "lastName", "suffix", "website", "industry", "noOfEmployees", "leadSource",
                "Market Segment", "Sub Market Segment", "rating", "process", "Address", "collaborator"],
            disabled: ["firstName"]
        },

    }
    if (field?.fieldName === "firstName") {
        return {
            field: "concatedName",
            headerName: headerName[field?.fieldName] ?? field?.fieldName,
            cellRenderer: (params) => (
                <Link className="link" to={`${detailPagePath[title]}/${params.data._id}`} title={params.value}>
                    {params.value}
                </Link>
            ),
            show: tempMetaData[title].hide.indexOf(field?.fieldName) >= 0 ? false : true,
            disabled: tempMetaData[title]?.disabled.indexOf(field?.fieldName) >= 0 ? false : true
        }
    }
    else if (field?.lookup) {
        let joinedFieldName = getFieldName(field?.fieldName)
        return {
            field: field?.fieldName,
            headerName: headerName[field?.fieldName] ?? field?.fieldName,
            cellRenderer: (params) => (
                <Link className="link" to={`${detailPagePath[field?.fieldName]}/${params.data[`${field?.fieldName}Id`]}`} title={params.value}>
                    {params.value}
                </Link>
            ),
            show: tempMetaData[title].hide.indexOf(field?.fieldName) >= 0 ? false : true,
            disabled: tempMetaData[title]?.disabled.indexOf(field?.fieldName) >= 0 ? false : true
        }
    }

}