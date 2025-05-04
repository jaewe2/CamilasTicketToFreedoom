// src/Register.jsx
import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Register.css";

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const RegisterSchema = Yup.object().shape({
    email: Yup.string().email("Invalid email").required("Required"),
    password: Yup.string().min(6, "Min 6 characters").required("Required"),
    confirmPassword: Yup.string()
      .required("Required")
      .oneOf([Yup.ref("password"), null], "Passwords must match"),
  });

  const handleRegister = async (values, { setSubmitting }) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const token = await userCredential.user.getIdToken();
      localStorage.setItem("token", token);

      const response = await fetch("http://127.0.0.1:8000/api/verify-token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Registration successful!", {
          className: "custom-toast custom-toast-success",
          icon: "🎉",
        });
        navigate("/dashboard");
      } else {
        toast.error(`Token rejected: ${data.error}`, {
          className: "custom-toast custom-toast-error",
          icon: "⚠️",
        });
      }
    } catch (error) {
      toast.error(`Registration failed: ${error.message}`, {
        className: "custom-toast custom-toast-error",
        icon: "❌",
      });
    }

    setSubmitting(false);
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2 className="register-title">Register</h2>
        <Formik
          initialValues={{ email: "", password: "", confirmPassword: "" }}
          validationSchema={RegisterSchema}
          onSubmit={handleRegister}
        >
          {({ isSubmitting }) => (
            <Form>
              <Field className="register-input" type="email" name="email" placeholder="Email" />
              <ErrorMessage name="email" component="div" className="register-error" />

              <div className="register-password-group">
                <Field
                  className="register-input"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                />
                <span
                  className="register-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? "Hide" : "Show"}
                </span>
              </div>
              <ErrorMessage name="password" component="div" className="register-error" />

              <div className="register-password-group">
                <Field
                  className="register-input"
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                />
                <span
                  className="register-toggle"
                  onClick={() => setShowConfirm((prev) => !prev)}
                >
                  {showConfirm ? "Hide" : "Show"}
                </span>
              </div>
              <ErrorMessage name="confirmPassword" component="div" className="register-error" />

              <button className="register-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Registering..." : "Register"}
              </button>

              <p className="register-link">
                Already have an account? <Link to="/login">Log in here</Link>
              </p>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}

