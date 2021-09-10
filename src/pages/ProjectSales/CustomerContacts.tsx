import {
  Box,
  Card,
  CardContent,
  Grid,
  List,
  ListItemText,
  ListItem,
  ListItemAvatar,
  IconButton,
} from "@material-ui/core";

import { Link, useHistory } from "react-router-dom";
import { FaEye } from "react-icons/fa";
import { BsPerson } from "react-icons/bs";
import { BiFace } from "react-icons/bi";
import { Delete } from "@material-ui/icons";
import styles from "./ProjectSales.module.scss";

function DisplayData({ key, label, value, icon }) {
  return (
    <div style={{ flexGrow: 1 }}>
      <List>
        <ListItem key={key}>
          <ListItemAvatar>{icon}</ListItemAvatar>
          <ListItemText  primary={<>
                    <Grid container>
                        <Grid item xs={12} md={11} sm={11} className="text-truncate">{value ? value : '-'} </Grid>
                    </Grid> </>
                } secondary={label} />
        </ListItem>
      </List>
    </div>
  );
}

function RelatedContacts({
  contacts,
  accountId,
  accountName,
  contactRoute,
  handleRemoveContact,
}) {
  const history = useHistory();

  return (
    <div>
        <div className={styles.detail_main}>
      {contacts && contacts.length ? (
        <>
          {contacts.map((obj, index) => {
            return (
              <>

                <div className={styles.detailFromCard}>
                  <Card
                    key={obj?._id ?? `contact${index}`}
                    className="detailCard"
                   >
                    <CardContent className={styles.detail_view} >
                      <Grid container className={styles.detail_header}>
                        <Grid
                        >
                          <Link
                            className="account_name_link f_size"
                            to={`/${contactRoute}/detail/${obj._id}`}
                          >
                            {`${obj.firstName || ""}  ${obj.lastName || ""}`}
                          </Link>
                        </Grid>

                        <Grid item xs={1}  className={styles.delete_contact}>
                          <IconButton
                              className={"delete_contact_icon"}
                            title={`Remove contact: ${obj?.firstName} ${obj?.lastName}`}
                            aria-haspopup="true"
                            color="primary"
                            size="small"
                            onClick={() => {
                              handleRemoveContact(obj);
                            }}
                          >
                            <Delete color="error" />
                          </IconButton>
                        </Grid>
                      </Grid>
                      <Grid container>
                        <Grid item xs={6} sm={6} md={6} className={styles.detail_account}>
                          {
                            <DisplayData
                              key={index}
                              label="Account"
                              value={accountName || "-"}
                              icon={<BsPerson size={15} />}

                            />
                          }
                        </Grid>
                        <Grid item xs={12} sm={6} md={6} className={styles.detail_account}>
                          {
                            <DisplayData
                              key={index}
                              label="Title"
                              value={obj.title || "-"}
                              icon={<BiFace size={15} />}
                            />
                          }
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                  </div>


              </>

            );
          })}

        </>
      ) : null}
        </div>
        <div >
            <Box margin={1} />
            <Box
                className="btn-view gap-1"
                p={1}
                display="flex"
                justifyContent="center"
                alignItems="center"
                onClick={() =>
                    history.push(`/${contactRoute}`, {
                        accountId: accountId,
                        accountName: accountName,
                    })
                }
            >
                <FaEye /> View All &#8599;
            </Box>
        </div>
    </div>


  );
}
export default RelatedContacts;
