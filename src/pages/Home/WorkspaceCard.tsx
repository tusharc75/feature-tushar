import { useState } from 'react';
import { Link } from 'react-router-dom';
import workspaceImage from 'src/assets/dashboard_images/sidebar/workspace.png';
import { getCollaborateIconBasedOnName } from 'src/assets/svg/CollaborateSidebar';
import DashboardModal from 'src/components/DashboardModal';
import { SideCardProps } from 'src/pages/Home/SideCard';

import SideCard from 'src/pages/Home/SideCard';

const workSpaceProps = {
  heading: 'Workspace',
  description: 'By using Equipt Workspace, collaborate with your team members easily',
  icon: (
    <div className="max-w-[60px]">
      <img src={workspaceImage} alt={'Workspace Logo'} className="max-w-full" />
    </div>
  ),
  gradientColors: ['#925cb4', '#64b9fc']
} as SideCardProps;

const WorkspaceCard = ({ handleRoutes, objBySectionName }) => {
  const [modalContent, setModalContent] = useState(null);

  const handleOpenModal = () => {
    setModalContent({
      items: objBySectionName['Collaboration Tools'] || objBySectionName['Activities'] || objBySectionName['Workspace'] || null,
      title: 'Workspace',
      icon: workSpaceProps.icon
    });
  };

  return (
    <>
      <SideCard onClick={() => handleOpenModal()} {...workSpaceProps} />

      <DashboardModal
        style={{ width: 'min(468px, calc(100vw - 64px))' }}
        modalHead={modalContent}
        handleClose={() => setModalContent(null)}
        handleRoutes={handleRoutes}
        contentMaxHeight="300px"
      >
        <ul className={'grid grid-cols-2 gap-2'}>
          {modalContent?.items
            ?.filter((item) => !item?.isHidden)
            .map((item) => (
              <li key={item.name} className="list-none rounded-md border shadow-md transition-shadow hover:shadow-lg">
                <Link to={handleRoutes(item)} className={'flex items-center gap-2 px-2 py-4'}>
                  <span className="block max-h-[20px] max-w-[20px] flex-shrink-0 [&>*]:h-[auto] [&>*]:max-w-full">
                    {getCollaborateIconBasedOnName(item.name)}
                  </span>
                  <span className="line-clamp-1 min-w-0 text-[14px] font-medium">{item.resourceLabel || item.name}</span>
                </Link>
              </li>
            ))}
        </ul>
      </DashboardModal>
    </>
  );
};

export default WorkspaceCard;
