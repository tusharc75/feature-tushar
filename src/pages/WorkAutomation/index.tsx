import { useHistory } from 'react-router-dom';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { useData } from '../../StateProvider/Provider';
import CustomContainer from '../../components/CustomContainer';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';

const WorkAutomation = () => {
  const history = useHistory();
  const {
    state: { permissions }
  }: any = useData();

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.workAutomation]} />
      </div>
      <CustomContainer>
        <ListingPageHeader
          isActionButtonVisible={false}
          addButtonOnclick={() => {
            history.push(`${routes.workAutomation.path}/0`);
          }}
          isAddButtonVisible={permissions?.workAutomation?.isCreate}
        />
      </CustomContainer>
    </section>
  );
};

export default WorkAutomation;
