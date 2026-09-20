import os
import shutil
from datetime import datetime, timezone
from uuid import uuid4

import ollama
from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
)
from pydantic import BaseModel
from pypdf import PdfReader

from app.models import User
from app.routes.auth import get_current_user


# =========================================================
# Router
# =========================================================

router = APIRouter(
    prefix="/api/documents",
    tags=["Documents"],
)


# =========================================================
# Storage
# =========================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)


UPLOAD_DIR = os.path.join(
    BASE_DIR,
    "uploads",
)


os.makedirs(
    UPLOAD_DIR,
    exist_ok=True,
)


# =========================================================
# Allowed File Types
# =========================================================

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".txt",
    ".docx",
}


# =========================================================
# In-Memory Document Storage
# =========================================================

documents = {}


# =========================================================
# Request Models
# =========================================================

class DocumentQuestion(BaseModel):
    question: str


# =========================================================
# PDF Text Extraction
# =========================================================

def extract_pdf_text(
    file_path: str,
) -> str:
    """
    Extract readable text from a PDF.
    """

    reader = PdfReader(
        file_path
    )

    pages = []

    for page in reader.pages:

        text = page.extract_text()

        if text:

            pages.append(
                text
            )

    return "\n\n".join(
        pages
    )


# =========================================================
# Upload Document
# =========================================================

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(
        get_current_user
    ),
):

    # -----------------------------------------------------
    # Validate filename
    # -----------------------------------------------------

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="Filename is required.",
        )


    # -----------------------------------------------------
    # Get extension
    # -----------------------------------------------------

    extension = os.path.splitext(
        file.filename
    )[1].lower()


    # -----------------------------------------------------
    # Validate file type
    # -----------------------------------------------------

    if extension not in ALLOWED_EXTENSIONS:

        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported file type. "
                "Allowed files: PDF, TXT, DOCX."
            ),
        )


    # -----------------------------------------------------
    # Create document ID
    # -----------------------------------------------------

    document_id = str(
        uuid4()
    )


    # -----------------------------------------------------
    # Create safe stored filename
    # -----------------------------------------------------

    stored_filename = (
        f"{document_id}{extension}"
    )


    file_path = os.path.join(
        UPLOAD_DIR,
        stored_filename,
    )


    # -----------------------------------------------------
    # Save file
    # -----------------------------------------------------

    try:

        with open(
            file_path,
            "wb",
        ) as buffer:

            shutil.copyfileobj(
                file.file,
                buffer,
            )

    except Exception as error:

        print(
            f"Document upload error: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to save document.",
        )


    # -----------------------------------------------------
    # Document timestamp
    # -----------------------------------------------------

    now = datetime.now(
        timezone.utc
    ).isoformat()


    # -----------------------------------------------------
    # Extract text
    # -----------------------------------------------------

    extracted_text = ""


    # -----------------------------------------------------
    # PDF
    # -----------------------------------------------------

    if extension == ".pdf":

        try:

            extracted_text = (
                extract_pdf_text(
                    file_path
                )
            )

            print(
                f"Extracted {len(extracted_text)} "
                f"characters from {file.filename}"
            )

        except Exception as error:

            print(
                f"PDF text extraction error: {error}"
            )

            extracted_text = ""


    # -----------------------------------------------------
    # TXT
    # -----------------------------------------------------

    elif extension == ".txt":

        try:

            with open(
                file_path,
                "r",
                encoding="utf-8",
                errors="ignore",
            ) as text_file:

                extracted_text = (
                    text_file.read()
                )

        except Exception as error:

            print(
                f"TXT extraction error: {error}"
            )

            extracted_text = ""


    # -----------------------------------------------------
    # DOCX
    # -----------------------------------------------------

    elif extension == ".docx":

        # DOCX extraction will be added later.
        extracted_text = ""


    # -----------------------------------------------------
    # Create document metadata
    # -----------------------------------------------------

    document = {
        "id": document_id,

        "user_id": current_user.id,

        "filename": file.filename,

        "stored_filename": stored_filename,

        "file_type": extension.replace(
            ".",
            "",
        ).upper(),

        "path": file_path,

        "created_at": now,

        "size": os.path.getsize(
            file_path
        ),

        "text": extracted_text,
    }


    # -----------------------------------------------------
    # Store document
    # -----------------------------------------------------

    documents[
        document_id
    ] = document


    # -----------------------------------------------------
    # Response
    # -----------------------------------------------------

    return {
        "message":
            "Document uploaded successfully.",

        "document": {
            "id":
                document_id,

            "filename":
                file.filename,

            "file_type":
                document["file_type"],

            "size":
                document["size"],

            "created_at":
                document["created_at"],

            "text_length":
                len(
                    extracted_text
                ),
        },
    }


# =========================================================
# List Documents
# =========================================================

@router.get("/")
async def get_documents(
    current_user: User = Depends(
        get_current_user
    ),
):

    document_list = []

    for document in documents.values():

        # Only return documents
        # belonging to the logged-in user.

        if (
            document["user_id"]
            != current_user.id
        ):
            continue

        document_list.append(
            {
                "id":
                    document["id"],

                "filename":
                    document["filename"],

                "file_type":
                    document["file_type"],

                "size":
                    document["size"],

                "created_at":
                    document["created_at"],

                "text_length":
                    len(
                        document.get(
                            "text",
                            "",
                        )
                    ),
            }
        )


    # -----------------------------------------------------
    # Newest first
    # -----------------------------------------------------

    document_list.sort(
        key=lambda document:
            document["created_at"],
        reverse=True,
    )


    return {
        "documents":
            document_list
    }


# =========================================================
# Get One Document
# =========================================================

@router.get(
    "/{document_id}"
)
async def get_document(
    document_id: str,
    current_user: User = Depends(
        get_current_user
    ),
):

    document = documents.get(
        document_id
    )


    if not document:

        raise HTTPException(
            status_code=404,
            detail="Document not found.",
        )


    # -----------------------------------------------------
    # Check ownership
    # -----------------------------------------------------

    if (
        document["user_id"]
        != current_user.id
    ):

        raise HTTPException(
            status_code=403,
            detail=(
                "You do not have access "
                "to this document."
            ),
        )


    return {
        "id":
            document["id"],

        "filename":
            document["filename"],

        "file_type":
            document["file_type"],

        "size":
            document["size"],

        "created_at":
            document["created_at"],

        "text":
            document.get(
                "text",
                "",
            ),
    }


# =========================================================
# Analyze Document With AI
# =========================================================

@router.post(
    "/{document_id}/analyze"
)
async def analyze_document(
    document_id: str,
    current_user: User = Depends(
        get_current_user
    ),
):

    # -----------------------------------------------------
    # Find document
    # -----------------------------------------------------

    document = documents.get(
        document_id
    )


    if not document:

        raise HTTPException(
            status_code=404,
            detail="Document not found.",
        )


    # -----------------------------------------------------
    # Check ownership
    # -----------------------------------------------------

    if (
        document["user_id"]
        != current_user.id
    ):

        raise HTTPException(
            status_code=403,
            detail=(
                "You do not have access "
                "to this document."
            ),
        )


    # -----------------------------------------------------
    # Get extracted text
    # -----------------------------------------------------

    text = document.get(
        "text",
        "",
    ).strip()


    if not text:

        raise HTTPException(
            status_code=400,
            detail=(
                "No readable text was found "
                "in this document."
            ),
        )


    # -----------------------------------------------------
    # Limit text sent to model
    # -----------------------------------------------------

    max_characters = 12000

    text_for_ai = text[
        :max_characters
    ]


    # -----------------------------------------------------
    # AI prompt
    # -----------------------------------------------------

    prompt = f"""
You are NexaAI, an AI document analysis assistant.

Analyze the following document.

Provide:

1. A concise summary
2. The main key points
3. Important topics or concepts
4. Important findings or conclusions
5. Three useful questions a user could ask about this document

Keep the answer clear, structured, and easy to read.

DOCUMENT:

{text_for_ai}
"""


    # -----------------------------------------------------
    # Call Ollama
    # -----------------------------------------------------

    try:

        response = ollama.chat(
            model="llama3.2:3b",
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        )


        analysis = response[
            "message"
        ][
            "content"
        ]


    except Exception as error:

        print(
            f"Document AI analysis error: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to analyze document "
                "with local AI."
            ),
        )


    # -----------------------------------------------------
    # Return analysis
    # -----------------------------------------------------

    return {
        "message":
            "Document analyzed successfully.",

        "document_id":
            document_id,

        "filename":
            document["filename"],

        "analysis":
            analysis,

        "text_length":
            len(text),
    }


# =========================================================
# Ask Question About Document
# =========================================================

@router.post(
    "/{document_id}/ask"
)
async def ask_document(
    document_id: str,
    request: DocumentQuestion,
    current_user: User = Depends(
        get_current_user
    ),
):

    # -----------------------------------------------------
    # Find document
    # -----------------------------------------------------

    document = documents.get(
        document_id
    )


    if not document:

        raise HTTPException(
            status_code=404,
            detail="Document not found.",
        )


    # -----------------------------------------------------
    # Check ownership
    # -----------------------------------------------------

    if (
        document["user_id"]
        != current_user.id
    ):

        raise HTTPException(
            status_code=403,
            detail=(
                "You do not have access "
                "to this document."
            ),
        )


    # -----------------------------------------------------
    # Get document text
    # -----------------------------------------------------

    text = document.get(
        "text",
        "",
    ).strip()


    if not text:

        raise HTTPException(
            status_code=400,
            detail=(
                "No readable text was found "
                "in this document."
            ),
        )


    # -----------------------------------------------------
    # Validate question
    # -----------------------------------------------------

    question = request.question.strip()


    if not question:

        raise HTTPException(
            status_code=400,
            detail="Question is required.",
        )


    # -----------------------------------------------------
    # Limit document text
    # -----------------------------------------------------

    max_characters = 12000

    text_for_ai = text[
        :max_characters
    ]


    # -----------------------------------------------------
    # Create Q&A prompt
    # -----------------------------------------------------

    prompt = f"""
You are NexaAI, a document question-answering assistant.

Answer the user's question using ONLY the
information available in the document below.

If the answer is not available in the document,
clearly say:

"I couldn't find that information in the document."

Do not invent facts.
Do not use outside information.

DOCUMENT:

{text_for_ai}

USER QUESTION:

{question}

Give a clear and concise answer.
"""


    # -----------------------------------------------------
    # Ask Llama
    # -----------------------------------------------------

    try:

        response = ollama.chat(
            model="llama3.2:3b",
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        )


        answer = response[
            "message"
        ][
            "content"
        ]


    except Exception as error:

        print(
            f"Document Q&A error: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to answer the question "
                "with local AI."
            ),
        )


    # -----------------------------------------------------
    # Return answer
    # -----------------------------------------------------

    return {
        "message":
            "Question answered successfully.",

        "document_id":
            document_id,

        "filename":
            document["filename"],

        "question":
            question,

        "answer":
            answer,
    }


# =========================================================
# Delete Document
# =========================================================

@router.delete(
    "/{document_id}"
)
async def delete_document(
    document_id: str,
    current_user: User = Depends(
        get_current_user
    ),
):

    # -----------------------------------------------------
    # Find document
    # -----------------------------------------------------

    document = documents.get(
        document_id
    )


    if not document:

        raise HTTPException(
            status_code=404,
            detail="Document not found.",
        )


    # -----------------------------------------------------
    # Check ownership
    # -----------------------------------------------------

    if (
        document["user_id"]
        != current_user.id
    ):

        raise HTTPException(
            status_code=403,
            detail=(
                "You do not have access "
                "to this document."
            ),
        )


    # -----------------------------------------------------
    # Delete physical file
    # -----------------------------------------------------

    try:

        if os.path.exists(
            document["path"]
        ):

            os.remove(
                document["path"]
            )


    except Exception as error:

        print(
            f"Document deletion error: {error}"
        )


    # -----------------------------------------------------
    # Remove metadata
    # -----------------------------------------------------

    del documents[
        document_id
    ]


    return {
        "message":
            "Document deleted successfully.",

        "document_id":
            document_id,
    }