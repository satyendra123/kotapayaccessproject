const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/dbconnection");

const User = require("./user.model")(sequelize, DataTypes);
const Role = require("./role.model")(sequelize, DataTypes);
const Permission = require("./permission.model")(sequelize, DataTypes);
const UserRole = require("./userRole.model")(sequelize, DataTypes);
const RolePermission = require("./rolePermission.model")(sequelize, DataTypes);
const UserRefreshToken = require("./userRefreshToken.model")(sequelize, DataTypes);
const PasswordResetToken = require("./passwordResetToken.model")(sequelize, DataTypes);

const AccessQualification = require("./accessQualification.model")(sequelize, DataTypes);
const RegisteredUser = require("./registeredUser.model")(sequelize, DataTypes);
const QualificationRightsPermission = require("./qualificationRightsPermission.model")(sequelize, DataTypes);

const ApplicationSettings = require("./applicationSettings.model")(sequelize, DataTypes);

const Gate = require("./gate.model")(sequelize, DataTypes);
const GateMachine = require("./gateMachine.model")(sequelize, DataTypes);

const Guest = require("./guest.model")(sequelize, DataTypes);
const GuestCard = require("./guestCard.model")(sequelize, DataTypes);

const MachineActionLog = require("./machineActionLog.model")(sequelize, DataTypes);
const AlarmLog = require("./alarmLog.model")(sequelize, DataTypes);

const TicketMovementLog = require("./ticketMovementLog.model")(sequelize, DataTypes);

const StaffEntryExitLog = require("./staffEntryExitLog.model")(sequelize, DataTypes);
const UserActionLog = require("./userActionLog.model")(sequelize, DataTypes);
const GateConnectivityLog = require("./gateConnectivityLog.model")(sequelize, DataTypes);
const BlacklistEntry = require("./blacklistEntry.model")(sequelize, DataTypes);

const Shift = require("./shift.model")(sequelize, DataTypes);

const StaffCategory = require("./staffCategory.model")(sequelize, DataTypes);
const Staff = require("./staff.model")(sequelize, DataTypes);

const SubscriptionCard = require("./subscriptionCard.model")(sequelize, DataTypes);
const SubscriptionCardRechargeLog = require("./subscriptionCardRechargeLog.model")(sequelize, DataTypes);

const SupportQuery = require("./supportQuery.model")(sequelize, DataTypes);

const TariffService = require("./tariffService.model")(sequelize, DataTypes);
const ComboService = require("./comboService.model")(sequelize, DataTypes);
const ConnectedServiceWithCombo = require("./connectedServiceWithCombo.model")(sequelize, DataTypes);

const CustomerTicket = require("./customerTicket.model")(sequelize, DataTypes);
const CustomerService = require("./customerService.model")(sequelize, DataTypes);
const CustomerCombo = require("./customerCombo.model")(sequelize, DataTypes);
const Combo = require("./combo.model")(sequelize, DataTypes);
const Reason = require("./reason.model")(sequelize, DataTypes);
const LostTicket = require("./lostTicket.model")(sequelize, DataTypes);
const EligibleTicket = require("./eligibleTicket.model")(sequelize, DataTypes);

// ---------------------------------------------------------------------------
// Associations (mirrors app/models/*.py relationships + FK ondelete clauses)
// ---------------------------------------------------------------------------

// Auth / RBAC
User.hasMany(UserRole, { foreignKey: "userId", as: "roles", onDelete: "CASCADE" });
UserRole.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(UserRefreshToken, { foreignKey: "userId", as: "refreshTokens", onDelete: "CASCADE" });
UserRefreshToken.belongsTo(User, { foreignKey: "userId", as: "user" });

Role.hasMany(UserRole, { foreignKey: "roleId", as: "users", onDelete: "CASCADE" });
UserRole.belongsTo(Role, { foreignKey: "roleId", as: "role" });

Role.hasMany(RolePermission, { foreignKey: "roleId", as: "permissions", onDelete: "CASCADE" });
RolePermission.belongsTo(Role, { foreignKey: "roleId", as: "role" });

Permission.hasMany(RolePermission, { foreignKey: "permissionId", as: "roles", onDelete: "CASCADE" });
RolePermission.belongsTo(Permission, { foreignKey: "permissionId", as: "permission" });

// User management
AccessQualification.hasMany(RegisteredUser, { foreignKey: "accessQualificationId", as: "users" });
RegisteredUser.belongsTo(AccessQualification, { foreignKey: "accessQualificationId", as: "accessQualification" });

AccessQualification.hasOne(QualificationRightsPermission, {
  foreignKey: "accessQualificationId",
  as: "rightsPermission",
  onDelete: "CASCADE",
});
QualificationRightsPermission.belongsTo(AccessQualification, {
  foreignKey: "accessQualificationId",
  as: "accessQualification",
});

// Gates
Gate.hasMany(GateMachine, { foreignKey: "gateId", as: "machines", onDelete: "CASCADE" });
GateMachine.belongsTo(Gate, { foreignKey: "gateId", as: "gate" });

// Guests
Guest.hasMany(GuestCard, { foreignKey: "guestid", as: "cards", onDelete: "CASCADE" });
GuestCard.belongsTo(Guest, { foreignKey: "guestid", as: "guest" });

// Live logs
MachineActionLog.belongsTo(GateMachine, { foreignKey: "machineId", as: "machine" });
MachineActionLog.belongsTo(Gate, { foreignKey: "gateId", as: "gate" });

// Park access
TicketMovementLog.belongsTo(CustomerTicket, { foreignKey: "ticketId", as: "ticket" });
TicketMovementLog.belongsTo(Gate, { foreignKey: "gateId", as: "gate" });
TicketMovementLog.belongsTo(GateMachine, { foreignKey: "machineId", as: "machine" });

// Report logs
StaffEntryExitLog.belongsTo(Staff, { foreignKey: "staffId", as: "staff" });
StaffEntryExitLog.belongsTo(Gate, { foreignKey: "gateId", as: "gate" });
StaffEntryExitLog.belongsTo(GateMachine, { foreignKey: "machineId", as: "machine" });

UserActionLog.belongsTo(RegisteredUser, { foreignKey: "userId", as: "user" });

GateConnectivityLog.belongsTo(Gate, { foreignKey: "gateId", as: "gate" });
GateConnectivityLog.belongsTo(GateMachine, { foreignKey: "machineId", as: "machine" });

// Shifts (no DB-level ondelete cascade in the original schema - deleting a shift with
// related tariffs/tickets must be blocked/handled explicitly at the service layer)
Shift.hasMany(TariffService, { foreignKey: "shiftId", as: "tariffServices" });
TariffService.belongsTo(Shift, { foreignKey: "shiftId", as: "shift" });

Shift.hasMany(CustomerTicket, { foreignKey: "shiftId", as: "tickets" });
CustomerTicket.belongsTo(Shift, { foreignKey: "shiftId", as: "shift" });

Shift.hasMany(ComboService, { foreignKey: "shiftId", as: "comboServices", onDelete: "CASCADE" });
ComboService.belongsTo(Shift, { foreignKey: "shiftId", as: "shift" });

// Staff
StaffCategory.hasMany(Staff, { foreignKey: "staffCategoryId", as: "staffs" });
Staff.belongsTo(StaffCategory, { foreignKey: "staffCategoryId", as: "category" });

// Subscription cards
SubscriptionCard.hasMany(SubscriptionCardRechargeLog, { foreignKey: "subscriptioncardsid", as: "logs" });
SubscriptionCardRechargeLog.belongsTo(SubscriptionCard, { foreignKey: "subscriptioncardsid", as: "card" });

// Tariff & combos
TariffService.hasMany(CustomerService, { foreignKey: "serviceId", as: "customerServices" });
CustomerService.belongsTo(TariffService, { foreignKey: "serviceId", as: "service" });

ConnectedServiceWithCombo.belongsTo(Combo, { foreignKey: "comboid", as: "combo" });
Combo.hasMany(ConnectedServiceWithCombo, { foreignKey: "comboid", as: "connectedServices" });
ConnectedServiceWithCombo.belongsTo(TariffService, { foreignKey: "connectedSerID", as: "service" });

// Ticketing
CustomerTicket.hasMany(CustomerService, { foreignKey: "customerId", as: "services", onDelete: "CASCADE" });
CustomerService.belongsTo(CustomerTicket, { foreignKey: "customerId", as: "ticket" });

CustomerTicket.hasMany(CustomerCombo, { foreignKey: "customerId", as: "combos", onDelete: "CASCADE" });
CustomerCombo.belongsTo(CustomerTicket, { foreignKey: "customerId", as: "ticket" });

Combo.hasMany(CustomerCombo, { foreignKey: "comboId", as: "customerCombos" });
CustomerCombo.belongsTo(Combo, { foreignKey: "comboId", as: "combo" });

CustomerTicket.hasOne(EligibleTicket, { foreignKey: "ticketId", as: "eligibleTicket", onDelete: "CASCADE" });
EligibleTicket.belongsTo(CustomerTicket, { foreignKey: "ticketId", as: "ticket" });

CustomerTicket.hasMany(LostTicket, { foreignKey: "ticketId", as: "lostTickets", onDelete: "CASCADE" });
LostTicket.belongsTo(CustomerTicket, { foreignKey: "ticketId", as: "ticket" });

module.exports = {
  sequelize,
  User,
  Role,
  Permission,
  UserRole,
  RolePermission,
  UserRefreshToken,
  PasswordResetToken,
  AccessQualification,
  RegisteredUser,
  QualificationRightsPermission,
  ApplicationSettings,
  Gate,
  GateMachine,
  Guest,
  GuestCard,
  MachineActionLog,
  AlarmLog,
  TicketMovementLog,
  StaffEntryExitLog,
  UserActionLog,
  GateConnectivityLog,
  BlacklistEntry,
  Shift,
  StaffCategory,
  Staff,
  SubscriptionCard,
  SubscriptionCardRechargeLog,
  SupportQuery,
  TariffService,
  ComboService,
  ConnectedServiceWithCombo,
  CustomerTicket,
  CustomerService,
  CustomerCombo,
  Combo,
  Reason,
  LostTicket,
  EligibleTicket,
};
