# Video Calling App

A WhatsApp-style video calling application built with React, Vite, Socket.IO, and WebRTC.

## Prerequisites

- Node.js (v18+)
- npm

## Setup & Running

This project consists of two parts: the **Frontend** (root) and the **Backend** (`server/`). You need to run both simultaneously.

### 1. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd server
npm install
```

### 2. Start the Application

You need two terminal windows.

**Terminal 1: Backend Server**
```bash
cd server
npm run dev
```
*The server will start on http://localhost:3001*

**Terminal 2: Frontend Client**
```bash
npm run dev
```
*The client will start on http://localhost:5173*

## Features

- **1-to-1 Video Calling**: Peer-to-peer connection using WebRTC.
- **WhatsApp-style UI**: Picture-in-Picture (PiP) view, draggable/swappable videos.
- **Real-time User List**: See who is online and call them instantly.
- **Camera/Mic Controls**: Toggle video and audio during calls.
- **Avatar Fallback**: Displays initials when video is off.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, Socket.IO
- **Real-time**: Socket.IO (Signaling), WebRTC (Media)

