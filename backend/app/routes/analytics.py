from fastapi import APIRouter, Depends

from app.models import User
from app.routes.auth import get_current_user
from app.routes.chat import conversations
from app.routes.documents import documents


router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"],
)


def estimate_tokens(text: str) -> int:
    """
    Rough token estimation.

    This is an approximation for local AI usage.
    A common estimate is approximately 1 token
    for every 4 characters of English text.
    """

    if not text:
        return 0

    return max(
        1,
        len(text) // 4,
    )


@router.get("/")
async def get_analytics(
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Return usage and token analytics
    for the authenticated user.
    """

    # --------------------------------------------------
    # Conversation statistics
    # --------------------------------------------------

    total_conversations = 0

    total_messages = 0
    user_messages = 0
    assistant_messages = 0

    input_characters = 0
    output_characters = 0

    # --------------------------------------------------
    # Process only current user's conversations
    # --------------------------------------------------

    for conversation in conversations.values():

        if (
            conversation.get("user_id")
            != current_user.id
        ):
            continue

        total_conversations += 1

        messages = conversation.get(
            "messages",
            [],
        )

        for message in messages:

            content = message.get(
                "content",
                "",
            )

            role = message.get(
                "role",
            )

            total_messages += 1

            if role == "user":

                user_messages += 1

                input_characters += len(
                    content
                )

            elif role == "assistant":

                assistant_messages += 1

                output_characters += len(
                    content
                )

    # --------------------------------------------------
    # Token estimation
    # --------------------------------------------------

    estimated_input_tokens = (
        estimate_tokens(
            "x" * input_characters
        )
        if input_characters
        else 0
    )

    estimated_output_tokens = (
        estimate_tokens(
            "x" * output_characters
        )
        if output_characters
        else 0
    )

    estimated_total_tokens = (
        estimated_input_tokens
        + estimated_output_tokens
    )

    # --------------------------------------------------
    # Document statistics
    # --------------------------------------------------

    total_documents = 0

    total_document_characters = 0

    # --------------------------------------------------
    # Process only current user's documents
    # --------------------------------------------------

    for document in documents.values():

        if (
            document.get("user_id")
            != current_user.id
        ):
            continue

        total_documents += 1

        document_text = document.get(
            "text",
            "",
        )

        total_document_characters += len(
            document_text
        )

    estimated_document_tokens = (
        estimate_tokens(
            "x" * total_document_characters
        )
        if total_document_characters
        else 0
    )

    # --------------------------------------------------
    # Return analytics
    # --------------------------------------------------

    return {
        "total_conversations":
            total_conversations,

        "total_messages":
            total_messages,

        "user_messages":
            user_messages,

        "assistant_messages":
            assistant_messages,

        "total_documents":
            total_documents,

        "input_characters":
            input_characters,

        "output_characters":
            output_characters,

        "document_characters":
            total_document_characters,

        "estimated_input_tokens":
            estimated_input_tokens,

        "estimated_output_tokens":
            estimated_output_tokens,

        "estimated_total_tokens":
            estimated_total_tokens,

        "estimated_document_tokens":
            estimated_document_tokens,
    }