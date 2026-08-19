import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoute/ProtectedRoute";
import Sidebar from "../Sidebar/Sidebar";

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(
    "roles",
    JSON.stringify([{ name: "Operator", permissions: ["manage_tickets"] }])
  );
});

test("hides unauthorized sidebar modules and keeps authorized ticket links", () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Sidebar sidebarOpen toggleSidebar={() => {}} />
    </MemoryRouter>
  );

  expect(screen.queryByText("User Management")).not.toBeInTheDocument();
  expect(screen.queryByText("Shift Management")).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /tickets/i }));
  expect(screen.getByText("Generate Ticket")).toBeInTheDocument();
  expect(screen.getByText("Manage Tickets")).toBeInTheDocument();
  expect(screen.queryByText("FOC Reasons")).not.toBeInTheDocument();
});

test("blocks direct navigation to a screen without its permission", () => {
  render(
    <MemoryRouter
      initialEntries={["/user-management"]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route
          path="/user-management"
          element={
            <ProtectedRoute isLoggedIn permissions={["manage_users"]}>
              <div>User management content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/unauthorized" element={<div>Access denied</div>} />
      </Routes>
    </MemoryRouter>
  );

  expect(screen.getByText("Access denied")).toBeInTheDocument();
  expect(screen.queryByText("User management content")).not.toBeInTheDocument();
});
