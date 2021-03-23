import api from './axios'

export const GetUsers = async () => {
    const { data } = await api().get(`/activity/user`);
    return data;
};

export const GetTask = async (relatedTo) => {
    const { data } = await api().get(`/task?relatedTo=${relatedTo}`);
    return data;
};

export const GetTaskDetail = async (taskId) => {
    const { data } = await api().get(`/task/${taskId}`);
    return data;
};

export const CreateNewTask = async (inputData) => {
    const { data } = await api().post("/task", inputData);
    return data;
};

export const UpdateTask = async (taskId, inputData) => {
    const { data } = await api().put(`/task/${taskId}`, inputData);
    return data;
};

export const DeleteTask = async (taskId) => {
    const { data } = await api().delete(`/task/${taskId}`);
    return data;
};




export const GetEvent = async (relatedTo) => {
    const { data } = await api().get(`/event?relatedTo=${relatedTo}`);
    return data;
};

export const GetEventDetail = async (eventId) => {
    const { data } = await api().get(`/event/${eventId}`);
    return data;
};

export const CreateNewEvent = async (inputData) => {
    const { data } = await api().post("/event", inputData);
    return data;
};

export const UpdateEvent = async (eventId, inputData) => {
    const { data } = await api().put(`/event/${eventId}`, inputData);
    return data;
};

export const DeleteEvent = async (eventId) => {
    const { data } = await api().delete(`/event/${eventId}`);
    return data;
};

export const GetCase = async (relatedTo) => {
    const { data } = await api().get(`/case?relatedTo=${relatedTo}`);
    return data;
};

export const GetCaseDetail = async (caseId) => {
    const { data } = await api().get(`/case/${caseId}`);
    return data;
};

export const CreateNewCase = async (inputData) => {
    const { data } = await api().post("/case", inputData);
    return data;
};

export const UpdateCase = async (caseId, inputData) => {
    const { data } = await api().put(`/case/${caseId}`, inputData);
    return data;
};

export const DeleteCase = async (caseId) => {
    const { data } = await api().delete(`/case/${caseId}`);
    return data;
};




export const GetNote = async (relatedTo) => {
    const { data } = await api().get(`/note?relatedTo=${relatedTo}`);
    return data;
};

export const GetNoteDetail = async (noteId) => {
    const { data } = await api().get(`/note/${noteId}`);
    return data;
};

export const CreateNewNote = async (inputData) => {
    const { data } = await api().post("/note", inputData);
    return data;
};

export const UpdateNote = async (noteId, inputData) => {
    const { data } = await api().put(`/note/${noteId}`, inputData);
    return data;
};

export const DeleteNote = async (noteId) => {
    const { data } = await api().delete(`/note/${noteId}`);
    return data;
};




export const GetEmail = async (relatedTo) => {
    const { data } = await api().get(`/email?relatedTo=${relatedTo}`);
    return data;
};

export const GetEmailDetail = async (emailId) => {
    const { data } = await api().get(`/email/${emailId}`);
    return data;
};

export const CreateNewEmail = async (inputData) => {
    const { data } = await api().post("/email", inputData);
    return data;
};

export const UpdateEmail = async (emailId, inputData) => {
    const { data } = await api().put(`/email/${emailId}`, inputData);
    return data;
};

export const DeleteEmail = async (emailId) => {
    const { data } = await api().delete(`/email/${emailId}`);
    return data;
};



export const GetUpcomingActivity = async (relatedTo) => {
    const { data } = await api().get(`/activity/upcoming?relatedTo=${relatedTo}`);
    return data;
};

export const SearchActivity = async (searchText) => {
    const { data } = await api().get(`/activity/search?searchText=${searchText}`);
    return data;
};

export const GetBoard = async (type, filter) => {
    const { data } = await api().get(`/activity/board?type=${type}&filter=${filter}`);
    return data;
};

export const GetRoadmap = async (type, filter) => {
    const { data } = await api().get(`/activity/roadmap?type=${type}&filter=${filter}`);
    return data;
};

export const GetReferenceName = async (referenceType, referenceId) => {
    const { data } = await api().get(`/activity/referenceName?referenceType=${referenceType}&referenceId=${referenceId}`);
    return data;
};

export const GetNotes = async (filter) => {
    const { data } = await api().get(`/activity/notes?filter=${filter}`);
    return data;
};

export const GetEmails = async (filter) => {
    const { data } = await api().get(`/activity/emails?filter=${filter}`);
    return data;
};



export const GetComment = async (referenceId) => {
    const { data } = await api().get(`/comment/${referenceId}`);
    return data;
};


export const PostComment = async (inputData) => {
    const { data } = await api().post("/comment", inputData);
    return data;
};
