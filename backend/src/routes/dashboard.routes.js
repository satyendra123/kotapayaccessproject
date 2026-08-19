const express = require("express");
const dashboardController = require("../controllers/dashboard.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/tickets/members/today", dashboardController.todaysTicketGeneratedMembers);
router.get("/persons/inside/today", dashboardController.todayInside);
router.get("/persons/outside/today", dashboardController.todayOutside);
router.get("/overstay", dashboardController.overstay);
router.get("/revenue/today", dashboardController.todayRevenue);
router.get("/tickets/lost", dashboardController.totalLostTickets);
router.get("/tickets/eligible", dashboardController.totalEligibleTickets);
router.get("/tickets/group", dashboardController.totalGroupTickets);
router.get("/revenue/monthly", dashboardController.monthlyRevenue);
router.get("/tickets/today-collection", dashboardController.todayTicketCollection);

module.exports = router;
