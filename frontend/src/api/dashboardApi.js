import client from "./client.js";

export const getDashboardStats = () => client.get("/dashboard/stats");
export const getRecentPrompts = (limit = 5) => client.get("/dashboard/recent", { params: { limit } });
