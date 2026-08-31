-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Drop table if exists to ensure clean schema update for vector(768)
drop table if exists "BookChunks" cascade;

-- Create the BookChunks table with vector(768) to fit HNSW index limits (< 2000 dims)
create table "BookChunks" (
  id bigint primary key generated always as identity,
  book_id text not null,
  book_title text not null,
  page_number integer not null,
  content text not null,
  embedding vector(768),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for fast lookup by book_id
create index if not exists idx_book_chunks_book_id on "BookChunks"(book_id);

-- HNSW vector index for high-performance cosine similarity search (< 2000 dims limit satisfied)
create index if not exists idx_book_chunks_embedding 
on "BookChunks" using hnsw (embedding vector_cosine_ops);

-- RPC function for semantic similarity search across 768-dim book chunks
create or replace function search_books (
  query_embedding vector(768),
  match_threshold float default 0.10,
  match_count int default 5
)
returns table (
  id bigint,
  book_id text,
  book_title text,
  page_number int,
  content text,
  similarity float
)
language sql stable
as $$
  select
    "BookChunks".id,
    "BookChunks".book_id,
    "BookChunks".book_title,
    "BookChunks".page_number,
    "BookChunks".content,
    (1 - ("BookChunks".embedding <=> query_embedding))::float as similarity
  from "BookChunks"
  where (1 - ("BookChunks".embedding <=> query_embedding)) > match_threshold
  order by "BookChunks".embedding <=> query_embedding
  limit match_count;
$$;
