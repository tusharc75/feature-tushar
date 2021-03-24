import React from 'react'
import { Link } from 'react-router-dom'
import { Box } from '@material-ui/core'
import { contactDetailPage } from '../../routes/Contacts'
import { accountDetailPage } from '../../routes/Accounts'
import { makeStyles } from "@material-ui/core/styles";
import "./accounts.scss"

const useStyles = makeStyles((theme) => ({
    root: {
        width: "100%",
        flexGrow: 1,
    },
    box: {
        backgroundColor: 'white',
        padding: '15px',
        width: '95%',
        display: 'block',
        height: '120px',
        fontSize: '15px',
        margin: "0 auto",
        marginBottom: '10px',
    },
    div1: {
        display: 'flex',
        // justifyContent: 'space-between'
    },
    span: {
        width: '50%'
    }
}));
function RelatedContacts(props) {
    const classes = useStyles();
    const { contacts } = props
    return <>{
        contacts && contacts.length ?
            contacts.map((obj, index) => {
                return <Box key={index}
                    className={classes.box}
                    borderRadius={16}
                    boxShadow={0.5}
                >
                    <Link className="accountNameLink fSize"
                        to={`${contactDetailPage.path}/${obj._id}`}>
                        {`${obj.firstName || ''}  ${obj.lastName || ''}`}
                    </Link>

                    <div className={classes.div1}>
                        <span className={classes.span}>Account Name:</span>
                        <span><Link
                            className="accountNameLink"
                            to={`${accountDetailPage.path}/${obj?.accountName?.optionValue}`}>
                            {obj?.accountName?.optionLabel ? obj.accountName.optionLabel : ''}
                        </Link></span>
                    </div>
                    <div className={classes.div1}>
                        <span className={classes.span}> Title:</span>
                        <span>{obj.title || ''}</span>
                    </div>
                </Box>
            })
            : null
    }

    </ >
}
export default RelatedContacts