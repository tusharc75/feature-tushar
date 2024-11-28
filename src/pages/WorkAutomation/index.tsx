import { useHistory } from 'react-router-dom';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { useData } from '../../StateProvider/Provider';
import CustomContainer from '../../components/CustomContainer';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import ManageRentalJob from '../RentalManagement/ManageRental/index';
import { useState } from 'react';

const WorkAutomation = () => {
  const history = useHistory();
  const [openRentalJobDialog, setOpenRentalJobDialog] = useState(false);
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
            setOpenRentalJobDialog(true);
          }}
          addButtonProps={{text: `${routes.rentalManagement.title}`}}
          isAddButtonVisible={permissions?.workAutomation?.isCreate}
        />
      </CustomContainer>
      {openRentalJobDialog && (
        <ManageRentalJob
          open={openRentalJobDialog}
          isClone={false}
          rentalManagementId={null}
          onClose={() => {
            setOpenRentalJobDialog(false);
          }}
          onSuccess={(data) => {
            history.push(`${routes.workAutomationDetail.path}/${data?._id}`)
            setOpenRentalJobDialog(false);
          }}
          isAutomated={true}
        />
      )}
    </section>
  );
};

export default WorkAutomation;
