import {
  Box,
  Card,
  CardContent,
  Grid,
  List,
  ListItemText,
  ListItem,
  ListItemAvatar,
} from "@material-ui/core";

import { Link, useHistory } from "react-router-dom";
import { FaEye } from "react-icons/fa";
import { BsPerson } from "react-icons/bs";
import { BiFace } from "react-icons/bi";

function DisplayData({ key, label, value, icon }) {
  return (
    <div style={{ flexGrow: 1 }}>
      <List>
        <ListItem key={key}>
          <ListItemAvatar>{icon}</ListItemAvatar>
          <ListItemText primary={value ? value : "-"} secondary={label} />
        </ListItem>
      </List>
    </div>
  );
}

function RelatedContacts({ contacts, accountId, accountName, contactRoute }) {
  const history = useHistory();

  return (
    <div>
      {contacts && contacts.length ? (
        <>
          {contacts.map((obj, index) => {
            return (
              <>
                <div className="omsAccordian accordOpportunity">
                  <Card
                    key={obj?._id ?? `contact${index}`}
                    className="detailCard"
                  >
                    <CardContent className="detailListing">
                      <Grid container className="detailCardHeader">
                        <Grid item xs={12} sm={12}>
                          <Link
                            className="account_name_link f_size"
                            to={`/${contactRoute}/detail/${obj._id}`}
                          >
                            {`${obj.firstName || ""}  ${obj.lastName || ""}`}
                          </Link>
                        </Grid>
                      </Grid>
                      <Grid container>
                        <Grid item xs={12} sm={6} md={6}>
                          {
                            <DisplayData
                              key={index}
                              label="Account"
                              value={accountName || "-"}
                              icon={<BsPerson size={15} />}
                            />
                          }
                        </Grid>
                        <Grid item xs={12} sm={6} md={6}>
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
        </>
      ) : null}
    </div>
  );
}
export default RelatedContacts;
