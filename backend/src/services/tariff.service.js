const { Op } = require("sequelize");
const { sequelize, TariffService, ComboService, ConnectedServiceWithCombo, CustomerService, Combo, Shift } = require("../models");
const { HttpError } = require("../middleware/error.middleware");

// -------------------- Tariff Services --------------------

async function createTariffService(data) {
  const shift = await Shift.findByPk(data.shift_id);
  if (!shift) {
    throw new HttpError(400, `Shift with id ${data.shift_id} does not exist`);
  }

  return TariffService.create({
    servicename: data.servicename,
    price: data.price,
    discountedprice: data.discountedprice ?? null,
    servicefor: data.servicefor,
    status: data.status,
    shiftId: data.shift_id,
  });
}

async function getTariffServiceById(tariffId) {
  return TariffService.findByPk(tariffId);
}

async function updateTariffService(tariffId, data) {
  const tariff = await getTariffServiceById(tariffId);
  if (!tariff) return null;

  if (data.shift_id !== undefined) {
    const shift = await Shift.findByPk(data.shift_id);
    if (!shift) throw new HttpError(400, `Shift with id ${data.shift_id} does not exist`);
  }

  const map = {
    servicename: "servicename",
    shift_id: "shiftId",
    servicefor: "servicefor",
    price: "price",
    status: "status",
    discountedprice: "discountedprice",
  };
  for (const [key, field] of Object.entries(map)) {
    if (data[key] !== undefined) tariff[field] = data[key];
  }

  await tariff.save();
  return tariff;
}

async function deactivateTariffService(tariffId) {
  await TariffService.update({ status: "Inactive" }, { where: { id: tariffId } });
}

async function deleteTariffService(tariffId) {
  const tariff = await getTariffServiceById(tariffId);
  if (!tariff) throw new HttpError(404, "Tariff service not found");
  const name = tariff.servicename;
  await sequelize.transaction(async (transaction) => {
    await CustomerService.destroy({ where: { serviceId: tariffId }, transaction });
    await ConnectedServiceWithCombo.destroy({ where: { connectedSerID: tariffId }, transaction });
    await tariff.destroy({ transaction });
  });
  return `Tariff '${name}' deleted successfully`;
}

async function getActiveTariffServices() {
  const tariffs = await TariffService.findAll({
    include: [{ model: Shift, as: "shift" }],
    order: [["shiftId", "DESC"]],
  });
  return tariffs.map((t) => ({ tariff: t, shift: t.shift }));
}

// -------------------- Combo Services --------------------

async function getComboService(comboServiceId) {
  return ComboService.findByPk(comboServiceId);
}

async function createComboService(data) {
  const shift = await Shift.findByPk(data.shift_id);
  if (!shift) throw new HttpError(400, `Shift with id ${data.shift_id} does not exist`);

  return ComboService.create({
    comboService: data.combo_service,
    shiftId: data.shift_id,
    price: data.price,
    status: data.status || "Active",
    discountedprice: data.discountedprice ?? null,
  });
}

async function updateComboService(comboServiceId, data) {
  const comboService = await getComboService(comboServiceId);
  if (!comboService) return null;

  if (data.shift_id !== undefined) {
    const shift = await Shift.findByPk(data.shift_id);
    if (!shift) throw new HttpError(400, `Shift with id ${data.shift_id} does not exist`);
  }

  const map = {
    combo_service: "comboService",
    shift_id: "shiftId",
    price: "price",
    status: "status",
    discountedprice: "discountedprice",
  };
  for (const [key, field] of Object.entries(map)) {
    if (data[key] !== undefined) comboService[field] = data[key];
  }

  await comboService.save();
  return comboService;
}

async function deactivateComboService(comboServiceId) {
  const comboService = await getComboService(comboServiceId);
  if (!comboService) return null;
  comboService.status = "Inactive";
  await comboService.save();
  return comboService;
}

async function getComboServices() {
  return ComboService.findAll({
    order: [["shiftId", "DESC"]],
    limit: 100,
  });
}

// -------------------- Combos --------------------

function tariffToConnectedDict(s) {
  return {
    id: Number(s.id),
    servicename: String(s.servicename || ""),
    price: Number(s.price || 0),
    discountedprice: s.discountedprice != null ? Number(s.discountedprice) : null,
    servicefor: String(s.servicefor || ""),
    shift_id: s.shiftId,
    status: String(s.status || "Active"),
  };
}

async function fetchTariffsForSelectedIds(selectedIds) {
  if (!selectedIds.length) return [];

  const rows = await TariffService.findAll({ where: { id: selectedIds } });
  const existingIds = new Set(rows.map((s) => Number(s.id)));
  const missing = selectedIds.filter((sid) => !existingIds.has(sid));
  if (missing.length) {
    throw new HttpError(400, `Invalid selectedservices ids (not found in tariffs): ${JSON.stringify(missing)}`);
  }

  const inactive = rows.filter((s) => (s.status || "Active") !== "Active").map((s) => Number(s.id));
  if (inactive.length) {
    throw new HttpError(400, `Inactive tariff services cannot be added to combo: ${JSON.stringify(inactive)}`);
  }

  return rows;
}

async function getCombo(comboId) {
  return Combo.findByPk(comboId);
}

async function createCombo(data, userId) {
  const selectedIds = [...new Set((data.selectedservices || []).map(Number))];
  const fullServices = await fetchTariffsForSelectedIds(selectedIds);

  const dbCombo = await Combo.create({
    comboname: data.comboname,
    actualPrice: data.actual_price,
    discountPrice: data.discount_price || 0.0,
    status: data.status || "Active",
    createdby: userId,
  });

  for (const serviceId of selectedIds) {
    await ConnectedServiceWithCombo.create({ comboid: dbCombo.id, connectedSerID: serviceId, status: "Active" });
  }

  const svcById = new Map(fullServices.map((s) => [Number(s.id), s]));
  const connectedOut = selectedIds.filter((sid) => svcById.has(sid)).map((sid) => tariffToConnectedDict(svcById.get(sid)));
  const servicesMini = connectedOut.map((x) => ({ id: x.id, servicename: x.servicename }));

  return {
    id: Number(dbCombo.id),
    comboname: dbCombo.comboname || "",
    actual_price: Number(dbCombo.actualPrice || 0),
    discount_price: Number(dbCombo.discountPrice || 0.0),
    status: dbCombo.status || "Active",
    selectedservices: selectedIds,
    connected_services: connectedOut,
    services: servicesMini,
  };
}

async function updateCombo(comboId, data) {
  const dbCombo = await getCombo(comboId);
  if (!dbCombo) return null;

  for (const key of ["comboname", "actual_price", "discount_price", "status"]) {
    if (data[key] !== undefined) {
      const fieldMap = { comboname: "comboname", actual_price: "actualPrice", discount_price: "discountPrice", status: "status" };
      dbCombo[fieldMap[key]] = data[key];
    }
  }
  await dbCombo.save();

  if (data.selectedservices !== undefined && data.selectedservices !== null) {
    const selectedIds = [...new Set(data.selectedservices.map(Number))];
    await fetchTariffsForSelectedIds(selectedIds);

    await ConnectedServiceWithCombo.destroy({ where: { comboid: comboId } });
    for (const sid of selectedIds) {
      await ConnectedServiceWithCombo.create({ comboid: comboId, connectedSerID: sid, status: "Active" });
    }
  }

  return getComboWithServices(comboId);
}

async function deleteCombo(comboId) {
  const dbCombo = await getCombo(comboId);
  if (dbCombo) {
    await ConnectedServiceWithCombo.destroy({ where: { comboid: comboId } });
    await dbCombo.destroy();
  }
  return dbCombo;
}

async function getComboWithServices(comboId) {
  const combo = await Combo.findByPk(comboId);
  if (!combo) return null;

  const links = await ConnectedServiceWithCombo.findAll({
    where: { comboid: comboId, status: "Active" },
    order: [["id", "ASC"]],
  });
  const selectedIds = links.map((l) => Number(l.connectedSerID)).filter((id) => id != null);

  let fullServices = [];
  if (selectedIds.length) {
    fullServices = await TariffService.findAll({ where: { id: selectedIds } });
  }
  const svcById = new Map(fullServices.map((s) => [Number(s.id), s]));

  const connectedOut = [];
  for (const sid of selectedIds) {
    const s = svcById.get(sid);
    if (s) connectedOut.push(tariffToConnectedDict(s));
  }
  const servicesMini = connectedOut.map((x) => ({ id: x.id, servicename: x.servicename }));

  return {
    id: Number(combo.id),
    comboname: combo.comboname || "",
    actual_price: Number(combo.actualPrice || 0),
    discount_price: Number(combo.discountPrice || 0.0),
    status: combo.status || "Active",
    selectedservices: selectedIds,
    connected_services: connectedOut,
    services: servicesMini,
  };
}

async function getCombosWithServices() {
  const combos = await Combo.findAll({ where: { status: "Active" }, order: [["id", "DESC"]] });
  if (!combos.length) return { combos: [], servicesMap: {} };

  const comboIds = combos.map((c) => c.id);
  const links = await ConnectedServiceWithCombo.findAll({
    where: { comboid: comboIds, status: "Active" },
    order: [["id", "ASC"]],
  });

  const selectedMap = new Map();
  const allServiceIds = new Set();
  for (const link of links) {
    if (link.comboid == null || link.connectedSerID == null) continue;
    const cid = Number(link.comboid);
    const sid = Number(link.connectedSerID);
    if (!selectedMap.has(cid)) selectedMap.set(cid, []);
    selectedMap.get(cid).push(sid);
    allServiceIds.add(sid);
  }

  let svcById = new Map();
  if (allServiceIds.size) {
    const allSvcs = await TariffService.findAll({ where: { id: [...allServiceIds] } });
    svcById = new Map(allSvcs.map((s) => [Number(s.id), s]));
  }

  const servicesMap = {};
  for (const c of combos) {
    const ids = selectedMap.get(Number(c.id)) || [];
    servicesMap[Number(c.id)] = ids.filter((sid) => svcById.has(sid)).map((sid) => svcById.get(sid));
  }

  return { combos, servicesMap };
}

module.exports = {
  createTariffService,
  getTariffServiceById,
  updateTariffService,
  deactivateTariffService,
  deleteTariffService,
  getActiveTariffServices,
  createComboService,
  getComboService,
  updateComboService,
  deactivateComboService,
  getComboServices,
  getCombo,
  createCombo,
  updateCombo,
  deleteCombo,
  getComboWithServices,
  getCombosWithServices,
  tariffToConnectedDict,
};
