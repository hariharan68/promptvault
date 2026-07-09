import client from "./client.js";

export const getPrompts = (params = {}) => client.get("/prompts/", { params });
export const getPrompt = (id) => client.get(`/prompts/${id}`);
export const createPrompt = (data) => client.post("/prompts/", data);
export const updatePrompt = (id, data) => client.put(`/prompts/${id}`, data);
export const deletePrompt = (id) => client.delete(`/prompts/${id}`);
export const duplicatePrompt = (id) => client.post(`/prompts/${id}/duplicate`);
export const copyPrompt = (id) => client.post(`/prompts/${id}/copy`);
export const favoritePrompt = (id) => client.post(`/prompts/${id}/favorite`);
export const unfavoritePrompt = (id) => client.delete(`/prompts/${id}/favorite`);
