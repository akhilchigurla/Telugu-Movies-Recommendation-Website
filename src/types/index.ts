export interface Movie {
  id: string;
  title: string;
  director: string | null;
  actors: string[] | null;
  genres: string[] | null;
  year: number | null;
  rating: number;
  poster_url: string | null;
  backdrop_url: string | null;
  synopsis: string | null;
  language: string;
  duration_minutes: number | null;
  created_at: string;
}

export interface UserRating {
  id: string;
  user_id: string;
  movie_id: string;
  rating: number;
  created_at: string;
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  movie_id: string;
  created_at: string;
}
