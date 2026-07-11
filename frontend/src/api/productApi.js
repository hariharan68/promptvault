import client from "./client.js";

export const getTrash = (params = {}) => client.get("/prompts/trash", { params });
export const restorePrompt = (id) => client.post(`/prompts/${id}/restore`);
export const getPromptVersions = (id) => client.get(`/prompts/${id}/versions`);
export const discoverPrompts = (kind) => client.get(`/prompts/discover/${kind}`);
export const restorePromptVersion = (promptId, versionId) => client.post(`/prompts/${promptId}/versions/${versionId}/restore`);
export const bulkPrompts = (data) => client.post("/prompts/bulk", data);
export const importPrompts = (data) => client.post("/prompts/import", data);
export const exportPrompts = (format) => client.get("/prompts/export", { params: { format }, responseType: "blob" });
export const changePassword = (data) => client.post("/auth/change-password", data);
export const getSessions = () => client.get("/auth/sessions");
export const revokeAllSessions = () => client.post("/auth/sessions/revoke-all");
export const exportAccount = () => client.get("/auth/account/export");
export const deleteAccount = () => client.delete("/auth/account");
