import React from 'react'
import { Link } from 'react-router-dom'
import { contactDetailPage } from '../../routes/Contacts'
import { accountDetailPage } from '../../routes/Accounts'
import "./account.css"

function RelatedContacts(props) {
    const { contacts } = props
    return <>{
        contacts && contacts.length ?
            contacts.map(obj => {
                return <div style={{ padding: '10px 8px' }}>
                    <Link className="contactsNameLink"
                        to={`${contactDetailPage.path}/${obj._id}`}>
                        {`${obj.firstName || ''}  ${obj.lastName || ''}`}
                    </Link>
                    <div>Account Name:
                    <Link
                            className="contactsNameLink"
                            to={`${accountDetailPage.path}/${obj?.accountName?.optionValue}`}>
                            {obj?.accountName?.optionLabel ? obj.accountName.optionLabel : ''}
                        </Link>
                    </div>
                    <div>Title: {obj.title || ''}</div>
                </div>
            })
            : null
    }</>
}
export default RelatedContacts