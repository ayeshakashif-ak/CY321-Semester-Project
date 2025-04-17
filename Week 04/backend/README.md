# DocuDino Backend

**DocuDino** is a secure document management system designed to provide robust authentication, multi-factor authentication (MFA), and AI-driven identity verification. This is the backend portion of the project, providing a secure API for user authentication, document management, and AI-powered verification.

---

## Features

- **Secure Authentication** — JWT-based authentication for user login, registration, and session handling
- **Role-Based Access Control** — Different access levels for users, admins, and other roles
- **Document Upload & Verification** — Secure document upload and verification using AI and encrypted storage
- **Multi-Factor Authentication (MFA)** — Added layer of security through TOTP and QR code generation
- **Database Security** — Encrypted data storage and secure database practices to protect sensitive information
- **Audit Logs** — Integrity verification and audit logging for documents and user activities

---

## 🔒 Security & Authentication

DocuDino implements several security practices to protect sensitive user data:

- **JWT Tokens** — Secure, stateless user authentication using JSON Web Tokens
- **Password Hashing** — Passwords are hashed and stored securely using bcrypt
- **Role-Based Access Control** — Different user roles with restricted access to certain endpoints
- **Multi-Factor Authentication** — Supports OTP generation via Time-based One-Time Passwords (TOTP) for added security
- **Database Encryption** — Sensitive data such as user profiles and documents are encrypted
- **Audit Logging** — Logs are generated for important user actions to ensure system integrity

> These security practices ensure that DocuDino is both secure and scalable.

---

## Tech Stack

- **Flask** — Python web framework for building the backend
- **SQLAlchemy** — ORM for interacting with the PostgreSQL database
- **PostgreSQL** — Relational database for secure and scalable data storage
- **JWT** — JSON Web Tokens for secure user authentication
- **bcrypt** — Secure hashing for storing user passwords
- **TOTP** — Time-based One-Time Password (MFA) generation
- **Flask-Migrate** — Database migration tool for schema changes

---

## 🚀 Getting Started

### ✅ Prerequisites

Ensure you have the following installed:

- [Python 3.x](https://www.python.org/downloads/)
- [PostgreSQL](https://www.postgresql.org/download/)
