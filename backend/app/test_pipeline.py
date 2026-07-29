import os
import sys
import time

# Ensure backend root is in PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import fitz  # PyMuPDF
from fastapi.testclient import TestClient

from app.main import app
from app.db.database import engine, Base
from app.models import User, Paper, PaperChunk

# Ensure tables exist
Base.metadata.create_all(bind=engine)

client = TestClient(app)


def create_sample_pdf(filepath: str):
    """Creates a sample 3-page PDF file with research text for testing."""
    doc = fitz.open()

    pages_text = [
        "Abstract: Deep Learning for Page-Aware Neural Document Retrieval.\n"
        "In this paper, we introduce Synapse, a framework that processes PDF documents page by page.",

        "Section 1: Vector Embeddings and Chunking.\n"
        "Traditional PDF summarizers suffer from context drift when stuffing entire documents into single prompts.\n"
        "Synapse uses page-aware retrieval over localized chunk vectors to cite exact page numbers.",

        "Section 2: Experimental Results and Conclusion.\n"
        "Our experiments show significant retrieval accuracy improvements across dense academic papers.\n"
        "Future work will explore cross-paper comparative reasoning."
    ]

    for text in pages_text:
        page = doc.new_page()
        page.insert_text((50, 50), text, fontsize=12)

    doc.save(filepath)
    doc.close()


def test_phase_0_end_to_end():
    print("=== SYNAPSE PHASE 0 END-TO-END VERIFICATION ===")

    # 1. Signup user
    test_email = f"researcher_{int(time.time())}@synapse.ai"
    test_password = "SecurePassword123!"

    print(f"1. Testing User Signup ({test_email})...")
    signup_res = client.post("/api/v1/auth/signup", json={"email": test_email, "password": test_password})
    assert signup_res.status_code == 201, f"Signup failed: {signup_res.text}"
    tokens = signup_res.json()
    assert "access_token" in tokens
    assert "refresh_token" in tokens
    print("✓ Signup successful! JWT access token generated.")

    access_token = tokens["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    # 2. Get Me
    print("2. Testing Protected Route /auth/me...")
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    user_data = me_res.json()
    assert user_data["email"] == test_email
    print(f"✓ Authentication verified! User ID: {user_data['id']}")

    # 3. Create & Upload Sample PDF
    sample_pdf_path = "sample_test_paper.pdf"
    create_sample_pdf(sample_pdf_path)

    print("3. Uploading sample research PDF document...")
    with open(sample_pdf_path, "rb") as f:
        upload_res = client.post(
            "/api/v1/papers/upload",
            headers=headers,
            files={"file": ("sample_test_paper.pdf", f, "application/pdf")}
        )

    assert upload_res.status_code == 202, f"Upload failed: {upload_res.text}"
    paper_info = upload_res.json()
    paper_id = paper_info["id"]
    print(f"✓ Upload accepted! Paper ID: {paper_id}, initial status: {paper_info['status']}")

    # Clean up local sample pdf file
    if os.path.exists(sample_pdf_path):
        os.remove(sample_pdf_path)

    # 4. Poll background processing status
    print("4. Polling background extraction, chunking, & vector embedding pipeline...")
    max_retries = 15
    paper_detail = None
    for attempt in range(max_retries):
        time.sleep(1)
        detail_res = client.get(f"/api/v1/papers/{paper_id}", headers=headers)
        assert detail_res.status_code == 200
        paper_detail = detail_res.json()
        print(f"   [Attempt {attempt + 1}/{max_retries}] Status: '{paper_detail['status']}'")

        if paper_detail["status"] in ["ready", "failed"]:
            break

    assert paper_detail["status"] == "ready", f"Paper processing failed with error: {paper_detail.get('error_message')}"
    assert paper_detail["page_count"] == 3, f"Expected 3 pages, got {paper_detail['page_count']}"
    assert paper_detail["chunks_count"] >= 3, f"Expected at least 3 chunks, got {paper_detail['chunks_count']}"
    print(f"✓ Paper processing complete! Page count: {paper_detail['page_count']}, Vector Chunks stored: {paper_detail['chunks_count']}")

    # 5. List Papers
    print("5. Listing user papers in library...")
    list_res = client.get("/api/v1/papers", headers=headers)
    assert list_res.status_code == 200
    papers_list = list_res.json()
    assert len(papers_list) >= 1
    assert papers_list[0]["id"] == paper_id
    print("✓ Paper library view verified successfully!")

    print("\n🎉 ALL PHASE 0 VERIFICATION TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    test_phase_0_end_to_end()
