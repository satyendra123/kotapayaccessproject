const asyncHandler = require("../utils/asyncHandler");
const dashboardService = require("../services/dashboard.service");

const todaysTicketGeneratedMembers = asyncHandler(async (req, res) => {
  const value = await dashboardService.todaysTicketGeneratedMembers();
  res.json({ value });
});

const todayInside = asyncHandler(async (req, res) => {
  const { online, offline } = await dashboardService.todayInside();
  res.json({ online, offline, total: online + offline });
});

const todayOutside = asyncHandler(async (req, res) => {
  const { online, offline } = await dashboardService.todayOutside();
  res.json({ online, offline, total: online + offline });
});

const overstay = asyncHandler(async (req, res) => {
  const count = await dashboardService.overstayCount();
  res.json({ count });
});

const todayRevenue = asyncHandler(async (req, res) => {
  const { amount, currency } = await dashboardService.todayRevenue();
  res.json({ amount, currency });
});

const totalLostTickets = asyncHandler(async (req, res) => {
  const count = await dashboardService.totalLostTickets();
  res.json({ count });
});

const totalEligibleTickets = asyncHandler(async (req, res) => {
  const count = await dashboardService.totalEligibleTickets();
  res.json({ count });
});

const totalGroupTickets = asyncHandler(async (req, res) => {
  const count = await dashboardService.totalGroupTickets();
  res.json({ count });
});

const monthlyRevenue = asyncHandler(async (req, res) => {
  res.json(await dashboardService.monthlyRevenue());
});

const todayTicketCollection = asyncHandler(async (req, res) => {
  res.json(await dashboardService.todayTicketCollection());
});

module.exports = {
  todaysTicketGeneratedMembers,
  todayInside,
  todayOutside,
  overstay,
  todayRevenue,
  totalLostTickets,
  totalEligibleTickets,
  totalGroupTickets,
  monthlyRevenue,
  todayTicketCollection,
};
