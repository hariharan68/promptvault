import client from "./client.js";

export const getTags = () => client.get("/tags/").then((response) => ({ ...response, data: response.data.data ?? response.data }));
export const getTag = (id) => client.get(`/tags/${id}`);
export const createTag = (data) => client.post("/tags/", data);
