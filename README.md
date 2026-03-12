# 🚀 3-Tier MERN Stack CI/CD Pipeline on Kubernetes

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Kubernetes](https://img.shields.io/badge/kubernetes-%23326ce5.svg?style=flat&logo=kubernetes&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=flat&logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/github%20actions-%232671E5.svg?style=flat&logo=githubactions&logoColor=white)
![AWS ECR](https://img.shields.io/badge/AWS%20ECR-FF9900?style=flat&logo=amazonaws&logoColor=white)

A complete DevOps lifecycle project demonstrating the containerization, orchestration, and automated deployment of a 3-tier MERN (MongoDB, Express, React/HTML, Node.js) application using Docker, Kubernetes, and GitHub Actions.

## 🏗️ Architecture Overview

The application is divided into three isolated tiers deployed within a dedicated Kubernetes namespace (`three-tier-app`):

1. **Frontend (Presentation Layer):** Static HTML/CSS/JS served via an Nginx Alpine container. Exposed via a Kubernetes NodePort Service (`30000`).
2. **Backend (Application Layer):** Node.js API containerized using a highly secure, multi-stage Docker build with Google's `distroless` image. Exposed via a NodePort Service (`31111`).
3. **Database (Data Layer):** MongoDB deployed as a Kubernetes `StatefulSet` with a Headless Service (`27017`) to ensure stable network identities and data persistence using a Persistent Volume (PV) and Persistent Volume Claim (PVC).

## 🧰 Tech Stack

* **Frontend:** HTML/CSS/JS, Nginx
* **Backend:** Node.js, Express
* **Database:** MongoDB 6.0
* **Containerization:** Docker (Multi-stage, Distroless, Alpine)
* **Orchestration:** Kubernetes (Deployments, StatefulSets, Services, PV/PVC)
* **CI/CD:** GitHub Actions (GitHub-hosted & Self-hosted runners)
* **Container Registry:** AWS Elastic Container Registry (ECR) Public

## ⚙️ CI/CD Pipeline Workflow

The automated deployment relies on a GitHub Actions workflow triggered on a push to the `main` branch. 

### Stage 1: Continuous Integration (GitHub-Hosted Runner)
1. Code checkout.
2. Authenticates with AWS using GitHub Secrets.
3. Logs into AWS ECR Public.
4. Builds the Frontend and Backend Docker images.
5. Tags and pushes the images to AWS ECR Public.
6. Cleans up local images on the runner.

### Stage 2: Continuous Deployment (Self-Hosted Runner)
1. Triggers after a successful CI stage.
2. Authenticates with AWS and logs into ECR.
3. Pulls the latest images and the `mongo:6` base image.
4. Creates the `three-tier-app` Kubernetes namespace.
5. Deploys the PVC and MongoDB `StatefulSet`, waiting for readiness.
6. Applies the Frontend and Backend manifests and performs a rollout restart to ensure the latest images are running.

## 🚀 Deployment Instructions

### Prerequisites
Before running the pipeline, ensure the following infrastructure is in place:
* A running Kubernetes cluster.
* A configured Self-Hosted GitHub Actions runner connected to your repository.
* The following Secrets configured in your GitHub Repository:
  * `AWS_ACCESS_KEY`
  * `AWS_SECRET_ACCESS_KEY`

**Crucial Step: Infrastructure Storage**
The Persistent Volume (PV) is treated as foundational infrastructure and is *not* managed by the CI/CD pipeline. You must apply it manually to your cluster before triggering the deployment:

```bash
# apply the PersistentVolume
kubectl apply -f pv.yaml
