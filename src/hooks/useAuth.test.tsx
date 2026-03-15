import { render, screen, waitFor } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "./useAuth";

const {
  onAuthStateChangeMock,
  getSessionMock,
  signInWithPasswordMock,
  signUpMock,
  signOutMock,
  unsubscribeMock,
} = vi.hoisted(() => ({
  onAuthStateChangeMock: vi.fn(),
  getSessionMock: vi.fn(),
  signInWithPasswordMock: vi.fn(),
  signUpMock: vi.fn(),
  signOutMock: vi.fn(),
  unsubscribeMock: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      onAuthStateChange: onAuthStateChangeMock,
      getSession: getSessionMock,
      signInWithPassword: signInWithPasswordMock,
      signUp: signUpMock,
      signOut: signOutMock,
    },
  },
}));

function Consumer() {
  const { user, loading, signIn, signUp, signOut } = useAuth();

  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user?.email ?? "none"}</span>
      <button onClick={() => signIn("test@example.com", "secret123")}>sign in</button>
      <button onClick={() => signUp("test@example.com", "secret123")}>sign up</button>
      <button onClick={() => signOut()}>sign out</button>
    </div>
  );
}

describe("useAuth", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads the current session and exposes auth actions", async () => {
    onAuthStateChangeMock.mockReturnValue({
      data: { subscription: { unsubscribe: unsubscribeMock } },
    });
    getSessionMock.mockResolvedValue({
      data: { session: { user: { id: "user-1", email: "test@example.com" } } },
    });
    signInWithPasswordMock.mockResolvedValue({ error: null });
    signUpMock.mockResolvedValue({ error: null });
    signOutMock.mockResolvedValue({});

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
      expect(screen.getByTestId("user")).toHaveTextContent("test@example.com");
    });

    fireEvent.click(screen.getByRole("button", { name: "sign in" }));
    fireEvent.click(screen.getByRole("button", { name: "sign up" }));
    fireEvent.click(screen.getByRole("button", { name: "sign out" }));

    await waitFor(() => {
      expect(signInWithPasswordMock).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "secret123",
      });
      expect(signUpMock).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "secret123",
        options: { emailRedirectTo: window.location.origin },
      });
      expect(signOutMock).toHaveBeenCalled();
    });
  });

  it("throws when used outside the provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<Consumer />)).toThrow(
      "useAuth must be used within AuthProvider",
    );

    spy.mockRestore();
  });
});
