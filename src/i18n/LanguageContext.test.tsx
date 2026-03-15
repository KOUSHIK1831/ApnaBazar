import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LanguageProvider, useLanguage } from "./LanguageContext";
import { getTranslation } from "./translations";

function TestConsumer() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div>
      <span data-testid="language">{language}</span>
      <span>{t("common.save")}</span>
      <button onClick={() => setLanguage("te")}>Switch</button>
    </div>
  );
}

describe("LanguageContext", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("throws when useLanguage is used outside the provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow(
      "useLanguage must be used within a LanguageProvider",
    );

    spy.mockRestore();
  });

  it("hydrates the saved language from localStorage", () => {
    window.localStorage.setItem("apnabazar-lang", "hi");

    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>,
    );

    expect(screen.getByTestId("language")).toHaveTextContent("hi");
    expect(screen.getByText(getTranslation("common.save", "hi"))).toBeInTheDocument();
  });

  it("updates the language and persists it", () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Switch" }));

    expect(screen.getByTestId("language")).toHaveTextContent("te");
    expect(screen.getByText(getTranslation("common.save", "te"))).toBeInTheDocument();
    expect(window.localStorage.getItem("apnabazar-lang")).toBe("te");
  });
});
