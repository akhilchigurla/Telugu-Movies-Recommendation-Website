import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Star, AlertCircle, Loader2, RefreshCw, ThumbsUp } from 'lucide-react';
import type { Movie, UserRating } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import MovieCard from '@/components/MovieCard';
import MovieModal from '@/components/MovieModal';

interface Recommendation {
  movie: Movie;
  score: number;
  reason: string;
}

export default function Recommendations() {
  const { user, loading: authLoading } = useAuth();
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [userRatings, setUserRatings] = useState<UserRating[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    (async () => {
      const { data: movies } = await supabase.from('movies').select('*');
      if (movies) setAllMovies(movies as Movie[]);

      const { data: ratings } = await supabase
        .from('user_ratings')
        .select('*')
        .eq('user_id', user.id);
      if (ratings) setUserRatings(ratings as UserRating[]);

      setLoading(false);
    })();
  }, [user, authLoading]);

  useEffect(() => {
    if (allMovies.length === 0) return;

    const ratedMovieIds = new Set(userRatings.map((r) => r.movie_id));
    const ratedMovies = allMovies.filter((m) => ratedMovieIds.has(m.id));

    if (userRatings.length === 0) {
      const recs = [...allMovies]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 12)
        .map((movie) => ({
          movie,
          score: movie.rating,
          reason: 'Top-rated Telugu movie — rate a few films to get personalized picks!',
        }));
      setRecommendations(recs);
      return;
    }

    // Build user preference profile from ratings
    const genreScores: Record<string, { total: number; count: number }> = {};
    const directorScores: Record<string, { total: number; count: number }> = {};
    const actorScores: Record<string, { total: number; count: number }> = {};
    const yearPreference: { total: number; count: number } = { total: 0, count: 0 };

    ratedMovies.forEach((movie) => {
      const rating = userRatings.find((r) => r.movie_id === movie.id)?.rating ?? 0;
      const weight = rating / 5;

      movie.genres?.forEach((g) => {
        if (!genreScores[g]) genreScores[g] = { total: 0, count: 0 };
        genreScores[g].total += weight;
        genreScores[g].count += 1;
      });

      if (movie.director) {
        if (!directorScores[movie.director]) directorScores[movie.director] = { total: 0, count: 0 };
        directorScores[movie.director].total += weight;
        directorScores[movie.director].count += 1;
      }

      movie.actors?.forEach((a) => {
        if (!actorScores[a]) actorScores[a] = { total: 0, count: 0 };
        actorScores[a].total += weight;
        actorScores[a].count += 1;
      });

      if (movie.year) {
        yearPreference.total += movie.year * weight;
        yearPreference.count += weight;
      }
    });

    const avgYear = yearPreference.count > 0 ? yearPreference.total / yearPreference.count : 0;

    // Score unrated movies
    const candidates = allMovies.filter((m) => !ratedMovieIds.has(m.id));
    const scored: Recommendation[] = candidates.map((movie) => {
      let score = movie.rating * 0.3;
      const reasons: string[] = [];

      const genreMatch = movie.genres?.filter((g) => genreScores[g]) ?? [];
      if (genreMatch.length > 0) {
        const genreScore = genreMatch.reduce((sum, g) => {
          const gs = genreScores[g];
          return sum + (gs.total / gs.count);
        }, 0);
        score += genreScore * 0.4;
        reasons.push(`matches your love for ${genreMatch.slice(0, 2).join(' & ')}`);
      }

      if (movie.director && directorScores[movie.director]) {
        const ds = directorScores[movie.director];
        score += (ds.total / ds.count) * 0.2;
        reasons.push(`directed by ${movie.director} who you've rated highly`);
      }

      const actorMatch = movie.actors?.filter((a) => actorScores[a]) ?? [];
      if (actorMatch.length > 0) {
        const actorScore = actorMatch.reduce((sum, a) => {
          const as_ = actorScores[a];
          return sum + (as_.total / as_.count);
        }, 0);
        score += (actorScore / actorMatch.length) * 0.1;
        reasons.push(`stars ${actorMatch[0]}`);
      }

      if (avgYear > 0 && movie.year) {
        const yearDiff = Math.abs(movie.year - avgYear);
        if (yearDiff <= 5) score += 0.1;
      }

      return {
        movie,
        score,
        reason: reasons.length > 0 ? reasons.join(', ') : 'highly rated by the community',
      };
    });

    scored.sort((a, b) => b.score - a.score);
    setRecommendations(scored.slice(0, 12));
  }, [allMovies, userRatings]);

  const refreshRecommendations = () => {
    setLoading(true);
    setTimeout(() => {
      const shuffled = [...recommendations].sort(() => Math.random() - 0.5);
      setRecommendations(shuffled);
      setLoading(false);
    }, 500);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center pt-16">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
          <p className="text-gray-400">Finding the perfect Telugu movies for you...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 pt-16">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-2xl bg-amber-400/10 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-amber-400" />
          </div>
          <h1 className="text-3xl font-black text-white mb-3">Sign In Required</h1>
          <p className="text-gray-400 mb-8">
            To get personalized Telugu movie recommendations, please sign in or create an account.
            Rate a few movies and we'll find films you'll love.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              to="/login"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-600 text-black font-bold hover:from-amber-300 hover:to-orange-500 transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-all border border-white/10"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const ratedCount = userRatings.length;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="relative pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-400/10 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-400/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <span className="text-amber-400 font-medium text-sm">AI-Powered Recommendations</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-3">Your Personal Picks</h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            {ratedCount === 0
              ? "You haven't rated any movies yet. Here are the top-rated Telugu films to get you started — rate a few to unlock personalized recommendations!"
              : `Based on ${ratedCount} movie${ratedCount > 1 ? 's' : ''} you've rated, we think you'll love these Telugu films.`}
          </p>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-white/10">
              <Star className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-gray-300">{ratedCount} rated</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-white/10">
              <ThumbsUp className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-gray-300">{recommendations.length} recommended</span>
            </div>
            <button
              onClick={refreshRecommendations}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-white/10 text-gray-300 hover:bg-white/10 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Shuffle
            </button>
          </div>
        </div>
      </div>

      {/* Recommendations Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {recommendations.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No recommendations available. Try rating more movies!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {recommendations.map(({ movie, reason }) => (
              <div key={movie.id} className="space-y-2">
                <MovieCard movie={movie} onSelect={setSelectedMovie} />
                <p className="text-xs text-gray-500 italic px-1 line-clamp-2">{reason}</p>
              </div>
            ))}
          </div>
        )}

        {ratedCount < 3 && (
          <div className="mt-12 rounded-2xl bg-gradient-to-br from-amber-400/10 to-transparent border border-amber-400/20 p-8 text-center">
            <h3 className="text-xl font-bold mb-2">Rate more movies for better recommendations</h3>
            <p className="text-gray-400 mb-6">
              The more Telugu movies you rate, the more accurate our recommendations become.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-600 text-black font-bold hover:from-amber-300 hover:to-orange-500 transition-all"
            >
              Browse More Movies
            </Link>
          </div>
        )}
      </div>

      <MovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
    </div>
  );
}
