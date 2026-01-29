Below is a **clean, formal REQUIREMENT DOCUMENT only** (no code, no implementation details) that clearly defines a **WhatsApp-like Video Calling UI with PiP**, aligned with your **Vite + Socket.IO + WebRTC + shadcn + Tailwind** stack.

This is suitable for:

* Product sign-off
* Sharing with frontend/backend teams
* Architecture & UX alignment
* Vendor / agency handoff

---

# Video Calling Feature Requirements

**(WhatsApp-Style UI with Picture-in-Picture)**

---

## 1. Purpose

This document defines the **functional, UI/UX, and architectural requirements** for implementing **1-to-1 audio and video calling** in a web application using **WebRTC** for media transfer and **Socket.IO** for signaling.

The **visual behavior and interaction model must closely resemble WhatsApp video calling**, including **Picture-in-Picture (PiP)** behavior that displays **video or profile images for both participants**.

---

## 2. Scope

### In Scope

* One-to-one audio and video calls
* WhatsApp-style video UI
* Picture-in-Picture layout
* Camera on/off handling with avatar fallback
* Incoming and outgoing call flows
* Desktop and mobile-responsive UI
* Vite-based frontend
* Socket.IO signaling server (`server.ts`)
* shadcn/ui + Tailwind CSS components

### Out of Scope

* Group video calls
* Call recording
* Screen sharing
* SIP / SIP.js
* PSTN / telephony integration

---

## 3. Technology Stack (Mandatory)

| Layer     | Technology                    |
| --------- | ----------------------------- |
| Frontend  | Vite + React                  |
| Routing   | React Router DOM (v6/v7) with Code Splitting |
| UI        | shadcn/ui + Tailwind CSS      |
| Signaling | Socket.IO                     |
| Media     | WebRTC                        |
| Server    | Node.js + Express (`server/` directory) |
| Calls     | Peer-to-Peer (1-to-1)         |

---

## 4. High-Level Architecture

### 4.1 Media
* WebRTC must be used for:
  * Audio capture
  * Video capture
  * Peer-to-peer streaming

### 4.2 Signaling & Server
* **Server Location**: A `server/` folder in the project root.
* **Technology**: Node.js + Express + Socket.IO.
* **Responsibilities**:
  * Relay signaling messages
  * Manage active users (User List)
  * Call rooms
* **Frontend Integration**:
  * Functional approach (Custom React Hook) for Socket.IO client.
  * No class-based socket services.

---

## 5. Core Functional Requirements

### 5.1 User Identity & Discovery (New)
* **Onboarding**:
  * Simple "Enter Your Name" screen on launch.
  * No password/auth required.
  * Generate a unique socket ID for the session.
* **User List**:
  * Display a list of "Online Users" (everyone currently joined).
  * User can click a name to initiate a call.

### 5.2 Call Types
* Audio-only call
* Video call

### 5.3 Outgoing Calls
* User selects a target user from the **User List**.
* User chooses Audio or Video call.
* Permissions requested; local preview shown.

### 5.4 Incoming Calls
* Incoming call screen must:
  * Indicate **audio vs video**.
  * Show caller name and **Initials Avatar**.
* User must be able to:
  * Accept as video
  * Accept as audio only
  * Decline

---

## 6. WhatsApp-Style Video UI Requirements

![Image](https://images.indianexpress.com/2021/07/WhatsApp_New_Interface1.jpg)

![Image](https://media.wired.com/photos/59269f72af95806129f5013f/3%3A2/w_2560%2Cc_limit/WhatsApp_Video_TA-1.jpg)

![Image](https://s.yimg.com/ny/api/res/1.2/c6fbh_AfSaUmQ3i48C.QZw--/YXBwaWQ9aGlnaGxhbmRlcjt3PTEzNjA7aD0xNDQw/https%3A//media.zenfs.com/en/digital_trends_973/1f879dc0364c3bfea11b72d6dd173592)

![Image](https://www.huaweicentral.com/wp-content/uploads/2025/04/calling-img.jpg)

---

## 7. Video Layout Rules (Critical)

### 7.1 Default Layout
* **Remote participant**:
  * Displayed full screen
* **Local participant**:
  * Displayed in Picture-in-Picture (PiP)

### 7.2 Picture-in-Picture (PiP)
* PiP must:
  * Float above the main video
  * Be rounded with shadow
  * Be tappable/clickable
* Tapping PiP must **swap views**

---

## 8. Camera Off & Avatar Fallback (Mandatory)

### 8.1 No Black Screens Rule
At no point should a black or empty video area be shown.

### 8.2 Fallback Behavior & Avatar Source
| Scenario          | Display Requirement                 |
| ----------------- | ----------------------------------- |
| Local camera OFF  | Show local user avatar in PiP       |
| Remote camera OFF | Show remote avatar full screen      |
| Both cameras OFF  | One avatar full screen + one in PiP |

### 8.3 Avatar Implementation
* **Source**: `shadcn/ui` Avatar component.
* **Content**: Initials extracted from the user's First and Last name (e.g., "John Doe" -> "JD").
* **Style**: Consistent background color, visually clear text.

---

## 9. View Swapping (WhatsApp Parity)

* User must be able to tap/click the PiP view
* After swap:

  * Local video/avatar becomes full screen
  * Remote video/avatar moves to PiP
* Swap must work regardless of:

  * Camera ON/OFF state
  * Video or avatar being shown

---

## 10. Call Controls

### Required Controls

* Mute / Unmute microphone
* Enable / Disable camera
* End call

### Behavior

* Controls must be:

  * Minimal
  * Always accessible
  * Positioned at the bottom of the screen
* Camera toggle must immediately:

  * Disable video stream
  * Replace video with avatar

---

## 11. Incoming Video Call Screen

### UI Requirements

* Show:

  * Caller name
  * Caller avatar
  * “Video Calling…” indicator
* Buttons:

  * Accept with Video
  * Accept Audio Only
  * Decline

---

## 12. Responsiveness & Sizing

### Widget / Small View

* PiP must scale down
* Controls remain usable
* No UI overlap

### Fullscreen / Desktop

* PiP larger
* Full-screen immersive video

---

## 13. State Management Requirements

The application must track:

* Call status (idle / ringing / active / ended)
* Call type (audio / video)
* Local video enabled state
* Remote video enabled state
* Swap state (normal / swapped)

---

## 14. Non-Functional Requirements

### Performance

* Video must adapt to network conditions
* Audio must remain clear even on poor networks

### Reliability

* Graceful handling of:

  * Camera permission denial
  * Camera disconnected mid-call
  * Network interruptions

### UX Quality

* Smooth transitions
* No flickering
* No blank states

---

## 15. Constraints

* Only **1-to-1** calls allowed
* No SIP, SIP.js, or telephony stack
* No backend media processing
* Browser-based only

---

## 16. Acceptance Criteria

A feature is considered complete when:

* UI visually matches WhatsApp video calling
* PiP works exactly as expected
* Avatars replace video cleanly
* Swapping views works in all states
* Incoming and outgoing calls behave correctly
* No black video screens are visible
* Works across desktop and mobile browsers

---

## 17. Conclusion

This requirement ensures:

* A **familiar WhatsApp-like experience**
* Clean UX with no confusing states
* Modern WebRTC + Socket.IO architecture
* Easy future extensibility

---