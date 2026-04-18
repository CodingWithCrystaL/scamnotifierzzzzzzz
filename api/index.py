"""
api/index.py
Vercel serverless entry point.
Vercel calls this file as the Python function handler for all /api/* routes.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from main import app  # noqa: F401
