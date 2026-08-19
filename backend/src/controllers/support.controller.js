const asyncHandler = require("../utils/asyncHandler");
const supportService = require("../services/support.service");

function queryItemOut(q) {
  return {
    id: q.id,
    query_text: q.queryText,
    reply_text: q.replyText,
    created_at: q.created_at,
    updated_at: q.updated_at,
  };
}

const submitUserQuery = asyncHandler(async (req, res) => {
  const query = await supportService.submitQuery({ userId: req.body.user_id, queryText: req.body.query_text });
  res.json({ status: "success", message: "Query submitted successfully", query_id: query.id });
});

const getAllQueries = asyncHandler(async (req, res) => {
  const queries = await supportService.listQueries();
  res.json({ status: "success", data: queries.map(queryItemOut) });
});

const getSingleQuery = asyncHandler(async (req, res) => {
  const query = await supportService.getQuery(Number(req.params.id));
  res.json({
    id: query.id,
    query_text: query.queryText,
    reply_text: query.replyText,
    created_at: query.created_at,
  });
});

const replyToQueryAdmin = asyncHandler(async (req, res) => {
  await supportService.replyQuery(Number(req.params.id), req.body.reply_text);
  res.json({ status: "success", message: "Reply added successfully" });
});

const deleteQuery = asyncHandler(async (req, res) => {
  const message = await supportService.deleteQuery(Number(req.params.id));
  res.json({ status: "success", message });
});

module.exports = { submitUserQuery, getAllQueries, getSingleQuery, replyToQueryAdmin, deleteQuery };
