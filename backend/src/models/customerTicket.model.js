module.exports = (sequelize, DataTypes) => {
  const CustomerTicket = sequelize.define(
    "CustomerTicket",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      ticketGenFor: { type: DataTypes.STRING(50), allowNull: false, field: "ticket_gen_for" },
      ticketNumber: { type: DataTypes.STRING(50), allowNull: false, unique: true, field: "ticket_number" },
      customerName: { type: DataTypes.STRING(100), allowNull: false, field: "customer_name" },
      aadharNo: { type: DataTypes.STRING(20), allowNull: true, field: "aadhar_no" },
      mobileNo: { type: DataTypes.STRING(15), allowNull: false, field: "mobile_no" },
      noOfMembers: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, field: "no_of_members" },
      totalServicePrice: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0.0, field: "total_service_price" },
      totalComboPrices: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0.0, field: "total_combo_prices" },
      grandTotal: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0.0, field: "grand_total" },
      discount: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0.0 },
      isDiscountApplied: { type: DataTypes.STRING(10), allowNull: true, defaultValue: "No", field: "is_discount_applied" },
      howDiscountApplied: { type: DataTypes.STRING(50), allowNull: true, field: "how_discount_applied" },
      qrCode: { type: DataTypes.STRING(255), allowNull: false, field: "qr_code" },
      ticketGenDateTime: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "ticket_gen_date_time" },
      isTicketFreePaid: { type: DataTypes.STRING(10), allowNull: false, field: "is_ticket_free_paid" },
      focReason: { type: DataTypes.STRING(255), allowNull: true, field: "foc_reason" },
      ticketScanCount: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0, field: "ticket_scan_count" },
      shiftId: { type: DataTypes.INTEGER, allowNull: false, field: "shift_id" },
      ticketGeneratedShift: { type: DataTypes.STRING(100), allowNull: true, field: "ticket_generated_shift" },
      ticketScannedEntryAt: { type: DataTypes.STRING(100), allowNull: true, field: "ticket_scanned_entry_at" },
      ticketScannedExitAt: { type: DataTypes.STRING(100), allowNull: true, field: "ticket_scanned_exit_at" },
    },
    {
      tableName: "customerticket",
      timestamps: false,
      indexes: [
        { name: "ix_customerticket_gen_date", fields: ["ticket_gen_date_time"] },
        { name: "ix_customerticket_entry_at", fields: ["ticket_scanned_entry_at"] },
        { name: "ix_customerticket_exit_at", fields: ["ticket_scanned_exit_at"] },
        { name: "ix_customerticket_paid", fields: ["is_ticket_free_paid"] },
      ],
    }
  );

  return CustomerTicket;
};
