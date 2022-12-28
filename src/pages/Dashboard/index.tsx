import { useEffect, useState, useContext, Fragment } from 'react';
import { Typography, List, ListItem, ListItemText } from '@material-ui/core';
import { Link, useHistory } from 'react-router-dom';
import { useData } from '../../StateProvider/Provider';
import { kebabCase } from 'lodash';
import styles from './Dashboard.module.scss';
import './style.scss';
import { SVGImages, IconConst } from '../../assets/dashboard_images';
import SentimentVeryDissatisfiedIcon from '@material-ui/icons/SentimentVeryDissatisfied';
import routes from 'src/components/Helpers/Routes';
import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import { HiArrowRight } from 'react-icons/hi';
import { groupByKey, assignIconAndText } from './helpers';

function Dashboard() {
  const history = useHistory();
  const { dispatch }: any = useData();
  const {
    state: { user, selectedEntity }
  } = useData();
  const [sections, setSections] = useState([]);
  const [search, setSearch] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [objBySectionName, setObjBySectionName] = useState(null);

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

    const groupedData = groupByKey(allData, (section) => section.sectionName);
    setObjBySectionName(groupedData);
    const data = assignIconAndText(groupedData);
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

  return (
    <Fragment>
      <div className={`content-wrapper ${styles.contentWrapper}`}>
        <div className={styles.main}>
          <div className={styles.leftContainer}>
            {/* <div className={`${styles.search_section}`}>
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
            </div> */}
            {search.trim() !== '' ? (
              <SearchResult filteredData={filteredData} history={history} handleRoutes={handleRoutes} />
            ) : (
              <DisplayCardGrid sections={sections} handleRoutes={handleRoutes} />
            )}
          </div>
          <div className={styles.rightContainer}>
            <DisplaySideCard objBySectionName={objBySectionName} handleRoutes={handleRoutes} mode="Setups" />
            <DisplaySideCard objBySectionName={objBySectionName} handleRoutes={handleRoutes} mode="Collaboration Tools" />
          </div>
          {/* <div className={styles.hero_container}>
            <h1 className={styles.hero_heading}>Raising resiliency in a rapidly transforming business environment</h1>
            <p className={styles.hero_paragraph}>Simplify and accelerate your B2B transactions.</p>
            <img src={SVGImages(IconConst.HERO)} alt="Dashboard Hero Image" className={styles.crm_hero_image} />
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
          if (section.head === 'Collaboration Tools' || section.head === 'Setups' || section.head === 'Activities') return <></>;
          const style = { '--bg_color': section.color, textAlign: 'left' } as React.CSSProperties;
          return (
            <button
              key={section.head}
              className={styles.singlecard}
              style={style}
              onClick={() => section.items.length > 0 && setModalContent({ items: section.items, title: section.head })}
            >
              <Typography component="h2" className={styles.cardHeading}>
                {section.head}
              </Typography>
              <Typography component="p" className={styles.cardDesc}>
                {section.items.length > 0 ? section.text : 'Coming Soon.'}
              </Typography>
              <div className={styles.cardBottomSection}>
                {section.items.length > 0 && (
                  <div
                    className={styles.viewAll}
                    onClick={() => section.items.length > 0 && setModalContent({ items: section.items, title: section.head })}
                  >
                    <Typography component="span">View All</Typography>
                    <HiArrowRight />
                  </div>
                )}
                <p className={styles.cardIcon}>{section.icon}</p>
              </div>
            </button>
          );
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

interface sidecardInterface {
  objBySectionName: any;
  handleRoutes: any;
  mode: 'Collaboration Tools' | 'Setups';
}
const DisplaySideCard = ({ objBySectionName, handleRoutes, mode = 'Collaboration Tools' }: sidecardInterface) => {
  const [modalContent, setModalContent] = useState(null);
  const [colabData, setColabData] = useState(null);
  const style = { '--sideCardBg': mode === 'Collaboration Tools' ? '#fffaee' : '#FDFFF4', width: '100%' } as React.CSSProperties;
  const description =
    (mode === 'Collaboration Tools' && `By using Collaboration tools, collaborate with or within team members easily`) ||
    (mode === 'Setups' && `List of all product and category setups`);

  const checkLinkAvailability = ['Product Master', 'Pricing Setup', 'Lead Time Master'];

  useEffect(() => {
    if (objBySectionName) {
      if (mode === 'Collaboration Tools') setColabData(objBySectionName['Collaboration Tools'] || objBySectionName['Activities'] || null);
      else setColabData(objBySectionName['Setups'] || objBySectionName['Product Setup'] || null);
    }
  }, [objBySectionName]);

  const handleClose = () => {
    setModalContent(null);
  };
  return (
    <>
      {colabData ? (
        <button style={style} className={styles.rightInner} onClick={() => setModalContent({ items: colabData, title: mode })}>
          <img src={SVGImages(mode)} alt={`${mode} Logo`} className={styles.colabLogo} />
          <Typography component={'h2'}>{mode}</Typography>
          <Typography component={'p'}>{description}</Typography>
          {mode === 'Setups' && (
            <>
              <ul className={styles.linkList}>
                {colabData
                  ?.filter((item) => !item?.isHidden && checkLinkAvailability.includes(item.resourceLabel || item.name))
                  .map((item) => (
                    <li key={item.name}>
                      <Link to={handleRoutes(item)} className={styles.dialogLinks}>
                        <Typography component="span">{item.resourceLabel || item.name}</Typography>
                      </Link>
                    </li>
                  ))}
              </ul>
              <div className={styles.viewAll} onClick={() => colabData.length > 0 && setModalContent({ items: colabData, title: mode })}>
                <Typography component="span">View All</Typography>
                <HiArrowRight />
              </div>
            </>
          )}
          {mode === 'Collaboration Tools' && (
            <button className={styles.colabButton} onClick={() => setModalContent({ items: colabData, title: mode })}>
              <Typography component="span">Start Collaborating</Typography>
            </button>
          )}
        </button>
      ) : null}
      <RenderDialog modalContent={modalContent} handleClose={handleClose} handleRoutes={handleRoutes} />
    </>
  );
};
