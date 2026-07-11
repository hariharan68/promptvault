import client from "./client.js";

export const getGroups = () => client.get("/groups/").then((response) => ({ ...response, data: response.data.data ?? response.data }));
export const getGroup = (id) => client.get(`/groups/${id}`);
export const createGroup = (data) => client.post("/groups/", data);
export const updateGroup = (id, data) => client.put(`/groups/${id}`, data);
export const deleteGroup = (id) => client.delete(`/groups/${id}`);
