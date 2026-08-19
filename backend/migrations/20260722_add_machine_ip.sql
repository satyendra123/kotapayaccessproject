ALTER TABLE gate_machines
  ADD COLUMN machine_ip VARCHAR(45) NOT NULL AFTER machine_name;
