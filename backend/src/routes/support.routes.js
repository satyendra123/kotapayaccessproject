const express = require("express");
const Joi = require("joi");

const supportController = require("../controllers/support.controller");
const authMiddleware = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");
const { validateBody } = require("../utils/validate.util");

const router = express.Router();

router.use(authMiddleware);

const supportQueryCreateSchema = Joi.object({
  user_id: Joi.number().integer().required(),
  query_text: Joi.string().min(1).required(),
});

const supportQueryReplySchema = Joi.object({
  reply_text: Joi.string().min(1).required(),
});

router.post(
  "/queries",
  requirePermission("submit_support_query"),
  validateBody(supportQueryCreateSchema),
  supportController.submitUserQuery
);
router.get("/queries", requirePermission("view_support_queries"), supportController.getAllQueries);
router.get("/queries/:id(\\d+)", requirePermission("view_support_queries"), supportController.getSingleQuery);
router.put(
  "/queries/:id(\\d+)/reply",
  requirePermission("reply_support_queries"),
  validateBody(supportQueryReplySchema),
  supportController.replyToQueryAdmin
);
router.delete("/queries/:id(\\d+)", requirePermission("delete_support_queries"), supportController.deleteQuery);

module.exports = router;
