import queryString from 'query-string';
import { Fragment, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import ListingPageHeader from 'src/components/ListingPageHeader';
import { useData } from '../../StateProvider/Provider';
import { GetReferenceName } from '../../axios/activity';
import Board from '../../components/Activity/Report/Board';
import Roadmap from '../../components/Activity/Report/Roadmap';
import { SearchFilter } from '../../components/Activity/Report/SearchFilter';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import CustomContainer from '../../components/CustomContainer';
import CustomTabs from '../../components/Helpers/CustomTabs';
import routes from '../../components/Helpers/Routes';
import './style.scss';

const capitalize = (string) => {
  return string?.charAt(0)?.toUpperCase() + string?.slice(1);
};

const Activity = ({ type }) => {
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { referenceType, referenceId } = parsed;
  const {
    state: { user, permissions }
  }: any = useData();
  const [viewType, setViewType] = useState(0);
  const [filter, setFilter] = useState(null);

  useEffect(() => {
    if (referenceType) {
      GetReferenceName(referenceType, referenceId)
        .then(({ data }) => {
          setFilter([{ _id: referenceId, type: referenceType, name: data.name }]);
        })
        .catch((err) => {});
    } else {
      setFilter([]);
    }
  }, [type, referenceId]);

  const tabs = ['Board', 'Roadmap'];
  const handleChangeFilter = (value) => {
    setFilter(value);
    history.replace({
      search: ''
    });
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: capitalize(routes[type].title) }]} />
      </div>
      <CustomContainer>
        {filter && (
          <Fragment>
            <ListingPageHeader
              leftSideContents={<CustomTabs value={viewType} setValue={setViewType} tabs={tabs} />}
              rightSideContents={<SearchFilter handleChangeFilter={handleChangeFilter} filter={filter} activityName={type} />}
              isActionButtonVisible={false}
              isAddButtonVisible={false}
            />
            {viewType === 0 && <Board type={type} filter={filter} />}
            {viewType === 1 && <Roadmap type={type} filter={filter} />}
          </Fragment>
        )}
      </CustomContainer>
    </section>
  );
};

export default Activity;
