const { Guest, GuestCard } = require("../models");

function serializeGuest(guest) {
  return {
    id: guest.id,
    name: guest.name,
    gender: guest.gender,
    withmembers: guest.withmembers,
    phonenumber: guest.phonenumber,
    emailid: guest.emailid,
    status: guest.status,
    accesscardtype: guest.accesscardtype,
    aadharcard: guest.aadharcard,
    timezone_start: guest.timezoneStart,
    timezone_end: guest.timezoneEnd,
    accessgate: guest.accessgate,
    cardsconnected: guest.cardsconnected,
  };
}

function serializeGuestCard(card) {
  return { id: card.id, cardnumber: card.cardnumber };
}

async function createGuest(data) {
  const inputCards = data.input_cards || [];

  const newGuest = await Guest.create({
    name: data.name,
    gender: data.gender,
    withmembers: data.withmembers,
    phonenumber: data.phonenumber,
    emailid: data.emailid,
    status: data.status,
    accesscardtype: data.accesscardtype,
    aadharcard: data.aadharcard,
    timezoneStart: data.timezone_start,
    timezoneEnd: data.timezone_end,
    accessgate: data.accessgate,
    cardsconnected: inputCards.length,
  });

  for (const number of inputCards) {
    await GuestCard.create({ guestid: newGuest.id, cardnumber: number });
  }

  return serializeGuest(newGuest);
}

async function getAllGuests() {
  const guests = await Guest.findAll({ order: [["id", "DESC"]] });
  return guests.map(serializeGuest);
}

async function getGuestById(guestId) {
  const guest = await Guest.findByPk(guestId);
  return guest ? serializeGuest(guest) : null;
}

const FIELD_MAP = {
  name: "name",
  gender: "gender",
  withmembers: "withmembers",
  phonenumber: "phonenumber",
  emailid: "emailid",
  status: "status",
  accesscardtype: "accesscardtype",
  aadharcard: "aadharcard",
  timezone_start: "timezoneStart",
  timezone_end: "timezoneEnd",
  accessgate: "accessgate",
};

async function updateGuest(guestId, data) {
  const guest = await Guest.findByPk(guestId);
  if (!guest) {
    return null;
  }

  if (data.input_cards !== undefined) {
    const newCards = data.input_cards;
    await GuestCard.destroy({ where: { guestid: guest.id } });
    for (const number of newCards) {
      await GuestCard.create({ guestid: guest.id, cardnumber: number });
    }
    guest.cardsconnected = newCards.length;
  }

  for (const [key, modelField] of Object.entries(FIELD_MAP)) {
    if (data[key] !== undefined) {
      guest[modelField] = data[key];
    }
  }

  await guest.save();
  return serializeGuest(guest);
}

async function deactivateGuest(guestId) {
  const guest = await Guest.findByPk(guestId);
  if (!guest) {
    return null;
  }
  guest.status = "Deactive";
  await guest.save();
  return serializeGuest(guest);
}

async function deleteGuest(guestId) {
  const guest = await Guest.findByPk(guestId);
  if (!guest) {
    return false;
  }
  await GuestCard.destroy({ where: { guestid: guest.id } });
  await guest.destroy();
  return true;
}

async function deleteGuestCard(cardId) {
  const card = await GuestCard.findByPk(cardId);
  if (!card) {
    return false;
  }
  await card.destroy();
  return true;
}

async function listAllGuestCards() {
  const cards = await GuestCard.findAll();
  return cards.map(serializeGuestCard);
}

async function listGuestCardsByGuestId(guestId) {
  const cards = await GuestCard.findAll({ where: { guestid: guestId } });
  return cards.map(serializeGuestCard);
}

module.exports = {
  createGuest,
  getAllGuests,
  getGuestById,
  updateGuest,
  deactivateGuest,
  deleteGuest,
  deleteGuestCard,
  listAllGuestCards,
  listGuestCardsByGuestId,
};
