"""Service layer: owns the kumoai session, dataset, graph, and model.

Everything the API serves comes through here. The graph and model are built
once and cached in process state; every model call is timed client-side so
the UI can show honest end-to-end latency (network + sampling + forward pass,
undecomposable from here — the README says so and the UI labels it
"end-to-end").
"""
from __future__ import annotations

import os
import time
from dataclasses import dataclass, field
from typing import Any

import kumoai.rfm as rfm
import pandas as pd

DATASET_S3 = "s3://kumo-sdk-public/rfm-datasets/online-shopping"
DATASET_HTTPS = "https://kumo-sdk-public.s3.us-west-2.amazonaws.com/rfm-datasets/online-shopping"
TABLES = ("users", "items", "orders")
RUN_MODE = os.environ.get("COMPASS_RUN_MODE", "fast")


@dataclass
class CompassState:
    tables: dict[str, pd.DataFrame] = field(default_factory=dict)
    graph: Any = None
    model: Any = None
    api_ready: bool = False


STATE = CompassState()


def _fetch(name: str) -> pd.DataFrame:
    try:
        return pd.read_parquet(f"{DATASET_S3}/{name}.parquet", storage_options={"anon": True})
    except Exception:
        return pd.read_parquet(f"{DATASET_HTTPS}/{name}.parquet")


def ensure_dataset() -> dict[str, pd.DataFrame]:
    if not STATE.tables:
        STATE.tables = {name: _fetch(name) for name in TABLES}
    return STATE.tables


def ensure_graph():
    if STATE.graph is None:
        tables = ensure_dataset()
        STATE.graph = rfm.Graph.from_data(dict(tables), infer_metadata=True, verbose=False)
    return STATE.graph


def ensure_model():
    """Initialize the Kumo client and model lazily; predictions need an API key."""
    if STATE.model is None:
        api_key = os.environ.get("KUMO_API_KEY")
        if not api_key:
            raise RuntimeError(
                "KUMO_API_KEY is not set. Get a free key at kumorfm.ai and add it to .env."
            )
        rfm.init(api_key=api_key)
        STATE.model = rfm.KumoRFM(ensure_graph(), verbose=False)
        STATE.api_ready = True
    return STATE.model


def graph_summary() -> dict:
    """Schema + inferred links, shaped for the compass visualization."""
    graph = ensure_graph()
    nodes = []
    for name in graph.tables:  # graph.tables is a dict of name -> table object
        table = graph.table(name)
        pk = getattr(table, "primary_key", None)
        time_col = table.time_column if table.has_time_column() else None
        nodes.append(
            {
                "name": name,
                "rows": int(len(STATE.tables[name])),
                "primary_key": pk.name if pk is not None else None,
                "time_column": time_col.name if time_col is not None else None,
                "columns": [str(c) for c in STATE.tables[name].columns],
            }
        )
    edges = [
        {"src": e.src_table, "dst": e.dst_table, "fkey": e.fkey} for e in graph.edges
    ]
    return {"nodes": nodes, "edges": edges}


def run_predict(query: str, indices: list | None, explain: bool) -> dict:
    model = ensure_model()
    t0 = time.perf_counter()
    result = model.predict(
        query,
        indices=indices or None,
        explain=rfm.ExplainConfig() if explain else False,
        run_mode=RUN_MODE,
        verbose=False,
    )
    elapsed_ms = round((time.perf_counter() - t0) * 1000)
    if explain:
        # Explanation object: prediction df + human-readable summary.
        df = getattr(result, "prediction", None)
        summary = getattr(result, "summary", None) or str(result)
        rows = df.to_dict(orient="records") if df is not None else []
        return {"rows": rows, "explanation": summary, "latency_ms": elapsed_ms, "run_mode": RUN_MODE}
    return {
        "rows": result.to_dict(orient="records"),
        "explanation": None,
        "latency_ms": elapsed_ms,
        "run_mode": RUN_MODE,
    }


def run_evaluate(query: str) -> dict:
    model = ensure_model()
    t0 = time.perf_counter()
    metrics = model.evaluate(query, run_mode=RUN_MODE, verbose=False)
    elapsed_ms = round((time.perf_counter() - t0) * 1000)
    return {
        "metrics": metrics.to_dict(orient="records"),
        "latency_ms": elapsed_ms,
        "run_mode": RUN_MODE,
    }
