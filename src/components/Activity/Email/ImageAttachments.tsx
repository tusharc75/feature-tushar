import emailStyles from "../../../pages/Activity/Email/email.module.scss"
import Grid from '@material-ui/core/Grid';
import { Paper } from '@material-ui/core'
import { IconButton } from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import { GoArrowDown } from "react-icons/go"
import GetAppIcon from '@material-ui/icons/GetApp';


export default function ImageAttachments(props) {
    const { imageAttachments, onImageClick, onDelete, emailId, isRenderedFrom = false } = props
    return (
        <Grid container spacing={1} className={emailStyles.createEmailContainer}>
            {
                imageAttachments.length ?
                    <>
                        {imageAttachments.map((attachment, i) => {
                            return <>
                                <Grid item key={`attachment${i}`} sm={8} xs={12} md={6} xl={6}>
                                    <Paper className={emailStyles.fileContainer}>
                                        <img src={attachment} alt={attachment}
                                            onClick={() => onImageClick(attachment)}
                                            className={emailStyles.image} />
                                        {isRenderedFrom === false ? 
                                        (<div className={emailStyles.overlay}>
                                            <IconButton>
                                                {
                                                    emailId ? <a href={`${attachment}`} download={true} >
                                                        <GoArrowDown color="white" size={25} />
                                                    </a> : <DeleteIcon className={emailStyles.deleteIcon}
                                                        onClick={() => onDelete(attachment)}
                                                    />
                                                }
                                            </IconButton>
                                        </div>)
                                        : 
                                        
                                            emailId ? <div style={{ display: 'flex', justifyContent: 'space-between', width: '30%', float: 'right',marginTop:'5px', bottom: '0' }}>
                                            <>
                                                <IconButton style={{ paddingBottom: '1px' }}>
                                                    {
                                                        <a href={`${attachment}`}
                                                            download={true}>
                                                            <GetAppIcon />
                                                        </a>
                                                    }
                                                </IconButton>
                                                <IconButton >
                                                    {
                                                        <DeleteIcon color='error'
                                                            onClick={() => onDelete(attachment)}
                                                        />
                                                    }
                                                </IconButton>
                                            </></div> :
                                                <IconButton >
                                                    {
                                                        <DeleteIcon color='error'
                                                            onClick={() => onDelete(attachment)}
                                                        />
                                                    }
                                                </IconButton>

                                                }
                                    </Paper>
                                </Grid>
                            </>
                        })
                        }
                    </>
                    : null
            }
        </Grid >
    )
}
