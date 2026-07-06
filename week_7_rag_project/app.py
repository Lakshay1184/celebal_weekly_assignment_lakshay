import os
import streamlit as st
from dotenv import load_dotenv

load_dotenv()

from langchain_mistralai import ChatMistralAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

# ---------------- PAGE CONFIG ----------------
st.set_page_config(
    page_title="RAG Assistant",
    page_icon="🤖",
    layout="wide"
)

# ---------------- CUSTOM CSS ----------------
st.markdown("""
<style>
.main {
    background-color: #0f172a;
    color: white;
}
.chat-bubble-user {
    background-color: #1e3a8a;
    padding: 12px;
    border-radius: 10px;
    margin: 8px 0;
}
.chat-bubble-ai {
    background-color: #334155;
    padding: 12px;
    border-radius: 10px;
    margin: 8px 0;
}
.sidebar .sidebar-content {
    background-color: #020617;
}
</style>
""", unsafe_allow_html=True)

# ---------------- SIDEBAR ----------------
st.sidebar.title("⚙️ Settings")

k = st.sidebar.slider("Top K Results", 1, 10, 4)
fetch_k = st.sidebar.slider("Fetch K", 5, 20, 10)
lambda_mult = st.sidebar.slider("MMR Diversity", 0.0, 1.0, 0.5)

show_context = st.sidebar.checkbox("Show Retrieved Context")

# ---------------- LOAD MODELS ----------------
@st.cache_resource
def load_system():
    embed = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    model = ChatMistralAI(
        model="mistral-small-latest",
        mistral_api_key=os.getenv("MISTRAL_API_KEY")
    )

    vector_store = Chroma(
        persist_directory="chroma-db",
        embedding_function=embed
    )

    return model, vector_store

model, vector_store = load_system()

retriever = vector_store.as_retriever(
    search_type="mmr",
    search_kwargs={
        "k": k,
        "fetch_k": fetch_k,
        "lambda_mult": lambda_mult
    }
)

# ---------------- PROMPT ----------------
prompt = ChatPromptTemplate.from_messages(
    [
        ("system", """You are a helpful AI assistant.
Use ONLY the provided context to answer the question.

If the answer is not present in the context,
say: "I could not find the answer in the document."
"""),
        ("human", """Context:
{context}

Question:
{question}""")
    ]
)

# ---------------- CHAT STATE ----------------
if "messages" not in st.session_state:
    st.session_state.messages = []

# ---------------- TITLE ----------------
st.title("🤖 RAG Document Assistant")
st.caption("Ask questions from your stored documents")

# ---------------- DISPLAY CHAT ----------------
for msg in st.session_state.messages:
    if msg["role"] == "user":
        st.markdown(f"<div class='chat-bubble-user'>👤 {msg['content']}</div>", unsafe_allow_html=True)
    else:
        st.markdown(f"<div class='chat-bubble-ai'>🤖 {msg['content']}</div>", unsafe_allow_html=True)

# ---------------- INPUT ----------------
query = st.chat_input("Ask something from your document...")

if query:
    # Store user message
    st.session_state.messages.append({"role": "user", "content": query})

    with st.spinner("Searching and generating answer..."):
        docs = retriever.invoke(query)

        context = "\n\n".join([doc.page_content for doc in docs])

        final_prompt = prompt.invoke({
            "context": context,
            "question": query
        })

        response = model.invoke(final_prompt)
        answer = response.content

    # Store AI response
    st.session_state.messages.append({"role": "assistant", "content": answer})

    st.rerun()

# ---------------- CONTEXT DISPLAY ----------------
if show_context and query:
    st.subheader("📄 Retrieved Context")
    st.code(context[:2000])