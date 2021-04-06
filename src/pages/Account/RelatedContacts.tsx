import React from 'react'
import { Link } from 'react-router-dom'
import { Box } from '@material-ui/core'
import { makeStyles } from "@material-ui/core/styles";
import routes from './../../components/Helpers/Routes'
import accountClass from "./account.module.scss"

const useStyles = makeStyles((theme) => ({
    root: {
        width: "100%",
        flexGrow: 1,
    },
    box: {
        border: "2px solid lightGray",
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
function RelatedContacts({ contacts, accountName }) {
    const classes = useStyles();

    return <>
        {
            contacts && contacts.length ?
                contacts.map((obj, index) => {
                    return <Box key={index}
                        className={classes.box}
                        borderRadius={16}
                        boxShadow={0.5}
                    >
                        <Link className={`${accountClass.account_name_link} f_size`}
                            to={`${routes.contactDetail.path}/${obj._id}`}>
                            {`${obj.firstName || ''}  ${obj.lastName || ''}`}
                        </Link>

                        <div className={classes.div1}>
                            <span className={classes.span}>Account Name:</span>
                            <span>
                                {accountName}
                                {/* <Link
                                    className={`${accountClass.account_name_link}`}
                                    to={`${routes.accountDetails.path}/${obj?.accountName?.optionValue}`}>
                                    {accountName}
                                </Link> */}
                            </span>
                        </div>
                        <div className={classes.div1}>
                            <span className={classes.span}> Title:</span>
                            <span>{obj.title || ''}</span>
                        </div>
                    </Box>
                })
                : null
        }
    </>
}
export default RelatedContacts