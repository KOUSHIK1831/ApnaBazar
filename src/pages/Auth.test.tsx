import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Auth from "./Auth";

const {
  signInMock,
  signUpMock,
  toastMock,
  navigateMock,
} = vi.hoisted(() => ({
  signInMock: vi.fn(),
  signUpMock: vi.fn(),
  toastMock: vi.fn(),
  navigateMock: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    signIn: signInMock,
    signUp: signUpMock,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@/components/LanguageSwitcher", () => ({
  default: () => <div>LanguageSwitcher</div>,
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/i18n/LanguageContext", () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

describe("Auth page", () => {
  it("signs in and navigates to the dashboard", async () => {
    signInMock.mockResolvedValue({ error: null });

    render(<Auth />);

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "seller@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "secret123" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "auth.signIn" }).closest("form")!);

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith("seller@example.com", "secret123");
      expect(navigateMock).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows a toast on sign-in error", async () => {
    signInMock.mockResolvedValue({ error: { message: "Invalid login" } });

    render(<Auth />);
    fireEvent.submit(screen.getByRole("button", { name: "auth.signIn" }).closest("form")!);

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Error",
          description: "Invalid login",
          variant: "destructive",
        }),
      );
    });
  });

  it("switches to sign-up mode and shows the confirmation toast", async () => {
    signUpMock.mockResolvedValue({ error: null });

    render(<Auth />);

    fireEvent.click(screen.getByRole("button", { name: "auth.noAccount" }));
    fireEvent.submit(screen.getByRole("button", { name: "auth.signUp" }).closest("form")!);

    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalled();
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Account created" }),
      );
    });
  });
});
