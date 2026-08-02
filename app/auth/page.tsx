"use client";

import { loginSchema, signupSchema } from "@/app/lib/validationSchema";
import { useState, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { HustleBuddyLogo } from "../components/ui/HustleBuddyLogo";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#000000]" />}>
      <AuthContent />
    </Suspense>
  );
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isSignupMode = searchParams.get("mode") === "signup";
  const [isLogin, setIsLogin] = useState(!isSignupMode);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

    const endpoint = isLogin
      ? `${baseUrl}/api/auth/login`
      : `${baseUrl}/api/auth/signup`;

    const payload = isLogin
      ? { email: formData.email, password: formData.password }
      : formData;

    const schema = isLogin ? loginSchema : signupSchema;
    const validation = schema.safeParse(payload);

    if (!validation.success) {
      setError(validation.error.issues[0].message);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.status !== 200) {
        if (data.response === "the email already exists") {
          throw new Error(
            data.message || "An account with this email already exists.",
          );
        }
        if (response.status === 400) {
          throw new Error(data.response[0] || "Invalid input");
        }
        if (response.status === 401) {
          throw new Error(
            data.response || "Invalid email or password. Please try again.",
          );
        }
        if (response.status === 500) {
          throw new Error(
            data.response || "Internal server error. Please try again later.",
          );
        } else {
          throw new Error(
            data.message || "Authentication failed. Please try again.",
          );
        }
      }
      if (isLogin) {
        // If user logged in, save the token
        localStorage.setItem("token", data.token);
        router.push("/dashboard");
      } else {
        // If user just signed up
        // Switch the UI to the Login mode so they can sign in with their new account!
        alert("Account created successfully! Please log in.");
        setIsLogin(true);
        setFormData((prev) => ({ ...prev, password: "" }));
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete("mode");
        router.replace(`?${newParams.toString()}`, { scroll: false });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-[#000000] p-4 overflow-hidden text-slate-200">
      <DecorativeBackgrounds />

      <button
        onClick={() => router.push("/")}
        className="absolute top-8 left-8 text-sm font-medium text-slate-500 hover:text-white transition-colors flex items-center gap-2 group z-20"
      >
        <span className="group-hover:-translate-x-1 transition-transform">
          ←
        </span>
        Back
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[420px] p-8 rounded-[28px] border border-white/10 bg-[#050505] shadow-[0_0_80px_rgba(0,0,0,0.8)] relative z-10"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center rounded-xl text-white mb-5 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
            <HustleBuddyLogo className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-medium tracking-tight text-white mb-2">
            {isLogin ? "Welcome back" : "Create an account"}
          </h1>
          <p className="text-sm text-slate-500 font-light">
            {isLogin
              ? "Enter your details to access your dashboard."
              : "Start automating your job applications today."}
          </p>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          <SocialButton
            icon={<ColorfulGoogleIcon />}
            text="Continue with Google"
          />
          <SocialButton icon={<GitHubIcon />} text="Continue with GitHub" />
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">
            Or
          </span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Backend Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit}
          noValidate
        >
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="pb-1">
                  <InputField
                    label="Full Name"
                    name="name"
                    type="text"
                    placeholder="Aayush Singh"
                    value={formData.name}
                    onChange={handleChange}
                    required={!isLogin}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <InputField
            label="Email Address"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <InputField
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Your password"
            value={formData.password}
            onChange={handleChange}
            required
            rightElement={
              isLogin && (
                <a
                  href="#"
                  className="text-xs text-slate-500 hover:text-white transition-colors"
                >
                  Forgot password?
                </a>
              )
            }
            suffix={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-white transition-colors p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            }
          />

          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="pb-1 flex items-center text-center">
                  <p className="text-xs text-slate-500 font-light">
                    Must be 8+ characters with uppercase, lowercase, number, and
                    special symbol
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 h-11 w-full bg-white text-black text-sm font-semibold rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {isLoading && (
              <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            )}
            {isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => {
              const nextState = !isLogin;
              setIsLogin(nextState);
              setError(null);
              const newParams = new URLSearchParams(searchParams.toString());
              if (nextState) {
                newParams.delete("mode");
              } else {
                newParams.set("mode", "signup");
              }
              router.replace(`?${newParams.toString()}`, { scroll: false });
            }}
            className="text-white font-medium hover:underline underline-offset-4 transition-all"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

//helper components

const InputField = ({
  label,
  name,
  type,
  placeholder,
  value,
  onChange,
  required,
  rightElement,
  suffix,
}: any) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <label className="text-xs font-medium text-slate-400">{label}</label>
      {rightElement}
    </div>

    <div className="relative">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="h-11 w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 pr-10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all"
      />

      {suffix && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
          {suffix}
        </div>
      )}
    </div>
  </div>
);

const SocialButton = ({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) => (
  <button className="h-11 w-full bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 rounded-xl flex items-center justify-center gap-3 text-sm font-medium transition-all group">
    {icon}
    <span className="text-slate-300 group-hover:text-white transition-colors">
      {text}
    </span>
  </button>
);

const DecorativeBackgrounds = () => (
  <>
    <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-full max-w-3xl h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.07] via-transparent to-transparent blur-[80px] pointer-events-none" />
    <div className="absolute bottom-0 left-0 w-64 h-64 bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_100%_100%_at_bottom_left,black,transparent)] pointer-events-none opacity-50" />
    <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_100%_100%_at_top_right,black,transparent)] pointer-events-none opacity-50" />
  </>
);

// ============================================================================
// Icons
// ============================================================================

// The Official Colorful Google 'G' Logo
const ColorfulGoogleIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const GitHubIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="currentColor"
    className="text-white"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);
