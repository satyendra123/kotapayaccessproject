const { SupportQuery } = require("../models");
const { HttpError } = require("../middleware/error.middleware");

async function submitQuery({ userId, queryText }) {
  return SupportQuery.create({ userId, queryText });
}

async function listQueries() {
  return SupportQuery.findAll({ order: [["id", "DESC"]] });
}

async function getQuery(queryId) {
  const query = await SupportQuery.findByPk(queryId);
  if (!query) {
    throw new HttpError(404, "Query not found");
  }
  return query;
}

async function replyQuery(queryId, replyText) {
  const query = await getQuery(queryId);
  query.replyText = replyText;
  await query.save();
  return query;
}

async function deleteQuery(queryId) {
  const query = await getQuery(queryId);
  await query.destroy();
  return "Query deleted successfully";
}

module.exports = { submitQuery, listQueries, getQuery, replyQuery, deleteQuery };
