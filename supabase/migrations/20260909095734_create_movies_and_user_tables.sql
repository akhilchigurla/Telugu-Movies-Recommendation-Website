/*
# Create Telugu Movie Recommendation Schema

## Overview
This migration creates the database schema for a Telugu movie recommendation website.
Users can browse Telugu movies, rate them, add to watchlist, and get personalized recommendations.

## New Tables

1. `movies` — Stores Telugu movies with metadata
   - id (uuid, primary key)
   - title (text, not null) — movie title
   - director (text) — director name
   - actors (text[]) — list of actors
   - genres (text[]) — genre tags (e.g. Action, Drama, Romance)
   - year (integer) — release year
   - rating (numeric, default 0) — average rating
   - poster_url (text) — poster image URL
   - backdrop_url (text) — backdrop image URL
   - synopsis (text) — plot summary
   - language (text, default 'Telugu')
   - duration_minutes (integer)
   - created_at (timestamp)

2. `user_ratings` — Stores user ratings for movies
   - id (uuid, primary key)
   - user_id (uuid, not null, references auth.users)
   - movie_id (uuid, not null, references movies)
   - rating (integer, 1-5)
   - created_at (timestamp)

3. `watchlist` — Stores movies users want to watch
   - id (uuid, primary key)
   - user_id (uuid, not null, references auth.users)
   - movie_id (uuid, not null, references movies)
   - created_at (timestamp)

## Security
- RLS enabled on all tables
- movies: readable by everyone (anon + authenticated), writable by authenticated only
- user_ratings: owner-scoped CRUD (authenticated only)
- watchlist: owner-scoped CRUD (authenticated only)
*/

-- Movies table
CREATE TABLE IF NOT EXISTS movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  director text,
  actors text[],
  genres text[],
  year integer,
  rating numeric DEFAULT 0,
  poster_url text,
  backdrop_url text,
  synopsis text,
  language text DEFAULT 'Telugu',
  duration_minutes integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE movies ENABLE ROW LEVEL SECURITY;

-- Movies: everyone can read
DROP POLICY IF EXISTS "anon_read_movies" ON movies;
CREATE POLICY "anon_read_movies" ON movies FOR SELECT
  TO anon, authenticated USING (true);

-- Movies: authenticated can insert
DROP POLICY IF EXISTS "auth_insert_movies" ON movies;
CREATE POLICY "auth_insert_movies" ON movies FOR INSERT
  TO authenticated WITH CHECK (true);

-- User ratings table
CREATE TABLE IF NOT EXISTS user_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id uuid NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

ALTER TABLE user_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_ratings" ON user_ratings;
CREATE POLICY "select_own_ratings" ON user_ratings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_ratings" ON user_ratings;
CREATE POLICY "insert_own_ratings" ON user_ratings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_ratings" ON user_ratings;
CREATE POLICY "update_own_ratings" ON user_ratings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_ratings" ON user_ratings;
CREATE POLICY "delete_own_ratings" ON user_ratings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id uuid NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_watchlist" ON watchlist;
CREATE POLICY "select_own_watchlist" ON watchlist FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_watchlist" ON watchlist;
CREATE POLICY "insert_own_watchlist" ON watchlist FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_watchlist" ON watchlist;
CREATE POLICY "delete_own_watchlist" ON watchlist FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_movies_genres ON movies USING GIN (genres);
CREATE INDEX IF NOT EXISTS idx_movies_year ON movies (year);
CREATE INDEX IF NOT EXISTS idx_movies_rating ON movies (rating DESC);
CREATE INDEX IF NOT EXISTS idx_user_ratings_user ON user_ratings (user_id);
CREATE INDEX IF NOT EXISTS idx_user_ratings_movie ON user_ratings (movie_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist (user_id);
