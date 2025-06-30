import { Box } from '@mui/material';
import { BsDisplay, BsEnvelopeOpen } from 'react-icons/bs';
import ResourceWiseNotificationPreference from 'src/pages/ProfilePage/components/ResourceWiseNotificationPreference';

const PreferenceOptions = ({ id, icon, heading, subtitle }) => (
  <div className="flex items-center gap-4 ">
    <span className="flex-shrink-0">{icon}</span>
    <div>
      <h6 className="text-lg font-bold ">{heading}</h6>
      <p className="text-[13px] text-gray-500">{subtitle}</p>
    </div>
  </div>
);

export default function NotificationPreference({ notificationPreferenceData, user, onSuccess }) {
  const options = [
    {
      icon: <BsDisplay size={55} />,
      heading: 'Portal',
      subtitle: 'A banner in corner of your website',
      id: 'Portal'
    },
    {
      icon: <BsEnvelopeOpen size={50} />,
      heading: 'Email',
      subtitle: 'Conversation sent to your mail',
      id: 'Email3'
    }
  ];

  return (
    <>
      <h5 className="mb-2 text-[18px] font-medium md:text-[20px]">Your Notification Preference</h5>
      <Box style={{ padding: '8px' }}>
        <div className="grid grid-cols-1 gap-4 rounded-md border px-2 py-2 sm:grid-cols-2 md:px-4">
          {options.map((curPreference, i) => (
            <div className="relative" key={curPreference.id}>
              <PreferenceOptions id={curPreference.id} icon={curPreference.icon} heading={curPreference.heading} subtitle={curPreference.subtitle} />
              {i < options.length - 1 && <div className="absolute bottom-0 right-0 top-0 border-r"></div>}
            </div>
          ))}
        </div>
        <ResourceWiseNotificationPreference />
      </Box>
    </>
  );
}
