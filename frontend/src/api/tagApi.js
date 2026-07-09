import client from "./client.js";

export const getTags = () => client.get("/tags/");
export const getTag = (id) => client.get(`/tags/${id}`);
export const createTag = (data) => client.post("/tags/", data);
