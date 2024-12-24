import emailStyles from '../../../pages/Activity/Email/email.module.scss';
import Grid from '@mui/material/Grid';
import { Paper } from '@mui/material';
import { IconButton } from '@mui/material';
import DeleteIcon from '@material-ui/icons/Delete';
import { GoArrowDown } from 'react-icons/go';

export default function ImageAttachments(props) {
  const { imageAttachments, onImageClick, onDelete, emailId, isRenderedFrom = false, isCreateOnly = false } = props;

  return (
    <Grid container spacing={1} className={emailStyles.createEmailContainer}>
      {imageAttachments.length ? (
        <>
          {imageAttachments.map((attachment, i) => {
            return (
              <>
                <Grid item key={`attachment${i}`} sm={8} xs={12} md={6} xl={6}>
                  <Paper className={emailStyles.container}>
                    <img src={attachment} alt={attachment} onClick={() => onImageClick(attachment)} className={emailStyles.image} />

                    <>
                      {isCreateOnly && emailId ? (
                        <div className={emailStyles.overlay}>
                          <IconButton>
                            <a href={`${attachment}`} download={true}>
                              <GoArrowDown color="white" size={25} />
                            </a>
                          </IconButton>
                        </div>
                      ) : emailId ? (
                        <>
                          <div
                            className={emailStyles.overlay}
                            style={{ display: 'flex', justifyContent: 'space-between', marginRight: '3%', width: '100px' }}
                          >
                            <IconButton>
                              <a href={`${attachment}`} download={true}>
                                <GoArrowDown color="white" size={25} style={{ marginTop: '7px' }} />
                              </a>
                            </IconButton>
                            <IconButton>
                              <DeleteIcon className={emailStyles.deleteIcon} onClick={() => onDelete(attachment)} />
                            </IconButton>
                          </div>
                        </>
                      ) : (
                        <div className={emailStyles.overlay}>
                          <IconButton>
                            <DeleteIcon className={emailStyles.deleteIcon} onClick={() => onDelete(attachment)} />
                          </IconButton>
                        </div>
                      )}
                    </>
                  </Paper>
                </Grid>
              </>
            );
          })}
        </>
      ) : null}
    </Grid>
  );
}
