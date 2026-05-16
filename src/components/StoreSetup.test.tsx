import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LanguageProvider } from "@/i18n/LanguageContext";

import StoreSetup from "./StoreSetup";

describe("StoreSetup", () => {
  it("builds a slug from the store name and location on submit", () => {
    const onComplete = vi.fn();

    render(
      <LanguageProvider>
        <StoreSetup onComplete={onComplete} />
      </LanguageProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText("Ravi Kumar"), {
      target: { value: "Ravi Kumar" },
    });
    fireEvent.change(screen.getByPlaceholderText("+91 9876543210"), {
      target: { value: "+91 9999999999" },
    });
    fireEvent.change(screen.getByPlaceholderText("Ravi's Boutique"), {
      target: { value: "Ravi's Boutique" },
    });
    fireEvent.change(screen.getByPlaceholderText("Mumbai, India"), {
      target: { value: "Hyderabad" },
    });
    fireEvent.change(screen.getByPlaceholderText("Shop #12"), {
      target: { value: "12A" },
    });
    fireEvent.change(screen.getByPlaceholderText("What do you sell? Tell your customers what makes your store special..."), {
      target: { value: "Festival collection" },
    });

    fireEvent.submit(screen.getByRole("button", { name: /create/i }).closest("form")!);

    expect(onComplete).toHaveBeenCalledWith({
      full_name: "Ravi Kumar",
      store_name: "Ravi's Boutique",
      store_slug: "ravi-s-boutique-hyderabad",
      location: "Hyderabad",
      store_description: "Festival collection",
      contact_number: "+91 9999999999",
      store_number: "12A",
    });
  });
});
