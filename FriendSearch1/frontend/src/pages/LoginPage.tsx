import { useState, type FormEvent } from "react";
import { useAuth } from "../context/authcontext";
import { authApi } from "../api/client";
import type { LoginPayload, RegisterPayload } from "../types";
import Input from "../components/ui/input";
import Button from "../components/ui/button";
import styles from "../styles/Loginpage.module.css";

type Mode = "login" | "register";

export default function LoginPage() {
  const { login } = useAuth();
  const [mode, setMode]     = useState<Mode>("login");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    username: "", display_name: "", email: "", password: "", bio: "",
  });

  const set = (key: keyof typeof form, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        const payload: LoginPayload = {
          username: form.username,
          password: form.password,
        };
        const { user, token } = await authApi.login(payload);
        login(token, user);
      } else {
        const payload: RegisterPayload = {
          username:     form.username,
          display_name: form.display_name,
          email:        form.email,
          password:     form.password,
          bio:          form.bio,
        };
        const { user, token } = await authApi.register(payload);
        login(token, user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.root}>
      {/* Background decoration */}
      <div className={styles.bgOrb1} />
      <div className={styles.bgOrb2} />
      <div className={styles.gridLines} />

      <div className={`${styles.card} fade-up`}>
        {/* Logo */}
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⬡</span>
          <span className={styles.logoText}>FriendSearch</span>
        </div>
        <p className={styles.sub}>DSA Group Project · Theme A5</p>

        {/* Mode tabs */}
        <div className={styles.tabs}>
          {(["login", "register"] as Mode[]).map((m) => (
            <button
              key={m}
              className={`${styles.tab} ${mode === m ? styles.tabActive : ""}`}
              onClick={() => { setMode(m); setError(""); }}
            >
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Username"
            placeholder="e.g. alice"
            value={form.username}
            onChange={(e) => set("username", e.target.value)}
            required
            autoFocus
          />

          {mode === "register" && (
            <>
              <Input
                label="Display Name"
                placeholder="Alice Mwangi"
                value={form.display_name}
                onChange={(e) => set("display_name", e.target.value)}
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="alice@example.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
              />
            </>
          )}

          <Input
            label="Password"
            type="password"
            placeholder={mode === "login" ? "Your password" : "Min 6 characters"}
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            required
          />

          {mode === "register" && (
            <Input
              label="Bio"
              placeholder="Tell people about yourself (optional)"
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
            />
          )}

          {error && <p className={styles.error}>{error}</p>}

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={loading}
          >
            {mode === "login" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        {mode === "login" && (
          <p className={styles.hint}>
            Demo accounts: alice, bob, carol, dave, eve, frank, grace, henry, irene, james
            <br />
            Password: <strong>demo1234</strong>
          </p>
        )}
      </div>
    </div>
  );
}