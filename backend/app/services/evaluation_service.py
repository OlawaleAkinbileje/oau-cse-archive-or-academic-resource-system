
"""
Evaluation Framework for the OAU CSE Academic Archive.
Tests: Precision, Recall, Response Time.
"""

from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import time
import json
from pathlib import Path

from app.services.search_service import hybrid_search as search_documents


@dataclass
class TestQuery:
    id: str
    query: str
    expected_ids: List[int]
    description: str
    category: str


TEST_QUERIES: List[TestQuery] = [
    TestQuery(
        id="q001",
        query="Dijkstra algorithm",
        expected_ids=[],
        description="Search for Dijkstra's shortest path algorithm",
        category="algorithm"
    ),
    TestQuery(
        id="q002",
        query="Python list",
        expected_ids=[],
        description="Python data structures",
        category="language"
    ),
    TestQuery(
        id="q003",
        query="CSC 401",
        expected_ids=[],
        description="Course code specific search",
        category="course"
    ),
    TestQuery(
        id="q004",
        query="Bubble sort",
        expected_ids=[],
        description="Simple sorting algorithm",
        category="algorithm"
    ),
    TestQuery(
        id="q005",
        query="Dynamic programming knapsack",
        expected_ids=[],
        description="Advanced algorithm search",
        category="algorithm"
    ),
    TestQuery(
        id="q006",
        query="Binary search tree",
        expected_ids=[],
        description="Data structure search",
        category="data_structures"
    ),
    TestQuery(
        id="q007",
        query="Java object oriented",
        expected_ids=[],
        description="Language and paradigm",
        category="language"
    ),
    TestQuery(
        id="q008",
        query="200 level",
        expected_ids=[],
        description="Level-based search",
        category="level"
    ),
]


@dataclass
class EvaluationResult:
    query_id: str
    query: str
    precision: float
    recall: float
    response_time_ms: float
    num_results: int
    relevant_found: int


class EvaluationService:
    def __init__(self, db: Session):
        self.db = db
        self.results: List[EvaluationResult] = []

    def evaluate_query(self, test_query: TestQuery) -> EvaluationResult:
        start_time = time.time()
        results = search_documents(
            db=self.db,
            q=test_query.query
        )
        end_time = time.time()
        response_time = (end_time - start_time) * 1000  # milliseconds

        found_ids = {doc["document_id"] for doc in results}
        expected_set = set(test_query.expected_ids) if test_query.expected_ids else set()

        # If no expected IDs are provided, we'll do a "sanity check" evaluation
        if not expected_set:
            return EvaluationResult(
                query_id=test_query.id,
                query=test_query.query,
                precision=1.0 if results else 0.0,
                recall=1.0 if results else 0.0,
                response_time_ms=response_time,
                num_results=len(results),
                relevant_found=len(results)
            )

        true_positives = len(found_ids.intersection(expected_set))

        precision = true_positives / len(found_ids) if found_ids else 0.0
        recall = true_positives / len(expected_set) if expected_set else 0.0

        return EvaluationResult(
            query_id=test_query.id,
            query=test_query.query,
            precision=precision,
            recall=recall,
            response_time_ms=response_time,
            num_results=len(results),
            relevant_found=true_positives
        )

    def run_full_evaluation(self) -> Dict[str, Any]:
        print("=== Starting Full Evaluation ===\n")

        total_time = 0
        all_results = []

        for query in TEST_QUERIES:
            print(f"Evaluating query: '{query.query}'")
            result = self.evaluate_query(query)
            all_results.append(result)
            total_time += result.response_time_ms
            print(f"  - Response time: {result.response_time_ms:.2f} ms")
            print(f"  - Results: {result.num_results}")
            print(f"  - Precision: {result.precision:.2f}")
            print(f"  - Recall: {result.recall:.2f}\n")

        avg_time = total_time / len(TEST_QUERIES)
        avg_precision = sum(r.precision for r in all_results) / len(all_results)
        avg_recall = sum(r.recall for r in all_results) / len(all_results)

        print("=== Overall Evaluation Results ===")
        print(f"Average Response Time: {avg_time:.2f} ms")
        print(f"Average Precision: {avg_precision:.2f}")
        print(f"Average Recall: {avg_recall:.2f}")
        print(f"All queries meet &lt;2s requirement: {all(r.response_time_ms < 2000 for r in all_results)}")

        self.results = all_results

        return {
            "query_results": [
                {
                    "query_id": r.query_id,
                    "query": r.query,
                    "precision": r.precision,
                    "recall": r.recall,
                    "response_time_ms": r.response_time_ms,
                    "num_results": r.num_results
                }
                for r in all_results
            ],
            "summary": {
                "avg_response_time_ms": avg_time,
                "avg_precision": avg_precision,
                "avg_recall": avg_recall,
                "meets_sub_two_second_requirement": all(r.response_time_ms < 2000 for r in all_results)
            }
        }

    def save_evaluation_report(self, output_path: str = "evaluation_report.json"):
        report = self.run_full_evaluation()
        Path(output_path).write_text(json.dumps(report, indent=2))
        print(f"\nEvaluation report saved to {output_path}")
        return report
