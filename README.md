# 🎟️ TicketPass — Digital Event Ticketing & Checkpoint Management Platform

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.5+-F7931E?logo=scikitlearn&logoColor=white)](https://scikit-learn.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A modern, full-stack responsive web application for end-to-end event ticketing and gate admittance management. Built with **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Motion**, **TicketPass** delivers an intuitive self-service booking storefront for attendees, high-speed camera QR pass validation for checkpoint staff, walk-in box office assisted sales, an administrative console for publishing events and tracking capacity analytics, and an integrated **Decision Tree Machine Learning** service for ticket telemetry classification.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Pre-configured Demo Accounts](#-pre-configured-demo-accounts)
- [Step-by-Step Setup & Installation](#-step-by-step-setup--installation)
  - [Prerequisites](#prerequisites)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Start Python ML Backend](#2-start-python-ml-backend-terminal-1)
  - [3. Start React Frontend](#3-start-react-frontend-terminal-2)
  - [4. Verify System Connectivity](#4-verify-system-connectivity)
- [How to Use TicketPass](#-how-to-use-ticketpass)
  - [1. Attendee / Customer Flow](#1-attendee--customer-flow)
  - [2. Staff Gate Checkpoint & QR Scanner](#2-staff-gate-checkpoint--qr-scanner)
  - [3. Box Office Assisted Walk-In Sales](#3-box-office-assisted-walk-in-sales)
  - [4. Administrator Console & Event Publishing](#4-administrator-console--event-publishing)
- [Decision Tree Machine Learning Pipeline](#-decision-tree-machine-learning-pipeline)
  - [Model Overview](#model-overview)
  - [Dataset & Feature Pipeline](#dataset--feature-pipeline)
  - [Retraining the Model](#retraining-the-model)
  - [Direct API Testing](#direct-api-testing)
- [Available Scripts](#-available-scripts)
- [Project Directory Structure](#-project-directory-structure)
- [Tech Stack](#-tech-stack)
- [Environment & Security](#-environment--security)
- [License](#-license)

---

## 🌟 Overview

TicketPass connects digital self-service ticket booking directly with physical gate operations:

- **Zero Client Installation**: Fully web-based responsive interface; attendees can browse, buy, and present digital passbook tickets directly on iOS, Android, macOS, or Windows browsers.
- **Real-Time QR Pass Validation**: Checkpoint staff scan passes using their device camera with sub-second admittance checks, instant status alerts, duplicate check-in prevention, and audio feedback.
- **Role-Based Access Control (RBAC)**: Distinct permissions isolate customer storefronts from staff gate scanners and administrator consoles.
- **Walk-in Box Office Counter**: Gate personnel can instantly sell tickets to walk-in attendees, process payments, and issue scannable passes on the spot.
- **Integrated Machine Learning**: A trained scikit-learn Decision Tree model classifies ticket telemetry (Digital vs. Physical) based on transaction patterns, channel, payment method, and lead times.
- **100% Self-Contained**: No external API keys or paid third-party dependencies required. Runs entirely on local services.

---

## 🏗️ System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          TICKETPASS PLATFORM                           │
├──────────────────────────────────┬─────────────────────────────────────┤
│         CUSTOMER JOURNEY         │           STAFF & ADMIN             │
│                                  │                                     │
│  ┌────────────────────────────┐  │  ┌───────────────────────────────┐  │
│  │   Catalog & Event Search   │  │  │   Checkpoint QR Scanner       │  │
│  └─────────────┬──────────────┘  │  │   (Camera / Upload / Manual)  │  │
│                ▼                 │  └───────────────┬───────────────┘  │
│  ┌────────────────────────────┐  │                  ▼                  │
│  │  Tier Selection & Checkout │  │  ┌───────────────────────────────┐  │
│  └─────────────┬──────────────┘  │  │   Token & Date Validation     │  │
│                ▼                 │  └───────────────┬───────────────┘  │
│  ┌────────────────────────────┐  │                  │                  │
│  │ Digital Passbook & QR Code │  │                  │                  │
│  └────────────────────────────┘  │                  ▼                  │
├──────────────────────────────────┴──────────────────┼──────────────────┤
│                                                     ▼                  │
│                                      ┌──────────────────────────────┐  │
│                                      │   Python ML Backend (Port    │  │
│                                      │              5000)           │  │
│                                      │   Decision Tree Classifier   │  │
│                                      └──────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Attendee** chooses an event, selects ticket tier and quantity, and completes checkout.
2. **System** generates cryptographically distinct ticket records and scannable QR tokens (`TP1:...` format).
3. **Attendee** presents the passbook card or QR code at venue entrance.
4. **Gate Staff** scans the code via webcam or mobile camera.
5. **Validator** checks pass validity, event date, and duplicate check-in status.
6. **ML Classifier** infers ticket telemetry (`DIGITAL PASS` vs `PHYSICAL TICKET`) from order features.

---

## 👥 Pre-configured Demo Accounts

TicketPass includes 4 pre-configured personas for quick role testing without manual registration:

| Persona | Role | Email | Permissions & Accessible Features |
| :--- | :--- | :--- | :--- |
| **Chan Dara** | Customer | `chandara@gmail.com` | Browse catalog, purchase multi-pass orders, view personal passbook |
| **Bopha Chea** | Staff Scanner | `bophachea@gmail.com` | Live camera QR scanner, entry verification, check-in audit logs |
| **Vireak Roth** | Senior Staff | `vireakroth@gmail.com` | Checkpoint scanner, walk-in box office sales, event creation |
| **Kosal Seng** | Administrator | `kosalseng@gmail.com` | Full master console, analytics, event publishing, category management |

> **Quick Sign-In**: On the Sign In page (`/auth`), click any of the **Demo Personas** on the right side to log in instantly. Any password (e.g., `password123`) is accepted in demo mode.

---

## 💻 Step-by-Step Setup & Installation

### Prerequisites

Ensure you have the following installed on your machine:
- **[Node.js](https://nodejs.org/)** (v18.0.0 or higher recommended)
- **[Python](https://www.python.org/)** (v3.10 or higher for the ML backend)
- **Git**

---

### 1. Clone Repository

```bash
git clone https://github.com/YimAyuVadna/TicketPass.git
cd TicketPass
```

---

### 2. Start Python ML Backend (Terminal 1)

The machine learning backend runs a lightweight HTTP server on port `5000` providing prediction inference via scikit-learn.

**On Windows (PowerShell):**
```powershell
cd ml-backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

**On macOS / Linux:**
```bash
cd ml-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

> **Expected output:**
> ```text
> ========================================================
> TicketPass — Python ML Backend API
> ========================================================
> Loaded Decision Tree model from models/ticket_classifier.pkl
> Server running at: http://localhost:5000
>   - Health check:     http://localhost:5000/health
>   - Prediction API:   POST http://localhost:5000/predict
>   - Interactive UI:   GET  http://localhost:5000/predict
> ========================================================
> ```

---

### 3. Start React Frontend (Terminal 2)

From the project root directory, install npm packages and start the Vite development server:

```bash
npm install
npm run dev
```

> **Expected output:**
> ```text
>   VITE v6.2.3  ready in 280 ms
> 
>   ➜  Local:   http://localhost:3000/
>   ➜  Network: use --host to expose
> ```

---

### 4. Verify System Connectivity

1. Open your browser and navigate to **[http://localhost:3000](http://localhost:3000)**.
2. The React frontend automatically proxies `/predict` requests to `http://localhost:5000` (configured in `vite.config.ts`).
3. You can also visit **[http://localhost:5000/predict](http://localhost:5000/predict)** in your browser to access the interactive ML tester UI.

*(Note: The frontend is fully operational even if the Python ML backend is offline. Ticket verification and checkpoint admittance will continue working smoothly, with ML telemetry classification gracefully noted as offline.)*

---

## 📖 How to Use TicketPass

### 1. Attendee / Customer Flow

#### Browsing Events
- Open the storefront at `http://localhost:3000`.
- Browse events across dynamic categories (Music, Tech & Innovation, Sports, Culture & Arts, Food & Festivals, Cinema).
- Use the real-time search bar to search by event title, venue name, or city landmarks (Diamond Island, Sokha Hotel, Olympic Stadium, Furi Mall).
- Click on any event card to view full details: date, schedule, organizer information, venue rules, and ticket tiers.

#### Purchasing Tickets
1. Click **Buy Pass** on any event.
2. If not signed in, you will be prompted to log in (or select a demo persona) and automatically returned to your checkout modal.
3. Choose your desired ticket tier (**VIP**, **Early Bird**, **General Admission**).
4. Adjust ticket quantity with real-time price calculations.
5. Select a simulated payment option (**ABA PAY**, **Wing Bank**, **Credit/Debit Card**, or **Cash**).
6. Confirm payment to receive instant celebratory feedback and ticket confirmation.

#### Managing & Presenting Passes
- Click **Passes** in the navigation bar to open your digital passbook.
- Each pass shows the event title, seat tier, date, venue, ticket number, and current status (`VALID`, `CHECKED_IN`, or `EXPIRED`).
- Click **View Pass** on any ticket to open the high-contrast scannable QR display.
- Present the QR code on your phone screen to gate staff upon arrival.

#### Quick Simulation Shortcut
- Click **Simulate Pass** in the top navigation bar to instantly generate an online test ticket with a scannable QR code without completing full checkout.

---

### 2. Staff Gate Checkpoint & QR Scanner

1. Log in with a staff account: click **Bopha Chea (Staff Scanner)** or **Vireak Roth (Senior Staff)**.
2. Click **Scan QR** in the top navigation bar or **Scanner** in the Staff Dashboard.
3. Choose between 4 scanning modes:
   - **Camera Scan**: Uses your webcam or mobile camera with an auto-scanning overlay. Simply point the camera at a digital pass or paper ticket.
   - **Upload Image**: Drag-and-drop or select an image file containing a QR code for automatic client-side decoding via `jsQR`.
   - **Manual ID**: Type a ticket number (e.g., `TKT-2026-000928`) or raw QR token.
   - **Test Tokens**: Use pre-configured test scenarios to verify all system responses:
     - *Valid Pass Sample* → Grants immediate admission.
     - *Used Pass Sample* → Triggers duplicate check-in alert.
     - *Expired Pass Sample* → Flags tickets with past event dates.
     - *Cancelled Pass Sample* → Rejects invalid tickets.
     - *Telemetry Classification Scenarios* → Tests the Decision Tree model against digital online passes vs. physical counter passes.
4. **Admittance Results**:
   - 🟢 **VALID PASS**: Displays attendee name, ticket tier, order date, and plays an admittance chime. Admittance is logged in real-time.
   - 🟡 **ALREADY CHECKED IN**: Displays warning banner with timestamp of previous check-in to prevent pass sharing.
   - 🔴 **EXPIRED / INVALID PASS**: Rejection banner with alert sound.
5. **Standby Booth Mode**:
   - Enable "Standby Mode" at the top of the scanner modal for hands-free gate operation. Once a pass is verified, the scanner automatically resets after 3 seconds to scan the next attendee.

---

### 3. Box Office Assisted Walk-In Sales

1. Log in as **Vireak Roth (Senior Staff)** or **Kosal Seng (Admin)**.
2. Click **Assisted Sale** in the top navigation bar.
3. Select an upcoming event from the dropdown.
4. Enter attendee name and contact details.
5. Choose ticket tier and quantity.
6. Record payment method (Cash box office, ABA transfer, Card).
7. Click **Complete Sale & Issue Pass**:
   - Ticket capacity is instantly deducted from the event inventory.
   - A verified pass is issued immediately with a unique QR code ready for physical printing or instant scanning.

---

### 4. Administrator Console & Event Publishing

1. Log in as **Kosal Seng (Admin)**.
2. Click **Console** in the navigation bar.
3. **Analytics Dashboard**:
   - Real-time gross revenue, total tickets issued, check-in conversion rate, and active events.
   - Event-by-event capacity fulfillment progress bars with sold-out warnings.
   - Live audit feed showing recent ticket purchases and gate scans.
4. **Publish New Events**:
   - Click **Create Event**.
   - Set event title, category, date, time, organizer, and venue rules.
   - Configure multiple ticket tiers with independent capacities and pricing.
   - Upload event imagery directly via local image file (Base64) or external URL.
5. **Category & Hero Banner Management**:
   - Click **Manage Categories** to create, rename, or toggle event categories.
   - Click **Spotlight Hero** to select which featured event appears prominently on the storefront hero banner.

---

## 🧠 Decision Tree Machine Learning Pipeline

### Model Overview

The machine learning component (`ml-backend`) implements a **Supervised Decision Tree Classifier** using `scikit-learn`. It analyzes ticket transaction attributes at gate admission to classify the ticket's issuance channel:
- `DIGITAL PASS` (Class 0): Tickets purchased online via e-wallets, cards, or advance booking.
- `PHYSICAL TICKET` (Class 1): Tickets issued at on-site box office counters with cash or walk-in payment.

### Dataset & Feature Pipeline

The classifier is trained on synthetic transaction telemetry matching Cambodian event patterns:

| Feature Name | Type | Description |
| :--- | :--- | :--- |
| `payment_method` | Categorical (Encoded) | `ABA` (0), `WING` (1), `CARD` (2), `CASH` (3) |
| `unit_price` | Continuous (USD) | Price per ticket ($5.00 – $150.00) |
| `quantity` | Discrete | Number of tickets in transaction (1 – 10) |
| `total_amount` | Continuous (USD) | Total order value (`unit_price * quantity`) |
| `hour_of_purchase` | Discrete (0–23) | Hour of day when transaction occurred |
| `day_of_week` | Categorical (Encoded) | Monday (0) through Sunday (6) |
| `has_notes` | Binary (0 / 1) | Whether special seating or dietary notes were entered |
| `ticket_tier` | Categorical (Encoded) | `VIP` (0), `REGULAR` (1), `BALCONY` (2), `EARLY_BIRD` (3) |
| `time_since_purchase_hours` | Continuous | Hours between purchase time and gate admission |

### Retraining the Model

To regenerate training data and retrain the Decision Tree model:

```bash
cd ml-backend
# 1. Generate training dataset (data/training_data.csv)
python generate_training_data.py

# 2. Train and export model (models/ticket_classifier.pkl)
python train_model.py
```

During training, `train_model.py` outputs:
- Confusion matrix and classification report (Precision, Recall, F1-Score).
- Decision tree visualization saved to `outputs/decision_tree_visual.png`.
- Exported model bundle containing the classifier, encoders, and feature column signatures.

### Direct API Testing

You can query the prediction server directly with `curl` or Postman:

```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "payment_method": "ABA",
    "unit_price": 45,
    "quantity": 1,
    "total_amount": 45,
    "hour_of_purchase": 15,
    "day_of_week": "FRIDAY",
    "has_notes": true,
    "ticket_tier": "VIP",
    "time_since_purchase_hours": 48
  }'
```

**Response:**
```json
{
  "ticket_type": "DIGITAL",
  "prediction_code": 0,
  "confidence": 0.98,
  "probabilities": {
    "DIGITAL": 0.98,
    "PHYSICAL": 0.02
  },
  "features_received": { ... }
}
```

---

## ⚡ Available Scripts

In the root directory, run:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite local development server on `http://localhost:3000` with instant HMR |
| `npm run build` | Compiles TypeScript and builds optimized production bundles into `dist/` |
| `npm run preview` | Locally serves the production build from `dist/` |
| `npm run lint` | Runs TypeScript static type checking without emitting files (`tsc --noEmit`) |

In the `ml-backend/` directory, run:

| Command | Description |
| :--- | :--- |
| `python app.py` | Starts the Python ML inference server on `http://localhost:5000` |
| `python generate_training_data.py` | Generates synthetic ticket purchase dataset (`data/training_data.csv`) |
| `python train_model.py` | Trains Decision Tree classifier and exports `models/ticket_classifier.pkl` |
| `python predict.py` | CLI test script running sample test cases through the trained model |

---

## 📂 Project Directory Structure

```text
TicketPass/
├── ml-backend/                      # Python Machine Learning Subsystem
│   ├── data/                        # Training datasets (CSV)
│   ├── models/                      # Serialized Decision Tree (ticket_classifier.pkl)
│   ├── outputs/                     # Decision tree diagrams and charts
│   ├── app.py                       # ML HTTP server & interactive web tester (port 5000)
│   ├── generate_training_data.py    # Synthetic dataset generator
│   ├── predict.py                   # Preprocessing and prediction inference
│   ├── train_model.py               # Model training and evaluation script
│   └── requirements.txt             # Python dependencies (scikit-learn, pandas, numpy)
├── public/                          # Public static assets
├── src/                             # React Application Source Code
│   ├── components/
│   │   ├── admin/                   # Admin console, event publishing, category managers
│   │   ├── auth/                    # Sign In / Sign Up views and demo persona cards
│   │   ├── common/                  # Reusable QR generator, modal wrappers, buttons
│   │   ├── customer/                # Storefront catalog, hero banner, checkout modal
│   │   ├── layout/                  # Responsive navigation bar and footer
│   │   ├── profile/                 # User settings and account modal
│   │   ├── scanner/                 # Gate checkpoint camera QR reader, upload & manual modes
│   │   ├── staff/                   # Staff checkpoint dashboard & walk-in box office sales
│   │   └── tickets/                 # Passbook cards, QR modal, print view
│   ├── context/
│   │   └── TicketContext.tsx        # Centralized state (Auth, Events, Passes, Check-in logs)
│   ├── data/
│   │   └── initialData.ts           # Pre-seeded events, categories, and test user personas
│   ├── App.tsx                      # Root application component & view coordinator
│   ├── index.css                    # Tailwind CSS v4 directives & layout styling
│   ├── main.tsx                     # React application entrypoint
│   └── types.ts                     # TypeScript interfaces, roles, and data models
├── index.html                       # HTML document root with typography preconnects
├── package.json                     # Node.js dependencies and project scripts
├── tsconfig.json                    # Strict TypeScript configuration
└── vite.config.ts                   # Vite configuration and /predict reverse proxy
```

---

## 🛠️ Tech Stack

- **Frontend Core**: [React 19](https://react.dev/), [TypeScript 5.8](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **CSS Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Motion & Transitions**: [Motion](https://motion.dev/)
- **Machine Learning**: [scikit-learn](https://scikit-learn.org/), [pandas](https://pandas.pydata.org/), [NumPy](https://numpy.org/), [joblib](https://joblib.readthedocs.io/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **QR Code Generation**: [qrcode](https://github.com/soldair/node-qrcode)
- **Live Camera QR Decoding**: [jsQR](https://github.com/cozmo/jsQR)
- **Visual Feedback**: [canvas-confetti](https://github.com/catdad/canvas-confetti)

---

## 📢 Recent Updates

- Added **ShareTicketModal** component for easy ticket sharing via QR and link.
- Updated repository remote to **Passly**; clone with `git clone https://github.com/YimAyuVadna/Passly.git`.
- Refreshed UI theme and gold palette across components.
- Updated documentation to reflect new repo location.



## 🔒 Environment & Security

- **Zero External API Keys**: TicketPass is completely self-contained. It requires no external API keys, third-party authentication tokens, or cloud billing accounts to operate.
- **Local Environment Safeguards**: All environment files (`.env`, `.env.local`, etc.) are explicitly excluded via `.gitignore` to prevent any inadvertent credential leaks.
- **Client-Side QR Processing**: Camera video frames are decoded entirely on the client side in real time using `jsQR`; video feeds are never recorded or streamed to any external servers.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Feel free to use, modify, and distribute for educational or commercial purposes.