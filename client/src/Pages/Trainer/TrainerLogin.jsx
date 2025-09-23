import React, { useState } from "react";
import styles from "./TrainerLogin.module.css";
import { FaFlag } from "react-icons/fa6";
import axios from "axios";
import baseUrl from "../../baseUrl";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "react-toastify";

function TrainerLogin() {
    const navigate = useNavigate();
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [showOtpVerification, setShowOtpVerification] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotEmailError, setForgotEmailError] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [otpError, setOtpError] = useState("");
    const [newPasswordError, setNewPasswordError] = useState("");
    const [confirmPasswordError, setConfirmPasswordError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const [form, setForm] = useState({
        trainerEmail: "",
        password: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({
            ...form,
            [name]: value,
        });

        if (name === "trainerEmail") {
            if (!value) {
                setEmailError("Email is required.");
            } else if (!emailRegex.test(value)) {
                setEmailError("Please enter a valid email address.");
            } else {
                setEmailError("");
            }
        }

        if (name === "password") {
            if (!value) {
                setPasswordError("Password is required.");
            } else if (value.length < 6) {
                setPasswordError("Password must be at least 6 characters.");
            } else if (!/[A-Z]/.test(value)) {
                setPasswordError(
                    "Password must contain at least one uppercase letter."
                );
            } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
                setPasswordError(
                    "Password must contain at least one special character."
                );
            } else {
                setPasswordError("");
            }
        }
    };

    const handleForgotEmailChange = (e) => {
        const value = e.target.value;
        setForgotEmail(value);
        
        if (!value) {
            setForgotEmailError("Email is required.");
        } else if (!emailRegex.test(value)) {
            setForgotEmailError("Please enter a valid email address.");
        } else {
            setForgotEmailError("");
        }
    };

    const handleOtpChange = (e) => {
        const value = e.target.value;
        setOtp(value);
        
        if (!value) {
            setOtpError("OTP is required.");
        } else if (value.length !== 6) {
            setOtpError("OTP must be 6 digits.");
        } else if (!/^\d+$/.test(value)) {
            setOtpError("OTP must contain only numbers.");
        } else {
            setOtpError("");
        }
    };

    const handleNewPasswordChange = (e) => {
        const value = e.target.value;
        setNewPassword(value);
        
        if (!value) {
            setNewPasswordError("New password is required.");
        } else if (value.length < 6) {
            setNewPasswordError("Password must be at least 6 characters.");
        } else if (!/[A-Z]/.test(value)) {
            setNewPasswordError("Password must contain at least one uppercase letter.");
        } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
            setNewPasswordError("Password must contain at least one special character.");
        } else {
            setNewPasswordError("");
        }
    };

    const handleConfirmPasswordChange = (e) => {
        const value = e.target.value;
        setConfirmPassword(value);
        
        if (!value) {
            setConfirmPasswordError("Please confirm your password.");
        } else if (value !== newPassword) {
            setConfirmPasswordError("Passwords do not match.");
        } else {
            setConfirmPasswordError("");
        }
    };

    const trainerLogin = async () => {
        if (isDisabled) {
            toast.warning("Please fill in all required fields correctly.");
            return;
        }

        setIsLoading(true);
        try {
            const res = await axios.post(`${baseUrl}/api/v1/trainer/login`, form);
            console.log("res", res)
            const id = res.data.trainerId
            if (res.status === 200) {
                toast.success("Login successful! Redirecting to dashboard...");
                setTimeout(() => {
                    navigate(`/Trainerdashboard/${id}`);
                }, 1500);
            }
        } catch (error) {
            console.log(error);
            if (error.response?.status === 401) {
                toast.error("Invalid email or password. Please check your credentials.");
            } else if (error.response?.status === 404) {
                toast.error("Trainer account not found.");
            } else if (error.response?.status === 403) {
                toast.error("Account access denied. Please contact support.");
            } else if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Login failed. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendOtp = async () => {
        if (!forgotEmail || forgotEmailError) {
            toast.warning("Please enter a valid email address.");
            return;
        }

        setIsLoading(true);

        try {
            const res = await axios.post(`${baseUrl}/api/v1/trainer/sent-otp`, {
                trainerEmail: forgotEmail
            });
            
            if (res.status === 200) {
                toast.success("OTP sent successfully! Please check your email.");
                setShowOtpVerification(true);
            }
        } catch (error) {
            console.log(error);
            if (error.response?.status === 429) {
                toast.error("Too many OTP requests. Please try again after a minute.");
            } else if (error.response?.status === 404) {
                toast.error("No trainer account found with this email address.");
            } else if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Failed to send OTP. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!otp || !newPassword || !confirmPassword || otpError || newPasswordError || confirmPasswordError) {
            toast.warning("Please fill in all fields correctly.");
            return;
        }

        setIsLoading(true);

        try {
            const res = await axios.post(`${baseUrl}/api/v1/trainer/reset-password`, {
                trainerEmail: forgotEmail,
                otp: otp,
                newPassword: newPassword
            });
            
            if (res.status === 200) {
                toast.success("Password reset successful! You can now login with your new password.");
                setTimeout(() => {
                    resetForgotPassword();
                }, 2000);
            }
        } catch (error) {
            console.log(error);
            if (error.response?.status === 400) {
                toast.error(error.response.data.message || "Invalid OTP or expired. Please try again.");
            } else if (error.response?.status === 429) {
                toast.error("Too many attempts. Please request a new OTP.");
            } else if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Failed to reset password. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const resetForgotPassword = () => {
        setShowForgotPassword(false);
        setShowOtpVerification(false);
        setForgotEmail("");
        setForgotEmailError("");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
        setOtpError("");
        setNewPasswordError("");
        setConfirmPasswordError("");
        toast.info("Redirected to login page.");
    };

    const isDisabled = !form.trainerEmail || !form.password || emailError || passwordError || isLoading;
    const isForgotDisabled = !forgotEmail || forgotEmailError || isLoading;
    const isResetDisabled = !otp || !newPassword || !confirmPassword || otpError || newPasswordError || confirmPasswordError || isLoading;

    // OTP Verification Screen
    if (showOtpVerification) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.logo}>
                        <FaFlag className={styles.logoIcon} />
                        <span className={styles.logoText}>Courtly</span>
                    </div>
                    <p className={styles.subtitle}>Verify OTP</p>
                    <h2 className={styles.title}>Reset Trainer Password</h2>

                    <div className={styles.inputDatas}>
                        <div className={styles.inputContainer}>
                            <input
                                type="text"
                                placeholder="Enter 6-digit OTP"
                                value={otp}
                                onChange={handleOtpChange}
                                maxLength="6"
                            />
                            {otpError && (
                                <p className={styles.errorText}>
                                    {otpError}
                                </p>
                            )}
                        </div>

                        <div className={styles.inputContainer}>
                            <input
                                type="password"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={handleNewPasswordChange}
                            />
                            {newPasswordError && (
                                <p className={styles.errorText}>
                                    {newPasswordError}
                                </p>
                            )}
                        </div>

                        <div className={styles.inputContainer}>
                            <input
                                type="password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={handleConfirmPasswordChange}
                            />
                            {confirmPasswordError && (
                                <p className={styles.errorText}>
                                    {confirmPasswordError}
                                </p>
                            )}
                        </div>

                        <button
                            onClick={handleResetPassword}
                            disabled={isResetDisabled}
                            className={styles.submitButton}
                        >
                            {isLoading ? "Resetting..." : "Reset Password"}
                        </button>

                        <button
                            onClick={resetForgotPassword}
                            className={styles.backButton}
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Forgot Password Screen
    if (showForgotPassword) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.logo}>
                        <FaFlag className={styles.logoIcon} />
                        <span className={styles.logoText}>Courtly</span>
                    </div>
                    <p className={styles.subtitle}>Reset Password</p>
                    <h2 className={styles.title}>Trainer Password Recovery</h2>

                    <div className={styles.inputDatas}>
                        <div className={styles.inputContainer}>
                            <input
                                type="email"
                                placeholder="Enter your trainer email"
                                value={forgotEmail}
                                onChange={handleForgotEmailChange}
                            />
                            {forgotEmailError && (
                                <p className={styles.errorText}>
                                    {forgotEmailError}
                                </p>
                            )}
                        </div>

                        <button
                            onClick={handleSendOtp}
                            disabled={isForgotDisabled}
                            className={styles.submitButton}
                        >
                            {isLoading ? "Sending..." : "Send OTP"}
                        </button>

                        <button
                            onClick={resetForgotPassword}
                            className={styles.backButton}
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Main Login Screen
    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.logo}>
                    <FaFlag className={styles.logoIcon} />
                    <span className={styles.logoText}>Courtly</span>
                </div>
                <p className={styles.subtitle}>Hello Trainer</p>
                <h2 className={styles.title}>Welcome to Courtly</h2>

                <div className={styles.inputDatas}>
                    <div className={styles.inputContainer}>
                        <input
                            type="email"
                            name="trainerEmail"
                            placeholder="Email"
                            required
                            value={form.trainerEmail}
                            onChange={handleChange}
                        />
                        {emailError && (
                            <p className={styles.errorText}>
                                {emailError}
                            </p>
                        )}
                    </div>

                    <div className={styles.inputContainer}>
                        <div className={styles.inputWrapper}>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                name="password"
                                required
                                value={form.password}
                                onChange={handleChange}
                                className={styles.passwordInput}
                            />

                            <span
                                onClick={() => setShowPassword(!showPassword)}
                                className={styles.eyeIcon}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </span>
                        </div>

                        {passwordError && (
                            <p className={styles.errorText}>
                                {passwordError}
                            </p>
                        )}
                    </div>

                   

                    <button
                        onClick={trainerLogin}
                        disabled={isDisabled}
                    >
                        {isLoading ? "Logging in..." : "Login"}
                    </button>
                     <div className={styles.forgotPasswordContainer}>
                        <button
                            type="button"
                            onClick={() => {
                                setShowForgotPassword(true);
                                toast.info("Enter your email to reset your password.");
                            }}
                            className={styles.forgotPasswordLink}
                        >
                            Forgot Password?
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TrainerLogin