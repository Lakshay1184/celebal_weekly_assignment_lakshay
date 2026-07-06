from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import CharacterTextSplitter

#seperatorr always overrules chunk size in char.text.split
spliter = CharacterTextSplitter(separator="",chunk_size = 100 , chunk_overlap = 0)


data = TextLoader("C:/Users/laksh/Desktop/gen_ai/rag_project/notes.txt")
docs = data.load()

chunks = spliter.split_documents(docs)
print(len(chunks))
for i in chunks:
    print(i.page_content)