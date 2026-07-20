"""RFM Compass API.

Endpoints:
  GET  /api/health   -> liveness + whether an API key is configured
  GET  /api/graph    -> tables, columns, inferred FK edges (compass data)
  POST /api/predict  -> run a PQL query, optionally with explanation
  POST /api/evaluate -> temporal holdout metrics for a PQL query

Interactive docs: /docs (Swagger UI) and /redoc, generated from this file.
"""
from __future__ import annotations

import os
from importlib.metadata import version
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import service

load_dotenv()

app = FastAPI(
    title="RFM Compass",
    version="0.1.0",
    description=(
        "Backend for RFM Compass: wraps the `kumoai` SDK to infer a relational "
        "schema graph from raw tables, then run PQL predictive queries against "
        "the KumoRFM foundation model with per-call latency and explanations."
    ),
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class HealthResponse(BaseModel):
    status: str
    api_key_configured: bool = Field(
        ..., description="Whether KUMO_API_KEY is set — predict/evaluate need it, schema browsing doesn't."
    )
    kumo_version: str = Field(..., description="Installed `kumoai` package version.")


class GraphNode(BaseModel):
    name: str
    rows: int
    primary_key: str | None = Field(None, description="Inferred primary-key column, if any.")
    time_column: str | None = Field(None, description="Inferred time column, if any.")
    columns: list[str]


class GraphEdge(BaseModel):
    src: str = Field(..., description="Source table name.")
    dst: str = Field(..., description="Destination table name.")
    fkey: str = Field(..., description="Foreign-key column on the source table.")


class GraphResponse(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]


class PredictRequest(BaseModel):
    query: str = Field(
        ...,
        description="PQL predictive query.",
        examples=["PREDICT COUNT(orders.*, 0, 90, days)=0 FOR users.user_id IN (1, 2, 3)"],
    )
    indices: list[int] | list[str] | None = Field(
        None, description="Explicit entity indices, overriding any IN (...) list in the query."
    )
    explain: bool = Field(False, description="Attach a human-readable explanation of the prediction.")


class PredictResponse(BaseModel):
    rows: list[dict[str, Any]]
    explanation: str | None = Field(None, description="Present only when `explain=true` was requested.")
    latency_ms: int = Field(..., description="Client-observed end-to-end time for this call.")
    run_mode: str


class EvaluateRequest(BaseModel):
    query: str = Field(
        ...,
        description="PQL predictive query to score against a temporal holdout.",
        examples=["PREDICT COUNT(orders.*, 0, 90, days)=0 FOR users.user_id"],
    )


class EvaluateResponse(BaseModel):
    metrics: list[dict[str, Any]]
    latency_ms: int = Field(..., description="Client-observed end-to-end time for this call.")
    run_mode: str


@app.get("/api/health", response_model=HealthResponse, tags=["meta"], summary="Liveness + config check")
def health() -> dict:
    return {
        "status": "ok",
        "api_key_configured": bool(os.environ.get("KUMO_API_KEY")),
        "kumo_version": version("kumoai"),
    }


@app.get(
    "/api/graph",
    response_model=GraphResponse,
    tags=["schema"],
    summary="Inferred schema graph",
    description="Tables, columns, and foreign-key edges the SDK infers from the dataset — powers the compass visualization.",
)
def graph() -> dict:
    try:
        return service.graph_summary()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post(
    "/api/predict",
    response_model=PredictResponse,
    tags=["model"],
    summary="Run a PQL predictive query",
    responses={400: {"description": "KUMO_API_KEY not configured."}, 502: {"description": "SDK call failed."}},
)
def predict(req: PredictRequest) -> dict:
    try:
        return service.run_predict(req.query, req.indices, req.explain)
    except RuntimeError as exc:  # missing API key -> actionable 400, not a 500
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.post(
    "/api/evaluate",
    response_model=EvaluateResponse,
    tags=["model"],
    summary="Evaluate a PQL query on a temporal holdout",
    responses={400: {"description": "KUMO_API_KEY not configured."}, 502: {"description": "SDK call failed."}},
)
def evaluate(req: EvaluateRequest) -> dict:
    try:
        return service.run_evaluate(req.query)
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=str(exc)) from exc
