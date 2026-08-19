const asyncHandler = require("../utils/asyncHandler");
const tariffService = require("../services/tariff.service");
const { HttpError } = require("../middleware/error.middleware");

function tariffOut(t, shiftname = null) {
  return {
    id: t.id,
    servicename: t.servicename,
    shift_id: t.shiftId,
    shiftname,
    servicefor: t.servicefor,
    price: t.price,
    status: t.status,
    discountedprice: t.discountedprice,
  };
}

function comboServiceOut(c) {
  return {
    id: c.id,
    combo_service: c.comboService,
    shift_id: c.shiftId,
    shiftname: c.shift ? c.shift.shiftname : null,
    price: c.price,
    status: c.status,
    discountedprice: c.discountedprice,
  };
}

function serviceToDict(s) {
  const servicename = s.servicename || "";
  return {
    id: Number(s.id || 0),
    servicename,
    price: Number(s.price || 0),
    discountedprice: s.discountedprice != null ? Number(s.discountedprice) : null,
    servicefor: s.servicefor || "",
    shift_id: s.shiftId,
    status: s.status || "Active",
  };
}

const createTariff = asyncHandler(async (req, res) => {
  const obj = await tariffService.createTariffService(req.body);
  res.json(tariffOut(obj));
});

const listTariffs = asyncHandler(async (req, res) => {
  const data = await tariffService.getActiveTariffServices();
  res.json(data.map(({ tariff, shift }) => tariffOut(tariff, shift ? shift.shiftname : null)));
});

const getTariff = asyncHandler(async (req, res) => {
  const tariff = await tariffService.getTariffServiceById(Number(req.params.tariffId));
  if (!tariff) throw new HttpError(404, "Tariff service not found");
  res.json(tariffOut(tariff));
});

const updateTariff = asyncHandler(async (req, res) => {
  const updated = await tariffService.updateTariffService(Number(req.params.tariffId), req.body);
  if (!updated) throw new HttpError(404, "Tariff service not found");
  res.json(tariffOut(updated));
});

const deactivateTariff = asyncHandler(async (req, res) => {
  await tariffService.deactivateTariffService(Number(req.params.tariffId));
  res.json({ message: "Tariff service deactivated!" });
});

const deleteTariff = asyncHandler(async (req, res) => {
  const message = await tariffService.deleteTariffService(Number(req.params.tariffId));
  res.json({ message });
});

const createComboServiceRoute = asyncHandler(async (req, res) => {
  const obj = await tariffService.createComboService(req.body);
  res.json(comboServiceOut(obj));
});

const listComboServices = asyncHandler(async (req, res) => {
  const rows = await tariffService.getComboServices();
  res.json(rows.map(comboServiceOut));
});

const getComboServiceRoute = asyncHandler(async (req, res) => {
  const comboService = await tariffService.getComboService(Number(req.params.comboServiceId));
  if (!comboService) throw new HttpError(404, "Combo service not found");
  res.json(comboServiceOut(comboService));
});

const updateComboServiceRoute = asyncHandler(async (req, res) => {
  const updated = await tariffService.updateComboService(Number(req.params.comboServiceId), req.body);
  if (!updated) throw new HttpError(404, "Combo service not found");
  res.json(comboServiceOut(updated));
});

const deactivateComboServiceRoute = asyncHandler(async (req, res) => {
  await tariffService.deactivateComboService(Number(req.params.comboServiceId));
  res.json({ message: "Combo service deactivated!" });
});

const createComboRoute = asyncHandler(async (req, res) => {
  const created = await tariffService.createCombo(req.body, (req.user && req.user.id) || 1);
  const connectedOut = created.connected_services || [];
  const selectedIds = created.selectedservices || connectedOut.map((s) => s.id);

  res.json({
    id: created.id,
    comboname: created.comboname || "",
    actual_price: Number(created.actual_price || 0),
    discount_price: Number(created.discount_price || 0.0),
    status: created.status || "Active",
    selectedservices: selectedIds,
    connected_services: connectedOut,
    services: created.services || connectedOut.map((s) => ({ id: s.id, servicename: s.servicename })),
  });
});

const listCombosRoute = asyncHandler(async (req, res) => {
  const { combos, servicesMap } = await tariffService.getCombosWithServices();

  const out = combos.map((c) => {
    const connected = servicesMap[Number(c.id)] || [];
    const connectedOut = connected.map(serviceToDict);
    return {
      id: Number(c.id),
      comboname: c.comboname || "",
      actual_price: Number(c.actualPrice || 0),
      discount_price: Number(c.discountPrice || 0.0),
      status: c.status || "Active",
      selectedservices: connectedOut.map((s) => s.id),
      connected_services: connectedOut,
      services: connectedOut.map((s) => ({ id: s.id, servicename: s.servicename })),
    };
  });

  res.json(out);
});

const getComboRoute = asyncHandler(async (req, res) => {
  const combo = await tariffService.getComboWithServices(Number(req.params.comboId));
  if (!combo) throw new HttpError(404, "Combo not found");
  res.json(combo);
});

const updateComboRoute = asyncHandler(async (req, res) => {
  const updated = await tariffService.updateCombo(Number(req.params.comboId), req.body);
  if (!updated) throw new HttpError(404, "Combo not found");
  res.json(updated);
});

const deleteComboRoute = asyncHandler(async (req, res) => {
  await tariffService.deleteCombo(Number(req.params.comboId));
  res.json({ message: "Combo deleted!" });
});

module.exports = {
  createTariff,
  listTariffs,
  getTariff,
  updateTariff,
  deactivateTariff,
  deleteTariff,
  createComboServiceRoute,
  listComboServices,
  getComboServiceRoute,
  updateComboServiceRoute,
  deactivateComboServiceRoute,
  createComboRoute,
  listCombosRoute,
  getComboRoute,
  updateComboRoute,
  deleteComboRoute,
};
