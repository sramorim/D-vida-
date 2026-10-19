#!/usr/bin/env python3
import json
import sys

try:
    import instaloader
    print(json.dumps({"available": True}))
except ImportError:
    print(json.dumps({"available": False, "error": "instaloader not installed"}))
except Exception as e:
    print(json.dumps({"available": False, "error": str(e)}))