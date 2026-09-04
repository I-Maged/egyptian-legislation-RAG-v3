import { render, screen } from "@testing-library/react";

import userEvent from "@testing-library/user-event";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { signIn, signUp } from "@/app/actions/auth";

import AuthForm from "./auth-form";

vi.mock("@/app/actions/auth", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

const mockedSignIn = vi.mocked(signIn);
const mockedSignUp = vi.mocked(signUp);

describe("AuthForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedSignIn.mockResolvedValue(null);
    mockedSignUp.mockResolvedValue(null);
  });

  it("shows the sign-in form (email + password only) by default", () => {
    render(<AuthForm />);

    expect(screen.getByLabelText("البريد الإلكتروني")).toBeInTheDocument();
    expect(screen.getByLabelText("كلمة المرور")).toBeInTheDocument();
    expect(screen.queryByLabelText("الاسم")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("الدور")).not.toBeInTheDocument();
  });

  it("switches to the sign-up form with name and role fields", async () => {
    const user = userEvent.setup();

    render(<AuthForm />);

    await user.click(screen.getByRole("tab", { name: "إنشاء حساب" }));

    expect(screen.getByLabelText("الاسم")).toBeInTheDocument();
    expect(screen.getByLabelText("الدور")).toBeInTheDocument();

    const roleSelect = screen.getByLabelText("الدور");

    expect(roleSelect).toHaveValue("");
    expect(roleSelect).toContainElement(
      screen.getByRole("option", { name: "مستخدم" }),
    );
    expect(roleSelect).toContainElement(
      screen.getByRole("option", { name: "مسؤول" }),
    );
  });

  it("marks every field as mandatory", async () => {
    const user = userEvent.setup();

    render(<AuthForm />);

    for (const label of ["البريد الإلكتروني", "كلمة المرور"]) {
      expect(screen.getByLabelText(label)).toBeRequired();
    }

    await user.click(screen.getByRole("tab", { name: "إنشاء حساب" }));

    for (const label of ["الاسم", "البريد الإلكتروني", "كلمة المرور", "الدور"]) {
      expect(screen.getByLabelText(label)).toBeRequired();
    }
  });

  it("blocks submission while sign-in fields are empty", async () => {
    const user = userEvent.setup();

    render(<AuthForm />);

    await user.click(screen.getByRole("button", { name: "دخول" }));

    expect(mockedSignIn).not.toHaveBeenCalled();
  });

  it("blocks submission while sign-up fields are empty", async () => {
    const user = userEvent.setup();

    render(<AuthForm />);
    await user.click(screen.getByRole("tab", { name: "إنشاء حساب" }));
    await user.click(screen.getByRole("button", { name: "إنشاء الحساب" }));

    expect(mockedSignUp).not.toHaveBeenCalled();
  });

  it("submits valid sign-in credentials", async () => {
    const user = userEvent.setup();

    render(<AuthForm />);

    await user.type(screen.getByLabelText("البريد الإلكتروني"), "a@b.com");
    await user.type(screen.getByLabelText("كلمة المرور"), "secret");
    await user.click(screen.getByRole("button", { name: "دخول" }));

    expect(mockedSignIn).toHaveBeenCalledTimes(1);

    const formData = mockedSignIn.mock.calls[0][1];

    expect(formData.get("email")).toBe("a@b.com");
    expect(formData.get("password")).toBe("secret");
  });

  it("displays server-side errors", async () => {
    mockedSignIn.mockResolvedValueOnce({
      error: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    });
    const user = userEvent.setup();

    render(<AuthForm />);

    await user.type(screen.getByLabelText("البريد الإلكتروني"), "a@b.com");
    await user.type(screen.getByLabelText("كلمة المرور"), "secret");
    await user.click(screen.getByRole("button", { name: "دخول" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    );
  });
});
