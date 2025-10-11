import axios from "axios";

const URL = process.env.NEXT_PUBLIC_URL_AND_PORT;

const jsonHeader = {
  headers: {
    "Content-Type": "application/json",
  },
};

/**
 * Create a new inspection ticket
 * @param {Object} data - ticket payload
 * @param {string} [data.businessId] - Business ObjectId
 * @param {string} [data.bidNumber] - Business BID number (alternative to businessId)
 * @param {string} [data.inspectionType] - e.g. "routine"
 * @param {string} [data.violationType] - e.g. "sanitation"
 * @param {string} [data.violation] - violation details
 * @param {string} [data.remarks] - officer remarks
 * @param {string|Date} [data.inspectionDate] - optional inspection date
 */
export const createInspectionTicket = (data) => {
  return axios.post(`/api/ticket`, data, jsonHeader);
};

/**
 * Fetch tickets with optional filters
 * @param {Object} params - query params
 * @param {string} [params.status] - e.g. "pending", "completed"
 * @param {string} [params.businessId] - filter by business
 * @param {string|number} [params.year] - filter by year
 */
export const getTickets = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return axios.get(`/api/ticket${query ? `?${query}` : ""}`, jsonHeader);
};

/**
 * Fetch a single ticket by ID
 * @param {string} id - Ticket ObjectId
 */
export const getTicketById = (id) => {
  return axios.get(`/api/ticket/${id}`, jsonHeader);
};

/**
 * Update a ticket by ID
 * @param {string} id - Ticket ObjectId
 * @param {Object} data - fields to update
 * @param {string} data.inspectionStatus - "pending" | "completed" | "none"
 * @param {string|Date} [data.inspectionDate]
 * @param {string} [data.remarks]
 * @param {Object} [data.checklist]
 */
export const updateTicket = (id, data) => {
  return axios.put(`/api/ticket/${id}`, data, jsonHeader);
};

/**
 * Delete a ticket by ID
 * @param {string} id - Ticket ObjectId
 */
export const deleteTicket = (id) => {
  return axios.delete(`/api/ticket/${id}`, jsonHeader);
};
