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
    signInMock.mockResolvedValue({ error: null });
    const onSuccess = vi.fn();

    render(
      <BuyerAuthModal isOpen onClose={vi.fn()} onSuccess={onSuccess} storeName="Test Store" />,
    );

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "buyer@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "secret123" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "auth.signIn" }).closest("form")!);

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith("buyer@example.com", "secret123");
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("shows auth errors and supports switching to sign up", async () => {
    signUpMock.mockResolvedValue({ error: { message: "Already exists" } });

    render(
      <BuyerAuthModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "auth.noAccount" }));
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "buyer@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "secret123" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "auth.signUp" }).closest("form")!);

    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalled();
      expect(screen.getByText("Already exists")).toBeInTheDocument();
    });
  });
});
