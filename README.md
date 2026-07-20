# RFM Compass 🧭

> Navigate relational data with Relational Foundation Models(RFM).
> 
> ![](./docs/img/cover.png)

Ask predictive questions in **PQL**, explore your relational schema as a graph, and understand how **Relational Foundation Models (RFMs)** arrive at their predictions through visual explanations and end-to-end latency metrics.

---

## Why RFM Compass?

RFM Compass is an open-source exploration tool for **NVIDIA Kumo Relational Foundation Models**.

Instead of treating relational databases as isolated tables, RFM Compass helps you visualize how entities are connected, formulate predictive queries, and understand the relationships the model learns from.

Whether you're learning RFMs or building production workflows, Compass provides an intuitive way to inspect the complete prediction pipeline.

---

## ⚡ Getting Started

### ⚙️ Install Dependencies

```bash
# Boostrap the project: Create .venv and upgrade pip
./go install_tools

# Install dependencies for backend and frontend
./go setup

## Copy and add your API key to the `.env` file
cp .env.example .env
```

Create a free API key from [**kumorfm.ai**](https://kumorfm.ai/api-keys) and add it to your `.env`.


### ▶️ Run the App

Start the backend:

```bash
./go backend
```

Start the frontend:

```bash
./go frontend
```

Open:

- Backend: http://localhost:8000
- Frontend: http://localhost:5173


---

## Tech Stack

![Tech Stack](./docs/img/rfm_compass_request_flow.svg)


### Backend

- FastAPI
- NVIDIA `kumoai`
- Graph construction
- Metadata inference
- Prediction API
- Model evaluation
- Explainability
- Performance metrics

### Frontend

- React
- TypeScript
- Vite
- Material UI

The interface is inspired by a traditional navigation compass, where the compass rose represents the inferred relational graph and the needle points toward the entity currently being predicted.

----

## Vision

Relational Foundation Models unlock predictions directly from connected data without manual feature engineering.

**RFM Compass** aims to become the easiest way to explore, understand, and build applications powered by relational AI.
