from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from dotenv import load_dotenv
load_dotenv()

splitter = RecursiveCharacterTextSplitter(chunk_size = 1000 , chunk_overlap = 200)

data = PyPDFLoader("C:/Users/laksh/Downloads/geu_book.pdf")
docs = data.load()

chunks = splitter.split_documents(docs)

embed = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

vectorstore = Chroma.from_documents(
    documents = chunks,
    embedding= embed,
    persist_directory= "chroma-db"
)
