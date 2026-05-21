# qperform — Frontend Dashboard

![Archived](https://img.shields.io/badge/Status-Archived-lightgrey?style=flat)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![Azure](https://img.shields.io/badge/Azure-0078D4?style=flat&logo=microsoftazure&logoColor=white)

> **Real-time operations dashboard for OnQ BPO/CSR teams — development paused when author changed companies.**

---

## 📋 Project Context

This was a production dashboard being built for **OnQ**, a BPO (Business Process Outsourcing) and CSR (Customer Service Representative) operations company. The goal was to give team leads and supervisors a live view of agent productivity, call metrics, and queue status pulled directly from Microsoft Dataverse.

Development was paused when I moved to a different company. The codebase reflects a partially complete feature set.

---

## 🏗️ What Was Built

- Authentication flow via **Azure Active Directory** (OAuth 2.0)
- Connection to **Microsoft Dataverse** for live production data
- Base dashboard layout and routing
- TypeScript project scaffold with Vite and ESLint

---

## 🛠️ Tech Stack

| Concern | Technology |
|---------|-----------|
| Language | TypeScript |
| Bundler | Vite |
| Auth | Azure Active Directory |
| Data Source | Microsoft Dataverse |
| Deploy | Azure (PowerShell deployment scripts included) |

---

## 🗂️ Sister Repositories

This project is part of a multi-repo setup:

| Repo | Purpose |
|------|---------|
| [`qperform_dev`](https://github.com/deadlyrat/qperform_dev) | Frontend app (this repo) |
| [`qperform_server`](https://github.com/deadlyrat/qperform_server) | Node.js backend server |
| [`qperform_server_dev`](https://github.com/deadlyrat/qperform_server_dev) | Backend development branch |
| [`qperform_dev_arch`](https://github.com/deadlyrat/qperform_dev_arch) | Architecture prototypes |

---

## ⚠️ Status

This project is **archived** and not actively maintained. It is published here for portfolio purposes to demonstrate TypeScript, Azure AD integration, and enterprise frontend architecture patterns.
