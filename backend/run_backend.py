import sys
import os
from pathlib import Path

base = Path(__file__).resolve().parent
deps = base / ".pydeps"
sys.path.insert(0, str(deps))
os.environ["PYTHONPATH"] = str(deps) + os.pathsep + os.environ.get("PYTHONPATH", "")

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        log_level="info",
        access_log=True,
    )
