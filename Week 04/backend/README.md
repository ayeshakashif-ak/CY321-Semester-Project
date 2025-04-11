# Docudino Backend

## Overview

Docudino is a secure document management system that leverages multi-factor authentication (MFA), AI-driven identity verification, and database encryption to ensure the privacy and security of user data. This backend handles user authentication, document upload and verification, role-based access control, and more.

The backend is built using **Flask**, and it interacts with a **PostgreSQL** database. It is designed with a focus on security, implementing best practices for secure coding, secure authentication, and database protection.

## Features

- **User Authentication**: Secure login, registration, and session management.
- **Multi-Factor Authentication (MFA)**: Supports Time-based One-Time Passwords (TOTP) and QR code generation.
- **AI-based Identity Verification**: Integration with AI for user verification and document integrity validation.
- **Database Security**: Encryption of sensitive data, secure storage of passwords, and audit logging for document integrity.
- **Role-Based Access Control (RBAC)**: Different access levels for users, admins, and other roles within the application.
- **Document Upload & Verification**: Users can upload and verify documents securely.

## Table of Contents

1. [Installation](#installation)
2. [Environment Setup](#environment-setup)
3. [Directory Structure](#directory-structure)
4. [Running the Application](#running-the-application)
5. [Endpoints](#endpoints)
6. [Security Measures](#security-measures)
7. [Contributing](#contributing)
8. [License](#license)

## Installation

To run the Docudino backend locally, follow these steps:

### Clone the Repository

```bash
git clone https://github.com/your-username/docudino-backend.git
cd docudino-backend
