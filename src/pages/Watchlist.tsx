import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Loader2 } from 'lucide-react';
import type { Movie } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import MovieCard from '@/components/MovieCard';
import MovieModal from '@/components/MovieModal';

export default function Watchlist() {
  const { user, loading: authLoading } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    (async () => {
      const { data } = await supabase
        .from('watchlist')
        .select('movie_id')
        .eq('user_id', user.id);

      if (data && data.length > 0) {
        const movieIds = data.map((d) => d.movie_id);
        const { data: movieData } = await supabase
          .from('movies')
          .select('*')
          .in('id', movieIds);
        if (movieData) setMovies(movieData as Movie[]);
      }
      setLoading(false);
    })();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center pt-16">
        <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 pt-16">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-2xl bg-amber-400/10 flex items-center justify-center mx-auto mb-6">
            <Bookmark className="w-10 h-10 text-amber-400" />
          </div>
          <h1 className="text-3xl font-black text-white mb-3">Sign In Required</h1>
          <p className="text-gray-400 mb-8">Sign in to view your watchlist.</p>
          <Link
            to="/login"
            className="inline-flex px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-600 text-black font-bold hover:from-amber-300 hover:to-orange-500 transition-all"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
            <Bookmark className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-3xl font-black">My Watchlist</h1>
            <p className="text-gray-400 text-sm">{movies.length} movie{movies.length !== 1 ? 's' : ''} saved to watch later</p>
          </div>
        </div>

        {movies.length === 0 ? (
          <div className="text-center py-20">
            <Bookmark className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Your watchlist is empty</h3>
            <p className="text-gray-400 mb-6">Browse movies and tap the + button to add them here.</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-600 text-black font-bold hover:from-amber-300 hover:to-orange-500 transition-all"
            >
              Browse Movies
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} onSelect={setSelectedMovie} />
            ))}
          </div>
        )}
      </div>

      <MovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
    </div>
  );
}
