import { LoginForm } from "./login-form";

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/";
  const initialTab = sp.tab === "signup" ? "signup" : "login";
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-green-950/10 bg-white p-8">
      <h1 className="font-display text-3xl font-medium text-green-950">Welcome</h1>
      <p className="mb-6 mt-1 text-stone-500">Log in or create an account to order and track deliveries.</p>
      {sp.reset === "1" && (
        <p role="status" className="mb-4 rounded-xl bg-green-100 p-3 text-sm font-medium text-green-900">
          ✓ Your password was changed. Please log in with the new one.
        </p>
      )}
      <LoginForm next={next} initialTab={initialTab} />
    </div>
  );
}
