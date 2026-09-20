import { useState } from "react";
import type { FormEvent } from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
  User,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";


export default function Register() {
  const navigate = useNavigate();

  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");


    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }


    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }


    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }


    if (password !== confirmPassword) {
      setError(
        "Passwords do not match."
      );
      return;
    }


    try {

      setLoading(true);


      await register(
        name.trim(),
        email.trim(),
        password
      );


      navigate("/");


    } catch (error) {

      setError(
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again."
      );

    } finally {

      setLoading(false);

    }
  };


  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 py-10">

      <div className="w-full max-w-md">

        {/* Logo */}

        <div className="flex justify-center mb-8">

          <div className="flex items-center gap-3">

            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">

              <Sparkles
                size={22}
                className="text-white"
              />

            </div>

            <span className="text-2xl font-bold">
              NexaAI
            </span>

          </div>

        </div>


        {/* Card */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">

          <div className="text-center mb-8">

            <h1 className="text-2xl font-bold">
              Create your account
            </h1>

            <p className="text-slate-400 mt-2">
              Start building with NexaAI
            </p>

          </div>


          {/* Error */}

          {error && (

            <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">

              {error}

            </div>

          )}


          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* Name */}

            <div>

              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Full name
              </label>

              <div className="relative">

                <User
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Pranav Ashok"
                  autoComplete="name"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-white placeholder-slate-600 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />

              </div>

            </div>


            {/* Email */}

            <div>

              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Email
              </label>

              <div className="relative">

                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-white placeholder-slate-600 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />

              </div>

            </div>


            {/* Password */}

            <div>

              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Password
              </label>

              <div className="relative">

                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 py-3 pl-10 pr-12 text-white placeholder-slate-600 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>

            </div>


            {/* Confirm Password */}

            <div>

              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Confirm password
              </label>

              <div className="relative">

                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  id="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 py-3 pl-10 pr-12 text-white placeholder-slate-600 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>

            </div>


            {/* Register button */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading
                ? "Creating account..."
                : "Create account"}

            </button>

          </form>


          {/* Login */}

          <div className="mt-6 text-center text-sm text-slate-400">

            Already have an account?{" "}

            <Link
              to="/login"
              className="font-medium text-blue-400 hover:text-blue-300"
            >
              Sign in
            </Link>

          </div>

        </div>


        <p className="text-center text-xs text-slate-600 mt-6">
          © 2026 NexaAI. All rights reserved.
        </p>

      </div>

    </div>
  );
}