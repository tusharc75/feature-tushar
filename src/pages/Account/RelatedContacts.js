import React from 'react'
import { Link } from 'react-router-dom'
import { contactDetailPage } from '../../routes/Contacts'
import "./account.css"
function RelatedContacts(props) {
    const { contacts } = props
    console.log("🚀 ~ file: RelatedContacts.js ~ line 7 ~ RelatedContacts ~ contacts", contacts)
    return <>{
        contacts && contacts.length ?
            contacts.map(obj => {
                return <div>
                    <Link className="contactsNameLink"
                        to={`${contactDetailPage.path}/${obj._id}`}>
                        {`${obj.firstName || ''}  ${obj.lastName || ''}`}
                    </Link>
                    <div>Account Name:
                        {obj?.accountName?.optionLabel ? obj.accountName.optionLabel : ''}</div>
                    <div>Title: {obj.title || ''}</div>
                    <hr />
                </div>
            })
            : null
    }</>
}
export default RelatedContacts