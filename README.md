# qperform — Dashboard Frontend

![Archivado](https://img.shields.io/badge/Estado-Archivado-lightgrey?style=flat)
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg" width="18" align="absmiddle" /> ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg" width="18" align="absmiddle" /> ![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![Azure](https://img.shields.io/badge/Azure-0078D4?style=flat&logo=microsoftazure&logoColor=white)

> **Dashboard de operaciones en tiempo real para equipos BPO/CSR de OnQ — desarrollo pausado al cambiar de empresa.**

---

## Contexto del Proyecto

Este fue un dashboard de produccion que se estaba construyendo para **OnQ**, una empresa de BPO (Business Process Outsourcing) y operaciones de CSR (Customer Service Representative). El objetivo era dar a los team leads y supervisores una vista en vivo de la productividad de los agentes, metricas de llamadas y estado de las colas, consumiendo datos directamente de Microsoft Dataverse.

El desarrollo quedo pausado al cambiar de empresa. El codigo base refleja un conjunto de funcionalidades parcialmente completadas.

---

## Lo que se construyo

- Flujo de autenticacion via **Azure Active Directory** (OAuth 2.0)
- Conexion a **Microsoft Dataverse** para datos de produccion en vivo
- Layout base del dashboard y routing
- Scaffold del proyecto TypeScript con Vite y ESLint

---

## Stack Tecnologico

| Componente | Tecnologia |
|-----------|-----------|
| Lenguaje | TypeScript |
| Bundler | Vite |
| Autenticacion | Azure Active Directory |
| Fuente de datos | Microsoft Dataverse |
| Despliegue | Azure (scripts PowerShell de despliegue incluidos) |

---

## Repositorios relacionados

Este proyecto forma parte de una configuracion multi-repo:

| Repo | Proposito |
|------|-----------|
| [`qperform_dev`](https://github.com/deadlyrat/qperform_dev) | App frontend (este repo) |
| [`qperform_server`](https://github.com/deadlyrat/qperform_server) | Servidor backend Node.js |
| [`qperform_server_dev`](https://github.com/deadlyrat/qperform_server_dev) | Rama de desarrollo del backend |
| [`qperform_dev_arch`](https://github.com/deadlyrat/qperform_dev_arch) | Prototipos de arquitectura |

---

## Estado

Este proyecto esta **archivado** y no se mantiene activamente. Se publica aqui con fines de portfolio para demostrar patrones de TypeScript, integracion con Azure AD y arquitectura frontend empresarial.
