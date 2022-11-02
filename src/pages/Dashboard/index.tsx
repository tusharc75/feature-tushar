import { useEffect, useState, Fragment } from 'react';
import { Box, Typography, Button, List, ListItem, ListItemText } from '@material-ui/core';
import { Link, useHistory } from 'react-router-dom';
import { useData } from '../../StateProvider/Provider';
import { camelCase, kebabCase, sortBy } from 'lodash';
import styles from './Dashboard.module.scss';

import { SVG, IMAGE_WIDTH, IMAGE_HEIGHT, IconConst } from '../../assets/dashboard_images';
import Icon from '@material-ui/core/Icon';
import { MdNavigateNext } from 'react-icons/md';
import { AiFillAccountBook } from 'react-icons/ai';
import { Search } from '@material-ui/icons';
import ClearIcon from '@material-ui/icons/Clear';
import SentimentVeryDissatisfiedIcon from '@material-ui/icons/SentimentVeryDissatisfied';
import routes from 'src/components/Helpers/Routes';
import { staticHiddenResource } from '../../constants/helpers';
import { CiFilter } from 'react-icons/ci';

function Dashboard() {
  const history = useHistory();
  const { dispatch }: any = useData();
  const {
    state: { user, selectedEntity }
  } = useData();
  const [showCloseButton, setShowCloseButton] = useState(false);
  const [sections, setSections] = useState([]);
  const [search, setSearch] = useState('');
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    let arr = [];
    let allData = [];
    // let allData = user && [...user?.role.sideBar];
    let entityData;
    if (user?.entity && user.entity.length) {
      entityData = user.entity.find((curEntity) => curEntity._id === selectedEntity);
    }
    if (entityData?.resource) {
      allData = entityData.resource;
    }

    allData?.forEach((u) => {
      u['resourceLabel'] = u.resourceLabel ?? u.name;
      u['sectionNameLowerCase'] = u.sectionName?.toLowerCase();
      u['resourceLabelLowerCase'] = u.resourceLabel?.toLowerCase() ?? u.name?.toLowerCase();
      !arr.includes(u.sectionName) && arr.push(u.sectionName);
    });

    var data = arr.map((sec) => {
      const list = allData?.filter((u) => {
        if (u?.name === 'Product Builder' && process.env.REACT_APP_ENV === 'staging') {
          return false;
        }
        if (u?.isHidden || staticHiddenResource?.includes(u?.name)) {
          return false;
        }
        return sec === u.sectionName && u.isRead;
      });

      let icon = <AiFillAccountBook size={32} />;
      let heading = '';
      let text = '';

      switch (sec) {
        case 'CRM +':
          icon = <img src={SVG(IconConst.CRM)} alt="Crm Logo" width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />;
          text = 'Convert leads and close sales deals faster.';
          break;
        case 'Accounts':
          icon = <img src={SVG(IconConst.ACCOUNTS)} alt="Accounts Logo" width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />;
          text = 'Customer and Supplier Account Management at your fingertips.';
          break;
        case 'Activities':
          icon = <img src={SVG(IconConst.ACTIVITIES)} alt="Activities Logo" width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />;
          text = 'Assign and Access Activities related to an Order.';
          break;
        case 'Product Setup':
          icon = <img src={SVG(IconConst.PRODUCT_SETUP)} alt="Product Setup Logo" width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />;
          text = 'Product and Category Setup.';
          break;
        case 'Admin Portal':
          icon = <img src={SVG(IconConst.ADMIN_PORTAL)} alt="Admin Portal Logo" width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />;
          text = 'Build your own Template, Manage Roles and Entities.';
          break;
        case 'ROM':
          icon = <img src={SVG(IconConst.ROM)} alt="ROM Logo" width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />;
          text = 'Fulfill Rental Orders Faster.';
          break;
        case 'Dynamic Forms':
          icon = <img src={SVG(IconConst.FORM_ICON)} alt="Form Logo" width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />;
          text = 'Setup Dynamic Forms & Templates';
          break;
        case 'Inventory Management':
          icon = <img src={SVG(IconConst.INV_ICON)} alt="Form Logo" width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />;
          text = 'Manage Inventory and Purchases Smartly.';
          break;
        default:
          icon = <img src={SVG(IconConst.GEN_ICON)} alt="Form Logo" width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />;
          text = '';
      }

      return {
        icon: icon,
        text: text,
        head: sec,
        items: list
      };
    });

    setSections(data);
    // (async () => {
    //   try {
    //     axiosInstance()
    //       .get(`user/meta-grid/${user?._id}`)
    //       .then(({ data: { data } }) => {
    //         let tempMetaData = JSON.stringify(data?.gridMetaData);
    //         localStorage.setItem('gridMetaData', tempMetaData);
    //         dispatch({ type: SET_GRID_METADATA, payload: data?.gridMetaData });
    //       });
    //   } catch (e) {
    //     console.log(e);
    //   }
    // })();
  }, [user, selectedEntity]);

  const handleRoutes = (item) => {
    switch (item.name) {
      case 'Pos':
        return routes.pos.path;
      default:
        return `/${kebabCase(item.name)}`;
    }
  };

  // SEARCH FUNCTION
  const handleSearch = (value: string) => {
    const searchedValueInLowerCase = value?.toLowerCase();
    const filteredItems = [];
    sections.forEach((section) => {
      const items = section.items.filter(
        (ff) => ff.sectionNameLowerCase.indexOf(searchedValueInLowerCase) > -1 || ff.resourceLabelLowerCase.indexOf(searchedValueInLowerCase) > -1
      );
      if (items.length > 0) {
        filteredItems.push({ ...section, items: items });
      }
    });
    setFilteredData(filteredItems);
  };
  const clearSearch = () => {
    setSearch('');
    setShowCloseButton(false);
  };

  return (
    <Fragment>
      <div className={`content-wrapper ${styles.main} ${styles.gridLayout}`}>
        {/* search section */}
        <div className={styles.searchContainer}>
          <div className={`${styles.search_section}`}>
            <div className={`${styles.search_input}`}>
              <input
                type="text"
                value={search}
                placeholder="Search"
                onChange={(e) => {
                  const searchedValue = e.target.value;
                  searchedValue.length > 0 ? setShowCloseButton(true) : setShowCloseButton(false);
                  setSearch(searchedValue);
                  handleSearch(e.target.value);
                }}
              />
              <div className={styles.searchIcon}>
                <Search color="disabled" />
              </div>
              {showCloseButton && (
                <div className={styles.clear_icon}>
                  <ClearIcon onClick={() => clearSearch()} />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className={styles.filterContainer}>
          <Button className={styles.filterContent} startIcon={<CiFilter className={styles.filterIcon} />}>
            Filter
          </Button>
        </div>

        {/* Hero section */}
        {search.trim() === '' && (
          <div className={styles.heroContainer}>
            <div className={`d-flex flex-wrap align-items-center justify-content-center ${styles.heroContent}`}>
              <div className={styles.iconContainer}>
                <img src={SVG(IconConst.HERO_TEXT_ICON)} alt="" aria-hidden />
              </div>
              <div className={styles.textContainer}>
                <Typography variant="h5">Raising resiliency in a rapidly transforming business environment</Typography>
                <Typography variant="body2">Simplify and accelerate your B2B transactions</Typography>
              </div>
            </div>
          </div>
        )}

        {/* card and results section */}
        <div className={`${styles.cardsSection} ${search.trim() === '' ? styles.heroContainer : ''}`}>
          {search.trim() === '' ? (
            <div className={`${styles.cardsContainer}`}>
              {sections?.map((section) => {
                return section.items.length > 0 ? (
                  <div className={styles.singleCard} key={section.head}>
                    <div className={styles.cardInner}>
                      <div className={styles.cardFront}>
                        <div className={styles.cardFrontContent}>
                          <Typography variant="h5" className={styles.card_head}>
                            {section.head}
                          </Typography>
                          <Typography variant={'body2'} className={styles.card_description}>
                            {section.text}
                          </Typography>
                          <div className={styles.cardBottom}>
                            <Button className={styles.viewAllButton} endIcon={<MdNavigateNext />}>
                              View all
                            </Button>
                            {section.icon}
                          </div>
                        </div>
                      </div>
                      <div className={styles.cardBack}>
                        <div className={styles.cardBackContent}>
                          {section.items
                            .filter((item) => !item?.isHidden)
                            .map((item) => (
                              <Link key={item.name} to={handleRoutes(item)}>
                                {item.resourceLabel || item.name}
                              </Link>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          ) : (
            <div className={`${styles.filtered_data}`}>
              {filteredData.length !== 0 ? (
                filteredData.map((section) => {
                  return (
                    <List key={section.head} subheader={<li className={`${styles.list_header} mb-2`}>{section.head}</li>}>
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
              ) : (
                <div className={styles.no_result_container}>
                  <SentimentVeryDissatisfiedIcon />
                  <p className={styles.no_result}>Sorry, we couldn't find any result</p>
                </div>
              )}
            </div>
          )}
        </div>
        {/* sidebar section */}
        <div className={styles.sidebarContent}>
          <div className={styles.iconContainer}>
            <img src={SVG(IconConst.SIDEBAR_COG_ICON)} alt="" aria-hidden />
          </div>
          <div className={styles.head}>
            <Typography variant="h5">Setups</Typography>
            <Typography variant="body2">List of all product and category setups</Typography>
          </div>
          <div className={styles.links}>
            <Link to={'#'}>Product Master</Link>
            <Link to={'#'}>Pricing Setup</Link>
            <Link to={'#'}>Lead Time Master</Link>
            <Link to={'#'}>Product Master</Link>
          </div>
        </div>
      </div>
    </Fragment>
  );
}

export default Dashboard;
