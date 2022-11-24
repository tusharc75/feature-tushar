import { useEffect, useState, useContext, Fragment } from 'react';
import { Container, Grid, Paper, Box, Typography, Button, List, ListItem, ListItemText, ListSubheader } from '@material-ui/core';
import { Link, useHistory } from 'react-router-dom';
import { useData } from '../../StateProvider/Provider';
import { camelCase, kebabCase, sortBy } from 'lodash';
import styles from './Dashboard.module.scss';

import './style.scss';
import { SVG, IMAGE_WIDTH, IMAGE_HEIGHT, IconConst } from '../../assets/dashboard_images';

import Icon from '@material-ui/core/Icon';
import { SiCivicrm } from 'react-icons/si';
import { MdNavigateNext, MdLocalActivity } from 'react-icons/md';
import { RiAccountPinCircleFill, RiFolderSettingsFill } from 'react-icons/ri';
import { BsCalendarFill } from 'react-icons/bs';
import { FaRegistered } from 'react-icons/fa';
import { AiFillAccountBook } from 'react-icons/ai';
import { TextField, InputAdornment } from '@material-ui/core';
import { Search } from '@material-ui/icons';
import ClearIcon from '@material-ui/icons/Clear';
import SentimentVeryDissatisfiedIcon from '@material-ui/icons/SentimentVeryDissatisfied';
import routes from 'src/components/Helpers/Routes';
import { staticHiddenResource } from '../../constants/helpers';

import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import { HiArrowRight } from 'react-icons/hi';

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
      let color = '#FFEFEE';

      switch (sec) {
        case 'Product Setup':
          icon = <img src={SVG(IconConst.PRODUCT_SETUP)} alt="Product Setup Logo" width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />;
          text = 'Product and Category Setup.';
          color = '#FFEFEE';
          break;
        case 'Admin Portal':
          icon = <img src={SVG(IconConst.ADMIN_PORTAL)} alt="Admin Portal Logo" width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />;
          text = 'Build your own Template, Manage Roles and Entities.';
          color = '#F3F8FF';
          break;
        case 'CRM +':
          icon = <img src={SVG(IconConst.CRM)} alt="Crm Logo" width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />;
          text = 'Convert leads and close sales deals faster.';
          color = '#FFF7F2';
          break;
        case 'ROM':
          icon = <img src={SVG(IconConst.ROM)} alt="ROM Logo" width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />;
          text = 'Fulfill Rental Orders Faster.';
          color = '#F9FDEC';
          break;
        case 'Accounts':
          icon = <img src={SVG(IconConst.ACCOUNTS)} alt="Accounts Logo" width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />;
          text = 'Customer and Supplier Account Management at your fingertips.';
          color = '#FFFAEC';
          break;
        case 'Activities':
          icon = <img src={SVG(IconConst.ACTIVITIES)} alt="Activities Logo" width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />;
          text = 'Assign and Access Activities related to an Order.';
          color = '#F6F1FF';
          break;

        case 'Dynamic Forms':
          icon = <img src={SVG(IconConst.FORM_ICON)} alt="Form Logo" width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />;
          text = 'Setup Dynamic Forms & Templates';
          color = '#FFEFEE';
          break;
        case 'Inventory Management':
          icon = <img src={SVG(IconConst.INV_ICON)} alt="Form Logo" width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />;
          text = 'Manage Inventory and Purchases Smartly.';
          color = '#F3F8FF';
          break;
        default:
          icon = <img src={SVG(IconConst.GEN_ICON)} alt="Form Logo" width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />;
          text = '';
          color = '#FFF7F2';
      }

      return {
        icon: icon,
        text: text,
        head: sec,
        items: list,
        color: color
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
  const handleSearch = (value) => {
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
      <div className={`content-wrapper ${styles.contentWrapper}`}>
        <div className={styles.main}>
          <div className={styles.leftContainer}>
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
                    handleSearch(searchedValue);
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
            {search.trim() !== '' ? (
              <SearchResult filteredData={filteredData} history={history} handleRoutes={handleRoutes} />
            ) : (
              <DisplayCardGrid sections={sections} handleRoutes={handleRoutes} />
            )}
          </div>
          <div className={styles.rightContainer}>
            <DisplayColabTool sections={sections} handleRoutes={handleRoutes} />
          </div>
          {/* <div className={styles.hero_container}>
            <h1 className={styles.hero_heading}>Raising resiliency in a rapidly transforming business environment</h1>
            <p className={styles.hero_paragraph}>Simplify and accelerate your B2B transactions.</p>
            <img src={SVG(IconConst.HERO)} alt="Dashboard Hero Image" className={styles.crm_hero_image} />
          </div>
          <div className="card_container">
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
                    handleSearch();
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
            {search.trim() === '' ? (
              <div className="card_grid dashboard_homepage">
                {sections.map((section) => {
                  return section.items.length > 0 ? (
                    <div key={section.head} className="single_card">
                      <div className="card_content">
                        <div className="card_front">
                          <div className="card_front_content">
                            <p className="card_logo">{section.icon}</p>
                            <h2 className="card_head">{section.head}</h2>
                            <p className="card_description">{section.text}</p>
                            <Button className="view_all_button">
                              View all
                              <MdNavigateNext />
                            </Button>
                          </div>
                        </div>
                        <div className="card_back">
                          <div className="card_back_content">
                            {section.items
                              .filter((item) => !item?.isHidden)
                              .map((item) => (
                                <div key={item.name}>
                                  <Box marginY={1} component="div" className={`list_component`}>
                                    <Typography variant="subtitle2" className={styles.hover_list_box}>
                                      <Link to={handleRoutes(item)}>{item.resourceLabel || item.name}</Link>
                                    </Typography>
                                  </Box>
                                </div>
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
          </div> */}
        </div>
      </div>
    </Fragment>
  );
}

export default Dashboard;

const SearchResult = ({ filteredData, history, handleRoutes }) => {
  return (
    <div className={styles.searchResult}>
      <div className={`${styles.filtered_data} `} style={{ overflowY: filteredData.length === 0 ? 'auto' : 'scroll' }}>
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
    </div>
  );
};

const DisplayCardGrid = ({ sections, handleRoutes }) => {
  const [modalContent, setModalContent] = useState(null);

  const handleClose = () => {
    setModalContent(null);
  };

  return (
    <div className={styles.cardSection}>
      <div className={styles.cardContainer}>
        {sections.map((section) => {
          const style = { '--bg_color': section.color } as React.CSSProperties;
          return section.items.length > 0 && section?.head !== 'Activities' ? (
            <div
              key={section.head}
              className={styles.singlecard}
              style={style}
              onClick={() => setModalContent({ items: section.items, title: section.head })}
            >
              <Typography component="h2" className={styles.cardHeading}>
                {section.head}
              </Typography>
              <Typography component="p" className={styles.cardDesc}>
                {section.text}
              </Typography>
              <div className={styles.cardBottomSection}>
                <button className={styles.viewAll} onClick={() => setModalContent({ items: section.items, title: section.head })}>
                  <Typography component="span">View All</Typography>
                  <HiArrowRight />
                </button>
                <p className={styles.cardIcon}>{section.icon}</p>
              </div>
            </div>
          ) : null;
        })}
      </div>
      <RenderDialog modalContent={modalContent} handleClose={handleClose} handleRoutes={handleRoutes} />
    </div>
  );
};

const RenderDialog = ({ modalContent, handleClose, handleRoutes }) => {
  const DialogContent = withStyles((theme) => ({
    root: {
      padding: theme.spacing(2)
    }
  }))(MuiDialogContent);
  return (
    <Dialog onClose={handleClose} aria-labelledby="customized-dialog-title" open={Boolean(modalContent)} className={styles.dialogContainer}>
      <MuiDialogTitle disableTypography className={styles.modalHead}>
        <Typography variant="h6" className={styles.modalTitle}>
          {modalContent?.title}
        </Typography>
        <IconButton aria-label="close" onClick={() => handleClose()}>
          <CloseIcon />
        </IconButton>
      </MuiDialogTitle>
      <DialogContent className={styles.dialogContent}>
        <ul className={styles.linkList}>
          {modalContent?.items
            ?.filter((item) => !item?.isHidden)
            .map((item) => (
              <li key={item.name}>
                <Typography component="span">
                  <Link to={handleRoutes(item)} className={styles.dialogLinks}>
                    {item.resourceLabel || item.name}
                  </Link>
                </Typography>
              </li>
            ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
};

const DisplayColabTool = ({ sections, handleRoutes }) => {
  const [modalContent, setModalContent] = useState(null);
  const [colabData, setColabData] = useState(null);
  const sectionHead = 'Collaboration Tools';

  useEffect(() => {
    setColabData({ ...sections?.filter((section) => section?.head === 'Activities')[0] });
  }, [sections]);

  const handleClose = () => {
    setModalContent(null);
  };
  return (
    <>
      {colabData ? (
        <div className={styles.rightInner} onClick={() => setModalContent({ items: colabData?.items, title: sectionHead })}>
          <img src={SVG(IconConst.COLABORATION_TOOL)} alt="Colab Logo" className={styles.colabLogo} />
          <Typography component={'h2'}>{sectionHead}</Typography>
          <Typography component={'p'}>By using Collaboration tools, collaborate with or within team members easily</Typography>
          <button className={styles.colabButton} onClick={() => setModalContent({ items: colabData?.items, title: sectionHead })}>
            <Typography component="span">Start Collaborating</Typography>
          </button>
        </div>
      ) : null}
      <RenderDialog modalContent={modalContent} handleClose={handleClose} handleRoutes={handleRoutes} />
    </>
  );
};
