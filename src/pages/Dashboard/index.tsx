import { useEffect, useState } from "react";
import { Container, Grid, Paper, Box, Typography } from "@material-ui/core";
import { Link } from "react-router-dom";

import Layout from "../../components/Layout";
import { useData } from "../../StateProvider/Provider";
import { kebabCase } from "lodash";

function Dashboard() {
  const {
    state: { user },
  } = useData();
  const [sections, setSections] = useState([]);

  useEffect(() => {
    const arr = [];
    let allData = user && [...user?.role.sideBar];
    if (user?.role?.selectedEntity) {
      allData = [...allData, ...user?.role?.selectedEntity?.resource];
    }

    allData?.forEach((u) => {
      !arr.includes(u.sectionName) && arr.push(u.sectionName);
    });
    const data = arr.map((sec) => {
      const list = allData?.filter((u) => sec === u.sectionName && u.isRead);

      return {
        head: sec,
        items: list,
      };
    });
    setSections(data);
  }, [user]);

  return (
    <Layout>
      <Container>
        <Box marginY={2}>
          <Grid container spacing={2}>
            {sections.map((section) => {
              return section.items.length > 0 ? (
                <Grid key={section.head} item xs={12} sm={6} md={4}>
                  <Paper>
                    <Box padding={2}>
                      <Box textAlign="center" marginBottom={2}>
                        <Typography variant="h6">{section.head}</Typography>
                      </Box>
                      <Box height="150px" style={{ overflowY: "auto" }}>
                        {section.items.map((item) => (
                          <Box marginY={1} key={item.name} component="div">
                            <Typography paragraph>
                              <Link to={`/${kebabCase(item.name)}`}>
                                {item.name}
                              </Link>
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              ) : null;
            })}
          </Grid>
        </Box>
      </Container>
    </Layout>
  );
}

export default Dashboard;
