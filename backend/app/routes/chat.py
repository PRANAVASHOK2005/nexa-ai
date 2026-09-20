import os
from datetime import datetime, timezone
from uuid import uuid4

import ollama
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from openai import OpenAI
from pydantic import BaseModel

from app.models import User
from app.routes.auth import get_current_user


# =========================================================
# Environment
# =========================================================

load_dotenv()


# =========================================================
# Router
# =========================================================

router = APIRouter(
    prefix="/api/chat",
    tags=["Chat"],
)


# =========================================================
# In-memory conversation storage
# =========================================================

conversations = {}


# =========================================================
# Request / Response Models
# =========================================================

class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None
    model: str = "llama3.2:3b"


class ChatResponse(BaseModel):
    response: str
    conversation_id: str


class ConversationSummary(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str


class ConversationDetail(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    messages: list


# =========================================================
# AI Providers
# =========================================================

# OpenAI is OPTIONAL.
# NexaAI can work completely with Ollama.

api_key = os.getenv("OPENAI_API_KEY")

openai_client = None

if api_key:
    openai_client = OpenAI(
        api_key=api_key
    )


# =========================================================
# Models supported by NexaAI
# =========================================================

ALLOWED_MODELS = {
    "llama3.2:3b",
    "gpt-5.6-luna",
    "gpt-5.6-sol",
}


def get_valid_model(model: str) -> str:
    """
    Return the requested model if supported.
    Otherwise use the local Ollama model.
    """

    if model not in ALLOWED_MODELS:
        return "llama3.2:3b"

    return model


def is_ollama_model(model: str) -> bool:
    """
    Check whether the selected model
    should be handled by Ollama.
    """

    return model == "llama3.2:3b"


# =========================================================
# Conversation Helpers
# =========================================================

def create_conversation(
    message: str,
    user_id: int,
):
    conversation_id = str(
        uuid4()
    )

    now = datetime.now(
        timezone.utc
    ).isoformat()

    conversations[
        conversation_id
    ] = {
        "id": conversation_id,
        "user_id": user_id,
        "title": message[:60],
        "created_at": now,
        "updated_at": now,
        "messages": [],
    }

    return conversation_id


def get_or_create_conversation(
    conversation_id: str | None,
    message: str,
    user_id: int,
):

    if (
        conversation_id
        and conversation_id in conversations
    ):
        conversation = conversations[
            conversation_id
        ]

        # Make sure the conversation
        # belongs to the logged-in user.
        if conversation["user_id"] != user_id:
            raise HTTPException(
                status_code=403,
                detail=(
                    "You do not have access "
                    "to this conversation."
                ),
            )

        return conversation_id

    return create_conversation(
        message,
        user_id,
    )


# =========================================================
# Build AI Conversation Context
# =========================================================

def build_ai_input(conversation):

    return [
        {
            "role": message["role"],
            "content": message["content"],
        }
        for message in conversation["messages"]
    ]


# =========================================================
# Normal Chat Endpoint
# =========================================================

@router.post(
    "/",
    response_model=ChatResponse,
)
async def chat(
    request: ChatRequest,
    current_user: User = Depends(
        get_current_user
    ),
):

    message = request.message.strip()

    # -----------------------------------------------------
    # Empty message
    # -----------------------------------------------------

    if not message:

        conversation_id = (
            request.conversation_id
            or create_conversation(
                "",
                current_user.id,
            )
        )

        return ChatResponse(
            response="Please enter a message.",
            conversation_id=conversation_id,
        )

    # -----------------------------------------------------
    # Get or create conversation
    # -----------------------------------------------------

    conversation_id = (
        get_or_create_conversation(
            request.conversation_id,
            message,
            current_user.id,
        )
    )

    conversation = conversations[
        conversation_id
    ]

    # -----------------------------------------------------
    # Save user message
    # -----------------------------------------------------

    conversation["messages"].append(
        {
            "role": "user",
            "content": message,
        }
    )

    conversation["updated_at"] = (
        datetime.now(
            timezone.utc
        ).isoformat()
    )

    try:

        # -------------------------------------------------
        # Build conversation context
        # -------------------------------------------------

        ai_input = build_ai_input(
            conversation
        )

        model = get_valid_model(
            request.model
        )

        # =================================================
        # OLLAMA
        # =================================================

        if is_ollama_model(model):

            response = ollama.chat(
                model=model,
                messages=ai_input,
            )

            assistant_response = (
                response["message"]["content"]
            )

        # =================================================
        # OPENAI
        # =================================================

        else:

            if openai_client is None:

                raise RuntimeError(
                    "OpenAI API key is not configured. "
                    "Use the local Ollama model "
                    "llama3.2:3b or configure "
                    "OPENAI_API_KEY."
                )

            response = (
                openai_client.responses.create(
                    model=model,
                    input=ai_input,
                )
            )

            assistant_response = (
                response.output_text
            )

        # -------------------------------------------------
        # Save assistant response
        # -------------------------------------------------

        conversation["messages"].append(
            {
                "role": "assistant",
                "content": assistant_response,
            }
        )

        conversation["updated_at"] = (
            datetime.now(
                timezone.utc
            ).isoformat()
        )

        return ChatResponse(
            response=assistant_response,
            conversation_id=conversation_id,
        )

    except Exception as error:

        print(
            f"AI API error: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to generate AI response.",
        )


# =========================================================
# Streaming Chat Endpoint
# =========================================================

@router.post(
    "/stream"
)
async def chat_stream(
    request: ChatRequest,
    current_user: User = Depends(
        get_current_user
    ),
):

    message = request.message.strip()

    # -----------------------------------------------------
    # Empty message
    # -----------------------------------------------------

    if not message:

        return StreamingResponse(
            iter(
                [
                    "Please enter a message."
                ]
            ),
            media_type="text/plain",
        )

    # -----------------------------------------------------
    # Get or create conversation
    # -----------------------------------------------------

    conversation_id = (
        get_or_create_conversation(
            request.conversation_id,
            message,
            current_user.id,
        )
    )

    conversation = conversations[
        conversation_id
    ]

    # -----------------------------------------------------
    # Save user message
    # -----------------------------------------------------

    conversation["messages"].append(
        {
            "role": "user",
            "content": message,
        }
    )

    conversation["updated_at"] = (
        datetime.now(
            timezone.utc
        ).isoformat()
    )

    # =====================================================
    # Streaming Generator
    # =====================================================

    def generate():

        assistant_response = ""

        try:

            # -------------------------------------------------
            # Build complete conversation context
            # -------------------------------------------------

            ai_input = build_ai_input(
                conversation
            )

            model = get_valid_model(
                request.model
            )

            # =================================================
            # OLLAMA STREAMING
            # =================================================

            if is_ollama_model(model):

                stream = ollama.chat(
                    model=model,
                    messages=ai_input,
                    stream=True,
                )

                for chunk in stream:

                    content = (
                        chunk["message"]["content"]
                    )

                    if content:

                        assistant_response += (
                            content
                        )

                        yield content

            # =================================================
            # OPENAI STREAMING
            # =================================================

            else:

                if openai_client is None:

                    raise RuntimeError(
                        "OpenAI API key is not configured. "
                        "Use llama3.2:3b or configure "
                        "OPENAI_API_KEY."
                    )

                stream = (
                    openai_client.responses.create(
                        model=model,
                        input=ai_input,
                        stream=True,
                    )
                )

                for event in stream:

                    if (
                        event.type
                        == "response.output_text.delta"
                    ):

                        assistant_response += (
                            event.delta
                        )

                        yield event.delta

            # -------------------------------------------------
            # Save complete assistant response
            # -------------------------------------------------

            conversation[
                "messages"
            ].append(
                {
                    "role": "assistant",
                    "content": assistant_response,
                }
            )

            conversation[
                "updated_at"
            ] = (
                datetime.now(
                    timezone.utc
                ).isoformat()
            )

        except Exception as error:

            print(
                f"AI streaming error: {error}"
            )

            yield (
                "\n\n[AI response failed.]"
            )

    # =====================================================
    # Return Streaming Response
    # =====================================================

    return StreamingResponse(
        generate(),
        media_type="text/plain",
        headers={
            "X-Conversation-ID":
                conversation_id
        },
    )


# =========================================================
# Get Conversation History
# =========================================================

@router.get(
    "/history",
    response_model=list[
        ConversationSummary
    ],
)
async def get_history(
    current_user: User = Depends(
        get_current_user
    ),
):

    history = []

    for conversation in conversations.values():

        # Only return conversations
        # belonging to the logged-in user.
        if (
            conversation["user_id"]
            != current_user.id
        ):
            continue

        history.append(
            {
                "id": conversation["id"],
                "title": conversation["title"],
                "created_at": conversation[
                    "created_at"
                ],
                "updated_at": conversation[
                    "updated_at"
                ],
            }
        )

    # Most recently updated first

    history.sort(
        key=lambda item: item[
            "updated_at"
        ],
        reverse=True,
    )

    return history


# =========================================================
# Get One Conversation
# =========================================================

@router.get(
    "/history/{conversation_id}",
    response_model=ConversationDetail,
)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(
        get_current_user
    ),
):

    conversation = conversations.get(
        conversation_id
    )

    if not conversation:

        raise HTTPException(
            status_code=404,
            detail="Conversation not found.",
        )

    # Make sure the conversation
    # belongs to the logged-in user.

    if (
        conversation["user_id"]
        != current_user.id
    ):

        raise HTTPException(
            status_code=403,
            detail=(
                "You do not have access "
                "to this conversation."
            ),
        )

    return conversation


# =========================================================
# Delete Conversation
# =========================================================

@router.delete(
    "/history/{conversation_id}"
)
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(
        get_current_user
    ),
):

    if (
        conversation_id
        not in conversations
    ):

        raise HTTPException(
            status_code=404,
            detail="Conversation not found.",
        )

    conversation = conversations[
        conversation_id
    ]

    # Make sure the conversation
    # belongs to the logged-in user.

    if (
        conversation["user_id"]
        != current_user.id
    ):

        raise HTTPException(
            status_code=403,
            detail=(
                "You do not have access "
                "to this conversation."
            ),
        )

    del conversations[
        conversation_id
    ]

    return {
        "message":
            "Conversation deleted successfully.",
        "conversation_id":
            conversation_id,
    }