import { X, Star, Clock, Calendar, Clapperboard, Users, Bookmark, Plus, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Movie } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface MovieModalProps {
  movie: Movie | null;
  onClose: () => void;
}

export default function MovieModal({ movie, onClose }: MovieModalProps) {
  const { user } = useAuth();
  const [inWatchlist, setInWatchlist] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);

  useEffect(() => {
    if (!movie || !user) return;
    (async () => {
      const { data: wl } = await supabase
        .from('watchlist')
        .select('id')
        .eq('movie_id', movie.id)
        .eq('user_id', user.id)
        .maybeSingle();
      setInWatchlist(!!wl);

      const { data: ur } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('movie_id', movie.id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (ur) setUserRating(ur.rating);
    })();
  }, [movie, user]);

  if (!movie) return null;

  const toggleWatchlist = async () => {
    if (!user) return;
    if (inWatchlist) {
      await supabase.from('watchlist').delete().eq('movie_id', movie.id).eq('user_id', user.id);
      setInWatchlist(false);
    } else {
      await supabase.from('watchlist').insert({ movie_id: movie.id, user_id: user.id });
      setInWatchlist(true);
    }
  };

  const rateMovie = async (rating: number) => {
    if (!user) return;
    const { data: existing } = await supabase
      .from('user_ratings')
      .select('id')
      .eq('movie_id', movie.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from('user_ratings').update({ rating }).eq('movie_id', movie.id).eq('user_id', user.id);
    } else {
      await supabase.from('user_ratings').insert({ movie_id: movie.id, user_id: user.id, rating });
    }
    setUserRating(rating);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="aspect-video relative overflow-hidden bg-zinc-800 rounded-t-2xl">
          <img
            src={movie.backdrop_url || movie.poster_url || ''}
            alt={movie.title}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h2 className="text-3xl font-bold text-white mb-2">{movie.title}</h2>
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                {movie.rating.toFixed(1)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {movie.year}
              </span>
              {movie.duration_minutes && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {Math.floor(movie.duration_minutes / 60)}h {movie.duration_minutes % 60}m
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {movie.genres && movie.genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {movie.genres.map((g) => (
                <span key={g} className="px-3 py-1 rounded-full text-xs font-medium bg-amber-400/10 text-amber-400 border border-amber-400/20">
                  {g}
                </span>
              ))}
            </div>
          )}

          {movie.synopsis && (
            <p className="text-gray-300 text-sm leading-relaxed">{movie.synopsis}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {movie.director && (
              <div className="flex items-start gap-2">
                <Clapperboard className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-gray-500">Director</span>
                  <p className="text-white">{movie.director}</p>
                </div>
              </div>
            )}
            {movie.actors && movie.actors.length > 0 && (
              <div className="flex items-start gap-2">
                <Users className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-gray-500">Cast</span>
                  <p className="text-white">{movie.actors.join(', ')}</p>
                </div>
              </div>
            )}
          </div>

          {user && (
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Your Rating:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => rateMovie(star)} className="hover:scale-125 transition-transform">
                    <Star
                      className={`w-5 h-5 ${
                        star <= (userRating ?? 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-600 hover:text-amber-400'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <button
                onClick={toggleWatchlist}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  inWatchlist
                    ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                {inWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
