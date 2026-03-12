#  3-Tier MERN Stack Application: End To End CI/CD Project

![Architecture: 3-Tier](https://img.shields.io/badge/Architecture-3--Tier-blue)
![Containerization: Docker](https://img.shields.io/badge/Containerization-Docker-2496ED?logo=docker&logoColor=white)
![Orchestration: Kubernetes](https://img.shields.io/badge/Orchestration-Kubernetes-326CE5?logo=kubernetes&logoColor=white)
![CI/CD: GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?logo=github-actions&logoColor=white)
![Security: Docker Scout](https://img.shields.io/badge/Security-Docker_Scout-0db7ed?logo=docker&logoColor=white)
![Monitoring: Prometheus](https://img.shields.io/badge/Monitoring-Prometheus-E6522C?logo=prometheus&logoColor=white)
![Dashboards: Grafana](https://img.shields.io/badge/Dashboards-Grafana-F46800?logo=grafana&logoColor=white)

A production-ready, highly available 3-tier web application fully containerized and orchestrated via Kubernetes. This repository demonstrates end-to-end DevOps practices, including multi-stage Docker builds, Kubernetes stateful/stateless deployments, security scanning, and automated CI/CD pipelines using GitHub Actions and AWS ECR.

---

##  Architecture Overview

The application is decoupled into three distinct layers, deployed within a dedicated Kubernetes namespace (`three-tier-app`), ensuring scalability, security, and independent lifecycle management.

##  Observability & Monitoring Strategy

To maintain high availability and proactively monitor system health, a comprehensive monitoring stack is deployed alongside the application:

* **Node Exporter:** Deployed as a Kubernetes `DaemonSet` to ensure it runs on every node in the cluster. It exposes vital hardware and OS-level metrics (CPU, memory, disk I/O, network pressure).
* **Prometheus:** Acts as the central metrics server, configured to systematically scrape time-series data from the Node Exporter targets and Kubernetes internal components.
* **Grafana:** Connected directly to Prometheus as its primary data source. Used to build rich, dynamic dashboards that visualize application performance, resource bottlenecks, and database health in real-time.

* **Tier 1: Frontend (Presentation Layer)**
    * Static assets (HTML, CSS, JS) served via a lightweight Nginx web server.
    * Deployed as a highly available Kubernetes `Deployment` (3 replicas).
    * Exposed via a `NodePort` Service (Port: 30000).
* **Tier 2: Backend (Application Layer)**
    * Node.js/Express REST API processing business logic.
    * Built using a secure, multi-stage Dockerfile utilizing a **Distroless** image to minimize attack surface.
    * Exposed via a `NodePort` Service (Port: 31111).
* **Tier 3: Database (Data Layer)**
    * MongoDB container managed by a Kubernetes `StatefulSet` ensuring data consistency and stable network identities.
    * Headless Service (`mongo-svc`) for internal cluster DNS resolution.
    * Persistent data storage utilizing a `PersistentVolume` (PV) and `PersistentVolumeClaim` (PVC) bound to host storage.
* **Tier 4: Observability (Monitoring Layer)**
    * Prometheus for scraping and storing time-series metrics.
    * Node Exporter acting as the primary data source for host-level metrics.
    * Grafana for visualizing cluster health and performance telemetry.

---

##  Containerization Strategy

### Frontend (`nginx:stable-alpine`)
Uses a lean Alpine-based Nginx image. The default Nginx configurations are cleared out, and the static application files (`index.html`, `styles.css`, `app.js`) are injected directly into the serving directory.

### Backend (Multi-Stage Distroless)
Optimized for production security and minimal image size:
1.  **Builder Stage:** Uses `node:20-alpine` to install production dependencies and compile the code.
2.  **Runtime Stage:** Transfers the built application into `gcr.io/distroless/nodejs20-debian13`. This strips away package managers and shells, drastically reducing vulnerability vectors.

---

##  Kubernetes Infrastructure

All resources are encapsulated in the `three-tier-app` namespace.

| Component | K8s Resource | Details |
| :--- | :--- | :--- |
| **Frontend** | `Deployment` | 3 Replicas, pulls `mern-stack-frontend:latest` |
| **Frontend Network** | `Service` | Type: `NodePort`, NodePort: `30000`, Target: `80` |
| **Backend** | `Deployment` | 1 Replica, pulls `mern-stack-backend:latest` |
| **Backend Network** | `Service` | Type: `NodePort`, NodePort: `31111`, Target: `4000` |
| **Database** | `StatefulSet` | 1 Replica, uses `mongo:6`, mounts `/data/db` |
| **Database Network**| `Service` | Type: `ClusterIP` (None/Headless), Port: `27017` |
| **Storage** | `PV` / `PVC` | 3Gi Capacity, `ReadWriteOnce`, HostPath backing. |
| **Node Exporter** | `DaemonSet` | Runs on all nodes, exposes port `9100` |
| **Prometheus** | `Deployment` | Scrapes Node Exporter, stores metrics |
| **Grafana** | `Deployment` | Connects to Prometheus, visualizes data |

> ** Infrastructure Note:** The `PersistentVolume` (mongodb-pv) is an infrastructure-level resource and must be provisioned on the cluster *prior* to running the CI/CD pipeline.

---

##  CI/CD Pipeline (GitHub Actions)

The deployment lifecycle is fully automated via GitHub Actions, split into two dependent jobs.

### Job 1: Continuous Integration (Runs on GitHub-Hosted Ubuntu)
1.  **Code Checkout & Auth:** Pulls the repository and authenticates with AWS (IAM via Secrets) and Docker Hub.
2.  **Frontend Build & SecOps:** Builds the frontend Docker image. Runs **Docker Scout** to scan for Critical/High CVEs (fails the pipeline if vulnerabilities are detected). Pushes the secure image to AWS ECR.
3.  **Backend Build & SecOps:** Builds the backend Docker image, scans with Docker Scout, and pushes to AWS ECR.
4.  **Runner Cleanup:** Removes local images to prevent bloat.

### Job 2: Continuous Deployment (Runs on Self-Hosted Runner)
1.  **Environment Prep:** Checks out code, authenticates with AWS ECR, and pulls the newly built images locally to the deployment node.
2.  **Namespace & Storage:** Applies the Kubernetes namespace and the `PersistentVolumeClaim` for MongoDB.
3.  **Database Rollout:** Deploys the MongoDB StatefulSet and explicitly waits (`kubectl rollout status`) until the database is fully ready before proceeding.
4.  **App Rollout:** Applies the Frontend and Backend K8s manifests (Deployments & Services) and triggers a `rollout restart` to ensure the latest images are pulled and running.

---

##  Prerequisites & Setup

To replicate this environment, ensure you have:
* A running Kubernetes cluster with a self-hosted GitHub Actions runner attached.
* An AWS account with an ECR public repository configured (`public.ecr.aws/f9w4b6z1/...`).
* The following GitHub Repository Secrets configured:
    * `AWS_ACCESS_KEY`
    * `AWS_SECRET_ACCESS_KEY`
    * `DOCKER_USERNAME`
    * `DOCKER_API_TOKEN`

### Manual Pre-Requisite (Persistent Volume)
Before triggering the pipeline, you must apply the Persistent Volume to your cluster:
```bash
kubectl apply -f mongodb-pv.yaml
