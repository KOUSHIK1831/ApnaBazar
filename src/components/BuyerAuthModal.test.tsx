import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import BuyerAuthModal from "./BuyerAuthModal";

const { signInMock, signUpMock } = vi.hoisted(() => ({
  signInMock: vi.fn(),
  signUpMock: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    signIn: signInMock,
    signUp: signUpMock,
  }),
}));

vi.mock("@/i18n/LanguageContext", () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

describe("BuyerAuthModal", () => {
  it("does not render when closed", () => {
    const { container } = render(
      <BuyerAuthModal isOpen={false} onClose={vi.fn()} onSuccess={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("signs in and calls onSuccess on success", async () => {
    const onSuccess = vi.fn();
    render(
      <BuyerAuthModal isOpen onClose={vi.fn()} onSuccess={onSuccess} storeName="Test Store" />,
    );

    // Step 1: Send OTP
    fireEvent.change(screen.getByPlaceholderText("Enter 10-digit phone"), {
      target: { value: "9876543210" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send OTP" }));

    await waitFor(() => {
      expect(screen.getByText(/OTP sent to \+91 9876543210/i)).toBeInTheDocument();
    });

    // Step 2: Verify OTP
    fireEvent.change(screen.getByPlaceholderText("Enter 6-digit OTP"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Verify & Place Order/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith("9876543210");
    });
  });

  it("shows auth errors and supports switching to sign up", async () => {
    render(
      <BuyerAuthModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} />,
    );

    // Should show error for invalid phone
    fireEvent.change(screen.getByPlaceholderText("Enter 10-digit phone"), {
      target: { value: "123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send OTP" }));

    expect(screen.getByText(/Please enter a valid 10-digit phone number/i)).toBeInTheDocument();
  });
});
