import React from "react";
import { Container } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import Staffentrylogs from "./Staff Entry/staffentrylogs";
import UserActionLogs from "./UserActionLogs";
import SalesRevanue from "./SalesRevanue";
import Lost from "./Lost";
import Eligibleticket from "./Eligibleticket";
import GatesConnectivity from "./GatesConnectivity";
import BlacklistCard from "./BlacklistCard";
import TicketEntryReport from "./TicketEntryReport";
const LogsLayout = () => {
  return (
    <Container fluid className="mt-4">
      <TicketEntryReport/>
      {/* Staff Entry / Exit Logs */}
      <Staffentrylogs/>
      {/* User Action Logs */}
         <UserActionLogs/>
      {/* Sales & Revenue */}
         <SalesRevanue/>
      {/* Lost Tickets */}
     <Lost/>

      {/* Eligible Tickets */}
     <Eligibleticket/>

      {/* Gates Connectivity Logs */}
   <GatesConnectivity/>

      {/* Blacklist Card & Tickets */}
    <BlacklistCard/>
    </Container>
  );
};

export default LogsLayout;
