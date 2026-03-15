import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { NavLink } from "./NavLink";

describe("NavLink", () => {
  it("applies the active class when the route matches", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <NavLink
          to="/dashboard"
          className="base"
          activeClassName="active"
        >
          Dashboard
        </NavLink>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveClass("base", "active");
  });
});
