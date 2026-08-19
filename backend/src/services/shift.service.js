const { Op } = require("sequelize");
const {
  sequelize, Shift, TariffService, ComboService, CustomerTicket, CustomerService,
  CustomerCombo, LostTicket, EligibleTicket, TicketMovementLog, ConnectedServiceWithCombo,
} = require("../models");
const { HttpError } = require("../middleware/error.middleware");

async function createShift(data) {
  const existing = await Shift.findOne({ where: { shiftname: data.shiftname } });
  if (existing) {
    throw new HttpError(400, "Shift name already exists");
  }
  return Shift.create({
    shiftname: data.shiftname,
    shiftstarttime: data.shiftstarttime,
    shiftendtime: data.shiftendtime,
    status: data.status,
  });
}

async function listShifts() {
  return Shift.findAll();
}

async function getShift(shiftId) {
  const shift = await Shift.findByPk(shiftId);
  if (!shift) {
    throw new HttpError(404, "Shift not found");
  }
  return shift;
}

async function updateShift(shiftId, data) {
  const shift = await getShift(shiftId);
  for (const field of ["shiftname", "shiftstarttime", "shiftendtime", "status"]) {
    if (data[field] !== undefined) {
      shift[field] = data[field];
    }
  }
  await shift.save();
  return shift;
}

async function deleteShift(shiftId) {
  const shift = await getShift(shiftId);
  const name = shift.shiftname;

  await sequelize.transaction(async (transaction) => {
    const tariffs = await TariffService.findAll({ where: { shiftId }, attributes: ["id"], transaction });
    const tickets = await CustomerTicket.findAll({ where: { shiftId }, attributes: ["id"], transaction });
    const tariffIds = tariffs.map((tariff) => tariff.id);
    const ticketIds = tickets.map((ticket) => ticket.id);

    if (ticketIds.length) {
      // Execute sequentially to avoid holding competing locks when a user
      // clicks Delete more than once.
      await TicketMovementLog.destroy({ where: { ticketId: { [Op.in]: ticketIds } }, transaction });
      await sequelize.query("DELETE FROM lost_ticket_logs WHERE ticket_id IN (:ticketIds)", {
        replacements: { ticketIds }, transaction,
      });
      await LostTicket.destroy({ where: { ticketId: { [Op.in]: ticketIds } }, transaction });
      await EligibleTicket.destroy({ where: { ticketId: { [Op.in]: ticketIds } }, transaction });
      await CustomerCombo.destroy({ where: { customerId: { [Op.in]: ticketIds } }, transaction });
      await sequelize.query("DELETE FROM ticket_subscription_links WHERE ticket_id IN (:ticketIds)", {
        replacements: { ticketIds }, transaction,
      });
      await sequelize.query(
        "DELETE FROM entry_exit_logs WHERE shift_id = :shiftId OR ticket_id IN (:ticketIds)",
        { replacements: { shiftId, ticketIds }, transaction }
      );
    } else {
      await sequelize.query("DELETE FROM entry_exit_logs WHERE shift_id = :shiftId", {
        replacements: { shiftId }, transaction,
      });
    }

    const customerServiceConditions = [];
    if (ticketIds.length) customerServiceConditions.push({ customerId: { [Op.in]: ticketIds } });
    if (tariffIds.length) customerServiceConditions.push({ serviceId: { [Op.in]: tariffIds } });
    if (customerServiceConditions.length) {
      await CustomerService.destroy({ where: { [Op.or]: customerServiceConditions }, transaction });
    }
    if (tariffIds.length) {
      await ConnectedServiceWithCombo.destroy({ where: { connectedSerID: { [Op.in]: tariffIds } }, transaction });
      await TariffService.destroy({ where: { id: { [Op.in]: tariffIds } }, transaction });
    }

    await ComboService.destroy({ where: { shiftId }, transaction });
    await CustomerTicket.destroy({ where: { shiftId }, transaction });
    await shift.destroy({ transaction });
  });
  return `Shift '${name}' and its linked records deleted successfully!`;
}

module.exports = { createShift, listShifts, getShift, updateShift, deleteShift };
