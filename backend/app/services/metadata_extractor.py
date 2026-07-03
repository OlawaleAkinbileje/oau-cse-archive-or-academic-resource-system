
"""
Enhanced metadata extractor for CSE academic documents.
Extracts programming languages, algorithm types, function signatures, and concepts.
"""

from pathlib import Path
from typing import List, Dict, Any, Optional, Set
import re
from io import BytesIO
from PyPDF2 import PdfReader

# Extended language mapping
CODE_EXT_TO_LANG = {
    ".py": "python",
    ".js": "javascript",
    ".ts": "typescript",
    ".java": "java",
    ".c": "c",
    ".cpp": "cpp",
    ".h": "c",
    ".hpp": "cpp",
    ".cs": "csharp",
    ".php": "php",
    ".rb": "ruby",
    ".go": "go",
    ".rs": "rust",
    ".kt": "kotlin",
    ".swift": "swift",
    ".html": "html",
    ".css": "css",
    ".sql": "sql",
}

# Algorithm/Concept keywords for CSE
ALGORITHM_KEYWORDS = {
    "sorting": [
        "bubble sort", "quick sort", "merge sort", "heap sort", "insertion sort",
        "selection sort", "radix sort", "bucket sort", "counting sort"
    ],
    "searching": [
        "binary search", "linear search", "depth-first search", "breadth-first search",
        "dfs", "bfs", "hash table", "binary search tree"
    ],
    "graph": [
        "dijkstra", "bellman-ford", "floyd-warshall", "minimum spanning tree",
        "prims algorithm", "kruskals algorithm", "graph", "node", "edge", "vertex"
    ],
    "dynamic_programming": [
        "dynamic programming", "dp", "memoization", "knapsack", "fibonacci"
    ],
    "data_structures": [
        "linked list", "array", "stack", "queue", "heap", "binary tree",
        "hash map", "dictionary", "tree", "graph", "priority queue"
    ],
    "complexity": [
        "time complexity", "space complexity", "o(1)", "o(n)", "o(n^2)",
        "o(log n)", "o(n log n)"
    ]
}


class EnhancedMetadataExtractor:
    def __init__(self, filename: str, content: bytes):
        self.filename = filename
        self.content = content
        self.ext = Path(filename).suffix.lower()
        self.text_content = self._extract_text()

    def _extract_text(self) -> str:
        if self.ext == ".pdf":
            return self._extract_pdf_text()
        try:
            return self.content.decode("utf-8", errors="ignore").strip()
        except:
            return ""

    def _extract_pdf_text(self) -> str:
        try:
            reader = PdfReader(BytesIO(self.content))
            page_text = []
            for page in reader.pages:
                page_text.append(page.extract_text() or "")
            return "\n".join(page_text).strip()
        except:
            return ""

    def extract_programming_language(self) -> Optional[str]:
        return CODE_EXT_TO_LANG.get(self.ext)

    def extract_algorithms_and_concepts(self) -> Dict[str, List[str]]:
        text_lower = self.text_content.lower()
        results: Dict[str, List[str]] = {}

        for category, keywords in ALGORITHM_KEYWORDS.items():
            found: List[str] = []
            for keyword in keywords:
                if keyword in text_lower:
                    found.append(keyword)
            if found:
                results[category] = list(set(found))
        return results

    def extract_function_signatures(self) -> List[str]:
        if self.ext not in [".py", ".js", ".ts", ".java", ".c", ".cpp"]:
            return []

        signatures: List[str] = []

        if self.ext == ".py":
            patterns = [
                r"def\s+(\w+)\s*\((.*?)\)\s*[-&gt;]*\s*(.*?)\s*:",
                r"class\s+(\w+)\s*(?:\((.*?)\))?\s*:"
            ]
        elif self.ext in [".js", ".ts"]:
            patterns = [
                r"function\s+(\w+)\s*\((.*?)\)",
                r"const\s+(\w+)\s*=\s*(?:async\s+)?\((.*?)\)\s*=&gt;",
                r"(\w+)\s*\((.*?)\)\s*(?:\{|;)"
            ]
        elif self.ext in [".java", ".c", ".cpp"]:
            patterns = [
                r"(\w+(?:\s+\w+)*)\s+(\w+)\s*\((.*?)\)\s*(?:\{|;)"
            ]
        else:
            return []

        for pattern in patterns:
            matches = re.findall(pattern, self.text_content)
            for match in matches:
                if match and len(match) > 0:
                    signature = match[0]
                    if len(signature) > 2 and not signature.startswith(("_", "__")):
                        signatures.append(signature)

        return list(set(signatures))

    def extract_key_snippet(self, max_length: int = 500) -> str:
        if len(self.text_content) <= max_length:
            return self.text_content

        # Prefer content with code or algorithm keywords
        text_lower = self.text_content.lower()
        best_start = 0
        max_keywords = 0

        for window_start in range(0, len(self.text_content), 100):
            window_end = min(window_start + 1000, len(self.text_content))
            window = text_lower[window_start:window_end]
            count = sum(
                1 for category in ALGORITHM_KEYWORDS.values()
                for keyword in category
                if keyword in window
            )
            if count > max_keywords:
                max_keywords = count
                best_start = window_start

        snippet = self.text_content[best_start:best_start + max_length]
        return snippet.strip()

    def extract_all_metadata(self, max_length: int = 5000) -> Dict[str, Any]:
        return {
            "programming_language": self.extract_programming_language(),
            "algorithms": self.extract_algorithms_and_concepts(),
            "function_signatures": self.extract_function_signatures(),
            "key_snippet": self.extract_key_snippet(max_length),  
            "full_text": self.text_content if len(self.text_content) <= max_length else self.text_content[:max_length]  
        }

