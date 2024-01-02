export const getUserAvatar = (data) => {
  let avatar = '';
  for (const user of data.users) {
    const userName = `${user.firstName} ${user.lastName}`;
    if (userName === data.chatTitle) {
      avatar = user.avatar || '';
    }
  }
  return avatar;
};

export const assignAvatar = (notifications, chats) => {
  const newNotifications = [...notifications];
  for (const notification of newNotifications) {
    const chat = chats.find((c) => c.id === notification.chatterId);
    if (chat) notification.avatar = getUserAvatar(chat);
    else notification.avatar = '';
    notification.chatterName = chat ? `${chat.chatTitle}` : '';
  }
  return newNotifications;
};
