import { Star, Bookmark, Plus, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Movie } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface MovieCardProps {
  movie: Movie;
  onSelect: (movie: Movie) => void;
}

export default function MovieCard({ movie, onSelect }: MovieCardProps) {
  const { user } = useAuth();
  const [inWatchlist, setInWatchlist] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
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
  }, [movie.id, user]);

  const toggleWatchlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    if (inWatchlist) {
      await supabase.from('watchlist').delete().eq('movie_id', movie.id).eq('user_id', user.id);
      setInWatchlist(false);
    } else {
      await supabase.from('watchlist').insert({ movie_id: movie.id, user_id: user.id });
      setInWatchlist(true);
    }
  };

  const rateMovie = async (e: React.MouseEvent, rating: number) => {
    e.stopPropagation();
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
      onClick={() => onSelect(movie)}
      className="group relative cursor-pointer rounded-xl overflow-hidden bg-zinc-900 border border-white/5 hover:border-amber-400/30 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-400/10 hover:-translate-y-1"
    >
      <div className="aspect-[2/3] relative overflow-hidden bg-zinc-800">
        <img
          src={movie.poster_url || ''}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-sm">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span className="text-xs font-bold text-white">{movie.rating.toFixed(1)}</span>
        </div>

        {user && (
          <button
            onClick={toggleWatchlist}
            className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/70 backdrop-blur-sm flex items-center justify-center hover:bg-amber-400 hover:text-black transition-all"
          >
            {inWatchlist ? <Check className="w-4 h-4 text-amber-400" /> : <Plus className="w-4 h-4 text-white" />}
          </button>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-bold text-base leading-tight mb-1 line-clamp-2">{movie.title}</h3>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{movie.year}</span>
            {movie.genres && movie.genres.length > 0 && (
              <>
                <span>•</span>
                <span className="line-clamp-1">{movie.genres.slice(0, 2).join(', ')}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {user && (
        <div className="p-2 flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={(e) => rateMovie(e, star)}
              className="p-0.5 hover:scale-125 transition-transform"
            >
              <Star
                className={`w-4 h-4 ${
                  star <= (userRating ?? 0)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-gray-600 hover:text-amber-400'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
