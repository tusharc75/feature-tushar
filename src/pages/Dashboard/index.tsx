import { useEffect, useState, Fragment } from 'react';
import { Container, Grid, Paper, Box, Typography, Button, List, ListItem, ListItemText, ListSubheader, ListItemIcon } from '@material-ui/core';
import { Link, useHistory } from 'react-router-dom';
import { useData } from '../../StateProvider/Provider';
import { kebabCase } from 'lodash';
import styles from './Dashboard.module.scss';
import crmImage from '../../assets/eQuip_t-homepage-design-trs-small-size.-in-png.png';
import { SiCivicrm } from 'react-icons/si';
import { MdNavigateNext, MdLocalActivity } from 'react-icons/md';
import { RiAccountPinCircleFill, RiFolderSettingsFill } from 'react-icons/ri';
import { BsCalendarFill } from 'react-icons/bs';
import { FaRegistered } from 'react-icons/fa';
import { AiFillAccountBook, AiFillSetting, AiOutlineTransaction } from 'react-icons/ai';
import { TextField, InputAdornment } from '@material-ui/core';
import { Search } from '@material-ui/icons';
import getAzureAcessToken from '../../components/Azure/getAzureAccessToken';
import axiosInstance from '../../axios/axiosInstance';
import { SET_GRID_METADATA, SET_SELECTED_ENTITY, SET_USER } from '../../StateProvider/actionTypes';

function Dashboard() {
  const history = useHistory();
  const { dispatch }: any = useData();
  const {
    state: { user }
  } = useData();
  const [sections, setSections] = useState([]);
  const [search, setSearch] = useState('');
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    const arr = [];
    let allData = user && [...user?.role.sideBar];
    if (user?.role?.selectedEntity) {
      allData = [...allData, ...user?.role?.selectedEntity?.resource];
    }
    // if (['local', 'development'].includes(process.env.REACT_APP_ENV) && allData) {
    //   const indexOfProduct = allData.findIndex((d) => d.name === 'Product');
    //   const product = allData[indexOfProduct];
    //
    //   allData = [
    //     ...allData.splice(0, indexOfProduct + 1),
    //     {
    //       isCreate: true,
    //       isDelete: true,
    //       isRead: true,
    //       isUpdate: true,
    //       name: 'Product List',
    //       resourceId: '',
    //       resourceLabel: 'Product List',
    //       roleType: 1,
    //       sectionName: product.sectionName
    //     },
    //     ...allData
    //   ];
    // }

    allData?.forEach((u) => {
      u['resourceLabel'] = u.resourceLabel ?? u.name;
      u['sectionNameLowerCase'] = u.sectionName?.toLowerCase();
      u['resourceLabelLowerCase'] = u.resourceLabel?.toLowerCase() ?? u.name?.toLowerCase();

      !arr.includes(u.sectionName) && arr.push(u.sectionName);
    });

    const data = arr.map((sec) => {
      // const list = allData?.filter((u) => sec === u.sectionName && u.isRead);
      const list = allData?.filter((u) => {
        if (u?.name === 'Product Builder' && process.env.REACT_APP_ENV === 'staging') {
          return false;
        }

        return sec === u.sectionName && u.isRead;
      });

      let icon = <AiFillAccountBook size={32} />;
      let heading = '';
      let text = '';

      switch (sec) {
        case 'CRM +':
          icon = <SiCivicrm size={32} />;
          text = 'Convert leads and close sales deals faster.';

          break;

        case 'Accounts':
          icon = <RiAccountPinCircleFill size={32} />;
          text = 'Powerful financial platform to grow more your business.';
          break;

        case 'Activities':
          icon = <MdLocalActivity size={32} />;
          text = 'We Need to Talk About Budgeting. It’s a Necessary Evil.';
          break;

        case 'Product Setup':
          icon = <RiFolderSettingsFill size={32} />;
          text = 'You’ll Kick Yourself if You Miss This Chance to Try Our New Activities.';
          break;

        case 'Admin Portal':
          icon = <BsCalendarFill size={32} style={{ padding: '4px' }} />;

          text = 'Try to Change Your Work Patterns and Get More Done with us.';
          break;

        case 'ROM':
          icon = <FaRegistered size={32} />;
          text = 'The Guaranteed Method For Avoiding Client Lag with Rentals.';
          break;
      }

      return {
        icon: icon,
        text: text,
        head: sec,
        items: list
      };
    });
    setSections(data);
  }, [user]);

  const handleRoutes = (item) => {
    if (item.name === 'Product List') {
      return '/product-list';
    }

    return `/${kebabCase(item.name)}`;

    //  Use below code to handle special route cases
    // switch (item.name) {

    //   case "T&Cs":
    //     return "/terms-conditions";

    //   default:
    //     return `/${kebabCase(item.name)}`;
    // }
  };

  return (
    <Fragment>
      <Container>
        <Grid className={styles.dashboard_layout}>
          <div className={styles.all_content_box}>
            <h1 className="mb-2">Raising resiliency in a rapidly transforming business environment</h1>
            <p>Managing your customer leads, opportunities, complex projects, and quotes just got easier</p>
            <img src={crmImage} alt="Logo" className={styles.set_crm_image} />
          </div>
          <div>
            <Box marginY={2} id="resourcesHomeGrid">
              <TextField
                placeholder="Search"
                type="search"
                value={search}
                fullWidth
                className="mb-3"
                onChange={(e) => {
                  const searchedValue = e.target.value;
                  const searchedValueInLowerCase = searchedValue?.toLowerCase();
                  setSearch(searchedValue);

                  const filteredItems = [];

                  sections.forEach((section) => {
                    const items = section.items.filter(
                      (ff) =>
                        ff.sectionNameLowerCase.indexOf(searchedValueInLowerCase) > -1 ||
                        ff.resourceLabelLowerCase.indexOf(searchedValueInLowerCase) > -1
                    );
                    if (items.length > 0) {
                      filteredItems.push({ ...section, items: items });
                    }
                  });

                  setFilteredData(filteredItems);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="disabled" />
                    </InputAdornment>
                  )
                }}
              />

              {search.trim() === '' ? (
                <Grid container spacing={1} className={styles.full_layout}>
                  {sections.map((section) => {
                    return section.items.length > 0 ? (
                      <Grid key={section.head} item xs={12} sm={4} md={4} className={styles.all_box_layout}>
                        <Grid className={styles.inner_box}>
                          <Paper className={styles.front_box}>
                            <Box padding={2}>
                              <Grid className={styles.box_layout_content}>
                                {
                                  <Box textAlign="center">
                                    <p className={styles.set_icon}>{section.icon}</p>
                                    <h2 className={styles.headline}>{section.head}</h2>
                                    <p className={styles.desc}>{section.text}</p>
                                    {/*<div className={styles.dropdown}>*/}
                                    <Button className={styles.view_button}>
                                      View all
                                      <MdNavigateNext />
                                      {/*<div className={styles.dropdown_content}>*/}
                                      {/*  {*/}
                                      {/*    section.items.map((item) => (*/}
                                      {/*      <Typography>*/}
                                      {/*        <Link to={handleRoutes(item)}>{item.resourceLabel || item.name}</Link>*/}
                                      {/*      </Typography>*/}
                                      {/*    ))*/}
                                      {/*  }*/}
                                      {/*</div>*/}
                                    </Button>
                                    {/*</div>*/}
                                  </Box>
                                }
                              </Grid>
                            </Box>
                          </Paper>
                          <Paper className={styles.back_box}>
                            <Box padding={2}>
                              <Grid>
                                {
                                  <Box height="215px" style={{ overflowY: 'auto' }} className={styles.back_box_content}>
                                    {section.items.map((item) => (
                                      <div key={item.name}>
                                        <Box marginY={1} component="div" className={styles.list_component}>
                                          <Typography paragraph className={styles.hover_list_box}>
                                            <Link to={handleRoutes(item)}>{item.resourceLabel || item.name}</Link>
                                          </Typography>
                                        </Box>
                                      </div>
                                    ))}
                                  </Box>
                                }
                              </Grid>
                            </Box>
                          </Paper>
                        </Grid>
                      </Grid>
                    ) : null;
                  })}
                </Grid>
              ) : (
                filteredData.map((section) => {
                  return (
                    <List key={section.head} subheader={<ListSubheader className={`${styles.list_header} mb-2`}>{section.head}</ListSubheader>}>
                      {section.items.map((item) => {
                        return (
                          <>
                            <ListItem
                              key={item.name}
                              button
                              onClick={() => {
                                history.push(handleRoutes(item));
                              }}
                            >
                              <ListItemText primary={item.resourceLabel} />
                            </ListItem>
                          </>
                        );
                      })}
                    </List>
                  );
                })
              )}
            </Box>
          </div>
        </Grid>
      </Container>
    </Fragment>
  );
}

export default Dashboard;
