import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import LanguageSwitcher from "./LanguageSwitcher";

const { setLanguageMock } = vi.hoisted(() => ({
  setLanguageMock: vi.fn(),
}));

vi.mock("@/i18n/LanguageContext", () => ({
  useLanguage: () => ({
    language: "en",
    setLanguage: setLanguageMock,
  }),
}));

describe("LanguageSwitcher", () => {
  it("opens the menu and switches the selected language", () => {
    render(<LanguageSwitcher />);

    fireEvent.click(screen.getByRole("button", { name: /switch language/i }));
    fireEvent.click(screen.getByRole("button", { name: /తెలుగు/i }));

    expect(setLanguageMock).toHaveBeenCalledWith("te");
  });

  it("closes when clicking outside", () => {
    render(<LanguageSwitcher />);

    fireEvent.click(screen.getByRole("button", { name: /switch language/i }));
    expect(screen.getByText("English")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByText("English")).not.toBeInTheDocument();
  });
});
